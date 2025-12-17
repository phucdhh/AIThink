import React, { useState } from 'react';
import '../styles/Sidebar.css';

const Sidebar = ({ 
  user, 
  recentChats, 
  onNewChat, 
  onSelectChat, 
  onSearch,
  onLogout,
  onThemeChange,
  currentChatId 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
    onSearch(e.target.value);
  };

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Header */}
      <div className="sidebar-header">
        {!isCollapsed && (
          <div className="sidebar-logo">
            <img src="/assets/AIThink_app_image.png" alt="AIThink" className="logo-image" />
            <span className="logo-text">
              <span className="logo-ai">AI</span>
              <span className="logo-think">Think</span>
            </span>
          </div>
        )}
        <button className="toggle-sidebar-btn" onClick={toggleSidebar} title={isCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {isCollapsed ? (
              <path d="M9 18l6-6-6-6" />
            ) : (
              <path d="M15 18l-6-6 6-6" />
            )}
          </svg>
        </button>
      </div>

      {/* New Chat Button */}
      <button className={`new-chat-btn ${isCollapsed ? 'icon-only' : ''}`} onClick={onNewChat} title="New chat">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 5v14M5 12h14" />
        </svg>
        {!isCollapsed && <span>New chat</span>}
      </button>

      {!isCollapsed ? (
        <>
          {/* Search Bar */}
          <div className="search-bar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Tìm kiếm..."
              value={searchQuery}
              onChange={handleSearch}
            />
          </div>

          {/* Recent Chats */}
          <div className="recent-chats">
            <div className="recent-chats-header">Recents</div>
            <div className="recent-chats-list">
              {recentChats && recentChats.length > 0 ? (
                recentChats.map(chat => (
                  <div
                    key={chat.chatId}
                    className={`chat-item ${currentChatId === chat.chatId ? 'active' : ''}`}
                    onClick={() => onSelectChat(chat)}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                    </svg>
                    <span className="chat-title">{chat.title}</span>
                  </div>
                ))
              ) : (
                <div className="no-chats">Chưa có cuộc trò chuyện nào</div>
              )}
            </div>
          </div>

          {/* User Menu */}
          <div className="user-menu">
            <div className="user-info" onClick={() => setShowSettings(!showSettings)}>
              <div className="user-avatar">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} />
                ) : (
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0) || 'G'}
                  </div>
                )}
              </div>
              <span className="username">{user?.username || 'Guest'}</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="5" r="1" />
                <circle cx="12" cy="19" r="1" />
              </svg>
            </div>

            {showSettings && (
              <div className="settings-menu">
                <button className="menu-item" onClick={() => window.open('https://www.ganjingworld.com/@ndmphuc', '_blank')}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <path d="M12 17h.01" />
                  </svg>
                  <span>Help</span>
                </button>
                <button className="menu-item" onClick={() => onThemeChange()}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  <span>Theme</span>
                </button>
                <button className="menu-item" onClick={onLogout}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        <>
          {/* Collapsed Icons */}
          <button className="icon-btn" onClick={onNewChat} title="Tìm kiếm">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
          </button>
          
          <div className="collapsed-section">
            <div className="collapsed-section-icon" title="Recents">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          </div>
        </>
      )}
      
      {/* User Menu - Always visible */}
      {isCollapsed ? (
        <div className="user-menu collapsed">
          <div className="user-avatar-only" onClick={() => setShowSettings(!showSettings)}>
            {user?.avatar ? (
              <img src={user.avatar} alt={user.username} />
            ) : (
              <div className="avatar-placeholder">
                {user?.username?.charAt(0) || 'G'}
              </div>
            )}
          </div>
          {showSettings && (
            <div className="settings-menu">
              <button className="menu-item" onClick={() => window.open('https://www.ganjingworld.com/@ndmphuc', '_blank')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                  <path d="M12 17h.01" />
                </svg>
                <span>Help</span>
              </button>
              <button className="menu-item" onClick={() => onThemeChange()}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
                <span>Theme</span>
              </button>
              <button className="menu-item" onClick={onLogout}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Logout</span>
              </button>
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
};

export default Sidebar;
