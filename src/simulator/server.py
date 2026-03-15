#!/usr/bin/env python3
"""
TPMS Simulator Server — v2
Dual-Root static file serving:
  /          → ./          (simulator.html etc.)
  /apps/     → ../apps/    (CMU app files)
HTTP  : http://127.0.0.1:9970/
WS    : ws://127.0.0.1:9969/
"""
import asyncio, json, logging, os, time, pathlib
from aiohttp import web
import websockets
logging.basicConfig(level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s")
log = logging.getLogger("tpms-sim")
# ── Paths ────────────────────────────────────────────────────────────────────
# server.py lives in  /src/simulator/
# app files live in   /src/apps/
BASE_DIR = pathlib.Path(__file__).parent.resolve()   
APPS_DIR = BASE_DIR.parent / "apps"
# /src/simulator/
# /src/apps/
# ── Shared simulator state ───────────────────────────────────────────────────
state = {
    "tires": [
            {"p": 2.24, "t": 9.0,  "id": "0f54771b", "lost": False},  # FL 0
            {"p": 2.24, "t": 10.0, "id": "0f547711", "lost": False},  # FR 1
            {"p": 2.22, "t": 10.0, "id": "0f5476ea", "lost": False},  # RL 2
            {"p": 2.22, "t": 9.0,  "id": "0f5476e8", "lost": False},  # RR 3
        ],
    "oil":   {"t": 85.2, "p": 3.45},
    "env":   {"outside": 20, "coolant": 90},
}
# ── SSE helpers ──────────────────────────────────────────────────────────────
def build_tpms_payload():
    tpms = {}
    for i, tire in enumerate(state["tires"]):
        if not tire["lost"]:
            tpms[str(i)] = {
                "id": tire["id"],
                "t":  round(tire["t"], 1),
                "p":  round(tire["p"], 2),
            }
    return tpms
async def sse_handler(request):
    """SSE endpoint — /stream"""
    resp = web.StreamResponse(headers={
        "Content-Type":  "text/event-stream",
        "Cache-Control": "no-cache",
        "Access-Control-Allow-Origin": "*",
    })
    await resp.prepare(request)

    oil_tick = 0
    try:
        while True:
            # Oil: every ~250 ms (every 4th iteration of the 250ms loop)
            oil_msg = {"oil": {
                "t": round(state["oil"]["t"], 1),
                "p": round(state["oil"]["p"], 2),
            }}
            data = "data: " + json.dumps(oil_msg) + "\n\n"
            await resp.write(data.encode())

            oil_tick += 1
            if oil_tick >= 4:          
                # ~1 s → also send TPMS
                oil_tick = 0
                tpms_data = build_tpms_payload()
                if tpms_data:
                    tpms_msg = {"tpms": tpms_data}
                    data =  "data: " + json.dumps(tpms_msg) + "\n\n"
                    await resp.write(data.encode())

            await asyncio.sleep(0.25)
    except (ConnectionResetError, asyncio.CancelledError):
        log.info("SSE client disconnected")
    return resp

# ── Config POST ──────────────────────────────────────────────────────────────
async def config_handler(request):
    try:
        body = await request.json()
        log.info("Config received: %s", json.dumps(body, indent=2))
        ids = body.get("tpms", {})
        mapping = {"fl": 0, "fr": 1, "rl": 2, "rr": 3}
        for key, idx in mapping.items():
            if key in ids:
                state["tires"][idx]["id"] = ids[key]
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

# ── Sim-State POST (from browser sliders) ────────────────────────────────────
async def simstate_handler(request):
    try:
        body = await request.json()
        if "tires" in body:
            for i, t in enumerate(body["tires"]):
                state["tires"][i].update(t)
        if "oil" in body:
            state["oil"].update(body["oil"])
        if "env" in body:
            state["env"].update(body["env"])
        return web.json_response({"ok": True})
    except Exception as e:
        return web.json_response({"error": str(e)}, status=400)

# ── Static file handler with dual-root logic ─────────────────────────────────
async def static_handler(request):
    """
    URL /apps/... → served from  APPS_DIR  (/src/apps/)
    Everything else  → served from  BASE_DIR  (/src/simulator/)
    """
    rel = request.match_info["path"]           # everything after the first /
    if rel.startswith("apps/"):
        # strip the "apps/" prefix, resolve against APPS_DIR
        file_rel = rel[len("apps/"):]
        filepath  = (APPS_DIR / file_rel).resolve()
        # security: must stay inside APPS_DIR
        if not str(filepath).startswith(str(APPS_DIR)):
            raise web.HTTPForbidden()
    else:
        filepath = (BASE_DIR / rel).resolve()
        if not str(filepath).startswith(str(BASE_DIR)):
            raise web.HTTPForbidden()

    if not filepath.exists() or not filepath.is_file():
        log.warning("404: %s (resolved: %s)", rel, filepath)
        raise web.HTTPNotFound()

    # Basic MIME mapping
    mime_map = {
        ".html": "text/html",
        ".css":  "text/css",
        ".js":   "application/javascript",
        ".json": "application/json",
        ".png":  "image/png",
        ".jpg":  "image/jpeg",
        ".jpeg": "image/jpeg",
        ".gif":  "image/gif",
        ".svg":  "image/svg+xml",
        ".ico":  "image/x-icon",
        ".woff": "font/woff",
        ".woff2":"font/woff2",
        ".ttf":  "font/ttf",
    }
    ct = mime_map.get(filepath.suffix.lower(), "application/octet-stream")
    return web.Response(body=filepath.read_bytes(), content_type=ct)

# ── WebSocket server (port 9969) ──────────────────────────────────────────────
async def ws_handler(websocket):
    log.info("WebSocket client connected")
    try:
        async for message in websocket:
            if message == "envData":
                outside_raw = state["env"]["outside"] + 40
                coolant_raw = state["env"]["coolant"] + 40
                resp =  "envData#0#0#0#0#{outside}#0#{coolant}#0#0".format(
                    outside=outside_raw,
                    coolant=coolant_raw,
                )
                await websocket.send(resp)
            else:
                log.debug("WS unknown message: %s", message)
    except Exception as e:
        log.info("WebSocket closed: %s", e)

# ── App factory ──────────────────────────────────────────────────────────────
def create_app():
    app = web.Application()
    app.router.add_get("/stream",    sse_handler)
    app.router.add_post("/config",   config_handler)
    app.router.add_post("/sim-state",simstate_handler)
    # Catch-all static handler — must be last
    app.router.add_get("/{path:.*}", static_handler)
    return app

# ── Entry point ───────────────────────────────────────────────────────────────
async def main():
    # Verify APPS_DIR exists
    if not APPS_DIR.exists():
        log.warning("APPS_DIR not found: %s", APPS_DIR)
        log.warning("App files will return 404. Check your folder layout.")
    else:
        log.info("Serving app files from: %s", APPS_DIR)

    # Start WebSocket server on 9969
    ws_server = await websockets.serve(ws_handler, "127.0.0.1", 9969)
    log.info("WebSocket  listening on ws://127.0.0.1:9969/")

    # Start aiohttp on 9970
    app = create_app()
    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, "127.0.0.1", 9970)
    await site.start()
    log.info("HTTP server  listening on http://127.0.0.1:9970/")
    log.info("Open in browser: http://127.0.0.1:9970/simulator.html")

    try:
        await asyncio.Future()   
    finally:
        ws_server.close()
        await runner.cleanup()
if __name__ == "__main__":
    asyncio.run(main())