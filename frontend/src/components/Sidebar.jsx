import React, { useState } from 'react';
import '../styles/Sidebar.css';

const AVATAR_EMOJIS = [
  '😀','😎','🤓','🧑‍💻','👩‍💻','🧑‍🎓','👩‍🎓','🧑‍🔬','🦊','🐼',
  '🐨','🐸','🦁','🐯','🦄','🐙','🐬','🦋','🌟','🔥',
  '🎯','🚀','🎓','📚','💡','🌈','🍀','🎮','🏆','💎',
];

// Resize & compress an image File to a data URL (max 256px, JPEG 0.82)
const compressImage = (file) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Không phải file ảnh'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('Không thể tải ảnh'));
      img.onload = () => {
        const MAX = 256;
        let w = img.width;
        let h = img.height;
        if (w > h && w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
        else if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// Helper: is avatar a URL/data URL (vs emoji)?
const isImageAvatar = (av) => av && (av.startsWith('data:') || av.startsWith('http'));

const ProfileModal = ({ user, onSave, onClose }) => {
  const [name, setName] = useState(user?.username || '');
  const [avatar, setAvatar] = useState(user?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = React.useRef(null);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSave({ username: trimmed, avatar });
    onClose();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Ảnh không được lớn hơn 5MB');
      return;
    }
    try {
      setUploading(true);
      const dataUrl = await compressImage(file);
      setAvatar(dataUrl);
    } catch (err) {
      alert('Không thể đọc ảnh: ' + err.message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className="profile-modal-overlay" onClick={onClose}>
      <div className="profile-modal" onClick={e => e.stopPropagation()}>
        <div className="profile-modal-header">
          <h3>Chỉnh sửa hồ sơ</h3>
          <button className="profile-modal-close" onClick={onClose}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Avatar preview */}
        <div className="profile-avatar-preview">
          {isImageAvatar(avatar) ? (
            <img className="profile-avatar-img-preview" src={avatar} alt="avatar" />
          ) : avatar ? (
            <span className="profile-avatar-emoji">{avatar}</span>
          ) : (
            <div className="profile-avatar-placeholder">
              {name?.charAt(0)?.toUpperCase() || 'G'}
            </div>
          )}
          {avatar && (
            <button className="profile-avatar-remove" onClick={() => setAvatar('')} title="Xóa ảnh">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Upload image from device */}
        <div className="profile-upload-row">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <button
            className="profile-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            {uploading ? 'Đang xử lý...' : 'Tải ảnh từ máy tính'}
          </button>
        </div>

        {/* Divider */}
        <div className="profile-divider"><span>hoặc chọn emoji</span></div>

        {/* Emoji picker */}
        <div className="profile-emoji-grid">
          {AVATAR_EMOJIS.map(emoji => (
            <button
              key={emoji}
              className={`profile-emoji-btn ${avatar === emoji ? 'selected' : ''}`}
              onClick={() => setAvatar(avatar === emoji ? '' : emoji)}
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>

        {/* Name input */}
        <div className="profile-name-row">
          <label>Tên hiển thị</label>
          <input
            className="profile-name-input"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Nhập tên của bạn..."
            maxLength={30}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            autoFocus
          />
        </div>

        <div className="profile-modal-footer">
          <button className="profile-btn-cancel" onClick={onClose}>Hủy</button>
          <button className="profile-btn-save" onClick={handleSave} disabled={!name.trim() || uploading}>Lưu</button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ 
  user, 
  recentChats, 
  onNewChat, 
  onSelectChat, 
  onSearch,
  onLogout,
  onThemeChange,
  onDeleteChat,
  onProfileUpdate,
  currentChatId 
}) => {
  // Default collapsed on mobile
  const [isCollapsed, setIsCollapsed] = useState(window.innerWidth <= 768);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

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
                  >
                    <div className="chat-item-content" onClick={() => onSelectChat(chat)}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                      </svg>
                      <span className="chat-title">{chat.title}</span>
                    </div>
                    <button 
                      className="chat-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm('Xóa cuộc trò chuyện này?')) {
                          if (onDeleteChat) {
                            onDeleteChat(chat.chatId);
                          }
                        }
                      }}
                      title="Xóa"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
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
                {isImageAvatar(user?.avatar) ? (
                  <img src={user.avatar} alt={user.username} />
                ) : user?.avatar ? (
                  <div className="avatar-emoji">{user.avatar}</div>
                ) : (
                  <div className="avatar-placeholder">
                    {user?.username?.charAt(0)?.toUpperCase() || 'G'}
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
                <button className="menu-item" onClick={() => { setShowSettings(false); setShowProfileModal(true); }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Chỉnh sửa hồ sơ</span>
                </button>
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
      ) : null}

      {showProfileModal && (
        <ProfileModal
          user={user}
          onSave={onProfileUpdate}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
};

export default Sidebar;
