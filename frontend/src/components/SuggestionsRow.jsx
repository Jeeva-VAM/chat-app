import usersData from "../data/users.json";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/suggestions.css";

const CARD_WIDTH = 170;
const GAP = 18;

function SuggestionsRow() {
  const [visibleUsers, setVisibleUsers] = useState([]);
  const scrollRef = useRef(null);
  const loadedCountRef = useRef(0);
  const navigate = useNavigate();

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const containerWidth = el.clientWidth;
    const cardsPerScreen = Math.ceil(
      containerWidth / (CARD_WIDTH + GAP)
    );

    const needed = cardsPerScreen * 2; 
    const initialUsers = usersData.slice(0, needed);
    loadedCountRef.current = initialUsers.length;
    setVisibleUsers(initialUsers);
  }, []);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;

    const nearEnd =
      el.scrollLeft + el.clientWidth >= el.scrollWidth - 20;

    if (nearEnd && loadedCountRef.current < usersData.length) {
      const next = usersData.slice(
        loadedCountRef.current,
        loadedCountRef.current + 5
      );

      loadedCountRef.current += next.length;
      setVisibleUsers(prev => [...prev, ...next]);
    }
  };

  const handleProfileClick = (userId) => {
    navigate(`/profile/${userId}`);
  };

  const handleMessageClick = (e, userId) => {
    e.stopPropagation(); 
    navigate(`/message/${userId}`);
  };

    return (
    <div className="suggestions-row-wrapper">
    <h2 className="suggest-user">Suggested Users</h2>
    <br />
      <div
        className="suggestions-row"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {visibleUsers.map(u => (
          <div 
            key={u.id} 
            className="suggestion-card"
            onClick={() => handleProfileClick(u.id)}
            style={{ cursor: 'pointer' }}
          >
            <img src={u.picture} className="suggestion-avatar" />
            <div className="suggestion-name">{u.name}</div>
            <button 
              className="message-btn"
              onClick={(e) => handleMessageClick(e, u.id)}
            >
              Message
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuggestionsRow;