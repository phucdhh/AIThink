import React, { useState } from 'react';
import '../styles/ChatFooter.css';

const ChatFooter = ({ onOpenDialog }) => {
  return (
    <div className="chat-footer">
      <p className="footer-slogan">
        AIThink có thể mắc lỗi và không chính xác, cần kiểm tra kỹ càng!
      </p>
      <div className="footer-links">
        <a className="footer-link" href="https://truyenthong.edu.vn/" target="_blank" rel="noopener noreferrer">Home</a>
        <span className="separator">|</span>
        <a className="footer-link" href="https://heytex.truyenthong.edu.vn/" target="_blank" rel="noopener noreferrer">HeyTeX</a>
        <span className="separator">|</span>
        <button className="footer-link" onClick={() => onOpenDialog('privacy')}>Privacy</button>
        <span className="separator">|</span>
        <button className="footer-link" onClick={() => onOpenDialog('terms')}>Terms</button>
        <span className="separator">|</span>
        <button className="footer-link" onClick={() => onOpenDialog('contact')}>Contact us</button>
      </div>
    </div>
  );
};

export default ChatFooter;
