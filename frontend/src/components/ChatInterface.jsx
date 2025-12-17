import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import StreamingMathRenderer from './StreamingMathRenderer';
import Sidebar from './Sidebar';
import ChatMessage from './ChatMessage';
import ChatFooter from './ChatFooter';
import Dialog from './Dialog';
import ModelSelector from './ModelSelector';
import '../styles/ChatInterface.css';

const ChatInterface = () => {
  // User and auth state
  const [user, setUser] = useState(null);
  const [recentChats, setRecentChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  
  // Chat state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [systemStatus, setSystemStatus] = useState(null);
  const [socket, setSocket] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  
  // UI state
  const [dialogType, setDialogType] = useState(null);
  const [theme, setTheme] = useState('light');
  const [thinkingMinimized, setThinkingMinimized] = useState({});
  
  const messagesEndRef = useRef(null);
  const currentResponseRef = useRef('');
  const inputRef = useRef(null);

  // Get API base URL
  const getApiUrl = () => {
    if (window.location.hostname === 'localhost') {
      return 'http://localhost:3000';
    }
    return window.location.origin;
  };

  // Initialize user on mount
  useEffect(() => {
    const initUser = async () => {
      try {
        const userId = localStorage.getItem('aithink-user-id');
        const headers = userId ? { 'x-user-id': userId } : {};
        
        const response = await fetch(`${getApiUrl()}/api/auth/user`, { headers });
        const userData = await response.json();
        
        setUser(userData);
        localStorage.setItem('aithink-user-id', userData.userId);
        
        // Load chat history
        loadChatHistory(userData.userId);
        
        // Apply saved theme
        if (userData.theme) {
          setTheme(userData.theme);
          document.body.setAttribute('data-theme', userData.theme);
        }
      } catch (error) {
        console.error('Error initializing user:', error);
      }
    };
    
    initUser();
  }, []);

  // Load chat history
  const loadChatHistory = async (userId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/auth/chats`, {
        headers: { 'x-user-id': userId }
      });
      const chats = await response.json();
      setRecentChats(chats);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  // Save current chat
  const saveCurrentChat = async () => {
    if (!user || !currentChatId || messages.length === 0) return;
    
    try {
      await fetch(`${getApiUrl()}/api/auth/chats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': user.userId
        },
        body: JSON.stringify({
          chatId: currentChatId,
          messages: messages.map(msg => ({
            ...msg,
            timestamp: msg.timestamp || new Date().toISOString()
          }))
        })
      });
      
      // Reload chat history
      loadChatHistory(user.userId);
    } catch (error) {
      console.error('Error saving chat:', error);
    }
  };

  // Auto-save chat when messages change
  useEffect(() => {
    if (messages.length > 0 && currentChatId) {
      const timer = setTimeout(() => {
        saveCurrentChat();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [messages, currentChatId]);

  // WebSocket connection
  useEffect(() => {
    const socketUrl = getApiUrl();
    
    console.log('Attempting to connect to:', socketUrl);
    const newSocket = io(socketUrl, {
      transports: ['polling'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      upgrade: false
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

    newSocket.on('chat:thinking', (data) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'thinking') {
          lastMessage.content += data.content;
        }
        return newMessages;
      });
    });

    newSocket.on('chat:content', (data) => {
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        
        if (lastMessage && lastMessage.role === 'thinking') {
          lastMessage.isStreaming = false;
          newMessages.push({
            role: 'assistant',
            content: data.content,
            isStreaming: true,
            timestamp: new Date().toISOString()
          });
        } else if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content += data.content;
        }
        
        return newMessages;
      });
    });

    newSocket.on('chat:tikz-compiled', (data) => {
      console.log('🎨 Received chat:tikz-compiled event', data.tikzCode ? 'with TikZ code' : '');
      setMessages(prev => {
        const newMessages = [...prev];
        const lastMessage = newMessages[newMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = data.content;
          if (data.tikzCode) {
            lastMessage.tikzCode = data.tikzCode;
          }
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
      setTimeout(() => inputRef.current?.focus(), 100);
    });

    newSocket.on('chat:error', (data) => {
      setIsLoading(false);
      alert('Lỗi: ' + data.error);
    });

    setSocket(newSocket);

    return () => {
      newSocket.emit('chat:stop');
      newSocket.close();
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (container) {
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;
      if (isNearBottom) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }
  }, [messages]);

  // Handle new chat
  const handleNewChat = () => {
    setCurrentChatId(`chat_${Date.now()}`);
    setMessages([]);
    inputRef.current?.focus();
  };

  // Handle select chat
  const handleSelectChat = (chat) => {
    setCurrentChatId(chat.chatId);
    setMessages(chat.messages || []);
  };

  // Handle search
  const handleSearch = async (query) => {
    if (!user || !query.trim()) {
      loadChatHistory(user.userId);
      return;
    }
    
    try {
      const response = await fetch(
        `${getApiUrl()}/api/auth/chats/search?query=${encodeURIComponent(query)}`,
        { headers: { 'x-user-id': user.userId } }
      );
      const results = await response.json();
      setRecentChats(results);
    } catch (error) {
      console.error('Error searching chats:', error);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('aithink-user-id');
    window.location.reload();
  };

  // Handle theme change
  const handleThemeChange = async () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    document.body.setAttribute('data-theme', newTheme);
    
    if (user) {
      try {
        await fetch(`${getApiUrl()}/api/auth/user/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'x-user-id': user.userId
          },
          body: JSON.stringify({ theme: newTheme })
        });
      } catch (error) {
        console.error('Error updating theme:', error);
      }
    }
  };

  // Handle submit
  const handleSubmit = (e) => {
    e.preventDefault();
    
    const canSubmit = systemStatus?.queue?.canAcceptNew !== false;
    if (!input.trim() || isLoading || !socket || !canSubmit) return;

    // Create new chat if needed
    if (!currentChatId) {
      setCurrentChatId(`chat_${Date.now()}`);
    }

    setMessages(prev => [...prev, {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    }]);

    setMessages(prev => [...prev, {
      role: 'queued',
      content: '',
      isStreaming: true
    }]);

    socket.emit('chat:message', { message: input, model: selectedModel });
    setInput('');
  };

  // Handle stop
  const handleStop = () => {
    if (!socket) return;
    
    socket.emit('chat:stop');
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

  const handleDeleteChat = async (chatId) => {
    try {
      // Delete from backend
      await fetch(`${getApiUrl()}/api/auth/chats/${chatId}`, {
        method: 'DELETE',
        headers: {
          'x-user-id': user?.userId
        }
      });
      
      // Update UI
      setRecentChats(prev => prev.filter(chat => chat.chatId !== chatId));
      
      // If deleting current chat, start a new one
      if (chatId === currentChatId) {
        handleNewChat();
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  return (
    <div className="app-layout">
      <Sidebar
        user={user}
        recentChats={recentChats}
        currentChatId={currentChatId}
        onNewChat={handleNewChat}
        onSelectChat={handleSelectChat}
        onSearch={handleSearch}
        onLogout={handleLogout}
        onThemeChange={handleThemeChange}
        onDeleteChat={handleDeleteChat}
      />
      
      <div className="main-content">
        <div className="chat-header">
          <div className="status-bar">
            <ModelSelector 
              socket={socket} 
              onModelChange={setSelectedModel}
            />
            <div className="status-item">
              <span className="status-icon">👥</span>
              <span className="status-value">{systemStatus?.onlineUsers || 0}</span>
              <span className="status-label">onl</span>
            </div>
            <div className="status-item">
              <span className="status-icon">⏳</span>
              <span className="status-value">{systemStatus?.queue?.queuedRequests || 0}</span>
              <span className="status-label">wait</span>
            </div>
          </div>
        </div>

        <div className="messages-wrapper">
          <div className="messages-container">
            {messages.length === 0 && (
              <div className="welcome-screen">
                <div className="welcome-logo">
                  <img src="/assets/AIThink_app_image.png" alt="AIThink" />
                </div>
                <h1>Chào mừng đến với AIThink</h1>
                <p>Khám phá quá trình giải quyết bài toán một cách trực quan</p>
              </div>
            )}
            
            {messages.map((msg, idx) => {
              if (msg.role === 'queued') {
                return (
                  <div key={idx} className="message queued-message">
                    <div className="queued-content">
                      <span className="pulse-dot"></span>
                      Đang xếp hàng đợi...
                    </div>
                  </div>
                );
              }
              
              if (msg.role === 'thinking') {
                const isMinimized = thinkingMinimized[idx] !== false;
                return (
                  <div key={idx} className="thinking-message">
                    <div className="thinking-header">
                      <div className="thinking-header-left">
                        <div className="message-avatar">
                          <img src="/assets/AIThink_app_image.png" alt="AI" />
                        </div>
                        <div className="thinking-label">
                          <span>🤔</span>
                          <span>Suy nghĩ...</span>
                        </div>
                      </div>
                      {!msg.isStreaming && (
                        <button 
                          className="thinking-toggle-btn" 
                          onClick={() => setThinkingMinimized(prev => ({ ...prev, [idx]: !isMinimized }))}
                          title={isMinimized ? 'Mở rộng' : 'Thu gọn'}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            {isMinimized ? (
                              <path d="M19 9l-7 7-7-7" />
                            ) : (
                              <path d="M5 15l7-7 7 7" />
                            )}
                          </svg>
                        </button>
                      )}
                    </div>
                    <div className={`thinking-content ${isMinimized ? 'minimized' : 'maximized'}`}>
                      <StreamingMathRenderer 
                        content={msg.content || 'Đang suy nghĩ...'} 
                        isStreaming={msg.isStreaming || false}
                      />
                    </div>
                  </div>
                );
              }
              
              return (
                <div key={idx}>
                  {msg.role === 'user' ? (
                    <ChatMessage
                      message={msg}
                      onEdit={() => {
                        setInput(msg.content);
                        inputRef.current?.focus();
                      }}
                      onCopy={() => {
                        navigator.clipboard.writeText(msg.content);
                      }}
                    />
                  ) : (
                    <div className="message assistant-message">
                      <div className="message-avatar">
                        <img src="/assets/AIThink_app_image.png" alt="AI" />
                      </div>
                      <div className="message-wrapper">
                        <div className="message-content answer-bubble">
                          <StreamingMathRenderer 
                            content={msg.content || ''} 
                            isStreaming={msg.isStreaming || false}
                            tikzCode={msg.tikzCode || null}
                          />
                        </div>
                        {!msg.isStreaming && (
                          <div className="message-actions">
                            <span className="message-time">
                              {msg.timestamp && new Date(msg.timestamp).toLocaleString('vi-VN')}
                            </span>
                            <button className="action-btn" onClick={() => handleSubmit({ preventDefault: () => {} })} title="Hỏi lại">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="1 4 1 10 7 10" />
                                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                              </svg>
                            </button>
                            <button className="action-btn" onClick={() => navigator.clipboard.writeText(msg.content)} title="Copy">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                              </svg>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>

          <div className="input-area">
            <form onSubmit={handleSubmit} className="input-form">
              <textarea
                ref={inputRef}
                className="input-textarea"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi toán (hỗ trợ LaTeX: $...$)"
                rows="3"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <div className="input-actions">
                {!isLoading ? (
                  <button 
                    type="submit" 
                    className="send-button"
                    disabled={!input.trim() || systemStatus?.queue?.canAcceptNew === false}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  </button>
                ) : (
                  <button 
                    type="button"
                    className="stop-button"
                    onClick={handleStop}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                  </button>
                )}
              </div>
            </form>
          </div>

          <ChatFooter onOpenDialog={setDialogType} />
        </div>
      </div>

      <Dialog
        isOpen={dialogType !== null}
        onClose={() => setDialogType(null)}
        type={dialogType}
      />
    </div>
  );
};

export default ChatInterface;
