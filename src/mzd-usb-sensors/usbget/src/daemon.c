/*
 * daemon.c
 *
 * USB broadcast reader + JSON assembler + SSE fanout.
 *
 * Design
 * ======
 *   Main thread (USB reader):
 *     - Sends 'B' to the Arduino to start broadcast mode.
 *     - Calls receiveLine() in a loop (blocks up to RECEIVE_TIMEOUT_MSEC).
 *     - Assembles JSON from '+' lines, broadcasts on '.'.
 *     - Holds usb_mutex during each receiveLine() call so the config
 *       handler (HTTP thread) can safely interject.
 *
 *   HTTP server thread (started by http_server_start()):
 *     - Serves GET /stream as SSE.
 *     - On POST /config: calls handle_config() (this file), which
 *       stops broadcast, sends TPMS set command, restarts broadcast.
 *
 * JSON format produced
 * ====================
 *   Only oil:  {"oil":{"t":85.2,"p":3.45}}
 *   Only TPMS: {"tpms":{"0":{"id":"AABB..","t":25.1,"p":2.05},...}}
 *   Both:      {"tpms":{...},"oil":{...}}
 *
 * Config POST body expected
 * =========================
 *   {"tpms":{"fl":"A1B2C3D4","fr":"E5F6G7H8","rl":"AABBCCDD","rr":"11223344"}}
 *   Keys fl/fr/rl/rr map to Arduino sensor indices 0/1/2/3.
 */

#include "daemon.h"
#include "http_server.h"
#include "protocol.h"
#include "usb.h"
#include "support.h"

#include <pthread.h>
#include <signal.h>
#include <stdarg.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>


/* ── Shared state ────────────────────────────────────────────── */

static pthread_mutex_t usb_mutex  = PTHREAD_MUTEX_INITIALIZER;
static usbDevice      *usb_device = NULL;


/* ── JSON frame assembly ─────────────────────────────────────── */

#define JSON_MAX_SIZE 512

static char json_buf[JSON_MAX_SIZE];
static int  json_pos;   /* write cursor inside json_buf */
static int  has_tpms;
static int  has_oil;

static void reset_frame(void)
{
    json_buf[0] = '{';
    json_pos    = 1;
    has_tpms    = 0;
    has_oil     = 0;
}

/*
 * Append content to json_buf.
 * Returns 0 on success, -1 if the buffer would overflow (frame is discarded).
 */
static int json_append(const char *fmt, ...)
{
    va_list ap;
    va_start(ap, fmt);
    int n = vsnprintf(json_buf + json_pos, (size_t)(JSON_MAX_SIZE - json_pos), fmt, ap);
    va_end(ap);

    if (n < 0 || json_pos + n >= JSON_MAX_SIZE - 2) {
        printfLog("daemon: JSON buffer overflow — frame dropped\n");
        reset_frame();
        return -1;
    }
    json_pos += n;
    return 0;
}

/* Separator between JSON object members */
static const char *sep(void)
{
    return (json_pos > 1) ? "," : "";
}

/*
 * Parse one '+' line (command char already stripped by receiveLine()).
 *
 * TPMS line format (from tpms_433.ino sendData()):
 *   "0: AABBCCDD 25.1 2.05 1: EEFF0011 24.8 2.10 2: ... 3: ..."
 *
 * Oil line format (from oil_sensor.ino sendData()):
 *   "oiltemp: 85.2 oilpress: 3.45"
 */
static void parse_data_line(const char *line)
{
    if (strncmp(line, "oiltemp:", 8) == 0) {
        float t = 0.0f, p = 0.0f;
        if (sscanf(line, "oiltemp: %f oilpress: %f", &t, &p) == 2) {
            json_append("%s\"oil\":{\"t\":%.1f,\"p\":%.2f}", sep(), t, p);
            has_oil = 1;
        }
        return;
    }

    /* Try to parse one or more "idx: HEXID TEMP PRESS " groups */
    const char *p = line;
    char  tpms_content[320];
    int   tpms_pos  = 0;
    int   parsed    = 0;

    for (;;) {
        int   idx;
        char  id[16];
        float t, pres;
        int   consumed = 0;

        id[0] = '\0';
        if (sscanf(p, " %d: %8s %f %f%n", &idx, id, &t, &pres, &consumed) != 4
            || consumed <= 0)
        {
            break;
        }
        id[8] = '\0'; /* ensure termination */

        if (parsed) tpms_content[tpms_pos++] = ',';
        tpms_pos += snprintf(tpms_content + tpms_pos,
                             (int)sizeof(tpms_content) - tpms_pos,
                             "\"%d\":{\"id\":\"%s\",\"t\":%.1f,\"p\":%.2f}",
                             idx, id, t, pres);
        p += consumed;
        parsed++;

        if (tpms_pos >= (int)sizeof(tpms_content) - 60) break;
    }

    if (parsed > 0) {
        json_append("%s\"tpms\":{%s}", sep(), tpms_content);
        has_tpms = 1;
    }
}

/* Close the current JSON frame and push it to SSE clients. */
static void finish_frame(void)
{
    if (json_pos < 1 || json_pos >= JSON_MAX_SIZE - 1) {
        reset_frame();
        return;
    }
    if (!has_tpms && !has_oil) {
        reset_frame();
        return;
    }

    json_buf[json_pos++] = '}';
    json_buf[json_pos]   = '\0';

    http_broadcast_json(json_buf);
    reset_frame();
}


/* ── Config handler (called from HTTP server thread) ─────────── */

/*
 * Parse a JSON config body and forward TPMS sensor IDs to the Arduino.
 *
 * Expected body: {"tpms":{"fl":"A1B2C3D4","fr":"...","rl":"...","rr":"..."}}
 * fl→idx 0, fr→idx 1, rl→idx 2, rr→idx 3
 */
static returnCode handle_config(const char *body, int body_len)
{
    /* Work on a null-terminated copy — cap at 512 bytes */
    char buf[512];
    int  copy_len = body_len < (int)sizeof(buf) - 1 ? body_len : (int)sizeof(buf) - 1;
    memcpy(buf, body, (size_t)copy_len);
    buf[copy_len] = '\0';

    /* Keys map to Arduino indices 0-3 */
    static const char *keys[] = {"\"fl\"", "\"fr\"", "\"rl\"", "\"rr\""};
    char  ids[4][9];
    int   id_found[4] = {0, 0, 0, 0};

    for (int i = 0; i < 4; i++) {
        const char *p = strstr(buf, keys[i]);
        if (!p) continue;
        p = strchr(p, ':');
        if (!p) continue;
        p++;
        while (*p == ' ') p++;
        if (*p != '"') continue;
        p++;
        int j = 0;
        while (*p && *p != '"' && j < 8) ids[i][j++] = *p++;
        ids[i][j] = '\0';
        if (j == 8) id_found[i] = 1;
    }

    /* At least one ID must be valid */
    int any = 0;
    for (int i = 0; i < 4; i++) any |= id_found[i];
    if (!any) return RC_ERROR;

    pthread_mutex_lock(&usb_mutex);

    ProtocolChar cmd;

    /* Stop broadcast */
    sendCommand(usb_device, BROADCAST_STOP, NULL);
    receiveLine(usb_device, &cmd); /* expect '.' */

    /* Send TPMS set command */
    sendCommand(usb_device, SET_ACTION, "TPMS");
    for (int i = 0; i < 4; i++) {
        if (!id_found[i]) continue;
        char param[12];
        snprintf(param, sizeof(param), "%d=%s", i, ids[i]);
        sendMoreData(usb_device, param);
    }
    sendEOT(usb_device);
    receiveLine(usb_device, &cmd); /* expect '.' ACK */

    /* Restart broadcast */
    sendCommand(usb_device, BROADCAST_START, NULL);
    receiveLine(usb_device, &cmd); /* expect '.' ACK */

    pthread_mutex_unlock(&usb_mutex);

    return RC_OK;
}


/* ── Main daemon loop ────────────────────────────────────────── */

returnCode run_daemon(usbDevice *device, int http_port)
{
    usb_device = device;

    /* Suppress SIGPIPE so writes to dead SSE clients don't kill the process */
    signal(SIGPIPE, SIG_IGN);

    /* Start HTTP server thread */
    if (http_server_start(http_port, handle_config) != RC_OK) {
        return RC_ERROR;
    }

    ProtocolChar cmd;

    /* Start Arduino broadcast mode */
    sendCommand(device, BROADCAST_START, NULL);
    receiveLine(device, &cmd); /* drain ACK */

    reset_frame();

    printfLog("Daemon running. Broadcast active. HTTP on port %d.\n", http_port);

    for (;;) {
        pthread_mutex_lock(&usb_mutex);
        char *line = receiveLine(device, &cmd);
        pthread_mutex_unlock(&usb_mutex);

        if (isMoreData(cmd)) {
            parse_data_line(line);
        } else if (isEOT(cmd)) {
            finish_frame();
        }
        /* NO_COMMAND = timeout (expected at ~RECEIVE_TIMEOUT_MSEC cadence) */
        /* NACK_OR_ERROR: log and continue */
        else if (isNACK(cmd)) {
            printfLog("daemon: Arduino error: %s\n", line);
        }
    }

    /* Never reached in normal operation */
    http_server_stop();
    return RC_OK;
}
