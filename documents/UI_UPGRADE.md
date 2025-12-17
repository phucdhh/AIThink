# Nâng cấp Giao diện AIThink - Phiên bản Claude-inspired

## 📋 Tổng quan

Giao diện AIThink đã được nâng cấp hoàn toàn với thiết kế lấy cảm hứng từ Claude.ai, mang đến trải nghiệm người dùng hiện đại và chuyên nghiệp.

## ✨ Tính năng mới

### 1. Sidebar (Thanh bên trái)
- **Logo & Branding**: Logo AIThink với chữ "AI" và "Think" có màu sắc khác biệt
- **Toggle Button**: Nút đóng/mở sidebar để tối ưu không gian màn hình
- **New Chat**: Tạo cuộc hội thoại mới nhanh chóng
- **Search**: Tìm kiếm trong lịch sử chat
- **Recents**: Danh sách các cuộc trò chuyện gần đây
- **User Menu**: 
  - Avatar và tên người dùng
  - Settings với các tùy chọn:
    - Help (Hướng dẫn)
    - Theme (Chuyển đổi Light/Dark mode)
    - Logout (Đăng xuất)

### 2. Main Chat Area (Khu vực chat chính)
- **Status Bar**: Hiển thị số người đang truy cập và số người đang chờ
- **Enhanced Messages**: 
  - Timestamp cho mỗi tin nhắn
  - Action buttons: Retry, Edit, Copy
  - Avatar AI cho phản hồi
- **Streaming với Chain of Thought**: Hiển thị quá trình suy nghĩ của AI
- **Responsive Design**: Tự động điều chỉnh theo kích thước màn hình

### 3. Footer
- **Slogan**: "AIThink hỗ trợ khám phá quá trình giải một bài toán như thế nào"
- **Links**: Privacy, Terms, Contact us (mở dialog khi click)

### 4. Dialogs
- **Privacy Policy**: Chính sách bảo mật
- **Terms of Service**: Điều khoản sử dụng
- **Contact**: Thông tin liên hệ

## 🎨 Theme System
- **Light Mode**: Giao diện sáng, dễ nhìn ban ngày
- **Dark Mode**: Giao diện tối, giảm mỏi mắt khi làm việc ban đêm
- Theme được lưu tự động cho mỗi user

## 👤 User Management

### Backend API Endpoints
```
GET    /api/auth/user              - Lấy hoặc tạo user mới
PUT    /api/auth/user/profile      - Cập nhật profile
GET    /api/auth/chats             - Lấy lịch sử chat
POST   /api/auth/chats             - Lưu chat
DELETE /api/auth/chats/:chatId     - Xóa chat
GET    /api/auth/chats/search      - Tìm kiếm chat
```

### Cấu trúc thư mục
```
users/
  ├── {userId}/
  │   ├── profile.json
  │   └── chats/
  │       ├── {chatId1}.json
  │       ├── {chatId2}.json
  │       └── ...
```

### User Data
Mỗi user có:
- `userId`: ID duy nhất
- `username`: Tên hiển thị (Guest_{id} cho guest)
- `avatar`: URL avatar (null mặc định)
- `theme`: Light hoặc dark
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật

### Chat History
Mỗi chat được lưu với:
- `chatId`: ID chat
- `title`: Tiêu đề (tự động từ câu hỏi đầu tiên)
- `messages`: Mảng tin nhắn
- `createdAt`: Thời gian tạo
- `updatedAt`: Thời gian cập nhật

## 🖼️ Logo & Assets

Logo tạm thời được tạo bằng SVG tại `/frontend/public/assets/AIThink_app_image.svg`

**Để thay logo chính thức:**
1. Chuẩn bị file PNG với kích thước 256x256px trở lên
2. Đặt tên file: `AIThink_app_image.png`
3. Copy vào thư mục: `/frontend/public/assets/`
4. Rebuild frontend: `npm run build`

## 📁 Cấu trúc File

### Frontend Components
```
frontend/src/components/
  ├── ChatInterface.jsx          - Component chính (đã nâng cấp)
  ├── ChatInterface_old.jsx      - Backup phiên bản cũ
  ├── Sidebar.jsx                - Thanh sidebar
  ├── ChatMessage.jsx            - Component tin nhắn
  ├── ChatFooter.jsx             - Footer với links
  ├── Dialog.jsx                 - Dialog cho Privacy/Terms/Contact
  ├── StreamingMathRenderer.jsx  - Render LaTeX streaming
  ├── MathRenderer.jsx           - Render LaTeX tĩnh
  ├── QueueStatus.jsx            - Hiển thị trạng thái hàng đợi
  ├── SVGRenderer.jsx            - Render SVG
  └── ZoomableSVG.jsx            - SVG có thể zoom

frontend/src/styles/
  ├── ChatInterface.css          - CSS layout chính
  ├── Sidebar.css                - CSS sidebar
  ├── ChatMessage.css            - CSS tin nhắn
  ├── ChatFooter.css             - CSS footer
  ├── Dialog.css                 - CSS dialog
  └── main.css                   - CSS global
```

### Backend API
```
backend/src/api/
  ├── auth/
  │   ├── index.js              - Auth routes
  │   └── userController.js     - User & chat controllers
  └── chat.js                   - Chat handler (existing)
```

## 🚀 Deployment

### Local Development
```bash
# Backend
cd backend
npm install
pm2 restart aithink-backend

# Frontend
cd frontend
npm install
npm run build
pm2 restart aithink-frontend
```

### Production
Giao diện mới hoạt động với cả môi trường:
- Local: http://localhost:5173
- Production: https://aithink.truyenthong.edu.vn

## 🔧 Customization

### Thay đổi màu sắc chủ đạo
Sửa file `frontend/src/styles/Sidebar.css` và các file CSS khác:
```css
/* Primary color - hiện tại: Indigo */
background: #4f46e5;  /* Thay đổi màu này */
color: #4f46e5;
```

### Thay đổi slogan
Sửa file `frontend/src/components/ChatFooter.jsx`:
```jsx
<p className="footer-slogan">
  AIThink hỗ trợ khám phá quá trình giải một bài toán như thế nào
</p>
```

### Thêm link Help Article
Sửa file `frontend/src/components/Sidebar.jsx`:
```jsx
<button className="menu-item" onClick={() => window.open('https://your-help-article-link', '_blank')}>
```

### Cập nhật thông tin Contact
Sửa file `frontend/src/components/Dialog.jsx` trong phần `case 'contact'`

## 📱 Responsive Design
- **Desktop**: Hiển thị đầy đủ sidebar và chat
- **Tablet**: Sidebar có thể đóng/mở
- **Mobile**: Sidebar overlay, tự động ẩn khi chat

## 🔐 Privacy & Security
- User data được lưu local trên server
- Mỗi user có thư mục riêng biệt
- Guest users tự động được tạo
- Chat history được tự động lưu

## 🎯 Next Steps (Tùy chọn nâng cao)

1. **Authentication thực sự**: Tích hợp OAuth, email/password login
2. **Avatar upload**: Cho phép user upload avatar riêng
3. **Chat sharing**: Chia sẻ cuộc trò chuyện qua link
4. **Export chat**: Xuất chat ra PDF/Text
5. **Advanced search**: Tìm kiếm với filters (ngày, topic, etc.)
6. **Notifications**: Thông báo khi có phản hồi mới
7. **Multi-language**: Hỗ trợ nhiều ngôn ngữ

## 🐛 Troubleshooting

### Logo không hiển thị
1. Kiểm tra file tồn tại: `/frontend/public/assets/AIThink_app_image.png`
2. Rebuild frontend: `npm run build`
3. Restart frontend: `pm2 restart aithink-frontend`

### User data không lưu
1. Kiểm tra thư mục users có quyền write
2. Xem backend logs: `pm2 logs aithink-backend`

### Theme không apply
1. Clear browser cache
2. Kiểm tra localStorage có key 'aithink-user-id'
3. Reload page

## 📞 Support
Nếu cần hỗ trợ, liên hệ:
- Email: support@truyenthong.edu.vn
- Website: https://aithink.truyenthong.edu.vn

---

**Version**: 2.0.0  
**Date**: December 15, 2025  
**Author**: AIThink Development Team
