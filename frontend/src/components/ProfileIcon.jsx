
import React, {  useState } from "react";
import { useNavigate } from "react-router-dom";
import { removeLoggedUser } from "../utils/loggedUsers";
import "../styles/ProfileIcon.css";

function ProfileIcon() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const userDetails = localStorage.getItem("user");
    return userDetails ? JSON.parse(userDetails) : null;
  });

  const handleLogout = async () => {
    if (user) {
      // Remove from logged users JSON
      await removeLoggedUser(user.email);
      
      // Remove from localStorage
      localStorage.removeItem("user");
      
      // Navigate to login page
      navigate("/");
      
      console.log("User logged out:", user.email);
    }
  };



  if (!user) return null;

  return (
    <div className="profile-wrapper">
      <div
        className="profile-avatar"
        onClick={() => navigate("/profile")}
      >
        {user?.picture ? (
          <img src={user.picture} alt="avatar" />
        ) : (
          <span>{user?.name?.charAt(0).toUpperCase()}</span>
        )}
      </div>
      <button 
        onClick={handleLogout}
        style={{
          marginLeft: '10px',
          padding: '8px 12px',
          backgroundColor: '#ff4444',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Logout
      </button>
    </div>
  );
}

export default ProfileIcon;
