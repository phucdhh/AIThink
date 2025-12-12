# Hướng dẫn Setup Cloudflare Tunnel

## 🚀 Các bước đã hoàn thành

✅ **Backend** đã được cấu hình CORS cho domain production
✅ **Frontend** đã được cấu hình `allowedHosts` 
✅ **WebSocket** tự động detect URL dựa trên hostname

---

## 📝 Cấu hình Cloudflare Tunnel

### Bước 1: Cài đặt cloudflared

```bash
brew install cloudflare/cloudflare/cloudflared
```

### Bước 2: Login vào Cloudflare

```bash
cloudflared login
```

Trình duyệt sẽ mở, chọn domain `truyenthong.edu.vn` để xác thực.

### Bước 3: Tạo Tunnel

```bash
cloudflared tunnel create aithink
```

Lưu lại **Tunnel ID** được hiển thị.

### Bước 4: Tạo file cấu hình

Tạo file `~/.cloudflared/config.yml`:

```yaml
tunnel: aithink
credentials-file: /Users/mac/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Frontend - Vite dev server
  - hostname: aithink.truyenthong.edu.vn
    service: http://localhost:5173
  
  # Backend API & WebSocket
  - hostname: api.aithink.truyenthong.edu.vn
    service: http://localhost:3000
  
  # Catch-all rule (required)
  - service: http_status:404
```

**Lưu ý:** Thay `<TUNNEL_ID>` bằng ID tunnel của bạn.

### Bước 5: Route DNS

```bash
# Frontend
cloudflared tunnel route dns aithink aithink.truyenthong.edu.vn

# Backend API (optional - nếu muốn tách riêng)
cloudflared tunnel route dns aithink api.aithink.truyenthong.edu.vn
```

### Bước 6: Chạy Tunnel

```bash
cloudflared tunnel run aithink
```

Hoặc chạy ngầm:

```bash
cloudflared tunnel run aithink &
```

### Bước 7: Setup tự động khởi động (Recommended)

```bash
# Install as a service
sudo cloudflared service install

# Start service
sudo launchctl start com.cloudflare.cloudflared
```

---

## 🔧 Cấu hình thay thế - Chỉ dùng 1 domain

Nếu bạn chỉ muốn dùng `aithink.truyenthong.edu.vn` cho cả frontend lẫn backend:

**File `~/.cloudflared/config.yml`:**

```yaml
tunnel: aithink
credentials-file: /Users/mac/.cloudflared/<TUNNEL_ID>.json

ingress:
  # Route API requests to backend
  - hostname: aithink.truyenthong.edu.vn
    path: /api/*
    service: http://localhost:3000
  
  # Route socket.io to backend
  - hostname: aithink.truyenthong.edu.vn
    path: /socket.io/*
    service: http://localhost:3000
  
  # Everything else to frontend
  - hostname: aithink.truyenthong.edu.vn
    service: http://localhost:5173
  
  - service: http_status:404
```

Trong trường hợp này, cập nhật `ChatInterface.jsx`:

```javascript
const socketUrl = window.location.hostname === 'localhost' 
  ? 'http://localhost:3000'
  : window.location.origin; // Cùng origin với frontend
```

---

## ✅ Kiểm tra

### 1. Kiểm tra Tunnel đang chạy:

```bash
cloudflared tunnel list
cloudflared tunnel info aithink
```

### 2. Test kết nối:

```bash
# Test frontend
curl -I https://aithink.truyenthong.edu.vn

# Test backend (nếu dùng subdomain riêng)
curl -I https://api.aithink.truyenthong.edu.vn/api/health
```

### 3. Kiểm tra logs:

```bash
cloudflared tunnel logs aithink
```

---

## 🐛 Troubleshooting

### Lỗi "Blocked request"
✅ **ĐÃ SỬA** - Đã thêm `allowedHosts` vào `vite.config.js`

### Lỗi CORS
✅ **ĐÃ SỬA** - Backend đã được cấu hình accept requests từ `aithink.truyenthong.edu.vn`

### WebSocket không kết nối được
- Kiểm tra Browser Console xem có lỗi gì
- Đảm bảo cả Backend và Frontend đều đang chạy
- Kiểm tra Cloudflare Tunnel routing config

### Tunnel không start được
```bash
# Check if tunnel exists
cloudflared tunnel list

# Recreate if needed
cloudflared tunnel delete aithink
cloudflared tunnel create aithink
```

---

## 📊 Monitoring

### Xem status của services:

```bash
# Backend
ps aux | grep "node src/server.js"

# Frontend
ps aux | grep vite

# Cloudflare Tunnel
ps aux | grep cloudflared
```

### Xem logs real-time:

**Backend:**
```bash
tail -f /Users/mac/AIThink/backend/logs/app.log
```

**Cloudflare Tunnel:**
```bash
cloudflared tunnel logs aithink
```

---

## 🔐 Production Checklist

Trước khi công khai:

- [ ] Thay `NODE_ENV=production` trong `.env`
- [ ] Setup logging (Winston)
- [ ] Thêm rate limiting
- [ ] Thêm authentication (nếu cần)
- [ ] Setup PM2 để auto-restart backend:
  ```bash
  npm install -g pm2
  pm2 start backend/src/server.js --name aithink-backend
  pm2 startup
  pm2 save
  ```
- [ ] Build frontend cho production:
  ```bash
  cd frontend
  npm run build
  ```
- [ ] Serve frontend build với Nginx hoặc serve:
  ```bash
  npm install -g serve
  serve -s dist -p 5173
  ```

---

## 🎯 Cấu hình Hiện tại

✅ **Backend**: `http://localhost:3000`
- CORS: Cho phép `https://aithink.truyenthong.edu.vn`
- WebSocket: Socket.IO với CORS enabled

✅ **Frontend**: `http://localhost:5173`
- allowedHosts: `['aithink.truyenthong.edu.vn', 'localhost']`
- Auto-detect WebSocket URL dựa trên hostname

✅ **Sẵn sàng cho Cloudflare Tunnel!**

---

## 🚀 Quick Start

1. **Start Backend:**
   ```bash
   cd /Users/mac/AIThink/backend
   npm start
   ```

2. **Start Frontend:**
   ```bash
   cd /Users/mac/AIThink/frontend
   npm run dev
   ```

3. **Start Cloudflare Tunnel:**
   ```bash
   cloudflared tunnel run aithink
   ```

4. **Truy cập:** https://aithink.truyenthong.edu.vn

---

**Lưu ý:** Đảm bảo Mac mini luôn bật và các services luôn chạy để website hoạt động 24/7.
