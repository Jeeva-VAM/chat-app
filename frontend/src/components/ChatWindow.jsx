import { useState, useEffect, useRef, useMemo } from "react";
import MessageInput from "./MessageInput";
import { useNavigate } from "react-router-dom";

function ChatWindow({ selectedUser }) {
  const navigate = useNavigate();
  const chatEndRef = useRef(null);

  // Generate initial messages based on selectedUser
  const initialMessages = useMemo(() => {
    if (!selectedUser) return [];

    return [
      { text: "Hello 👋", sender: "them", seen: true },
      { text: "Hi!", sender: "me", seen: true }
    ];
  }, [selectedUser]);

  const [messages, setMessages] = useState(initialMessages);

  // Reset messages when selectedUser changes
  useEffect(() => {
    setMessages(initialMessages);
  }, [initialMessages]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text) => {
    const newMessage = {
      text,
      sender: "me",
      seen: false
    };

    setMessages((prev) => [...prev, newMessage]);

    setTimeout(() => {
      setMessages((prev) =>
        prev.map((msg, index) =>
          index === prev.length - 1 ? { ...msg, seen: true } : msg
        )
      );
    }, 2000);
  };

  const addReaction = (index, emoji) => {
    setMessages((prev) =>
      prev.map((msg, i) =>
        i === index ? { ...msg, reaction: emoji } : msg
      )
    );
  };

  if (!selectedUser) {
    return (
      <div className="chat-window empty">
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
        <h3>Select a conversation</h3>
      </div>
    );
  }

  return (
    <div className="chat-window">
      <div className="chat-header">
        <h3>{selectedUser.name}</h3>
        <button className="back-btn" onClick={() => navigate("/dashboard")}>
          ← Back
        </button>
      </div>

      <div className="chat-body">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`message ${
              msg.sender === "me" ? "my-message" : "their-message"
            }`}
          >
            <p>{msg.text}</p>

            {msg.reaction && (
              <span className="reaction">{msg.reaction}</span>
            )}

            {msg.sender === "me" && (
              <small className="seen-status">
                {msg.seen ? "✔✔ Seen" : "✔ Sent"}
              </small>
            )}

            <button
              className="react-btn"
              onClick={() => addReaction(index, "👍")}
            >
              👍
            </button>
          </div>
        ))}
        <div ref={chatEndRef} />
      </div>

      <MessageInput onSend={sendMessage} />
    </div>
  );
}

export default ChatWindow;