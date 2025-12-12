#!/bin/bash
# Start Ollama on boot and load model

# Wait for system to be ready
sleep 5

# Start Ollama with 8 parallel requests (optimal for M2 24GB)
OLLAMA_NUM_PARALLEL=8 ollama serve > /tmp/ollama.log 2>&1 &

# Wait for Ollama to start
sleep 10

# Pull/verify model exists
ollama list

echo "Ollama started at $(date)" >> /tmp/ollama-startup.log
