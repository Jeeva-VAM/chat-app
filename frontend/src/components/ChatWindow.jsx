import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { sendMessage } from '../features/slice/chatSlice';
import { useNavigate } from "react-router-dom";

function ChatWindow({ conversation, messages = [], currentUserId, loading = {} }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // Use the loading prop instead of useSelector here

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !conversation || !currentUserId) return;

    const messageData = {
      senderId: currentUserId,
      messageType: 'text',
      content: { text: newMessage.trim() }
    };

    try {
      await dispatch(sendMessage({ 
        conversationId: conversation.id || conversation._id, 
        messageData 
      })).unwrap();
      
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!conversation) {
    return (
      <div className="chat-window">
        <div className="chat-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
        <div className="no-conversation">
          <p>Select a conversation to start messaging</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <img 
          src={conversation.avatar || 'https://via.placeholder.com/40'} 
          alt={conversation.name} 
          className="chat-avatar"
        />
        <div className="chat-user-info">
          <h3>{conversation.name}</h3>
          <span className="chat-status">
            {conversation.participants?.length > 2 ? 
              `${conversation.participants.length} members` : 
              'Online'
            }
          </span>
        </div>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </div>

      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="no-messages">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message._id} 
              className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
            >
              <div className="message-content">
                <p>{message.content?.text}</p>
                <div className="message-meta">
                  <span className="message-time">
                    {formatTime(message.createdAt)}
                  </span>
                  {message.isEdited && (
                    <span className="edited-indicator">edited</span>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="message-input-container">
        <textarea
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={`Message ${conversation.name}...`}
          className="message-input"
          rows="1"
          disabled={loading.sending}
        />
        <button 
          onClick={handleSendMessage}
          className="send-button"
          disabled={!newMessage.trim() || loading.sending}
        >
          {loading.sending ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}

export default ChatWindow;