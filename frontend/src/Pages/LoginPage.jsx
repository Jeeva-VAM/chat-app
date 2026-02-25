import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";

function Login() {
  const [user,] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/dashboard");
    }
  }, []);

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
  
    localStorage.setItem("user", JSON.stringify(decoded));
  
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