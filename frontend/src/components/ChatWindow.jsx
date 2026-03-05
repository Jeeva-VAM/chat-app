import { useState, useEffect, useRef } from "react";
import MessageInput from "./MessageInput";
import ApiService from "../services/api";
import { useNavigate } from "react-router-dom";

function ChatWindow({ selectedUser, currentUser, onNewMessage }) {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [typing, setTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  // Load messages when user is selected
  useEffect(() => {
    if (selectedUser && currentUser) {
      loadMessages();
      markMessagesAsRead();
    } else {
      setMessages([]);
    }
  }, [selectedUser, currentUser]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const conversationId = [currentUser.sub, selectedUser.userId].sort().join('_');
      const response = await ApiService.getConversationMessages(conversationId);
      
      // Transform messages to match UI format
      const transformedMessages = response.messages.map(msg => ({
        id: msg._id,
        text: msg.text,
        sender: msg.senderId === currentUser.sub ? "me" : "them",
        timestamp: msg.createdAt,
        status: msg.status,
        readBy: msg.readBy,
        type: msg.type || 'text'
      }));
      
      setMessages(transformedMessages);
    } catch (error) {
      console.error('Failed to load messages:', error);
      // Show demo messages if API fails
      setMessages([
        { id: 1, text: "Hello 👋 Welcome to the chat!", sender: "them", timestamp: new Date(), status: "read" },
        { id: 2, text: "Hi! Thanks for the welcome!", sender: "me", timestamp: new Date(), status: "read" }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    if (!selectedUser || !currentUser) return;
    
    try {
      const conversationId = [currentUser.sub, selectedUser.userId].sort().join('_');
      await ApiService.markMessagesAsRead(conversationId, currentUser.sub);
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const sendMessage = async (text, type = 'text', fileData = null) => {
    if (!selectedUser || !currentUser || (!text.trim() && !fileData)) return;

    // Optimistic update
    const optimisticMessage = {
      id: Date.now(),
      text: text || (fileData ? `📎 ${fileData.name}` : ''),
      sender: "me",
      timestamp: new Date(),
      status: "sending",
      type: type,
      fileData: fileData
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      const messageData = {
        senderId: currentUser.sub,
        recipientId: selectedUser.userId,
        text: text || `File: ${fileData?.name}`,
        type: type
      };

      const response = await ApiService.sendMessage(messageData);
      
      // Update optimistic message with server response
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, id: response.message._id, status: "sent" }
            : msg
        )
      );

      // Notify parent to refresh conversations
      if (onNewMessage) {
        onNewMessage();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // Mark message as failed
      setMessages(prev => 
        prev.map(msg => 
          msg.id === optimisticMessage.id 
            ? { ...msg, status: "failed" }
            : msg
        )
      );
    }
  };

  const handleSearch = async () => {
    console.log("search button pressed")
    console.log(searchQuery);
    if (!searchQuery.trim() || !currentUser) return;
    
    try {
      console.log("Inside try")
      const response = await ApiService.searchMessages(currentUser.sub, searchQuery);
      console.log("response received",response)
      setSearchResults(response.messages || []);
      console.log("response",response)
    } catch (error) {
      console.error('Failed to search messages:', error);
      setSearchResults([]);
    }
  };

  // Helper function to highlight search text in messages
  const highlightSearchText = (text, searchTerm) => {
    if (!searchTerm.trim()) return text;
    
    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <span key={index} className="search-highlight">{part}</span>
      ) : part
    );
  };

  // Navigate to specific message from search results
  const navigateToMessage = (searchResult) => {
    // Find the message in current chat by text and timestamp
    const targetMessage = messages.find(msg => 
      msg.text === searchResult.text && 
      new Date(msg.timestamp).getTime() === new Date(searchResult.createdAt).getTime()
    );

    if (targetMessage) {
      // Close search interface
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults([]);
      
      // Highlight the message temporarily
      setHighlightedMessageId(targetMessage.id);
      
      // Scroll to the message
      setTimeout(() => {
        const messageElement = document.getElementById(`message-${targetMessage.id}`);
        if (messageElement) {
          messageElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
          
          // Remove highlight after animation
          setTimeout(() => {
            setHighlightedMessageId(null);
          }, 3000);
        }
      }, 100);
    } else {
      // Message not found in current chat - it's from another conversation
      alert(`This message is from a different conversation. Please switch to that chat to view it.`);
    }
  };

  // Check if search result is in current conversation
  const isResultInCurrentChat = (searchResult) => {
    return messages.some(msg => 
      msg.text === searchResult.text && 
      new Date(msg.timestamp).getTime() === new Date(searchResult.createdAt).getTime()
    );
  };

  const addReaction = (index, emoji) => {
    setMessages(prev =>
      prev.map((msg, i) =>
        i === index ? { ...msg, reaction: emoji } : msg
      )
    );
  };

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true
    });
  };

  const getMessageStatus = (message) => {
    if (message.sender !== "me") return null;
    
    switch (message.status) {
      case "sending":
        return "🕒 Sending...";
      case "sent":
        return "✔ Sent";
      case "delivered":
        return "✔✔ Delivered";
      case "read":
        return "✔✔ Read";
      case "failed":
        return "⚠️ Failed";
      default:
        return "✔ Sent";
    }
  };

  if (!selectedUser) {
    return (
      <div className="chat-window empty">
        <div className="chat-header">
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
        <div className="empty-chat">
          <div className="empty-icon">💬</div>
          <h3>Select a conversation</h3>
          <p>Choose someone to start chatting with</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="user-info">
          <div className="avatar">
            {selectedUser.profileImage ? (
              <img src={selectedUser.profileImage} alt={selectedUser.name} />
            ) : (
              <div className="avatar-placeholder">{selectedUser.name[0]}</div>
            )}
            <div className={`status-indicator ${selectedUser.status || 'offline'}`}></div>
          </div>
          <div className="user-details">
            <h3>{selectedUser.name}</h3>
            <span className="status-text">
              {selectedUser.status === 'online' ? 'Online' : 'Last seen recently'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="search-btn"
            onClick={() => setShowSearch(!showSearch)}
            title="Search messages"
          >
            🔍
          </button>
          <button className="back-btn" onClick={() => navigate("/dashboard")}>
            ← Back
          </button>
        </div>
      </div>

      {showSearch && (
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button onClick={handleSearch}>Search</button>
          <button onClick={() => setShowSearch(false)}>✖</button>
        </div>
      )}

      {/* Search Results */}
      {showSearch && searchResults.length > 0 && (
        <div className="search-results">
          <h4>Search Results ({searchResults.length})</h4>
          <div className="search-results-list">
            {searchResults.map((result, index) => {
              const isInCurrentChat = isResultInCurrentChat(result);
              return (
                <div 
                  key={index} 
                  className={`search-result-item ${!isInCurrentChat ? 'other-chat' : ''}`}
                  onClick={() => navigateToMessage(result)}
                  title={!isInCurrentChat ? 'This message is from a different conversation' : 'Click to navigate to message'}
                >
                  <p>{highlightSearchText(result.text, searchQuery)}</p>
                  <div className="search-result-meta">
                    <span className="search-result-time">
                      {formatMessageTime(result.createdAt)}
                    </span>
                    {!isInCurrentChat && (
                      <span className="other-chat-indicator">Other chat</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* No search results message */}
      {showSearch && searchQuery.trim() && searchResults.length === 0 && (
        <div className="no-search-results">
          <p>No messages found for "{searchQuery}"</p>
        </div>
      )}

      <div className="chat-body">
        {loading && (
          <div className="loading-messages">
            <div className="spinner"></div>
            Loading messages...
          </div>
        )}
        
        {typing && (
          <div className="typing-indicator">
            <div className="typing-dots">
              <span></span><span></span><span></span>
            </div>
            {selectedUser.name} is typing...
          </div>
        )}

        {messages.map((msg, index) => (
          <div
            key={msg.id}
            id={`message-${msg.id}`}
            className={`message ${msg.sender === "me" ? "my-message" : "their-message"} ${msg.status === 'failed' ? 'failed' : ''} ${highlightedMessageId === msg.id ? 'message-highlighted' : ''}`}
          >
            <div className="message-content">
              <p>{showSearch && searchQuery ? highlightSearchText(msg.text, searchQuery) : msg.text}</p>
              
              {msg.reaction && (
                <span className="reaction">{msg.reaction}</span>
              )}
            </div>
            
            <div className="message-meta">
              <span className="timestamp">{formatMessageTime(msg.timestamp)}</span>
              {getMessageStatus(msg) && (
                <span className="status">{getMessageStatus(msg)}</span>
              )}
            </div>

            <button
              className="react-btn"
              onClick={() => addReaction(index, "👍")}
              title="Add reaction"
            >
              👍
            </button>
          </div>
        ))}
        
        <div ref={chatEndRef} />
      </div>

      <MessageInput 
        onSend={sendMessage} 
        disabled={loading}
        placeholder={`Message ${selectedUser.name}...`}
      />
    </div>
  );
}

export default ChatWindow;