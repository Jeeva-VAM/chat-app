import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState } from "react";
import "../styles/login.css";

function Login() {
  const [user, setUser] = useState(null);

  const handleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setUser(decoded);
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
              onSuccess={handleSuccess}
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