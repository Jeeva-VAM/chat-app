import { useState } from "react";
import Navbar from "../components/Navbar";

function DashboardPage() {
  const [user] = useState(() => {
    const userDetails = localStorage.getItem("user");
    return userDetails ? JSON.parse(userDetails) : null;
  });

  if (!user) return null;

  return (
    <div className="dashboard">
      <Navbar />

      <div className="dashboard-content">
        <h1>Welcome {user.name} </h1>
        <p>Select a chat to start messaging</p>
      </div>
    </div>
  );
}

export default DashboardPage;
