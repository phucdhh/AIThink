#!/bin/bash
# Start AIThink Application
# Usage: ./startAIThink.sh

echo "🚀 Starting AIThink..."
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
    echo "   Start Ollama with optimizations: ./start-ollama.sh"
    echo ""
fi

# Start AIThink services using PM2
cd /Users/mac/AIThink
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "✅ AIThink services started!"
echo ""
echo "📊 Status: pm2 status"
echo "📝 Logs:   pm2 logs"
echo "🌐 Backend:  http://localhost:5172"
echo "🌐 Frontend: http://localhost:5173"
echo ""
