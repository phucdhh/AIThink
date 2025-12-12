#!/bin/bash
# Quick restart script after Mac mini reboot

echo "🔄 Restarting AIThink services after reboot..."
echo ""

# 1. Start Ollama
echo "1️⃣ Starting Ollama..."
if ! ps aux | grep "ollama serve" | grep -v grep > /dev/null; then
    OLLAMA_NUM_PARALLEL=8 ollama serve > /tmp/ollama.log 2>&1 &
    sleep 3
    echo "   ✅ Ollama started (8 parallel)"
else
    echo "   ℹ️  Ollama already running"
fi

# 2. Check PM2
echo ""
echo "2️⃣ Checking PM2..."
if pm2 list 2>&1 | grep -q "online"; then
    echo "   ✅ PM2 apps already running"
else
    echo "   Starting PM2 apps..."
    cd /Users/mac/AIThink
    pm2 start ecosystem.config.js
fi

# 3. Restart Cloudflare Tunnel
echo ""
echo "3️⃣ Restarting Cloudflare Tunnel..."
sudo pkill -9 cloudflared
sleep 1
cloudflared tunnel run 601ea576-981e-4b58-9f0a-1fbe60937394 > /tmp/cloudflared.log 2>&1 &
echo "   ✅ Cloudflare Tunnel restarted"

# 4. Wait and verify
echo ""
echo "⏳ Waiting 10 seconds for services to stabilize..."
sleep 10

# 5. Check status
echo ""
echo "=========================================="
echo "  Final Status Check"
echo "=========================================="
./check-services.sh
