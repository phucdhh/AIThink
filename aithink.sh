#!/bin/bash
# AIThink Management Scripts

case "$1" in
  start)
    echo "🚀 Starting AIThink services..."
    pm2 start /Users/mac/AIThink/ecosystem.config.js
    pm2 save
    ;;
  
  stop)
    echo "🛑 Stopping AIThink services..."
    pm2 stop all
    ;;
  
  restart)
    echo "🔄 Restarting AIThink services..."
    pm2 restart all
    ;;
  
  status)
    echo "📊 AIThink Services Status:"
    pm2 status
    echo ""
    echo "📈 Monitor: pm2 monit"
    echo "📝 Logs: pm2 logs"
    ;;
  
  logs)
    if [ -z "$2" ]; then
      echo "📝 All logs (Ctrl+C to exit):"
      pm2 logs
    else
      echo "📝 Logs for $2:"
      pm2 logs "$2"
    fi
    ;;
  
  monitor)
    echo "📈 Opening PM2 Monitor (Ctrl+C to exit)..."
    pm2 monit
    ;;
  
  reload)
    echo "🔄 Reloading AIThink (zero-downtime)..."
    pm2 reload all
    ;;
  
  delete)
    echo "🗑️  Removing all PM2 processes..."
    pm2 delete all
    pm2 save --force
    ;;
  
  reset)
    echo "🔄 Resetting AIThink..."
    pm2 delete all
    pm2 start /Users/mac/AIThink/ecosystem.config.js
    pm2 save
    ;;
  
  health)
    echo "🏥 Health Check:"
    echo ""
    echo "Backend Health:"
    curl -s http://localhost:3000/api/health | python3 -m json.tool || echo "❌ Backend not responding"
    echo ""
    echo "Frontend:"
    curl -s -I http://localhost:5173 | head -1 || echo "❌ Frontend not responding"
    echo ""
    echo "Cloudflare Tunnel:"
    pgrep -l cloudflared || echo "❌ Cloudflare tunnel not running"
    ;;
  
  *)
    echo "AIThink Management Script"
    echo ""
    echo "Usage: $0 {start|stop|restart|status|logs|monitor|reload|delete|reset|health}"
    echo ""
    echo "Commands:"
    echo "  start    - Start all services"
    echo "  stop     - Stop all services"
    echo "  restart  - Restart all services"
    echo "  status   - Show service status"
    echo "  logs     - Show logs (use: logs backend or logs frontend)"
    echo "  monitor  - Open PM2 monitoring dashboard"
    echo "  reload   - Zero-downtime reload"
    echo "  delete   - Remove all PM2 processes"
    echo "  reset    - Delete and restart all services"
    echo "  health   - Check health of all components"
    echo ""
    exit 1
    ;;
esac
