import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useEffect } from "react";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // redirect if already logged
  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);

    const newUser = {
      id: decoded.sub,
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    };

    // fake users DB
    const existingUsers = JSON.parse(localStorage.getItem("users")) || [];
    const alreadyExists = existingUsers.find(u => u.id === newUser.id);

    if (!alreadyExists) {
      existingUsers.push(newUser);
      localStorage.setItem("users", JSON.stringify(existingUsers));
    }

    login(newUser); 
    navigate("/dashboard");
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
              onError={() => console.log("Login Failed")}
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