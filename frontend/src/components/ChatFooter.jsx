import React, { useState } from 'react';
import '../styles/ChatFooter.css';

const ChatFooter = ({ onOpenDialog }) => {
  return (
    <div className="chat-footer">
      <p className="footer-slogan">
        AIThink hỗ trợ khám phá quá trình giải một bài toán như thế nào
      </p>
      <div className="footer-links">
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
