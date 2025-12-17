import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import StreamingMathRenderer from './StreamingMathRenderer';
import QueueStatus from './QueueStatus';

const ChatInterface = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null); // { onlineUsers, queue }
  const [socket, setSocket] = useState(null);
  const messagesEndRef = useRef(null);
  const currentResponseRef = useRef('');
  const inputRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket - auto-detect based on hostname
    let socketUrl;
    if (window.location.hostname === 'localhost') {
      socketUrl = 'http://localhost:3000';
    } else {
      // For production, use same origin (Cloudflare will route to backend)
      socketUrl = window.location.origin;
    }
    
    console.log('Attempting to connect to:', socketUrl);
    const newSocket = io(socketUrl, {
      transports: ['polling'], // Force polling only (WebSocket not supported by Cloudflare Tunnel yet)
      path: '/socket.io/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      upgrade: false // Disable auto-upgrade to websocket
    });
    
    newSocket.on('connect', () => {
      console.log('✅ Connected to server:', socketUrl);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('❌ Connection error:', error);
    });

    newSocket.on('system:status', (status) => {
      setSystemStatus(status);
    });

    newSocket.on('chat:start', () => {
      console.log('🎬 Chat started - waiting for stream...');
      setIsLoading(true);
      currentResponseRef.current = '';
      // Update queued message to thinking
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'queued') {
          lastMessage.role = 'thinking';
          lastMessage.content = '';
        }
        return newMessages;
      });
    });

    // Handle thinking stream (Chain of Thought)
    newSocket.on('chat:thinking', (data) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        // Append to thinking bubble
        if (lastMessage && lastMessage.role === 'thinking') {
          lastMessage.content += data.content;
        }
        
        return newMessages;
      });
    });

    // Handle content stream (Answer)
    newSocket.on('chat:content', (data) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        // If last is thinking and we get content, create answer bubble
        if (lastMessage && lastMessage.role === 'thinking') {
          lastMessage.isStreaming = false; // Close thinking bubble
          newMessages.push({
            role: 'assistant',
            content: data.content,
            isStreaming: true
          });
        } else if (lastMessage && lastMessage.role === 'assistant') {
          // Append to answer bubble
          lastMessage.content += data.content;
        }
        
        return newMessages;
      });
    });

    // Handle TikZ compiled to SVG (replace full content)
    newSocket.on('chat:tikz-compiled', (data) => {
      console.log('🎨 Received chat:tikz-compiled event, content length:', data.content?.length);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        console.log('Last message role:', lastMessage?.role);
        if (lastMessage && lastMessage.role === 'assistant') {
          // Replace entire content with TikZ-compiled version
          console.log('✅ Replacing message content with compiled TikZ');
          lastMessage.content = data.content;
        }
        return newMessages;
      });
    });

    newSocket.on('chat:end', () => {
      setIsLoading(false);
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage) {
          lastMessage.isStreaming = false;
        }
        return newMessages;
      });
      currentResponseRef.current = '';
      // Focus input after completion
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    });

    newSocket.on('chat:error', (data) => {
      setIsLoading(false);
      alert('Lỗi: ' + data.error);
    });

    setSocket(newSocket);

    return () => {
      // Emit stop signal before disconnecting
      newSocket.emit('chat:stop');
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    // Only scroll if user is near bottom (prevent jump when user is reading above)
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Check if can accept new request
    const canSubmit = systemStatus?.queue?.canAcceptNew !== false;
    if (!input.trim() || isLoading || !socket || !canSubmit) return;

    // Add user message
    setMessages(prev => [...prev, {
      role: 'user',
      content: input
    }]);

    // Add queued message (waiting for processing)
    setMessages(prev => [...prev, {
      role: 'queued',
      content: '',
      isStreaming: true
    }]);

    // Send to server
    socket.emit('chat:message', { message: input });

    setInput('');
  };

  const handleStop = () => {
    if (!socket) return;
    
    // Emit stop signal to backend
    socket.emit('chat:stop');
    
    // Update UI
    setIsLoading(false);
    setMessages(prev => {
      const newMessages = [...prev];
      const lastMessage = newMessages[newMessages.length - 1];
      if (lastMessage && lastMessage.isStreaming) {
        lastMessage.isStreaming = false;
        lastMessage.content += '\n\n_[Đã dừng bởi người dùng]_';
      }
      return newMessages;
    });
    currentResponseRef.current = '';
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>
          <img src="/AIThink_app_image.png" alt="AIThink" style={{ height: '40px', verticalAlign: 'middle', marginRight: '10px' }} />
          AIThink
        </h1>
        <p>Hỗ trợ khám khám phá quá trình giải một bài toán như thế nào</p>
      </div>

      <div className="system-status">
        <div className="status-item">
          <span className="status-icon">👥</span>
          <span className="status-value">{systemStatus?.onlineUsers || 0}</span>
          <span className="status-label">đang truy cập</span>
        </div>
        <div className="status-item">
          <span className="status-icon">⏳</span>
          <span className="status-value">{systemStatus?.queue?.queuedRequests || 0}</span>
          <span className="status-label">đang chờ</span>
        </div>
        <div className="status-item ready">
          <span className="status-icon">✅</span>
          <span className="status-label">Sẵn sàng xử lý yêu cầu</span>
        </div>
      </div>

      <div className="chat-container">
        <div className="messages-container">
          {messages.length === 0 && (
            <div style={{ textAlign: 'center', color: '#999', marginTop: '50px' }}>
              <h2>Chào mừng bạn! 👋</h2>
              <p>Hãy đặt câu hỏi toán học để bắt đầu</p>
            </div>
          )}
          
          {messages.map((msg, idx) => (
            <div key={idx} className={`message message-${msg.role === 'thinking' || msg.role === 'queued' ? 'assistant' : msg.role}`}>
              {msg.role === 'queued' ? (
                <div className="message-content queued-bubble">
                  <div style={{ 
                    fontSize: '0.85em', 
                    fontWeight: '600', 
                    color: '#667eea',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    ⏳ Đang xếp hàng đợi...
                    <span style={{
                      display: 'inline-block',
                      width: '6px',
                      height: '6px',
                      borderRadius: '50%',
                      backgroundColor: '#667eea',
                      animation: 'pulse 1.5s ease-in-out infinite'
                    }}></span>
                  </div>
                  <div style={{ 
                    fontStyle: 'italic', 
                    color: '#999', 
                    fontSize: '0.9em'
                  }}>
                    Yêu cầu của bạn đang trong hàng đợi. Vui lòng chờ đợi...
                  </div>
                </div>
              ) : msg.role === 'thinking' ? (
                <div className="message-content thinking-bubble">
                  <div style={{ 
                    fontSize: '0.85em', 
                    fontWeight: '600', 
                    color: '#ff8800',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}>
                    🤔 Chain of Thought
                    {msg.isStreaming && (
                      <span style={{
                        display: 'inline-block',
                        width: '6px',
                        height: '6px',
                        borderRadius: '50%',
                        backgroundColor: '#ff8800',
                        animation: 'pulse 1.5s ease-in-out infinite'
                      }}></span>
                    )}
                  </div>
                  <div style={{ 
                    fontStyle: 'italic', 
                    color: '#555', 
                    fontSize: '0.92em',
                    lineHeight: '1.8',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <StreamingMathRenderer 
                      content={msg.content || 'Đang suy nghĩ...'} 
                      isStreaming={msg.isStreaming || false}
                    />
                  </div>
                </div>
              ) : (
                <div className="message-content">
                  {msg.role === 'user' ? (
                    msg.content
                  ) : (
                    <StreamingMathRenderer 
                      content={msg.content || ''} 
                      isStreaming={msg.isStreaming || false}
                    />
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-container">
          <form onSubmit={handleSubmit} className="input-form">
            <textarea
              ref={inputRef}
              className="input-textarea"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi toán (có thể gõ LaTeX: $...$)"
              rows="2"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            {!isLoading ? (
              <button 
                type="submit" 
                className="send-button"
                disabled={!input.trim() || systemStatus?.queue?.canAcceptNew === false}
                title={systemStatus?.queue?.canAcceptNew === false ? 'Hàng đợi đầy, vui lòng chờ...' : ''}
              >
                <span>📤</span>
                <span>Gửi</span>
              </button>
            ) : (
              <button 
                type="button"
                className="stop-button"
                onClick={handleStop}
              >
                <span>⏹️</span>
                <span>Dừng</span>
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
