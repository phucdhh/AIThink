#!/bin/bash
# Auto-start PM2 and resurrect saved processes on boot

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
export HOME="/Users/mac"

# Wait for system to settle
sleep 5

PM2=/opt/homebrew/bin/pm2

# Start PM2 daemon if not running
$PM2 ping > /dev/null 2>&1 || true

# Resurrect saved process list
$PM2 resurrect

# Save current list
$PM2 save

echo "PM2 auto-start completed at $(date)"
