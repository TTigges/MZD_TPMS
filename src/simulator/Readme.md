# MZD TPMS App Simulator

## Goal

Build a self-contained browser-based simulator for the TPMS app so it can be
developed and tested on a desktop without a Mazda CMU or Arduino hardware.

---

## Target Environment (CMU)

The app runs inside the **Mazda Connect infotainment unit (CMU)**:

- Display: **800 × 480 px**, Opera-based browser (old WebKit)
- Framework: **JCI** — apps are loaded via `additionalApps.json`;
  templates are JS objects that write their HTML into a `divElt`
- jQuery is available globally as `$`
- `utility.loadScript(path)` loads additional JS files relative to `/jci/gui/`
- No ES6 (no arrow functions, no `const`/`let`, no template literals)
- The status bar at the top consumes ~30 px; usable area is roughly **800 × 450 px**

The simulator does **not** need to replicate the JCI framework.
It only needs to provide the correct DOM structure and fake the two data inputs
described below.

---

## App files to load (`src/apps/_tpms/`)

Load these files in order inside the simulator HTML page:

| File | Purpose |
|---|---|
| `template/css/TpmsTmplt.css` | Main app stylesheet |
| `css/_tpmsApp.css` | Additional app styles |
| `template/img/` | Images referenced by CSS (`background.jpg`, `topview_470.png`, `topview_470_1.png`) |
| `template/js/TpmsTmplt.js` | Writes the full app HTML into a container div. Call: `new TpmsTmplt(null, containerDiv, "TpmsTmplt_0", {})` |
| `js/tpms.js` | Main app logic. Starts data retrieval via SSE + WebSocket after 3 s. |
| `js/tpmsUpdate.js` | UI interaction (multicontroller buttons, setup layer). Call: `updateTpmsApp()` after DOM is ready. |
| `js/_tpmsApp.js` | App registration stub — can be replaced by a no-op in the simulator. |

jQuery must be loaded before any of the above.

---

## DOM structure required by the simulator HTML

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <!-- load CSS files here -->
</head>
<body style="background:#222; margin:0; display:flex; justify-content:center; align-items:center; height:100vh;">

  <!-- CMU screen frame: 800×480, status bar ~30px top -->
  <div id="screen" style="width:800px; height:480px; position:relative; overflow:hidden;">

    <!-- Status bar placeholder -->
    <div id="statusBar" style="width:800px; height:30px; background:#111;"></div>

    <!-- App container — TpmsTmplt writes into this div -->
    <div id="TpmsTmplt_0"></div>

  </div>

  <!-- Simulator controls (sliders, buttons) go outside the screen frame -->
  <div id="simulatorControls"> ... </div>

  <!-- load JS files here -->
</body>
</html>
```

---

## Data inputs to simulate

### 1. SSE stream — `http://127.0.0.1:9970/stream`

`tpms.js` opens an `EventSource` to this URL after 3 seconds.
The simulator must provide a fake SSE endpoint **or** intercept `EventSource`
and feed events programmatically.

**TPMS message** (sent every ~1 s):
```
data: {"tpms":{"0":{"id":"0f54771b","t":9.0,"p":2.24},"1":{"id":"0f547711","t":10.0,"p":2.24},"2":{"id":"0f5476ea","t":10.0,"p":2.22},"3":{"id":"0f5476e8","t":9.0,"p":2.22}}}
```

**Oil message** (sent every ~250 ms, independent of TPMS):
```
data: {"oil":{"t":85.2,"p":3.45}}
```

**Combined message** (also valid):
```
data: {"tpms":{...},"oil":{...}}
```

Fields: `id` = 8-char hex sensor ID, `t` = temperature °C (float), `p` = pressure bar (float, 2 decimals).
Indices `0`=FL, `1`=FR, `2`=RL, `3`=RR.

### 2. Config POST — `http://127.0.0.1:9970/config`

When the user saves sensor IDs via the setup layer, `tpms.js` sends:
```
POST /config
Content-Type: application/json
{"tpms":{"fl":"0f54771b","fr":"0f547711","rl":"0f5476ea","rr":"0f5476e8"}}
```
The simulator should accept this and log it (no real persistence needed).

### 3. WebSocket — `ws://127.0.0.1:9969/`

`tpms.js` also opens a WebSocket for vehicle environment data.
The simulator must either provide a fake WebSocket server or intercept `WebSocket`.

Message format sent by the server when client sends `"envData"`:
```
envData#<fueleff>#<totfueleff>#<avgfuel>#<outsidetemp>#<intaketemp>#<coolanttemp>#<gearpos>#<fuelgauge>#<batsoc>
```
Relevant indices for the TPMS app:
- `res[4]` = outside temperature (raw value, subtract 40 for °C)
- `res[6]` = coolant temperature (raw value, subtract 40 for °C)

---

## Simulator controls to implement

Provide UI controls (sliders / input fields) to vary:

| Control | Range | Affects |
|---|---|---|
| Pressure FL/FR/RL/RR | 0.0 – 4.0 bar | `p` in TPMS SSE |
| Temperature FL/FR/RL/RR | −20 – 80 °C | `t` in TPMS SSE |
| Oil temperature | 0 – 150 °C | `oil.t` in SSE |
| Oil pressure | 0.0 – 6.0 bar | `oil.p` in SSE |
| Outside temperature | −40 – 60 °C | `res[4]` in WebSocket envData |
| Coolant temperature | −40 – 120 °C | `res[6]` in WebSocket envData |
| "Sensor signal lost" toggle | per tire | stop sending that sensor's data |

---

## Pressure display logic (for reference)

Normal pressure: **2.00 bar**. Bar graph color shifts green→yellow→red as
deviation from normal grows, reaching full red at ±25% deviation.
The tire border turns red if pressure is outside `[1.70, 2.30]` bar.

---

## Notes

- The app uses `log.addSrcFile(...)` and `log.debug(...)` — provide a no-op
  `log` object: `var log = { addSrcFile: function(){}, debug: function(){} };`
- `utility.loadScript(path)` is used to chain-load `tpmsUpdate.js` —
  implement as: `function utility() {} utility.loadScript = function(src){ var s=document.createElement('script'); s.src='/'+src; document.head.appendChild(s); };`
- The setup layer (sensor ID assignment) must work end-to-end: open via
  long-press (`.cntrlBtn5`), select IDs, save → POST to `/config`.
