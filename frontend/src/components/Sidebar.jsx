import React from 'react';

function Sidebar({ conversations = [], onSelectConversation, activeConversation, passedUser }) {
  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <h3>Messages</h3>
      </div>
      
      <div className="conversations-list">
        {/* Show the passed user at the top if available */}
        {passedUser && (
          <div className="conversation-item passed-user">
            <img 
              src={passedUser.profileImage || passedUser.picture || 'https://via.placeholder.com/40'} 
              alt={passedUser.name}
              className="conversation-avatar"
            />
            <div className="conversation-info">
              <h4>{passedUser.name}</h4>
              <p className="last-message">Start a new conversation</p>
            </div>
            <span className="new-conversation">New</span>
          </div>
        )}
        
        {conversations.map((conversation) => (
          <div
            key={conversation.id || conversation._id}
            className={`conversation-item ${(activeConversation?.id || activeConversation?._id) === (conversation.id || conversation._id) ? 'active' : ''}`}
            onClick={() => onSelectConversation(conversation)}
          >
            <img 
              src={conversation.avatar || 'https://via.placeholder.com/40'} 
              alt={conversation.name}
              className="conversation-avatar"
            />
            <div className="conversation-info">
              <h4>{conversation.name}</h4>
              <p className="last-message">
                {conversation.lastMessage?.text || 'No messages yet'}
              </p>
            </div>
            {conversation.unreadCount > 0 && (
              <span className="unread-count">{conversation.unreadCount}</span>
            )}
          </div>
        ))}
        
        {conversations.length === 0 && !passedUser && (
          <div className="no-conversations">
            <p>No conversations yet. Start by messaging someone!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;