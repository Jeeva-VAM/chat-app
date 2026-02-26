import DashboardPage from "./Pages/DashboardPage";
import Login from "./Pages/LoginPage";
import { Routes, Route,useLocation  } from "react-router-dom";
import { ProfilePage } from "./Pages/ProfilePage";
import Navbar from "./components/Navbar";


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
      </Routes>
    </>
  );
}

export default App;
