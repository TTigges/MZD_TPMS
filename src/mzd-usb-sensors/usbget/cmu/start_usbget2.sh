#!/bin/sh
#
# start_usbget2.sh
#
# Starts usbget2 daemon on the CMU with automatic reconnect.
# If usbget2 exits (e.g. Arduino disconnected/reset after short ACC-off),
# the loop restarts it after a short delay.
#
# Copy this file alongside usbget2 to:
#   /tmp/mnt/data_persist/dev/bin/
#
# Usage: sh start_usbget2.sh &
#

BINDIR="$(dirname "$0")"
USBGET="$BINDIR/usbget2"
PORT=9970

while true; do
    # Kill stale instance; ignore error if none running
    pkill usbget2 2>/dev/null
    sleep 1
    "$USBGET" -D -P "$PORT"
    # usbget2 exited (USB disconnect or error) — wait before restarting
    sleep 5
done &
echo "usbget2 watchdog started (PID $!)"
