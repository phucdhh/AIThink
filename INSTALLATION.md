# 📦 Hướng Dẫn Cài Đặt AIThink

Tài liệu này hướng dẫn chi tiết cách cài đặt và chạy ứng dụng **AIThink** - Gia sư Toán học AI trên hệ thống của bạn.

---

## 📋 Yêu Cầu Hệ Thống

### Phần Cứng
- **Mac mini M2** (hoặc tương đương) với chip Apple Silicon
- **RAM:** Tối thiểu 16GB (khuyến nghị 32GB)
- **Ổ cứng:** ~20GB dung lượng trống (cho Ollama và model)
- **Kết nối mạng:** Ổn định để tải model và truy cập từ xa

### Phần Mềm
- **macOS:** phiên bản 12+ (Monterey trở lên)
- **Node.js:** phiên bản 18.x hoặc 20.x
- **npm:** phiên bản 9.x trở lên
- **Ollama:** phiên bản mới nhất
- **Git:** để clone repository (tùy chọn)

---

## 🚀 Bước 1: Cài Đặt Ollama và Model

### 1.1. Cài đặt Ollama

```bash
# Tải Ollama cho macOS
curl -fsSL https://ollama.com/install.sh | sh

# Hoặc tải từ: https://ollama.com/download
```

### 1.2. Khởi động Ollama

```bash
# Ollama sẽ tự động chạy như một service
# Kiểm tra trạng thái:
curl http://127.0.0.1:11434/api/tags
```

Nếu thấy response JSON thì Ollama đã chạy thành công.

### 1.3. Tải Model Deepseek-R1

```bash
# Tải model deepseek-r1:8b (khoảng 4.9GB)
ollama pull deepseek-r1:8b

# Chờ tải xong, sau đó kiểm tra:
ollama list
```

Bạn sẽ thấy `deepseek-r1:8b` trong danh sách.

### 1.4. Kiểm tra Model

```bash
# Test thử model
ollama run deepseek-r1:8b "Tính 2+2 và giải thích"
```

Nếu model phản hồi, bạn đã cài đặt thành công!

---

## 🔧 Bước 2: Cài Đặt Backend

### 2.1. Chuẩn bị thư mục

```bash
# Di chuyển vào thư mục dự án
cd /Users/mac/AIThink/backend
```

### 2.2. Cài đặt Dependencies

```bash
# Cài đặt tất cả packages cần thiết
npm install

# Hoặc cài đặt thủ công:
npm install express cors socket.io axios dotenv
npm install --save-dev nodemon
```

### 2.3. Cấu hình Environment

Tạo file `.env` trong thư mục `backend/`:

```bash
# Tạo file .env
cat > .env << 'EOF'
# Server Configuration
PORT=3000
NODE_ENV=development

# Ollama Configuration
OLLAMA_HOST=http://127.0.0.1:11434
OLLAMA_MODEL=deepseek-r1:8b

# Queue Configuration
MAX_CONCURRENT_REQUESTS=3
QUEUE_TIMEOUT=300000

# CORS Configuration
FRONTEND_URL=http://localhost:5173

# Logging
LOG_LEVEL=info
EOF
```

### 2.4. Kiểm tra Cấu trúc File

Đảm bảo cấu trúc như sau:

```
backend/
├── src/
│   ├── server.js
│   ├── api/
│   │   └── chat.js
│   ├── services/
│   │   ├── ollamaService.js
│   │   ├── queueService.js
│   │   └── promptTemplates/
│   │       └── system_tutor_role.txt
│   └── middleware/
│       └── errorHandler.js
├── package.json
├── .env
└── .gitignore
```

### 2.5. Khởi động Backend

```bash
# Chạy ở chế độ development (tự động reload)
npm run dev

# Hoặc chạy production
npm start
```

Backend sẽ chạy tại `http://localhost:3000`

### 2.6. Kiểm tra Backend

Mở terminal mới và test:

```bash
# Kiểm tra health endpoint
curl http://localhost:3000/api/health

# Bạn sẽ thấy:
# {"status":"ok","ollama":"connected","queue":{"waiting":0,"processing":0}}
```

---

## 🎨 Bước 3: Cài Đặt Frontend

### 3.1. Chuẩn bị thư mục

```bash
# Mở terminal mới, di chuyển vào frontend
cd /Users/mac/AIThink/frontend
```

### 3.2. Cài đặt Dependencies

```bash
# Cài đặt tất cả packages
npm install

# Hoặc cài đặt thủ công:
npm install react react-dom socket.io-client katex react-katex
npm install --save-dev @vitejs/plugin-react vite
```

### 3.3. Cấu hình Vite

File `vite.config.js` đã có sẵn, kiểm tra nội dung:

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        ws: true,
      }
    }
  }
})
```

### 3.4. Kiểm tra Cấu trúc File

```
frontend/
├── src/
│   ├── main.jsx
│   ├── components/
│   │   ├── ChatInterface.jsx
│   │   ├── MathRenderer.jsx
│   │   └── QueueStatus.jsx
│   └── styles/
│       └── main.css
├── index.html
├── package.json
└── vite.config.js
```

### 3.5. Khởi động Frontend

```bash
# Chạy development server
npm run dev

# Frontend sẽ chạy tại http://localhost:5173
```

### 3.6. Truy cập Ứng dụng

Mở trình duyệt và truy cập:
```
http://localhost:5173
```

Bạn sẽ thấy giao diện chat của AIThink!

---

## ✅ Bước 4: Kiểm Tra Hoạt Động

### 4.1. Test Chat cơ bản

1. Mở trình duyệt tại `http://localhost:5173`
2. Nhập câu hỏi: "Giải phương trình: $2x + 5 = 15$"
3. Nhấn Enter hoặc nút Send
4. Quan sát:
   - Loading spinner xuất hiện
   - Response streaming từng phần
   - Công thức toán được render bằng KaTeX

### 4.2. Test Hàng đợi (Queue)

1. Mở 4-5 tabs trình duyệt
2. Gửi câu hỏi đồng thời từ tất cả tabs
3. Quan sát:
   - Chỉ 3 request được xử lý đồng thời (theo cấu hình)
   - Các request còn lại hiển thị "Vị trí trong hàng đợi: X"
   - Khi request xong, request tiếp theo tự động được xử lý

### 4.3. Kiểm tra Logs

```bash
# Xem logs backend
cd /Users/mac/AIThink/backend
tail -f logs/app.log

# Hoặc xem console output nếu dùng npm run dev
```

---

## 🔥 Bước 5: Chạy Tự Động (Production)

### 5.1. Sử dụng PM2 (khuyến nghị)

```bash
# Cài đặt PM2 globally
npm install -g pm2

# Khởi động backend với PM2
cd /Users/mac/AIThink/backend
pm2 start src/server.js --name aithink-backend

# Lưu cấu hình
pm2 save

# Tự động khởi động khi reboot
pm2 startup
```

### 5.2. Build Frontend cho Production

```bash
cd /Users/mac/AIThink/frontend
npm run build

# File build sẽ ở thư mục dist/
```

### 5.3. Serve Frontend Build

Có thể dùng PM2 để serve static files:

```bash
pm2 serve dist/ 5173 --name aithink-frontend --spa
pm2 save
```

### 5.4. Kiểm tra PM2

```bash
# Xem trạng thái
pm2 status

# Xem logs
pm2 logs

# Restart
pm2 restart all

# Stop
pm2 stop all
```

---

## 🌐 Bước 6: Triển Khai với Cloudflare Tunnel (Tùy chọn)

### 6.1. Cài đặt Cloudflared

```bash
# Cài đặt qua Homebrew
brew install cloudflare/cloudflare/cloudflared

# Xác thực
cloudflared login
```

### 6.2. Tạo Tunnel

```bash
# Tạo tunnel mới
cloudflared tunnel create aithink

# Tunnel ID sẽ được hiển thị, lưu lại!
```

### 6.3. Cấu hình DNS

```bash
# Tạo DNS record
cloudflared tunnel route dns aithink aithink.truyenthong.edu.vn
```

### 6.4. Tạo Config File

```bash
# Tạo file config
mkdir -p ~/.cloudflared
nano ~/.cloudflared/config.yml
```

Nội dung file `config.yml`:

```yaml
tunnel: aithink
credentials-file: /Users/mac/.cloudflared/<TUNNEL_ID>.json

ingress:
  - hostname: aithink.truyenthong.edu.vn
    service: http://localhost:3000
  - service: http_status:404
```

**Lưu ý:** Thay `<TUNNEL_ID>` bằng ID thực tế của tunnel.

### 6.5. Khởi động Tunnel

```bash
# Chạy tunnel
cloudflared tunnel run aithink

# Hoặc chạy với PM2
pm2 start cloudflared -- tunnel run aithink --config ~/.cloudflared/config.yml
pm2 save
```

### 6.6. Kiểm tra

Truy cập: `https://aithink.truyenthong.edu.vn`

---

## 🛠️ Script Tiện Ích

### Script Khởi động Tất cả

Tạo file `aithink.sh` ở root:

```bash
#!/bin/bash

echo "🚀 Starting AIThink..."

# Khởi động backend
cd /Users/mac/AIThink/backend
pm2 start src/server.js --name aithink-backend

# Serve frontend (nếu đã build)
cd /Users/mac/AIThink/frontend
pm2 serve dist/ 5173 --name aithink-frontend --spa

# Khởi động Cloudflare Tunnel (nếu cần)
# pm2 start cloudflared -- tunnel run aithink

pm2 save

echo "✅ AIThink started successfully!"
echo "Backend: http://localhost:3000"
echo "Frontend: http://localhost:5173"
pm2 status
```

Cấp quyền và chạy:

```bash
chmod +x aithink.sh
./aithink.sh
```

---

## 🐛 Xử Lý Sự Cố Thường Gặp

### 1. Ollama không kết nối được

**Triệu chứng:** Backend báo lỗi "Cannot connect to Ollama"

**Giải pháp:**
```bash
# Kiểm tra Ollama có chạy không
curl http://127.0.0.1:11434/api/tags

# Nếu không, khởi động lại
ollama serve

# Hoặc kiểm tra process
ps aux | grep ollama
```

### 2. Model không tìm thấy

**Triệu chứng:** Lỗi "model 'deepseek-r1:8b' not found"

**Giải pháp:**
```bash
# Kiểm tra danh sách model
ollama list

# Tải lại model
ollama pull deepseek-r1:8b
```

### 3. Port đã được sử dụng

**Triệu chứng:** "EADDRINUSE: address already in use :::3000"

**Giải pháp:**
```bash
# Tìm process đang dùng port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)

# Hoặc đổi port trong .env
PORT=3001
```

### 4. WebSocket không kết nối

**Triệu chứng:** Frontend không nhận được response

**Giải pháp:**
```bash
# Kiểm tra proxy config trong vite.config.js
# Đảm bảo cả /api và /socket.io đều được proxy

# Kiểm tra CORS trong backend
# FRONTEND_URL trong .env phải khớp với frontend URL
```

### 5. KaTeX không render công thức

**Triệu chứng:** Công thức hiển thị dạng text thuần

**Giải pháp:**
```bash
# Kiểm tra KaTeX CSS đã được import
# Trong index.html hoặc main.jsx:
import 'katex/dist/katex.min.css'

# Cài lại dependencies
npm install katex react-katex
```

### 6. Frontend build bị lỗi

**Triệu chứng:** `npm run build` báo lỗi

**Giải pháp:**
```bash
# Xóa node_modules và cài lại
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

---

## 📊 Giám Sát Hệ Thống

### Kiểm tra tài nguyên

```bash
# CPU và RAM
top -l 1 | grep -E "^CPU|^PhysMem"

# Disk usage
df -h

# Ollama memory usage
ps aux | grep ollama
```

### Kiểm tra logs

```bash
# PM2 logs
pm2 logs aithink-backend --lines 50

# System logs
log show --predicate 'process == "node"' --last 1h
```

---

## 🎯 Checklist Hoàn Thành Cài Đặt

- [ ] Ollama đã cài đặt và chạy
- [ ] Model deepseek-r1:8b đã tải về
- [ ] Backend chạy thành công tại port 3000
- [ ] Frontend chạy thành công tại port 5173
- [ ] Test chat hoạt động bình thường
- [ ] Hàng đợi (queue) hoạt động đúng
- [ ] KaTeX render công thức đúng
- [ ] PM2 đã cấu hình (nếu dùng production)
- [ ] Cloudflare Tunnel đã cấu hình (nếu cần)
- [ ] Logs được ghi nhận đầy đủ

---

## 📚 Tài Liệu Tham Khảo

- [Ollama Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [Socket.io Documentation](https://socket.io/docs/v4/)
- [React Documentation](https://react.dev/)
- [KaTeX Documentation](https://katex.org/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/)

---

## 🆘 Hỗ Trợ

Nếu gặp vấn đề:

1. Kiểm tra logs: `pm2 logs` hoặc console output
2. Xem lại file `.env` có đúng cấu hình không
3. Test từng component riêng lẻ (Ollama → Backend → Frontend)
4. Tham khảo phần "Xử Lý Sự Cố" ở trên

---

**Chúc bạn cài đặt thành công! 🎉**
