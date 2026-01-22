#!/bin/bash
# Start Ollama with performance optimizations

# Kill existing Ollama process
pkill -f "ollama serve"
sleep 2

# Start Ollama with optimizations
export OLLAMA_FLASH_ATTENTION="1"
export OLLAMA_KV_CACHE_TYPE="q8_0"

echo "🚀 Starting Ollama with optimizations..."
echo "   - Flash Attention: enabled (faster context processing)"
echo "   - KV Cache Type: q8_0 (reduced memory usage)"

nohup ollama serve > /tmp/ollama.log 2>&1 &

sleep 3

# Verify Ollama is running
if curl -s http://localhost:11434/api/version &> /dev/null; then
    VERSION=$(curl -s http://localhost:11434/api/version | jq -r '.version')
    echo "✅ Ollama started successfully (version: $VERSION)"
    echo "📝 Logs: tail -f /tmp/ollama.log"
else
    echo "❌ Failed to start Ollama"
    exit 1
fi
