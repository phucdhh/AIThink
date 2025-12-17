import React from 'react';
import '../styles/ChatMessage.css';

const ChatMessage = ({ message, onRetry, onEdit, onCopy }) => {
  const { role, content, timestamp, isStreaming } = message;
  
  const formatTime = (time) => {
    if (!time) return '';
    const date = new Date(time);
    return date.toLocaleString('vi-VN', { 
      hour: '2-digit', 
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    onCopy && onCopy();
  };

  if (role === 'user') {
    return (
      <div className="message user-message">
        <div className="message-content">{content}</div>
        <div className="message-actions">
          <span className="message-time">{formatTime(timestamp)}</span>
          <button className="action-btn" onClick={onEdit} title="Sửa">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button className="action-btn" onClick={handleCopy} title="Copy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
            </svg>
          </button>
        </div>
      </div>
    );
  }

  if (role === 'assistant') {
    return (
      <div className="message assistant-message">
        <div className="message-avatar">
          <img src="/assets/AIThink_app_image.png" alt="AI" />
        </div>
        <div className="message-wrapper">
          <div className="message-content">
            {content}
            {isStreaming && <span className="cursor">▊</span>}
          </div>
          {!isStreaming && (
            <div className="message-actions">
              <span className="message-time">{formatTime(timestamp)}</span>
              <button className="action-btn" onClick={onRetry} title="Hỏi lại">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                </svg>
              </button>
              <button className="action-btn" onClick={handleCopy} title="Copy">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (role === 'thinking') {
    return (
      <div className="message thinking-message">
        <div className="message-avatar">
          <img src="/assets/AIThink_app_image.png" alt="AI" />
        </div>
        <div className="message-wrapper">
          <div className="thinking-label">🤔 Suy nghĩ...</div>
          <div className="message-content thinking-content">
            {content}
            {isStreaming && <span className="cursor">▊</span>}
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default ChatMessage;
