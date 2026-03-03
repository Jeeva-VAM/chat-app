import DashboardPage from "./Pages/DashboardPage";
import Login from "./Pages/LoginPage";
import { Routes, Route,useLocation  } from "react-router-dom";
import { ProfilePage } from "./Pages/ProfilePage";
import Navbar from "./components/Navbar";
import MessagesPage from "./Pages/MessagePage";


function App() {
  const location = useLocation();
  const hideNavbar = location.pathname === "/";

  return (
    <>
    {!hideNavbar && <Navbar />}
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/messages" element={<MessagesPage />} />
      </Routes>
    </>
  );
}

export default App;
