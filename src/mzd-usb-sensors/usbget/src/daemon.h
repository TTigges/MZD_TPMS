/*
 * daemon.h
 *
 * USB-reader / HTTP-daemon main loop for usbget daemon mode.
 *
 * Call run_daemon() after opening the USB device.  It blocks forever,
 * running the Arduino broadcast loop and serving HTTP clients.
 */

#ifndef _USBGET_DAEMON_H
#define _USBGET_DAEMON_H

#include "support.h"
#include "usb.h"

/*
 * Start the HTTP server, enable Arduino broadcast mode ('B'),
 * then loop: read USB broadcast frames → assemble JSON → push SSE.
 *
 * Only returns on fatal error.
 */
returnCode run_daemon(usbDevice *device, int http_port);

#endif
