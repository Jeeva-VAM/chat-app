import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import "../styles/messages.css";

function MessagesPage() {
  const [selectedUser, setSelectedUser] = useState(null);

  const users = [
    { id: 1, name: "Arun", lastMessage: "Hey there!", unread: 2 },
    { id: 2, name: "Priya", lastMessage: "Okay 👍", unread: 0 },
    { id: 3, name: "Kumar", lastMessage: "See you!", unread: 1 }
  ];

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