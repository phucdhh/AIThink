#!/bin/bash
# Ollama Auto-start Script

# Set environment
export OLLAMA_NUM_PARALLEL=8
export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"

# Log start
echo "$(date): Starting Ollama with OLLAMA_NUM_PARALLEL=8" >> /tmp/ollama-autostart.log

# Start Ollama
exec /opt/homebrew/bin/ollama serve
