#!/bin/bash
# Check AIThink Services Status

echo "========================================"
echo "  AIThink Services Status"
echo "========================================"
echo ""

# Check Cloudflare Tunnel
echo "🌐 Cloudflare Tunnel:"
if ps aux | grep "config-aithink.yml" | grep -v grep > /dev/null; then
    PID=$(ps aux | grep "config-aithink.yml" | grep -v grep | awk '{print $2}')
    echo "   ✅ Running (PID: $PID)"
    
    # Check active connection
    if cloudflared tunnel info 601ea576-981e-4b58-9f0a-1fbe60937394 2>&1 | grep -q "does not have any active"; then
        echo "   ⚠️  No active connection - needs restart!"
        echo "   💡 Run: cloudflared tunnel --config ~/.cloudflared/config-aithink.yml run aithink > /tmp/cloudflared-aithink.log 2>&1 &"
    else
        echo "   ✅ Has active connection"
    fi
else
    echo "   ❌ Not running"
    echo "   💡 Run: cloudflared tunnel --config ~/.cloudflared/config-aithink.yml run aithink > /tmp/cloudflared-aithink.log 2>&1 &"
fi
echo ""

# Check Ollama
echo "🤖 Ollama:"
if ps aux | grep "ollama serve" | grep -v grep > /dev/null; then
    if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
        MODEL=$(curl -s http://localhost:11434/api/tags | grep -o '"name":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "   ✅ Running (Model: $MODEL)"
    else
        echo "   ⚠️  Process running but API not responding"
    fi
else
    echo "   ❌ Not running"
    echo "   💡 Run: ollama serve > /tmp/ollama.log 2>&1 &"
fi
echo ""

# Check PM2
echo "📦 PM2 Applications:"
if command -v pm2 > /dev/null; then
    pm2 list | tail -n +4
else
    echo "   ❌ PM2 not found"
fi
echo ""

# Check website
echo "🌍 Website Status:"
if curl -s -o /dev/null -w "%{http_code}" https://aithink.truyenthong.edu.vn/ | grep -q "200"; then
    echo "   ✅ https://aithink.truyenthong.edu.vn/ is accessible"
else
    echo "   ❌ Website not accessible"
fi
echo ""

echo "========================================"
echo "  Quick Actions"
echo "========================================"
echo "Start Ollama:   ollama serve > /tmp/ollama.log 2>&1 &"
echo "Start PM2:      pm2 start ecosystem.config.js"
echo "Restart PM2:    pm2 restart all"
echo "View PM2 logs:  pm2 logs"
echo ""
