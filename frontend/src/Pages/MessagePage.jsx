import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import ApiService from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/messages.css";

function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [, setConversations] = useState([]);
  const [, setAllUsers] = useState([]);
  const [combinedUsers, setCombinedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Fetch conversations and users on component mount
  useEffect(() => {
    if (user?.sub) {
      loadConversationsAndUsers();
    }
  }, [user]);

  const loadConversationsAndUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Load both conversations and all users in parallel
      console.log('🔄 Loading conversations and users for user:', user.sub);
      
      // Make parallel API calls
      const conversationsPromise = ApiService.getUserConversations(user.sub)
        .catch(err => {
          console.error('❌ Failed to load conversations:', err);
          return { conversations: [] };
        });
        
      const usersPromise = ApiService.getAllProfiles({ limit: 100 })
        .catch(err => {
          console.error('❌ Failed to load profiles:', err);
          return { profiles: [] };
        });
      
      const [conversationsResponse, usersResponse] = await Promise.all([
        conversationsPromise,
        usersPromise
      ]);
      
      console.log('✅ Loaded data:', {
        conversations: conversationsResponse,
        users: usersResponse
      });
      
      // Transform conversations to match expected format
      const transformedConversations = conversationsResponse.conversations.map(conv => ({
        id: conv.conversationId,
        userId: conv.participant.userId,
        name: conv.participant.name,
        profileImage: conv.participant.profileImage,
        status: conv.participant.status || 'offline',
        lastMessage: conv.lastMessage?.text || "No messages yet",
        lastMessageAt: conv.lastMessageAt,
        unread: conv.unreadCount,
        isConversation: true
      }));
      
      // Filter out current user and users already in conversations
      // Show all users with userId (OAuth users) except current user
      const conversationUserIds = new Set(transformedConversations.map(conv => conv.userId));
      
      console.log('🔍 Filtering users:', {
        currentUserId: user.sub,
        allProfiles: usersResponse.profiles.map(p => ({ userId: p.userId, name: p.name })),
        conversationUserIds: Array.from(conversationUserIds)
      });
      
      const availableUsers = usersResponse.profiles
        .filter(profile => {
          // Include users with userId who are not the current user
          const hasUserId = profile.userId;
          const notCurrentUser = profile.userId !== user.sub;
          const notInConversation = !conversationUserIds.has(profile.userId);
          
          console.log(`👤 ${profile.name}:`, {
            hasUserId,
            notCurrentUser,
            notInConversation,
            willShow: hasUserId && notCurrentUser && notInConversation
          });
          
          return hasUserId && notCurrentUser && notInConversation;
        })
        .map(profile => ({
          id: profile._id,
          userId: profile.userId,
          name: profile.name,
          profileImage: profile.profileImage,
          status: profile.status || 'offline',
          lastMessage: "Click to start chatting",
          lastMessageAt: null,
          unread: 0,
          isConversation: false
        }));
      
      // Combine conversations (at top) with available users (below)
      const combined = [
        ...transformedConversations.sort((a, b) => 
          new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
        ),
        ...availableUsers.sort((a, b) => a.name.localeCompare(b.name))
      ];
      
      setConversations(transformedConversations);
      setAllUsers(availableUsers);
      setCombinedUsers(combined);
      
    } catch (err) {
      console.error('💥 Failed to load data:', err);
      console.error('📍 Error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setError('Failed to load conversations and users. Please refresh.');
      
      // Show empty state instead of demo data
      setCombinedUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = () => {
    // Refresh conversations when a new message is sent
    loadConversationsAndUsers();
  };

  if (loading) {
    return (
      <div className="message-container">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="message-container">
      {error && (
        <div className="error-banner">
          <span>⚠️ {error}</span>
          <button onClick={loadConversationsAndUsers}>Retry</button>
        </div>
      )}
      
      <Sidebar
        users={combinedUsers}
        onSelectUser={setSelectedUser}
        selectedUser={selectedUser}
        onRefresh={loadConversationsAndUsers}
      />

      <ChatWindow 
        selectedUser={selectedUser} 
        currentUser={user}
        onNewMessage={handleNewMessage}
      />
    </div>
  );
}

export default MessagesPage;