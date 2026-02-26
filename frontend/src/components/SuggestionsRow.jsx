import usersData from "../data/users.json";
import { useState, useRef, useEffect } from "react";
import "../styles/suggestions.css";

const CARD_WIDTH = 170;
const GAP = 18;

function SuggestionsRow() {
  const [visibleUsers, setVisibleUsers] = useState([]);
  const scrollRef = useRef(null);
  const loadedCountRef = useRef(0);

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
          <div key={u.id} className="suggestion-card">
            <img src={u.picture} className="suggestion-avatar" />
            <div className="suggestion-name">{u.name}</div>
            <button className="message-btn">Message</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SuggestionsRow;