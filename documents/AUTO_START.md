# AIThink Auto-Start Setup

## Services đã được cấu hình tự động khởi động

### 1. ⚠️ Cloudflare Tunnel
- **Trạng thái**: Tự động chạy nhưng không có active connection
- **Cần restart sau reboot** để kết nối đúng

### 2. ✅ PM2 (Backend + Frontend)
- **Trạng thái**: Đã setup auto-start
- **LaunchAgent**: `/Users/mac/Library/LaunchAgents/pm2.mac.plist`
- **Saved process list**: `/Users/mac/.pm2/dump.pm2`

### 3. ⚠️ Ollama
- **Cần khởi động thủ công** sau khi reboot
- Script: `/Users/mac/AIThink/start-ollama.sh`

## 🚀 Quick Start sau khi reboot

### Cách nhanh nhất (1 lệnh):
```bash
cd /Users/mac/AIThink
./restart-after-reboot.sh
```
Script này sẽ:
- Start Ollama (nếu chưa chạy)
- Kiểm tra PM2 (tự động khởi động nhờ LaunchAgent)
- Restart Cloudflare Tunnel để thiết lập active connection
- Kiểm tra trạng thái tất cả services

### Hoặc kiểm tra trạng thái thủ công:
```bash
# Kiểm tra tất cả services
./check-services.sh

# Hoặc kiểm tra từng service:
# Cloudflare Tunnel
ps aux | grep cloudflared | grep -v grep

# PM2
pm2 list

# Ollama
curl http://localhost:11434/api/tags
```

### Nếu Cloudflare Tunnel không có active connection:
```bash
# Kiểm tra connection
cloudflared tunnel info 601ea576-981e-4b58-9f0a-1fbe60937394

# Nếu "does not have any active connection"
sudo pkill -9 cloudflared
cloudflared tunnel run 601ea576-981e-4b58-9f0a-1fbe60937394 > /tmp/cloudflared.log 2>&1 &

# Đợi 5 giây và kiểm tra
sleep 5 && tail -10 /tmp/cloudflared.log
```

### Nếu Ollama chưa chạy:
```bash
OLLAMA_NUM_PARALLEL=8 ollama serve > /tmp/ollama.log 2>&1 &
```

### Nếu PM2 apps chưa chạy:
```bash
cd /Users/mac/AIThink
pm2 resurrect
# Hoặc
pm2 start ecosystem.config.js
```

## Commands hữu ích

### Restart tất cả
```bash
# Stop tất cả
pm2 stop all

# Restart backend
pm2 restart aithink-backend

# Xem logs
pm2 logs aithink-backend --lines 50
```

### Xóa PM2 auto-start (nếu cần)
```bash
pm2 unstartup launchd
```

### Re-setup PM2 auto-start
```bash
pm2 startup
# Copy paste command output
pm2 save
```

## Logs location
- **Ollama**: `/tmp/ollama.log`
- **PM2**: `pm2 logs`
- **Cloudflare**: `sudo launchctl list | grep cloudflared`
- **System**: `/tmp/aithink-*.log`

## Troubleshooting

### Lỗi Cloudflare 1033
Nghĩa là backend không phản hồi. Kiểm tra:
1. Ollama có chạy không: `curl http://localhost:11434/api/tags`
2. Backend có chạy không: `pm2 list`
3. Backend có lỗi không: `pm2 logs aithink-backend --lines 20`

### Khởi động lại toàn bộ
```bash
# Stop PM2
pm2 stop all

# Kill Ollama
pkill ollama

# Start lại
ollama serve > /tmp/ollama.log 2>&1 &
sleep 5
pm2 start ecosystem.config.js
```
