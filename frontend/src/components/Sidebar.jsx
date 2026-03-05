import React from 'react';

function Sidebar({ users, onSelectUser, selectedUser }) {
  return (
    <div className="sidebar">
      <h3>Messages</h3>
      <div className="users-list">
        {users.map((user) => (
          <div
            key={user.id}
            className={`user-item ${selectedUser?.id === user.id ? 'selected' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <img 
              src={user.profileImage || 'https://via.placeholder.com/40'} 
              alt={user.name}
              className="user-avatar"
            />
            <div className="user-info">
              <h4>{user.name}</h4>
              <p className="last-message">{user.lastMessage}</p>
            </div>
            {user.unread > 0 && (
              <span className="unread-count">{user.unread}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;