import { useState, useEffect } from "react";
import { useParams, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/messages.css";
import { 
  fetchConversations, 
  createDirectConversation, 
  fetchMessages, 
  setActiveConversation 
} from "../features/slice/chatSlice";

function MessagesPage() {
  const [pageLoading, setPageLoading] = useState(true);
  const { userId } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  
  const passedUser = location.state?.selectedUser;
  const fullState = useSelector(state => state);
  const chatState = useSelector(state => state.chat);
  const { 
    conversations = [], 
    activeConversation = null, 
    messages = {},
    loading = { conversations: false, messages: false, sending: false }
  } = chatState || {};
  
  // Get current user (you'll need to implement this based on your auth system)
  const getCurrentUser = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user.sub || user.id || user.userId; // Google OAuth sub or regular id
  };

  const currentUserId = getCurrentUser();

  console.log('selected user ID', userId);
  console.log('passed user data', passedUser);
  console.log('current user ID', currentUserId);
  console.log('Full Redux state:', fullState);
  console.log('Redux chat state:', chatState);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        setPageLoading(true);
        
        // Fetch user's conversations first if we have a current user
        if (currentUserId) {
          await dispatch(fetchConversations(currentUserId)).unwrap();
        }
        
        // If we have a specific userId (from message button click)
        if (userId && currentUserId && userId !== currentUserId) {
          try {
            // Create or get direct conversation with this user
            const conversationResult = await dispatch(
              createDirectConversation({ 
                user1Id: currentUserId, 
                user2Id: userId 
              })
            ).unwrap();
            
            // Set as active conversation
            dispatch(setActiveConversation(conversationResult));
            
            // Fetch messages for this conversation
            if (conversationResult._id) {
              await dispatch(fetchMessages({ 
                conversationId: conversationResult._id 
              })).unwrap();
            }
          } catch (error) {
            console.error('Error creating conversation:', error);
          }
        }
      } catch (error) {
        console.error('Error initializing chat:', error);
      } finally {
        setPageLoading(false);
      }
    };

    initializeChat();
  }, [userId, currentUserId, dispatch]);

  const handleSelectConversation = async (conversation) => {
    dispatch(setActiveConversation(conversation));
    
    // Fetch messages for this conversation if not already loaded
    if (!messages[conversation.id || conversation._id]) {
      await dispatch(fetchMessages({ conversationId: conversation.id || conversation._id }));
    }
  };

  if (pageLoading) {
    return (
      <div className="message-container">
        <div className="loading-message">Loading conversations...</div>
      </div>
    );
  }

  return (
    <div className="message-container">
      <Sidebar
        conversations={conversations}
        onSelectConversation={handleSelectConversation}
        activeConversation={activeConversation}
        passedUser={passedUser}
      />

      <ChatWindow 
        conversation={activeConversation}
        messages={messages[activeConversation?.id || activeConversation?._id]?.messages || []}
        currentUserId={currentUserId}
        loading={loading}
      />
    </div>
  );
}

export default MessagesPage;