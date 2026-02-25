
import './App.css'
import DashboardPage from './pages/DashboardPage'
import Login from './Pages/LoginPage'
import { Routes, Route } from "react-router-dom";

function App() {
  return (
    <>
<Routes>
      <Route path="/" element={<Login />} />
      <Route path="/dashboard" element={<DashboardPage />} />
    </Routes>
     
    </>
  )
}

export default App;
