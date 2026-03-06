import { useDispatch, useSelector } from "react-redux";
import { loadMoreRequest, resetSuggestions } from "../features/slice/suggestionSlice";
import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import '../styles/suggestions.css'


function SuggestionsRow() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const scrollRef = useRef(null);

  useEffect(() => {
    dispatch(resetSuggestions());
    dispatch(loadMoreRequest());
  }, [dispatch]);

  const users = useSelector((state) => state.suggestions.users || []);
  
  useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      console.log('el',el)
      const checkOverflow = () => {
        if (el.scrollWidth <= el.clientWidth) {
          dispatch(loadMoreRequest());
        }
      };

      const id = requestAnimationFrame(checkOverflow);
      console.log('id',id)
      return () => cancelAnimationFrame(id);
    }, [users.length, dispatch]);

  console.log('users',users)


  const cursor = useSelector(
    (state) => state.suggestions.cursor
  );
  console.log('cursor',cursor)


  const hasMore = cursor !== undefined;

  const handleScroll = () => {
  const el = scrollRef.current;
  if (!el || !hasMore) return;

  const nearEnd =
    el.scrollLeft + el.clientWidth >= el.scrollWidth - 20;

  if (nearEnd) dispatch(loadMoreRequest());
};


  const handleMessageClick = (e, user) => {
    e.stopPropagation();
    // Pass complete user object via state
    navigate(`/messages/${user._id || user.id}`, { 
      state: { 
        selectedUser: {
          _id: user._id || user.id,
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          profileImage: user.picture,
          bio: user.bio || ''
        }
      }
    });
  };

  return (
    <div className="suggestions-row-wrapper">
      <h2 className="suggest-user">Suggested Users</h2>

      <div
        className="suggestions-row"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {users.map((u) => (
          <div
            key={u.id}
            className="suggestion-card"
            onClick={() => navigate(`/profile/${u.id}`)}
          >
            <img src={u.picture} className="suggestion-avatar" />
            <div className="suggestion-name">{u.name}</div>

            <button
              className="message-btn"
              onClick={(e) => handleMessageClick(e, u)} 
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