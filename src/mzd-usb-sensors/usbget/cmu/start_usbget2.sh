#!/bin/sh
#
# start_usbtest.sh
#
# Starts usbtest daemon on the CMU.
# Kills any stale instance first (e.g. after CMU reboot, the USB handle
# of an old process becomes invalid but the process stays alive).
#
# Copy this file alongside usbtest to:
#   /tmp/mnt/data_persist/dev/bin/
#
# Usage: sh start_usbtest.sh
#

BINDIR="$(dirname "$0")"
USBGET="$BINDIR/usbget2"
PORT=9970

# Kill stale instance; ignore error if none running
pkill usbget2 2>/dev/null
sleep 1

"$USBGET" -D -P "$PORT" &
echo "usbget daemon started on port $PORT (PID $!)"
