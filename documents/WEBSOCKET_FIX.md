# 🔧 Khắc phục lỗi WebSocket trên Production Domain

## ❌ Vấn đề

Khi truy cập qua `https://aithink.truyenthong.edu.vn`:
- Frontend hiển thị bình thường
- Nhập câu hỏi → Không có phản hồi
- Console hiển thị: "server connection lost"

**Nguyên nhân:** Cloudflare Tunnel chỉ route đến Frontend (port 5173), không route đến Backend (port 3000). WebSocket không thể kết nối.

## ✅ Giải pháp đã áp dụng

### 1. **Vite Proxy Configuration** (Recommended)

Sử dụng Vite làm reverse proxy để forward tất cả requests API và WebSocket từ frontend sang backend.

**File: `frontend/vite.config.js`**

```javascript
export default defineConfig({
  server: {
    port: 5173,
    host: '0.0.0.0',
    allowedHosts: ['aithink.truyenthong.edu.vn', 'localhost'],
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true  // Enable WebSocket proxy
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true  // Enable WebSocket proxy
      }
    }
  }
})
```

**Lợi ích:**
- ✅ Cloudflare chỉ cần route đến port 5173
- ✅ Vite tự động forward API và WebSocket đến backend
- ✅ Không cần cấu hình phức tạp ở Cloudflare
- ✅ CORS không còn là vấn đề (same origin)

### 2. **Frontend WebSocket Connection**

**File: `frontend/src/components/ChatInterface.jsx`**

```javascript
useEffect(() => {
  // Kết nối đến cùng origin (Vite sẽ proxy đến backend)
  let socketUrl;
  if (window.location.hostname === 'localhost') {
    socketUrl = 'http://localhost:3000'; // Local dev
  } else {
    socketUrl = window.location.origin; // Production: Vite proxy
  }
  
  const newSocket = io(socketUrl, {
    transports: ['websocket', 'polling'],
    path: '/socket.io/'
  });
  
  // ... rest of code
}, []);
```

## 🚀 Cách hoạt động

### Local Development:
```
Browser → http://localhost:5173 (Frontend)
WebSocket → http://localhost:3000 (Backend)
```

### Production via Cloudflare:
```
Browser → https://aithink.truyenthong.edu.vn
          ↓ (Cloudflare Tunnel)
          Vite Dev Server (localhost:5173)
          ↓ (Vite Proxy)
          /api/* → Backend (localhost:3000)
          /socket.io/* → Backend (localhost:3000)
```

## 🎯 Testing

### 1. Test Local
```bash
# Terminal 1: Backend
cd /Users/mac/AIThink/backend
npm start

# Terminal 2: Frontend
cd /Users/mac/AIThink/frontend
npm run dev

# Browser: http://localhost:5173
```

### 2. Test Production
```bash
# Đảm bảo cả Backend và Frontend đang chạy
ps aux | grep "node src/server.js"
ps aux | grep vite

# Browser: https://aithink.truyenthong.edu.vn
# Check Console: Should see "✅ Connected to server"
```

### 3. Debug Commands
```bash
# Check backend health
curl http://localhost:3000/api/health

# Check frontend accessible
curl -I http://localhost:5173

# Check Cloudflare tunnel
cloudflared tunnel list
ps aux | grep cloudflared
```

## 📊 Cloudflare Tunnel Configuration (Hiện tại)

Tunnel "MacMini" đang chạy và route:
- `aithink.truyenthong.edu.vn` → `localhost:5173`

**Không cần route thêm port 3000** vì Vite đã handle proxy.

## 🔄 Alternative: Dual Port Routing (Không khuyến nghị)

Nếu muốn Cloudflare route trực tiếp đến backend:

**Tạo file `~/.cloudflared/config.yml`:**
```yaml
tunnel: MacMini
credentials-file: /Users/mac/.cloudflared/3d585e7a-4c9e-40da-ae32-729b9106fae2.json

ingress:
  # API & WebSocket → Backend
  - hostname: aithink.truyenthong.edu.vn
    path: /api/*
    service: http://localhost:3000
  
  - hostname: aithink.truyenthong.edu.vn
    path: /socket.io/*
    service: http://localhost:3000
  
  # Everything else → Frontend
  - hostname: aithink.truyenthong.edu.vn
    service: http://localhost:5173
  
  - service: http_status:404
```

**Nhược điểm:**
- ❌ Phức tạp hơn
- ❌ Cần restart tunnel mỗi khi thay đổi
- ❌ CORS có thể gây vấn đề

## ✨ Kết luận

**Giải pháp hiện tại (Vite Proxy) là tốt nhất** vì:
1. ✅ Đơn giản - Cloudflare chỉ route 1 port
2. ✅ Không có CORS issues
3. ✅ Dễ maintain và debug
4. ✅ Frontend và Backend hoạt động như một unit

**Bây giờ ứng dụng sẽ hoạt động bình thường trên https://aithink.truyenthong.edu.vn!**

---

## 🐛 Troubleshooting

### Vẫn không kết nối được?

1. **Check Backend đang chạy:**
   ```bash
   curl http://localhost:3000/api/health
   ```

2. **Check Frontend proxy:**
   - Mở https://aithink.truyenthong.edu.vn
   - F12 → Console
   - Xem message "Attempting to connect to: ..."

3. **Check Vite dev server:**
   ```bash
   ps aux | grep vite
   # Nếu không chạy:
   cd /Users/mac/AIThink/frontend && npm run dev
   ```

4. **Restart tất cả:**
   ```bash
   # Kill all
   pkill -f "node src/server.js"
   pkill -f vite
   
   # Start Backend
   cd /Users/mac/AIThink/backend && npm start &
   
   # Start Frontend
   cd /Users/mac/AIThink/frontend && npm run dev &
   ```

### WebSocket transport errors?

Vite proxy config đã enable `ws: true` cho cả `/api` và `/socket.io`, nên WebSocket sẽ hoạt động.

Nếu vẫn có lỗi, Socket.IO sẽ fallback sang polling (long-polling HTTP), vẫn hoạt động nhưng chậm hơn.
