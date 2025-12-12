# 🚀 AIThink: Trợ lý giải toán

**AIThink** là một ứng dụng web dựa trên AI, được thiết kế để hỗ trợ người học giải quyết và hiểu các bài toán phức tạp. Ứng dụng này sử dụng sức mạnh suy luận của mô hình **Deepseek-R1:8b** được thử nghiệm chạy cục bộ thông qua Ollama trên Mac mini M2, cung cấp các giải thích chi tiết, từng bước, với vai trò là một trợ lý giải toán.

* **Tên miền truy cập:** `aithink.truyenthong.edu.vn` (Triển khai thông qua Cloudflare Tunnel)

---

## 🛠️ Công nghệ

| Thành phần | Công nghệ | Mục đích |
| :--- | :--- | :--- |
| **Mô hình Cơ sở** | `deepseek-r1:8b` (qua Ollama) | Cung cấp khả năng suy luận và giải toán cốt lõi. |
| **Backend API** | Node.js (Express/NestJS) | Xử lý yêu cầu người dùng, giao tiếp với Ollama, quản lý **Hàng đợi (Queue)**. |
| **Hàng đợi** | Redis (hoặc một giải pháp Node.js Queue đơn giản) | Quản lý tải, giới hạn số lượng yêu cầu đồng thời tới Ollama để bảo vệ Mac mini. |
| **Frontend** | React/Vue (với TypeScript) | Xây dựng giao diện người dùng tương tác, thân thiện. |
| **Render Toán học** | KaTeX/MathJax | Hiển thị công thức toán học đẹp mắt, hỗ trợ input và output LaTeX. |
| **Triển khai** | Mac mini M2 (Headless) + Cloudflare Tunnel | Hosting cục bộ an toàn và truy cập toàn cầu. |

---

## 📁 Cấu trúc Thư mục Dự kiến

```
aithink/
├── backend/
│   ├── src/
│   │   ├── api/
│   │   │   └── chat.js (Xử lý request chat, gọi Queue)
│   │   ├── services/
│   │   │   ├── ollamaService.js (Giao tiếp với Ollama API)
│   │   │   ├── queueService.js (Quản lý hàng đợi Redis/Local)
│   │   │   └── promptTemplates/
│   │   │       └── system_tutor_role.txt (File ràng buộc AI - Dễ dàng cập nhật)
│   │   ├── middleware/
│   │   │   └── errorHandler.js (Xử lý lỗi)
│   │   └── server.js (Khởi tạo server Node.js + WebSockets)
│   ├── package.json
│   ├── .env.example
│   └── .env (chưa theo dõi)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── ChatInterface.vue/tsx
│   │   │   ├── MathInput.vue/tsx (Hỗ trợ nhập LaTeX)
│   │   │   ├── MathRenderer.vue/tsx (Hiển thị KaTeX)
│   │   │   └── QueueStatus.vue/tsx (Hiển thị trạng thái hàng đợi)
│   │   ├── pages/
│   │   │   └── Index.vue/tsx
│   │   ├── styles/
│   │   │   └── main.css
│   │   └── main.ts
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
├── docker-compose.yml (Tùy chọn: để chạy Redis)
├── .gitignore
└── README.md
```

---

## 🔧 Hướng dẫn Thiết lập và Vận hành

### Bước 1: Thiết lập Ollama & Mô hình

1.  **Cài đặt Ollama:** Tải và cài đặt Ollama trên Mac mini.
2.  **Tải mô hình:** Chạy lệnh sau trong Terminal để tải mô hình Deepseek-R1:
    ```bash
    ollama pull deepseek-r1:8b
    ```
3.  **Xác minh API:** Đảm bảo Ollama đang chạy và API có thể truy cập tại `http://127.0.0.1:11434`.

### Bước 2: Thiết lập Backend (Node.js)

1.  **Cài đặt dependencies:** Di chuyển vào thư mục `backend` và chạy:
    ```bash
    npm install express axios ioredis # (ioredis cho hàng đợi)
    ```
2.  **Định hình vai trò trợ lý (`backend/src/services/promptTemplates/system_tutor_role.txt`):**

    File này là cốt lõi để đảm bảo AI hoạt động như một gia sư chuyên nghiệp.

    ```text
    Bạn là một trợ lý toán học chuyên nghiệp và kiên nhẫn. Nhiệm vụ của bạn là hỗ trợ người học bằng cách cung cấp lời giải chi tiết theo từng bước logic.

    Hướng dẫn chính:
    1. Trả lời luôn ở định dạng Markdown.
    2. Phân tích bài toán, sau đó đưa ra lời giải **từng bước** (Chain of Thought).
    3. **Không bao giờ** chỉ đưa ra đáp án cuối cùng.
    4. Trình bày tất cả các công thức toán học và biểu thức phức tạp bằng định dạng LaTeX, bao quanh bởi dấu `$inline$` hoặc `$$display$$`.
    5. Ví dụ: "Áp dụng công thức $a^2 + b^2 = c^2$..."
    ```

3.  **Cơ chế Hàng đợi (Queue):**
    * Sử dụng **WebSockets** (ví dụ: Socket.io) để kết nối giữa Backend và Frontend.
    * Khi yêu cầu đến, `queueService.js` sẽ kiểm tra số lượng yêu cầu đang được xử lý.
    * Nếu vượt quá giới hạn (ví dụ: 5), yêu cầu được thêm vào hàng đợi. WebSockets sẽ thông báo cho người dùng về **vị trí hiện tại** của họ.
    * Khi một yêu cầu được xử lý xong, yêu cầu tiếp theo trong hàng đợi sẽ được kích hoạt.

### Bước 3: Thiết lập Frontend (React/Vue)

1.  **Cài đặt dependencies:** Di chuyển vào thư mục `frontend` và chạy:
    ```bash
    npm install react vue typescript vite katex socket.io-client
    ```
2.  **Xử lý Giao diện:**
    * Sử dụng **KaTeX/MathJax** để render output LaTeX từ AI.
    * Triển khai **Streaming** (truyền tải từng phần dữ liệu) từ Ollama qua Backend sử dụng WebSockets để hiển thị trên giao diện người dùng, mang lại trải nghiệm chat mượt mà.
    * Thêm **QueueStatus component** để hiển thị số lượng yêu cầu đang chờ xử lý.
3.  **Các thư viện cần thiết:**
    * `katex`: Render công thức toán học
    * `socket.io-client`: Kết nối WebSocket
    * `axios`: Gửi request HTTP

### Bước 4: Triển khai với Cloudflare Tunnel

1.  **Cài đặt `cloudflared`:** Cài đặt Cloudflare Tunnel trên Mac mini của bạn.
    ```bash
    brew install cloudflare/cloudflare/cloudflared
    cloudflared login
    ```
2.  **Tạo Tunnel:** Tạo một tunnel mới và định cấu hình để trỏ tên miền `aithink.truyenthong.edu.vn` tới cổng mà Node.js Backend của bạn đang chạy (ví dụ: `http://localhost:3000`).
    ```bash
    cloudflared tunnel create aithink
    cloudflared tunnel route dns aithink aithink.truyenthong.edu.vn
    ```
3.  **Cấu hình:** Tạo file `~/.cloudflared/config.yml` với nội dung:
    ```yaml
    tunnel: aithink
    credentials-file: /Users/mac/.cloudflared/<tunnel-id>.json
    ingress:
      - hostname: aithink.truyenthong.edu.vn
        service: http://localhost:3000
      - service: http_status:404
    ```
4.  **Lợi ích:** Điều này cho phép bạn công khai ứng dụng mà không cần mở cổng trên router, đảm bảo an toàn cho mạng nội bộ.

---

## 🌟 Các Tính năng Chính

* **Chat Hỗ trợ Toán học:** Sử dụng Deepseek-R1 cho khả năng suy luận toán học tiên tiến.
* **Giao diện Tương tác:** Hỗ trợ người dùng nhập liệu bằng cú pháp LaTeX.
* **Hiển thị Chuyên nghiệp:** Render công thức toán học bằng KaTeX/MathJax.
* **Hàng đợi Tải (Load Queue):** Quản lý tải hệ thống để đảm bảo Mac mini không bị quá tải, cung cấp thông báo trạng thái hàng đợi cho người dùng.
* **Streaming Response:** Hiển thị câu trả lời từ từ để cải thiện trải nghiệm người dùng.
* **Triển khai An toàn:** Sử dụng Cloudflare Tunnel để công khai ứng dụng mà không cần mở cổng.

---

## ⚠️ Đánh giá Rủi ro và Hạn chế

| Rủi ro / Hạn chế | Mức độ | Giải pháp |
| :--- | :--- | :--- |
| **Tài nguyên hệ thống (Mac mini M2)** | Trung bình | Cần theo dõi sử dụng CPU/RAM. Deepseek-R1:8b đòi hỏi ~8GB RAM. Giới hạn số request đồng thời (2-5 yêu cầu). |
| **Thời gian phản hồi chậm** | Trung bình | Deepseek-R1 có thể mất 10-30 giây/câu hỏi. Cân nhắc sử dụng mô hình nhẹ hơn nếu cần (ví dụ: llama2:7b). |
| **Độ tin cậy của máy chủ (24/7)** | Cao | Cần script khởi động tự động, monitoring, và restart policy cho Ollama. |
| **Xác thực người dùng** | Cao | **Chưa có** - Cần thêm JWT/OAuth để bảo vệ API. |
| **Quản lý dữ liệu đầu vào** | Cao | Cần validate và sanitize input từ người dùng để tránh prompt injection. |
| **Chi phí Cloudflare** | Thấp | Tunnel miễn phí, nhưng cần account Cloudflare với tên miền. |

---

## 📋 Yêu cầu Hệ thống

* **Mac mini M2** (hoặc máy tính tương đương) với ít nhất **16GB RAM**
* **macOS 12+**
* **Node.js v18+**
* **Ollama v0.1+**
* **Redis** (hoặc sử dụng queue cục bộ)
* **Cloudflare account** (với tên miền đã xác thực)

---

## 🔐 Các Bước An toàn Quan trọng (Before Production)

1. **Thêm xác thực:** Implement JWT hoặc OAuth2 cho API.
2. **Rate limiting:** Giới hạn số request/IP/hour để tránh lạm dụng.
3. **Input validation:** Sanitize các query của người dùng để tránh prompt injection attacks.
4. **Logging & Monitoring:** Theo dõi các request, error, và tài nguyên hệ thống.
5. **HTTPS:** Đảm bảo tất cả traffic qua Cloudflare Tunnel được mã hóa.
6. **Backup:** Sao lưu cấu hình Cloudflare Tunnel và prompt templates.

---

## 📊 Lộ trình Phát triển

### Phase 1: MVP
- [ ] Thiết lập Ollama + Deepseek-R1
- [ ] Xây dựng Backend API (chat endpoint + queue system)
- [ ] Xây dựng Frontend (chat UI + KaTeX rendering)
- [ ] Triển khai Cloudflare Tunnel

### Phase 2: Tối ưu hóa
- [ ] Thêm xác thực người dùng
- [ ] Implement rate limiting & input validation
- [ ] Thêm monitoring & logging
- [ ] Test performance dưới tải cao

### Phase 3: Mở rộng
- [ ] Lưu lịch sử chat cho người dùng
- [ ] Thêm các mô hình AI khác
---