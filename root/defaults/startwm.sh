#!/bin/bash
[ -f /startpulse.sh ] && /startpulse.sh &
/usr/bin/openbox-session > /dev/null 2>&1
