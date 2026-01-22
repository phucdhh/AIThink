#!/bin/bash
# Check AIThink Application Status
# Usage: ./status.sh

echo "📊 AIThink Status Check"
echo "================================"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "❌ PM2 is not installed"
    exit 1
fi

# Show PM2 services status
echo "🔹 PM2 Services:"
pm2 status

echo ""
echo "================================"
echo ""

# Check Backend
echo "🔹 Backend (port 5172):"
if curl -s http://localhost:5172 &> /dev/null; then
    echo "   ✅ Backend is responding"
else
    echo "   ❌ Backend is not responding"
fi

echo ""

# Check Frontend
echo "🔹 Frontend (port 5173):"
if curl -s -I http://localhost:5173 &> /dev/null; then
    echo "   ✅ Frontend is responding"
else
    echo "   ❌ Frontend is not responding"
fi

echo ""

# Check Ollama
echo "🔹 Ollama (port 11434):"
if curl -s http://localhost:11434/api/version &> /dev/null; then
    OLLAMA_VERSION=$(curl -s http://localhost:11434/api/version | grep -o '"version":"[^"]*"' | cut -d'"' -f4)
    echo "   ✅ Ollama is running (version: $OLLAMA_VERSION)"
    
    # Check optimizations
    OLLAMA_PID=$(ps aux | grep "ollama serve" | grep -v grep | awk '{print $2}')
    if [ -n "$OLLAMA_PID" ]; then
        if ps eww -p $OLLAMA_PID 2>&1 | grep -q "OLLAMA_FLASH_ATTENTION=1"; then
            echo "   ⚡ Flash Attention: enabled"
        fi
        if ps eww -p $OLLAMA_PID 2>&1 | grep -q "OLLAMA_KV_CACHE_TYPE=q8_0"; then
            echo "   💾 KV Cache: q8_0 (optimized)"
        fi
    fi
else
    echo "   ❌ Ollama is not running"
fi

echo ""
echo "================================"
echo ""
echo "📝 View logs:    pm2 logs"
echo "🔄 Restart:      ./restartAIThink.sh"
echo "🛑 Stop:         ./stopAIThink.sh"
echo ""
