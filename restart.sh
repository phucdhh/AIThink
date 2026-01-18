#!/bin/bash
# Restart AIThink Application
# Usage: ./restartAIThink.sh

echo "🔄 Restarting AIThink..."
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed. Please install it first:"
    echo "   npm install -g pm2"
    exit 1
fi

# Check if Ollama is running
if ! curl -s http://localhost:11434/api/version &> /dev/null; then
    echo "⚠️  Warning: Ollama is not running on port 11434"
    echo "   AIThink requires Ollama to be running"
    echo ""
fi

# Restart AIThink services
pm2 restart aithink-backend aithink-frontend

echo ""
echo "✅ AIThink services restarted!"
echo ""
echo "📊 Status: pm2 status"
echo "📝 Logs:   pm2 logs"
echo ""
