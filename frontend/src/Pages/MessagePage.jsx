import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/messages.css";
import { useParams } from "react-router-dom";
import apiService from "../services/api";

function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { userId } = useParams();
  console.log('selected user ID', userId);

  // Load user details when userId changes
  useEffect(() => {
    const loadUserAndMessages = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Fetch the specific user details from MongoDB
        const userProfile = await apiService.getUserProfile(userId);
        console.log('Fetched user profile:', userProfile);
        
        // Create user object for sidebar and chat
        const selectedUserData = {
          id: userProfile.userId || userProfile._id,
          name: userProfile.name,
          lastMessage: "Start conversation...",
          unread: 0,
          profileImage: userProfile.profileImage || userProfile.picture
        };

        setSelectedUser(selectedUserData);
        
        // Add this user to the users list for sidebar (if not already present)
        setUsers(prevUsers => {
          const userExists = prevUsers.find(u => u.id === selectedUserData.id);
          if (!userExists) {
            return [selectedUserData, ...prevUsers];
          }
          return prevUsers;
        });

      } catch (error) {
        console.error('Error loading user profile:', error);
        
        // Fallback: create basic user object if API fails
        const fallbackUser = {
          id: userId,
          name: "User",
          lastMessage: "Start conversation...",
          unread: 0,
          profileImage: "https://via.placeholder.com/40"
        };
        
        setSelectedUser(fallbackUser);
        setUsers(prev => [fallbackUser, ...prev]);
      } finally {
        setLoading(false);
      }
    };

    loadUserAndMessages();
  }, [userId]);

  // Load default users for sidebar (your existing users or fetch from API)
  useEffect(() => {
    const loadDefaultUsers = () => {
      const defaultUsers = [
        { id: 1, name: "Arun", lastMessage: "Hey there!", unread: 2 },
        { id: 2, name: "Priya", lastMessage: "Okay 👍", unread: 0 },
        { id: 3, name: "Kumar", lastMessage: "See you!", unread: 1 }
      ];
      
      // Only set default users if no userId is provided
      if (!userId) {
        setUsers(defaultUsers);
      }
    };

    loadDefaultUsers();
  }, [userId]);

  if (loading) {
    return (
      <div className="message-container">
        <div className="loading-message">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="message-container">
      <Sidebar
        users={users}
        onSelectUser={setSelectedUser}
        selectedUser={selectedUser}
      />

      <ChatWindow selectedUser={selectedUser} />
    </div>
  );
}

export default MessagesPage;