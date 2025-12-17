#!/bin/bash
# AIThink Auto-start Script for Mac Boot

# Wait for system to be fully ready
sleep 15

# Set environment
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
export PM2_HOME="/Users/mac/.pm2"

# Log start
echo "$(date): AIThink auto-start initiated" >> /tmp/aithink-autostart.log

# Resurrect PM2 processes
/opt/homebrew/lib/node_modules/pm2/bin/pm2 resurrect >> /tmp/aithink-autostart.log 2>&1

echo "$(date): PM2 resurrect completed" >> /tmp/aithink-autostart.log

# Check status after 5 seconds
sleep 5
/opt/homebrew/lib/node_modules/pm2/bin/pm2 list >> /tmp/aithink-autostart.log 2>&1

echo "$(date): AIThink auto-start finished" >> /tmp/aithink-autostart.log
