import { useEffect, useState, useRef } from "react";
import "../styles/navbar.css";
import { FaEnvelope, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

function Navbar() {
  const [openMenu, setOpenMenu] = useState(false);
  const menuRef = useRef();
  const navigate = useNavigate();

  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <nav className="navbar">
      <div className="nav-left">
        <h1 className="logo">Chat App</h1>
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input type="text" placeholder="Search messages..." />
        </div>
      </div>

      <div className="nav-right">
        <div className="icon-container">
          <FaEnvelope
            className="message-icon"
            onClick={() => navigate("/messages")}
          />
          {/* <FaEnvelope className="message-icon" /> */}
        </div>

        {user && (
          <div className="profile-wrapper" ref={menuRef}>
            <img
              src={user?.picture}
              alt="Profile"
              className="profile-image"
              referrerPolicy="no-referrer"
              onError={(e) => {
                e.target.src = "https://ui-avatars.com/api/?name=" + user?.name;
              }}
              onClick={() => setOpenMenu(!openMenu)}
            />
            {openMenu && (
              <div className="dropdown-menu">
                <div
                  className="dropdown-item"
                  onClick={() => navigate("/profile")}
                >
                  Edit Profile
                </div>
                <div className="dropdown-item logout" onClick={handleLogout}>
                  Logout
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;
