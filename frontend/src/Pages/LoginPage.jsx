import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import { addLoggedUser } from "../utils/loggedUsers";

function Login() {
  const [user] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  // const handleGoogleSuccess = async (credentialResponse) => {
  //   const decoded = jwtDecode(credentialResponse.credential);
  //   console.log(decoded)
   
  //   localStorage.setItem("user", JSON.stringify(decoded));
    
    
  //   await addLoggedUser(decoded);
    
  //   console.log("User logged in and added to logged users:", decoded);

  //   navigate("/dashboard");
  // };

  const handleGoogleSuccess = (credentialResponse) => {
  const decoded = jwtDecode(credentialResponse.credential);

  const newUser = {
    id: decoded.sub,
    name: decoded.name,
    email: decoded.email,
    picture: decoded.picture,
  };

  // get existing users
  const existingUsers = JSON.parse(localStorage.getItem("users")) || [];

  // check duplicate
  const alreadyExists = existingUsers.find(u => u.id === newUser.id);

  if (!alreadyExists) {
    existingUsers.push(newUser);
    localStorage.setItem("users", JSON.stringify(existingUsers));
  }

  // store current user session
  localStorage.setItem("user", JSON.stringify(newUser));

  navigate("/dashboard");
};
  const handleError = () => {
    console.log("Login Failed");
  };

  return (
    <div className="container">
      <div className="card">
        {!user ? (
          <>
            <h2>Welcome Back 👋</h2>
            <p>Login with Google to continue</p>

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              shape="pill"
            />
          </>
        ) : (
          <div className="profile">
            <h3>Login Successful</h3>
            <img src={user.picture} alt="profile" />
            <h3>{user.name}</h3>
            <p>{user.email}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Login;
