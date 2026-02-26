
// import './App.css'
import DashboardPage from './Pages/DashboardPage'
import Login from './Pages/LoginPage'
import { Routes, Route } from "react-router-dom";
import { ProfilePage } from './Pages/ProfilePage';
import OAuthSuccess from './Pages/OAuthSuccess'

function App() {
  return (
    <>
<Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      {/* <Route path="/oauth-success" element={<OAuthSuccess />} /> */}
    </Routes>
     
    </>
  )
}

export default App;
