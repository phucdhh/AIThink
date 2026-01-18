#!/bin/bash
# Stop AIThink Application
# Usage: ./stopAIThink.sh

echo "🛑 Stopping AIThink..."
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed"
    exit 1
fi

# Stop AIThink services
pm2 stop aithink-backend aithink-frontend

echo ""
echo "✅ AIThink services stopped!"
echo ""
echo "📊 Status: pm2 status"
echo ""
