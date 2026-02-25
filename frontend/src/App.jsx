
import './App.css'
import DashboardPage from './pages/DashboardPage'
import Login from './Pages/LoginPage'
import { Routes, Route } from "react-router-dom";


function App() {

  return (
    <>
    
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        
      </div>
     
    </>
  )
}

export default App
