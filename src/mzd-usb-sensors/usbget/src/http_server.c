/*
 * http_server.c
 *
 * Minimal raw-socket HTTP/1.1 server.
 *
 * Endpoints:
 *   GET  /stream  — Server-Sent Events (SSE), streams JSON sensor frames
 *   POST /config  — Forward TPMS sensor-ID config to Arduino
 *   OPTIONS *     — CORS preflight
 *
 * Architecture:
 *   - Runs in a dedicated pthread.
 *   - select() loop: accepts connections, reads HTTP requests.
 *   - Once GET /stream is identified, the fd is handed to the SSE
 *     client list (non-blocking writes from USB reader thread via
 *     http_broadcast_json()).
 *   - A periodic SSE keepalive comment is sent every ~15 s so browsers
 *     don't time out the connection.
 */

#include "http_server.h"
#include "support.h"

#include <sys/socket.h>
#include <sys/select.h>
#include <netinet/in.h>
#include <unistd.h>
#include <fcntl.h>
#include <errno.h>
#include <pthread.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
#include <time.h>


/* ── SSE client list ─────────────────────────────────────────── */

typedef struct {
    int fd;
    int active;
} sse_client_t;

static sse_client_t   sse_clients[MAX_SSE_CLIENTS];
static pthread_mutex_t clients_mutex = PTHREAD_MUTEX_INITIALIZER;


/* ── Pending HTTP connections (being read / parsed) ──────────── */

#define MAX_PENDING    8
#define REQ_BUF_SIZE 2048

typedef struct {
    int  fd;
    char buf[REQ_BUF_SIZE];
    int  buf_pos;
} pending_conn_t;

static pending_conn_t pending[MAX_PENDING];


/* ── Server state ────────────────────────────────────────────── */

static int              server_fd      = -1;
static pthread_t        server_thread;
static volatile int     server_running = 0;
static config_callback_t config_cb_fn  = NULL;


/* ── Static HTTP response fragments ─────────────────────────── */

static const char SSE_HEADERS[] =
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: text/event-stream\r\n"
    "Cache-Control: no-cache\r\n"
    "Connection: keep-alive\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "\r\n";

static const char CONFIG_OK[] =
    "HTTP/1.1 200 OK\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Content-Length: 15\r\n"
    "\r\n"
    "{\"status\":\"ok\"}";

static const char CONFIG_ERR[] =
    "HTTP/1.1 500 Internal Server Error\r\n"
    "Content-Type: application/json\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Content-Length: 18\r\n"
    "\r\n"
    "{\"status\":\"error\"}";

static const char CORS_PREFLIGHT[] =
    "HTTP/1.1 204 No Content\r\n"
    "Access-Control-Allow-Origin: *\r\n"
    "Access-Control-Allow-Methods: GET, POST, OPTIONS\r\n"
    "Access-Control-Allow-Headers: Content-Type\r\n"
    "\r\n";

static const char NOT_FOUND[] =
    "HTTP/1.1 404 Not Found\r\n"
    "Content-Length: 0\r\n"
    "\r\n";


/* ── SSE client helpers ──────────────────────────────────────── */

static void add_sse_client(int fd)
{
    /* Switch to non-blocking so slow clients don't stall the USB reader */
    int flags = fcntl(fd, F_GETFL, 0);
    if (flags >= 0) {
        fcntl(fd, F_SETFL, flags | O_NONBLOCK);
    }

    pthread_mutex_lock(&clients_mutex);
    for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
        if (!sse_clients[i].active) {
            sse_clients[i].fd     = fd;
            sse_clients[i].active = 1;
            printfDebug("SSE client added: fd=%d slot=%d\n", fd, i);
            break;
        }
    }
    pthread_mutex_unlock(&clients_mutex);
}

/* Caller must hold clients_mutex. */
static void remove_sse_client(int idx)
{
    close(sse_clients[idx].fd);
    sse_clients[idx].active = 0;
    printfDebug("SSE client removed: slot=%d\n", idx);
}


/* ── Public: broadcast JSON to all SSE clients ───────────────── *
 * Called from USB reader thread.                                 */

void http_broadcast_json(const char *json)
{
    char frame[640];
    int  flen = snprintf(frame, (int)sizeof(frame), "data: %s\n\n", json);
    if (flen <= 0 || flen >= (int)sizeof(frame)) return;

    pthread_mutex_lock(&clients_mutex);
    for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
        if (!sse_clients[i].active) continue;

        int w = (int)write(sse_clients[i].fd, frame, (size_t)flen);
        if (w < 0) {
            if (errno == EAGAIN || errno == EWOULDBLOCK) {
                /* Client is momentarily busy — skip this frame, keep client */
            } else {
                /* EPIPE, ECONNRESET, EBADF: client gone */
                remove_sse_client(i);
            }
        }
    }
    pthread_mutex_unlock(&clients_mutex);
}

/* Send SSE keepalive comment to all clients (called from server thread). */
static void send_keepalive(void)
{
    static const char ka[] = ": keepalive\n\n";
    pthread_mutex_lock(&clients_mutex);
    for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
        if (!sse_clients[i].active) continue;
        int w = (int)write(sse_clients[i].fd, ka, sizeof(ka) - 1);
        if (w < 0 && errno != EAGAIN && errno != EWOULDBLOCK) {
            remove_sse_client(i);
        }
    }
    pthread_mutex_unlock(&clients_mutex);
}


/* ── HTTP request dispatch ───────────────────────────────────── */

static void handle_request(int fd, const char *req, int req_len)
{
    if (strncmp(req, "OPTIONS", 7) == 0) {
        write(fd, CORS_PREFLIGHT, sizeof(CORS_PREFLIGHT) - 1);
        close(fd);
        return;
    }

    if (strncmp(req, "GET /stream", 11) == 0) {
        write(fd, SSE_HEADERS, sizeof(SSE_HEADERS) - 1);
        add_sse_client(fd);
        /* fd is now owned by sse_clients — don't close here */
        return;
    }

    if (strncmp(req, "POST /config", 12) == 0) {
        const char *body = strstr(req, "\r\n\r\n");
        if (body) {
            body += 4;
            int body_len = req_len - (int)(body - req);
            returnCode rc = RC_OK;
            if (config_cb_fn && body_len > 0) {
                rc = config_cb_fn(body, body_len);
            }
            if (rc == RC_OK) {
                write(fd, CONFIG_OK,  sizeof(CONFIG_OK)  - 1);
            } else {
                write(fd, CONFIG_ERR, sizeof(CONFIG_ERR) - 1);
            }
        } else {
            write(fd, CONFIG_ERR, sizeof(CONFIG_ERR) - 1);
        }
        close(fd);
        return;
    }

    write(fd, NOT_FOUND, sizeof(NOT_FOUND) - 1);
    close(fd);
}


/* ── Server thread ───────────────────────────────────────────── */

static void *server_thread_func(void *arg)
{
    (void)arg;
    fd_set   read_set;
    time_t   last_keepalive = time(NULL);

    memset(pending, 0, sizeof(pending));
    for (int i = 0; i < MAX_PENDING; i++) pending[i].fd = -1;

    while (server_running) {
        FD_ZERO(&read_set);
        FD_SET(server_fd, &read_set);
        int max_fd = server_fd;

        for (int i = 0; i < MAX_PENDING; i++) {
            if (pending[i].fd >= 0) {
                FD_SET(pending[i].fd, &read_set);
                if (pending[i].fd > max_fd) max_fd = pending[i].fd;
            }
        }

        struct timeval tv = {1, 0}; /* 1 s — wakeup for keepalive */
        int ready = select(max_fd + 1, &read_set, NULL, NULL, &tv);
        if (ready < 0 && errno != EINTR) break;

        /* Periodic SSE keepalive */
        time_t now = time(NULL);
        if (now - last_keepalive >= 15) {
            send_keepalive();
            last_keepalive = now;
        }

        if (ready <= 0) continue;

        /* Accept new connections */
        if (FD_ISSET(server_fd, &read_set)) {
            int client_fd = accept(server_fd, NULL, NULL);
            if (client_fd >= 0) {
                int inserted = 0;
                for (int i = 0; i < MAX_PENDING; i++) {
                    if (pending[i].fd < 0) {
                        pending[i].fd      = client_fd;
                        pending[i].buf_pos = 0;
                        inserted = 1;
                        break;
                    }
                }
                if (!inserted) {
                    /* No free slot — reject */
                    close(client_fd);
                }
            }
        }

        /* Read pending HTTP request data */
        for (int i = 0; i < MAX_PENDING; i++) {
            if (pending[i].fd < 0) continue;
            if (!FD_ISSET(pending[i].fd, &read_set)) continue;

            int space = REQ_BUF_SIZE - pending[i].buf_pos - 1;
            if (space <= 0) {
                /* Request too large */
                close(pending[i].fd);
                pending[i].fd = -1;
                continue;
            }

            int n = (int)read(pending[i].fd,
                              pending[i].buf + pending[i].buf_pos,
                              (size_t)space);
            if (n <= 0) {
                close(pending[i].fd);
                pending[i].fd = -1;
                continue;
            }

            pending[i].buf_pos += n;
            pending[i].buf[pending[i].buf_pos] = '\0';

            /* Wait until we have the end of the HTTP headers */
            if (!strstr(pending[i].buf, "\r\n\r\n")) continue;

            /* For POST: also wait for the full body */
            if (strncmp(pending[i].buf, "POST", 4) == 0) {
                const char *cl = strstr(pending[i].buf, "Content-Length:");
                if (cl) {
                    int content_length = 0;
                    if (sscanf(cl + 15, " %d", &content_length) == 1) {
                        const char *body_start = strstr(pending[i].buf, "\r\n\r\n");
                        if (body_start) {
                            int body_received = pending[i].buf_pos
                                              - (int)(body_start + 4 - pending[i].buf);
                            if (body_received < content_length) continue;
                        }
                    }
                }
            }

            handle_request(pending[i].fd, pending[i].buf, pending[i].buf_pos);
            /* fd is either closed by handler or adopted by SSE list */
            pending[i].fd = -1;
        }
    }

    return NULL;
}


/* ── Public API ──────────────────────────────────────────────── */

returnCode http_server_start(int port, config_callback_t config_cb)
{
    config_cb_fn = config_cb;
    memset(sse_clients, 0, sizeof(sse_clients));

    server_fd = socket(AF_INET, SOCK_STREAM, 0);
    if (server_fd < 0) {
        printfLog("HTTP: failed to create socket\n");
        return RC_ERROR;
    }

    int opt = 1;
    setsockopt(server_fd, SOL_SOCKET, SO_REUSEADDR, &opt, (socklen_t)sizeof(opt));

    struct sockaddr_in addr;
    memset(&addr, 0, sizeof(addr));
    addr.sin_family      = AF_INET;
    addr.sin_addr.s_addr = htonl(INADDR_LOOPBACK); /* localhost only */
    addr.sin_port        = htons((uint16_t)port);

    if (bind(server_fd, (struct sockaddr *)&addr, sizeof(addr)) < 0) {
        printfLog("HTTP: failed to bind to port %d\n", port);
        close(server_fd);
        server_fd = -1;
        return RC_ERROR;
    }

    listen(server_fd, 8);

    server_running = 1;
    if (pthread_create(&server_thread, NULL, server_thread_func, NULL) != 0) {
        printfLog("HTTP: failed to create server thread\n");
        close(server_fd);
        server_fd = -1;
        return RC_ERROR;
    }

    printfLog("HTTP server listening on 127.0.0.1:%d\n", port);
    return RC_OK;
}

void http_server_stop(void)
{
    server_running = 0;
    if (server_fd >= 0) {
        close(server_fd);
        server_fd = -1;
    }
    pthread_join(server_thread, NULL);

    pthread_mutex_lock(&clients_mutex);
    for (int i = 0; i < MAX_SSE_CLIENTS; i++) {
        if (sse_clients[i].active) {
            remove_sse_client(i);
        }
    }
    pthread_mutex_unlock(&clients_mutex);
}
