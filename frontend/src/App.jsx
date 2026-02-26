
// import './App.css'
import DashboardPage from './Pages/DashboardPage'
import Login from './Pages/LoginPage'
import { Routes, Route } from "react-router-dom";
import { ProfilePage } from './Pages/ProfilePage';

function App() {
  return (
    <>
<Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
     
    </>
  )
}

export default App;
