
import React, {  useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/ProfileIcon.css";

function ProfileIcon() {
  const navigate = useNavigate();

  const [user] = useState(() => {
    const userDetails = localStorage.getItem("user");
    return userDetails ? JSON.parse(userDetails) : null;
  });



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
    </div>
  );
}

export default ProfileIcon;
