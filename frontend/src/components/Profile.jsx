import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/chat-profile.css";
import apiService from "../services/api";

function Profile() {
  const navigate = useNavigate();

  // Chat app profile state - OAuth + additional user data
  // Profile state - loaded from MongoDB
  const [profile, setProfile] = useState({
    userId: "",
    name: "",                      // From OAuth
    email: "",                     // From OAuth 
    profileImage: "",              // From OAuth (optional)
    bio: "",                      // User can add
    status: "online",              // Online status for chat
    mood: "😊",                    // Chat mood emoji
    joinDate: "February 2026",
    lastSeen: new Date().toISOString(),
    chatStats: {
      totalChats: 42,
      totalMessages: 1337,
      favoriteEmoji: "😄"
    },
    interests: ["Music", "Gaming", "Technology", "Movies"],
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
        darkMode: false,
        enterToSend: true
      }
    }
  });
  
  // Original profile for tracking changes
  const [originalProfile, setOriginalProfile] = useState({});
  
  // UI States
  const [isEditing, setIsEditing] = useState(false);
  const [isModified, setIsModified] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Load user profile data from backend API
  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get OAuth data from localStorage
      const storedUser = localStorage.getItem('user');
      if (!storedUser) {
        navigate('/');
        return;
      }
      
      const oauthData = JSON.parse(storedUser);
      
      // Try to fetch complete profile from MongoDB
      try {
        const response = await apiService.getUserProfile(oauthData.sub);
        
        if (response.profile) {
          // Profile exists in MongoDB - merge with defaults
          const dbProfile = response.profile;
          const loadedProfile = {
            userId: dbProfile.userId,
            name: dbProfile.name,
            email: dbProfile.email,
            profileImage: dbProfile.profileImage || '',
            bio: dbProfile.bio || '',
            status: dbProfile.status || 'online',
            mood: dbProfile.mood || '😊',
            joinDate: dbProfile.joinDate || 'February 2026',
            lastSeen: dbProfile.lastSeen || new Date().toISOString(),
            chatStats: dbProfile.chatStats || {
              totalChats: 0,
              totalMessages: 0,
              favoriteEmoji: '😄'
            },
            interests: dbProfile.interests || [],
            preferences: dbProfile.preferences || {
              notifications: { sound: true, desktop: true, vibration: true },
              privacy: { showLastSeen: true, showProfileImage: true, allowMessagesFromStrangers: true, readReceipts: true },
              chatSettings: { fontSize: 'medium', darkMode: false, enterToSend: true }
            }
          };
          
          setProfile(loadedProfile);
          setOriginalProfile({ ...loadedProfile });
          console.log('Profile loaded from MongoDB:', loadedProfile);
        } else {
          // No profile in MongoDB - create from OAuth data with defaults
          const newProfile = {
            userId: oauthData.sub,
            name: oauthData.name,
            email: oauthData.email,
            profileImage: oauthData.picture || '',
            bio: '',
            status: 'online',
            mood: '😊',
            joinDate: 'February 2026',
            lastSeen: new Date().toISOString(),
            chatStats: {
              totalChats: 0,
              totalMessages: 0,
              favoriteEmoji: '😄'
            },
            interests: [],
            preferences: {
              notifications: { sound: true, desktop: true, vibration: true },
              privacy: { showLastSeen: true, showProfileImage: true, allowMessagesFromStrangers: true, readReceipts: true },
              chatSettings: { fontSize: 'medium', darkMode: false, enterToSend: true }
            }
          };
          
          setProfile(newProfile);
          setOriginalProfile({ ...newProfile });
          console.log('Created new profile from OAuth:', newProfile);
        }
      } catch (apiError) {
        console.warn('MongoDB profile fetch failed, using OAuth data only:', apiError);
        
        // Fallback to OAuth data if database fetch fails
        const fallbackProfile = {
          userId: oauthData.sub,
          name: oauthData.name,
          email: oauthData.email,
          profileImage: oauthData.picture || '',
          bio: '',
          status: 'online',
          mood: '😊',
          joinDate: 'February 2026',
          lastSeen: new Date().toISOString(),
          chatStats: {
            totalChats: 0,
            totalMessages: 0,
            favoriteEmoji: '😄'
          },
          interests: [],
          preferences: {
            notifications: { sound: true, desktop: true, vibration: true },
            privacy: { showLastSeen: true, showProfileImage: true, allowMessagesFromStrangers: true, readReceipts: true },
            chatSettings: { fontSize: 'medium', darkMode: false, enterToSend: true }
          }
        };
        
        setProfile(fallbackProfile);
        setOriginalProfile({ ...fallbackProfile });
      }
    } catch (error) {
      console.error('Failed to load profile:', error);
      setErrors({ general: 'Failed to load profile data' });
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (updatedData) => {
    try {
      console.log('Updating profile:', updatedData);
      
      // Update profile in MongoDB
      const response = await apiService.updateUserProfile(updatedData.userId, updatedData);
      
      if (response.success && response.profile) {
        console.log('Profile updated in MongoDB:', response.profile);
        
        // Update local state with response
        setProfile(response.profile);
        setOriginalProfile({ ...response.profile });
        return true;
      } else {
        console.warn('Profile update response not successful:', response);
        // Fallback to local state update
        setProfile(updatedData);
        setOriginalProfile({ ...updatedData });
        return true;
      }
    } catch (error) {
      console.error('Failed to update profile in MongoDB:', error);
      // Fallback to local state update if API fails
      setProfile(updatedData);
      setOriginalProfile({ ...updatedData });
      return true;
    }
  };

  // Helper function to format connections count
  const formatCount = (count) => {
    if (count >= 500) return '500+';
    return count.toString();
  };

  // Helper function to check if profile is complete
  const getProfileCompleteness = () => {
    const fields = ['bio'];
    const filledFields = fields.filter(field => profile[field]?.trim());
    const hasInterests = profile.interests?.length > 0;
    
    let totalFields = fields.length + 1; // bio + interests
    let completedFields = filledFields.length;
    
    if (hasInterests) completedFields++;
    
    return Math.round((completedFields / totalFields) * 100);
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

    if (name === "bio" && value.length > 500) {
      error = "Bio cannot exceed 500 characters";
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

    // Handle nested properties like preferences.notifications.sound
    if (name.includes('.')) {
      const keys = name.split('.');
      setProfile(prev => {
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
      // Update profile data
      setProfile({ ...profile, [name]: value });
    }

    // Validate field
    const error = validate(name, value);
    setErrors({ ...errors, [name]: error });

    // Mark as modified if value changed from original
    if (profile[name] !== value) {
      setIsModified(true);
    }

    // Check if all changes are reverted
    if (originalProfile[name] === value) {
      const tempProfile = { ...profile, [name]: value };
      const isProfileUnchanged = Object.keys(tempProfile).every(
        key => tempProfile[key] === originalProfile[key]
      );
      setIsModified(!isProfileUnchanged);
    }
  };

  const handleSave = async () => {
    let newErrors = {};

    // Only validate truly required fields from OAuth
    const requiredFields = ['name', 'email'];
    
    requiredFields.forEach((key) => {
      const error = validate(key, profile[key]);
      if (error) newErrors[key] = error;
    });

    // Validate optional fields only if they have content
    const optionalFields = ['bio', 'profileImage'];
    optionalFields.forEach((key) => {
      if (profile[key]?.trim()) {
        const error = validate(key, profile[key]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      try {
        setLoading(true);
        const success = await updateProfile(profile);
        if (success) {
          setIsEditing(false);
          setIsModified(false);
          setOriginalProfile({ ...profile });
          console.log('Profile saved successfully to MongoDB!');
        } else {
          setErrors({ general: 'Failed to save profile changes' });
        }
      } catch (error) {
        console.error('Save profile error:', error);
        setErrors({ general: 'An error occurred while saving' });
      } finally {
        setLoading(false);
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
                src={profile.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=667eea&color=fff&size=200`} 
                alt="Profile" 
                className="profile-photo"
              />
              <div className={`status-indicator ${profile.status}`}></div>
            </div>
          </div>
          
          <div className="profile-info">
            <h1 className="profile-name">{profile.name} {profile.mood}</h1>
            <p className="profile-status">
              <span className={`status-dot ${profile.status}`}></span>
              {profile.status === 'online' ? 'Online now' : `Last seen ${new Date(profile.lastSeen).toLocaleString()}`}
            </p>
            
            {profile.bio ? (
              <p className="profile-bio">{profile.bio}</p>
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
                <div className="stat-number">{formatCount(profile.chatStats.totalChats)}</div>
                <div className="stat-label">Total Chats</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">{formatCount(profile.chatStats.totalMessages)}</div>
                <div className="stat-label">Messages Sent</div>
              </div>
              <div className="stat-card">
                <div className="stat-emoji">{profile.chatStats.favoriteEmoji}</div>
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
          
          {profile.interests && profile.interests.length > 0 ? (
            <div className="section-content">
              <div className="interests-grid">
                {profile.interests.map((interest, index) => (
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
                <span className="pref-value">{profile.preferences.notifications.sound ? 'On' : 'Off'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">👁️ Read Receipts</span>
                <span className="pref-value">{profile.preferences.privacy.readReceipts ? 'On' : 'Off'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">🌙 Theme</span>
                <span className="pref-value">{profile.preferences.chatSettings.darkMode ? 'Dark' : 'Light'}</span>
              </div>
              <div className="pref-item">
                <span className="pref-label">📱 Text Size</span>
                <span className="pref-value">{profile.preferences.chatSettings.fontSize || 'Medium'}</span>
              </div>
            </div>
            <button className="edit-settings-btn" onClick={() => setIsEditing(true)}>
              Edit Settings
            </button>
          </div>
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
      {/* </div> */}

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
              {/* Error Display */}
              {errors.general && (
                <div className="error-general" style={{
                  color: '#f44336',
                  backgroundColor: '#ffebee',
                  padding: '15px',
                  borderRadius: '10px',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  {errors.general}
                </div>
              )}
              
              {/* Basic Info Section */}
              <div className="edit-section">
                <h3>👤 Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      name="name"
                      value={profile.name}
                      onChange={handleChange}
                      placeholder="Your display name"
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Status</label>
                    <select
                      name="status"
                      value={profile.status || 'online'}
                      onChange={handleChange}
                    >
                      <option value="online">🟢 Online</option>
                      <option value="away">🟡 Away</option>
                      <option value="busy">🔴 Busy</option>
                      <option value="invisible">⚫ Invisible</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={profile.bio || ''}
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
                      value={profile.mood || '😊'}
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
                    <label>Profile Image URL</label>
                    <input
                      name="profileImage"
                      value={profile.profileImage || ''}
                      onChange={handleChange}
                      placeholder="https://example.com/your-photo.jpg"
                    />
                    {errors.profileImage && <span className="error">{errors.profileImage}</span>}
                    <small>Enter a URL for your profile picture</small>
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
                        checked={profile.preferences?.notifications?.sound || false}
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
                        checked={profile.preferences?.privacy?.readReceipts || false}
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
                        checked={profile.preferences?.chatSettings?.darkMode || false}
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
                      value={profile.preferences?.chatSettings?.fontSize || 'medium'}
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
                    value={profile.interests?.join(', ') || ''}
                    onChange={(e) => {
                      const interests = e.target.value.split(',').map(item => item.trim()).filter(item => item);
                      setProfile(prev => ({ ...prev, interests }));
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