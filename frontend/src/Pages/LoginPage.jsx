import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";
import { useState, useEffect } from "react";
import "../styles/login.css";
import { useNavigate } from "react-router-dom";
import apiService from "../services/api";

function Login() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate("/dashboard");
    }
  }, [navigate]);

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      setError(null);

      // Decode the Google JWT to get user info
      const decoded = jwtDecode(credentialResponse.credential);
      
      console.log('Google login successful:', decoded);
      
      // Create user profile data
      const userProfile = {
        userId: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        profileImage: decoded.picture,
        bio: '',
        status: 'online',
        mood: '😊',
        joinDate: new Date().toISOString().split('T')[0],
        lastSeen: new Date().toISOString(),
        chatStats: {
          totalChats: 0,
          totalMessages: 0,
          favoriteEmoji: '😊'
        },
        interests: [],
        preferences: {
          notifications: {
            sound: true,
            desktop: true,
            vibration: true
          },
          privacy: {
            showLastSeen: true,
            showProfileImage: true,
            allowMessagesFromStrangers: true,
            readReceipts: true
          },
          chatSettings: {
            fontSize: 'medium',
            enterToSend: true,
            darkMode: false
          }
        }
      };
      
      // Store user data in localStorage for quick access
      localStorage.setItem("user", JSON.stringify({
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        sub: decoded.sub
      }));
      
      // Save/update profile in MongoDB
      try {
        await apiService.createOrUpdateProfile(userProfile);
        console.log('Profile saved to MongoDB successfully');
      } catch (dbError) {
        console.warn('Profile save failed, continuing anyway:', dbError);
      }
      
      // Navigate to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error('Google login error:', error);
      setError(error.message || 'Failed to login with Google. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  const handleError = () => {
    console.log("Login Failed");
    setError('Google login failed. Please try again.');
  };

  return (
    <div className="container">
      <div className="card">
        {!user ? (
          <>
            <h2>Welcome Back 👋</h2>
            <p>Login with Google to continue</p>
            
            {error && (
              <div className="error-message" style={{ 
                color: '#f44336', 
                marginBottom: '15px', 
                padding: '10px', 
                backgroundColor: '#ffebee', 
                borderRadius: '5px',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}

            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={handleError}
              theme="outline"
              size="large"
              shape="pill"
              disabled={loading}
            />
            
            {loading && (
              <div className="loading-message" style={{
                marginTop: '15px',
                color: '#666',
                fontSize: '14px'
              }}>
                Signing you in...
              </div>
            )}
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
