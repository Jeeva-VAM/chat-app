import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/chat-profile.css";

function Profile() {
  const navigate = useNavigate();

  // Chat app profile state - OAuth + additional user data
  const [user, setUser] = useState({
    id: 1,
    name: "",                      // From OAuth localStorage
    email: "",                     // From OAuth localStorage
    profileImage: "",              // From OAuth localStorage
    bio: "",                       // User can add
    status: "online",              // Online status for chat
    mood: "😊",                    // Chat mood emoji
    theme: "light",               // Chat theme preference
    joinDate: "February 2026",
    lastSeen: new Date().toISOString(),
    chatStats: {
      totalChats: 0,
      totalMessages: 0,
      favoriteEmoji: "😄"
    },
    interests: [],                 // Chat interests/topics
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
        fontSize: "medium",
        enterToSend: true,
        darkMode: false
      }
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Load OAuth data and fetch additional profile data
  useEffect(() => {
    loadOAuthData();
    fetchProfile();
  }, []);

  const loadOAuthData = () => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const oauthData = JSON.parse(storedUser);
        setUser(prevUser => ({
          ...prevUser,
          name: oauthData.name || prevUser.name,
          email: oauthData.email || prevUser.email,
          profileImage: oauthData.picture || prevUser.profileImage
        }));
        setEditedUser(prevUser => ({
          ...prevUser,
          name: oauthData.name || prevUser.name,
          email: oauthData.email || prevUser.email,
          profileImage: oauthData.picture || prevUser.profileImage
        }));
      }
    } catch (error) {
      console.error('Failed to load OAuth data:', error);
    }
  };

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:3001/profiles/1');
      if (response.ok) {
        const profileData = await response.json();
        setUser(profileData);
        setEditedUser(profileData);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Use default data if server is not running
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      const response = await fetch('http://localhost:3001/profiles/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData)
      });
      
      if (response.ok) {
        const updatedProfile = await response.json();
        setUser(updatedProfile);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update profile:', error);
      // Fallback to local state update if server is not running
      setUser(updatedData);
      return true;
    }
  };

  // Helper function to check if profile is complete
  const getProfileCompleteness = () => {
    const fields = ['bio', 'headline', 'location'];
    const filledFields = fields.filter(field => user[field]?.trim());
    const hasExperience = user.experience?.length > 0;
    const hasSkills = user.skills?.length > 0;
    
    let totalFields = fields.length;
    let completedFields = filledFields.length;
    
    if (hasExperience) completedFields++;
    if (hasSkills) completedFields++;
    totalFields += 2; // experience and skills
    
    return Math.round((completedFields / totalFields) * 100);
  };

  // Helper function to format connections count
  const formatCount = (count) => {
    if (count >= 500) return '500+';
    return count.toString();
  };

  //  Validation Function
  const validate = (name, value) => {
    let error = "";

    // Required fields from OAuth
    if (name === "name" || name === "email") {
      if (!value.trim()) {
        error = "This field is required";
      }
    }

    if (name === "email" && value.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = "Enter valid email address";
      }
    }

    if (name === "bio" && value.length > 2600) {
      error = "Bio cannot exceed 2600 characters (LinkedIn limit)";
    }

    if (name === "headline" && value.length > 220) {
      error = "Headline cannot exceed 220 characters (LinkedIn limit)";
    }

    if (name === "profileImage" && value.trim()) {
      try {
        new URL(value);
      } catch {
        error = "Profile image must be a valid URL";
      }
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle nested properties like preferences.theme
    if (name.includes('.')) {
      const keys = name.split('.');
      setEditedUser(prev => {
        const updated = { ...prev };
        let current = updated;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
        return updated;
      });
    } else {
      setEditedUser({
        ...editedUser,
        [name]: value
      });
    }

    const error = validate(name, value);
    setErrors({
      ...errors,
      [name]: error
    });
  };

  const handleSave = async () => {
    let newErrors = {};

    // Only validate truly required fields from OAuth
    const requiredFields = ['name', 'email'];
    
    requiredFields.forEach((key) => {
      const error = validate(key, editedUser[key]);
      if (error) newErrors[key] = error;
    });

    // Validate optional fields only if they have content
    const optionalFields = ['bio', 'headline', 'profileImage'];
    optionalFields.forEach((key) => {
      if (editedUser[key]?.trim()) {
        const error = validate(key, editedUser[key]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const success = await updateProfile(editedUser);
      if (success) {
        setIsEditing(false);
      }
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="chat-profile">
        <div className="loading">Loading your profile...</div>
      </div>
    );
  }

  return (
    <div className="chat-profile">
      {/* Back Button */}
      <button onClick={handleBack} className="back-button">
        ← Back
      </button>

      {/* Chat Profile Header */}
      <div className="profile-header">
        <div className="cover-section">
          <div className="gradient-bg"></div>
        </div>
        
        <div className="profile-main-header">
          <div className="profile-photo-section">
            <div className="profile-photo-container">
              <img 
                src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=667eea&color=fff&size=200`} 
                alt="Profile" 
                className="profile-photo"
              />
              <div className={`status-indicator ${user.status}`}></div>
            </div>
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">{user.name} {user.mood}</h1>
            <p className="profile-status">
              <span className={`status-dot ${user.status}`}></span>
              {user.status === 'online' ? 'Online now' : `Last seen ${new Date(user.lastSeen).toLocaleString()}`}
            </p>
            
            {user.bio ? (
              <p className="profile-bio">{user.bio}</p>
            ) : (
              <button className="add-bio-btn" onClick={() => setIsEditing(true)}>
                Add a bio to tell others about yourself 💭
              </button>
            )}
            
            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)} className="btn-edit">
                ✏️ Edit Profile
              </button>
              <button className="btn-message">
                💬 Send Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - Chat Sections */}
      <div className="chat-content">
        {/* Chat Stats Section */}
        <div className="chat-section">
          <div className="section-header">
            <h2>📊 Chat Stats</h2>
          </div>
          <div className="section-content">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">{formatCount(user.chatStats.totalChats)}</div>
                <div className="stat-label">Total Chats</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{formatCount(user.chatStats.totalMessages)}</div>
                <div className="stat-label">Messages Sent</div>
              </div>
              <div className="stat-card">
                <div className="stat-emoji">{user.chatStats.favoriteEmoji}</div>
                <div className="stat-label">Favorite Emoji</div>
              </div>
            </div>
          </div>
        </div>

        {/* Interests Section */}
        <div className="chat-section">
          <div className="section-header">
            <h2>💫 Interests</h2>
            <button 
              className="add-section-btn"
              onClick={() => setIsEditing(true)}
            >
              +
            </button>
          </div>
          
          {user.interests && user.interests.length > 0 ? (
            <div className="section-content">
              <div className="interests-grid">
                {user.interests.map((interest, index) => (
                  <div key={index} className="interest-tag">
                    {interest}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="empty-section">
              <p>Add your interests to connect with like-minded people 🌟</p>
              <button className="add-content-button" onClick={() => setIsEditing(true)}>
                Add interests
              </button>
            </div>
          )}
        </div>

        {/* Preferences Section */}
        <div className="chat-section">
          <div className="section-header">
            <h2>⚙️ Chat Settings</h2>
          </div>
          <div className="section-content">
            <div className="preferences-grid">
              <div className="pref-item">
                <span className="pref-label">🔔 Notifications</span>
                <span className="pref-value">{user.preferences.notifications.sound ? 'On' : 'Off'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">👁️ Read Receipts</span>
                <span className="pref-value">{user.preferences.privacy.readReceipts ? 'On' : 'Off'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">🌙 Theme</span>
                <span className="pref-value">{user.preferences.chatSettings.darkMode ? 'Dark' : 'Light'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">📱 Text Size</span>
                <span className="pref-value">{user.preferences.chatSettings.fontSize || 'Medium'}</span>
              </div>
            </div>
            <button className="edit-settings-btn" onClick={() => setIsEditing(true)}>
              Edit Settings
            </button>
          </div>
        </div>

        {/* Activity Timeline */}
        <div className="chat-section">
          <div className="section-header">
            <h2>🕒 Recent Activity</h2>
          </div>
          <div className="section-content">
            <div className="activity-timeline">
              <div className="activity-item">
                <div className="activity-time">2 hours ago</div>
                <div className="activity-desc">Updated profile photo</div>
              </div>
              <div className="activity-item">
                <div className="activity-time">Yesterday</div>
                <div className="activity-desc">Joined the app</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal - Chat Style */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="chat-edit-modal">
            <div className="modal-header">
              <h2>✨ Edit Your Profile</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              {/* Basic Info Section */}
              <div className="edit-section">
                <h3>👤 Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      name="name"
                      value={editedUser.name}
                      onChange={handleChange}
                      placeholder="Your display name"
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editedUser.email}
                      onChange={handleChange}
                      placeholder="Your email address"
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={editedUser.bio || ''}
                    onChange={handleChange}
                    placeholder="Tell others about yourself... 💭"
                    maxLength="500"
                    rows="4"
                  />
                  <small>Tell others what makes you unique (max 500 characters)</small>
                  {errors.bio && <span className="error">{errors.bio}</span>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>Mood</label>
                    <select
                      name="mood"
                      value={editedUser.mood || '😊'}
                      onChange={handleChange}
                    >
                      <option value="😊">😊 Happy</option>
                      <option value="😎">😎 Cool</option>
                      <option value="🤔">🤔 Thinking</option>
                      <option value="😴">😴 Sleepy</option>
                      <option value="🎉">🎉 Excited</option>
                      <option value="❤️">❤️ Lovely</option>
                      <option value="🔥">🔥 On Fire</option>
                      <option value="⚡">⚡ Energetic</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={editedUser.status || 'online'}
                      onChange={handleChange}
                    >
                      <option value="online">🟢 Online</option>
                      <option value="away">🟡 Away</option>
                      <option value="busy">🔴 Busy</option>
                      <option value="invisible">⚫ Invisible</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Chat Preferences */}
              <div className="edit-section">
                <h3>⚙️ Chat Preferences</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="preferences.notifications.sound"
                        checked={editedUser.preferences?.notifications?.sound || false}
                        onChange={(e) => handleChange({
                          target: {
                            name: 'preferences.notifications.sound',
                            value: e.target.checked
                          }
                        })}
                      />
                      🔔 Sound notifications
                    </label>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="preferences.privacy.readReceipts"
                        checked={editedUser.preferences?.privacy?.readReceipts || false}
                        onChange={(e) => handleChange({
                          target: {
                            name: 'preferences.privacy.readReceipts',
                            value: e.target.checked
                          }
                        })}
                      />
                      👁️ Send read receipts
                    </label>
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        name="preferences.chatSettings.darkMode"
                        checked={editedUser.preferences?.chatSettings?.darkMode || false}
                        onChange={(e) => handleChange({
                          target: {
                            name: 'preferences.chatSettings.darkMode',
                            value: e.target.checked
                          }
                        })}
                      />
                      🌙 Dark mode
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Text Size</label>
                    <select
                      name="preferences.chatSettings.fontSize"
                      value={editedUser.preferences?.chatSettings?.fontSize || 'medium'}
                      onChange={handleChange}
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Interests */}
              <div className="edit-section">
                <h3>💫 Interests</h3>
                <div className="form-group">
                  <label>Add your interests (comma-separated)</label>
                  <input
                    name="interests"
                    value={editedUser.interests?.join(', ') || ''}
                    onChange={(e) => {
                      const interests = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                      setEditedUser(prev => ({ ...prev, interests }));
                    }}
                    placeholder="Music, Sports, Technology, Gaming..."
                  />
                  <small>What topics do you love chatting about?</small>
                </div>
              </div>

            </div>

            <div className="modal-footer">
              <button 
                className="btn-cancel" 
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-save" 
                onClick={handleSave}
              >
                💾 Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;