/*
 * http_server.h
 *
 * Minimal raw-socket HTTP server for SSE streaming (GET /stream)
 * and TPMS-config updates (POST /config).
 *
 * Usage pattern:
 *   1. http_server_start(port, config_cb)  — spawns server thread
 *   2. http_broadcast_json(json)           — called from USB reader thread,
 *                                           pushes one SSE frame to all clients
 *   3. http_server_stop()                  — clean shutdown
 */

#ifndef _USBGET_HTTP_SERVER_H
#define _USBGET_HTTP_SERVER_H

#include "support.h"

#define HTTP_DEFAULT_PORT  9969
#define MAX_SSE_CLIENTS      8

/*
 * Callback invoked when a POST /config request arrives.
 * body     : raw request body (NOT null-terminated, but body_len is set)
 * body_len : length of body in bytes
 * Returns RC_OK on success, RC_ERROR to send a 500 response.
 */
typedef returnCode (*config_callback_t)(const char *body, int body_len);

/* Start the HTTP server thread.  Non-blocking: returns immediately. */
returnCode http_server_start(int port, config_callback_t config_cb);

/* Stop the HTTP server and close all client connections. */
void http_server_stop(void);

/*
 * Broadcast a JSON string to all connected SSE clients.
 * Thread-safe — called from USB reader thread.
 * json must be a null-terminated string.
 */
void http_broadcast_json(const char *json);

#endif
