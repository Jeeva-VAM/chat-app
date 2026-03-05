
function Sidebar({ users, onSelectUser, selectedUser, onRefresh }) {
  const formatLastMessageTime = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const messageTime = new Date(timestamp);
    const diffInHours = (now - messageTime) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return messageTime.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      });
    } else {
      return messageTime.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3 className="sidebar-title">Messages</h3>
        <button className="refresh-btn" onClick={onRefresh} title="Refresh">
          🔄
        </button>
      </div>
      
      {users.length === 0 ? (
        <div className="empty-conversations">
          <div className="empty-icon">💬</div>
          <p>No conversations yet</p>
          <small>Start chatting with someone!</small>
        </div>
      ) : (
        <div className="users-list">
          {/* Show existing conversations first */}
          {users.some(user => user.isConversation) && (
            <div className="section">
              <div className="section-header">
                <h4>Recent Conversations</h4>
              </div>
              {users
                .filter(user => user.isConversation)
                .map((user) => (
                  <div
                    key={`conv-${user.id}`}
                    className={`user-item conversation ${
                      selectedUser?.id === user.id ? "active" : ""
                    }`}
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="user-avatar">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name ? user.name[0].toUpperCase() : '?'}
                        </div>
                      )}
                      <div className={`status-dot ${user.status || 'offline'}`}></div>
                    </div>
                    
                    <div className="user-info">
                      <div className="user-header">
                        <h4>{user.name}</h4>
                        <span className="message-time">
                          {formatLastMessageTime(user.lastMessageAt)}
                        </span>
                      </div>
                      <div className="message-preview">
                        <p>{user.lastMessage}</p>
                        {user.unread > 0 && (
                          <span className="unread-badge">{user.unread}</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
          
          {/* Show available users to start new chats */}
          {users.some(user => !user.isConversation) && (
            <div className="section">
              <div className="section-header">
                <h4>Start New Chat</h4>
                <span className="section-subtitle">Tap to chat</span>
              </div>
              {users
                .filter(user => !user.isConversation)
                .map((user) => (
                  <div
                    key={`user-${user.id}`}
                    className={`user-item new-chat ${
                      selectedUser?.id === user.id ? "active" : ""
                    }`}
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="user-avatar">
                      {user.profileImage ? (
                        <img src={user.profileImage} alt={user.name} />
                      ) : (
                        <div className="avatar-placeholder">
                          {user.name ? user.name[0].toUpperCase() : '?'}
                        </div>
                      )}
                      <div className={`status-dot ${user.status || 'offline'}`}></div>
                    </div>
                    
                    <div className="user-info">
                      <div className="user-header">
                        <h4>{user.name}</h4>
                        <span className="new-chat-icon">💬</span>
                      </div>
                      <div className="message-preview">
                        <p className="new-chat-text">{user.lastMessage}</p>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          )}
        </div>
      )}
    </div>
  );
}
  
  export default Sidebar;
