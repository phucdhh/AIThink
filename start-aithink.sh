#!/bin/bash
# AIThink Auto-start Script

# Wait for network to be ready
sleep 10

# Set PATH to include Homebrew and local binaries
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

# Start Ollama service with 6 parallel connections
echo "Starting Ollama with 6 parallel connections..."
OLLAMA_NUM_PARALLEL=6 /usr/local/bin/ollama serve > /tmp/ollama.log 2>&1 &
OLLAMA_PID=$!
echo "Ollama started with PID: $OLLAMA_PID"

# Wait for Ollama to be ready
echo "Waiting for Ollama to be ready..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        echo "Ollama is ready!"
        break
    fi
    sleep 1
done

# Start PM2 applications
echo "Starting PM2 applications..."
cd /Users/mac/AIThink
/usr/local/bin/pm2 start ecosystem.config.js > /tmp/pm2-start.log 2>&1
/usr/local/bin/pm2 save

echo "AIThink services started successfully!"
echo "Check logs at /tmp/ollama.log and /tmp/pm2-start.log"
