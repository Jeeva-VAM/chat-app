import SuggestionsRow from "../components/SuggestionsRow";
import { useAuth } from "../context/AuthContext";
import "../styles/dashboard.css";

function DashboardPage() {
  const { user } = useAuth();

  if (!user) return null; // or redirect

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <h1>Welcome {user.name}</h1>
        <p>Select a chat to start messaging</p>

        <SuggestionsRow />
      </div>
    </div>
  );
}

export default DashboardPage;