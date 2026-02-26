import users from '../data/users.json';
import { useEffect, useState } from "react";
import '../styles/suggestions.css';

function Suggestions() {
  const [suggestions, setSuggestions] = useState([]);

useEffect(() => {
  const currentUser = JSON.parse(localStorage.getItem("user"));

  const others = users.filter(u => u.id !== currentUser?.id);
  setSuggestions(others);
}, []);

  return (
    <div className="suggestions">
        <div className="suggestions-title">Suggested for you</div>

        <div className="suggestions-grid">
            {suggestions.map(u => (
            <div key={u.id} className="suggestion-card">
                <img src={u.picture} alt={u.name} className="suggestion-avatar" />

                <div className="suggestion-name">{u.name}</div>
                <div className="suggestion-meta">{u.email}</div>

                <button className="message-btn">Message</button>
            </div>
            ))}
        </div>
    </div>
  );
}

export default Suggestions;