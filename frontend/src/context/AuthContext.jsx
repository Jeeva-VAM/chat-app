import { createContext, useContext, useState } from "react";
/* eslint-disable react-refresh/only-export-components */

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(()=>{
    const storedUser = localStorage.getItem("user");
    return storedUser?JSON.parse(storedUser):null 
  });

  const login = (userData) => {
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);