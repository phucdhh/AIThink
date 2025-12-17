import React from 'react';
import '../styles/Dialog.css';

const Dialog = ({ isOpen, onClose, type }) => {
  if (!isOpen) return null;

  const getContent = () => {
    switch (type) {
      case 'privacy':
        return {
          title: 'Chính sách Bảo mật',
          content: (
            <>
              <h3>Cam kết Bảo mật Thông tin</h3>
              <p>AIThink cam kết bảo vệ quyền riêng tư và thông tin cá nhân của người dùng.</p>
              
              <h4>1. Thu thập thông tin</h4>
              <p>Chúng tôi chỉ lưu trữ lịch sử trò chuyện của bạn trên thiết bị local để cải thiện trải nghiệm sử dụng.</p>
              
              <h4>2. Sử dụng thông tin</h4>
              <p>Thông tin được sử dụng để:</p>
              <ul>
                <li>Cung cấp và cải thiện dịch vụ</li>
                <li>Tùy chỉnh trải nghiệm người dùng</li>
                <li>Lưu trữ lịch sử trò chuyện</li>
              </ul>
              
              <h4>3. Bảo mật</h4>
              <p>Dữ liệu của bạn được lưu trữ cục bộ và không được chia sẻ với bên thứ ba.</p>
            </>
          )
        };
      case 'terms':
        return {
          title: 'Điều khoản Sử dụng',
          content: (
            <>
              <h3>Điều khoản và Điều kiện</h3>
              <p>Bằng việc sử dụng AIThink, bạn đồng ý với các điều khoản sau:</p>
              
              <h4>1. Sử dụng Dịch vụ</h4>
              <ul>
                <li>Sử dụng AIThink cho mục đích học tập và giáo dục</li>
                <li>Không sử dụng cho các hoạt động vi phạm pháp luật</li>
                <li>Không lạm dụng hệ thống hoặc gây quá tải</li>
              </ul>
              
              <h4>2. Trách nhiệm Người dùng</h4>
              <ul>
                <li>Kiểm tra và xác minh kết quả từ AI</li>
                <li>Không chia sẻ thông tin nhạy cảm</li>
                <li>Tôn trọng quyền sở hữu trí tuệ</li>
              </ul>
              
              <h4>3. Giới hạn Trách nhiệm</h4>
              <p>AIThink là công cụ hỗ trợ học tập. Chúng tôi không chịu trách nhiệm về:</p>
              <ul>
                <li>Tính chính xác tuyệt đối của kết quả</li>
                <li>Việc sử dụng kết quả trong các bài kiểm tra, thi cử</li>
                <li>Mất mát dữ liệu do lỗi kỹ thuật</li>
              </ul>
            </>
          )
        };
      case 'contact':
        return {
          title: 'Liên hệ',
          content: (
            <>
              <h3>Thông tin Liên hệ</h3>
              <p>Nếu bạn có bất kỳ câu hỏi hoặc góp ý nào, vui lòng liên hệ với chúng tôi:</p>
              
              <div className="contact-info">
                <div className="contact-item">
                  <strong>📧 Email:</strong>
                  <p><a href="mailto:nguyendangminhphuc@dhsphue.edu.vn">nguyendangminhphuc@dhsphue.edu.vn</a></p>
                </div>
                
                <div className="contact-item">
                  <strong>🌐 Website:</strong>
                  <p><a href="https://aithink.truyenthong.edu.vn" target="_blank" rel="noopener noreferrer">https://aithink.truyenthong.edu.vn</a></p>
                </div>
                
                <div className="contact-item">
                  <strong>🏫 Tổ chức:</strong>
                  <p>Trường Đại học Sư phạm, Đại học Huế</p>
                </div>
                
                <div className="contact-item">
                  <strong>⏰ Giờ hỗ trợ:</strong>
                  <p>Thứ 2 - Thứ 6: 8:00 - 17:00</p>
                </div>
              </div>
            </>
          )
        };
      default:
        return { title: '', content: '' };
    }
  };

  const { title, content } = getContent();

  return (
    <div className="dialog-overlay" onClick={onClose}>
      <div className="dialog-content" onClick={(e) => e.stopPropagation()}>
        <div className="dialog-header">
          <h2>{title}</h2>
          <button className="dialog-close" onClick={onClose}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <div className="dialog-body">
          {content}
        </div>
      </div>
    </div>
  );
};

export default Dialog;
