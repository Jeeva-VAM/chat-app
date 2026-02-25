import React from "react";
import ProfileIcon from "./ProfileIcon";
import '../styles/navbar.css';

function Navbar() {
  return (
    <div className="navbar">
      <div className="nav-left">
        <ProfileIcon />
        <div className="logo">ChatApp</div>
      </div>

      <div className="nav-right">
        {/* future buttons */}
      </div>
    </div>
  );
}

export default Navbar;