import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function Profile() {
  const navigate = useNavigate();

  // LinkedIn-style profile state from JSON server
  const [user, setUser] = useState({
    id: 1,
    name: "Julia Smith",           // From OAuth
    email: "julia@example.com",    // From OAuth 
    profileImage: "",              // From OAuth (optional)
    headline: "",                  // To be added by user
    location: "",                  // To be added by user
    bio: "",                       // To be added by user
    connections: 0,
    followers: 0,
    provider: "google",
    joinDate: "February 2026",
    status: "online",
    lastSeen: new Date().toISOString(),
    experience: [],
    skills: [],
    interests: {
      companies: [],
      topics: []
    },
    preferences: {
      theme: "auto",
      notifications: {
        sound: true,
        desktop: true,
        email: false
      },
      privacy: {
        showLastSeen: true,
        showProfileImage: true,
        allowMessagesFromStrangers: true
      }
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch profile data from JSON server
  useEffect(() => {
    fetchProfile();
  }, []);

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
      return false;
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

  // 🔥 Validation Function
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

  const addSkill = (skillName) => {
    if (skillName && !user.skills.includes(skillName)) {
      const updatedSkills = [...user.skills, skillName];
      const updatedUser = { ...user, skills: updatedSkills };
      updateProfile(updatedUser);
    }
  };

  const addExperience = (experience) => {
    const updatedExperience = [...user.experience, experience];
    const updatedUser = { ...user, experience: updatedExperience };
    updateProfile(updatedUser);
  };

  const handleBack = () => {
    navigate(-1);
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="loading">Loading profile...</div>
      </div>
    );
  }
  return (
    <div className="linkedin-profile">
      {/* Back Button */}
      <button onClick={handleBack} className="back-button">
        ← Back
      </button>

      {/* LinkedIn-style Header */}
      <div className="profile-header">
        <div className="cover-photo">
          {/* LinkedIn cover gradient */}
        </div>
        
        <div className="profile-main-header">
          <div className="profile-photo-section">
            <img 
              src={user.profileImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0077b5&color=fff&size=200`} 
              alt="Profile" 
              className="profile-photo"
            />
          </div>
          
          <div className="profile-basic-info">
            <h1 className="profile-name">{user.name}</h1>
            {user.headline ? (
              <p className="profile-headline">{user.headline}</p>
            ) : (
              <button className="add-headline-btn" onClick={() => setIsEditing(true)}>
                Add a headline to tell people what you do
              </button>
            )}
            
            {user.location && (
              <p className="profile-location">📍 {user.location}</p>
            )}
            
            <p className="profile-connections">
              <strong>{formatCount(user.connections)} connections</strong>
            </p>
            
            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                ✏️ Edit Profile
              </button>
              <button className="btn-secondary">
                💬 Message
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - LinkedIn Sections */}
      <div className="linkedin-content">
        {/* About Section */}
        <div className="linkedin-section">
          <div className="section-header">
            <h2>About</h2>
            {!user.bio && (
              <button 
                className="add-section-btn"
                onClick={() => setIsEditing(true)}
              >
                +
              </button>
            )}
          </div>
          
          {user.bio ? (
            <div className="section-content">
              <p className="about-text">{user.bio}</p>
            </div>
          ) : (
            <div className="empty-section">
              <p>Add a bio to your profile to tell people more about yourself</p>
              <button className="add-content-button" onClick={() => setIsEditing(true)}>
                Add bio
              </button>
            </div>
          )}
        </div>

        {/* Activity/Analytics Section */}
        <div className="linkedin-section">
          <div className="section-header">
            <h2>Analytics</h2>
          </div>
          <div className="section-content">
            <div className="analytics-stats">
              <div className="stat-item">
                <strong>Profile views</strong>
                <p>Discover who's viewed your profile</p>
              </div>
              <div className="stat-item">
                <strong>{user.connections} connections</strong>
                <p>Grow your network</p>
              </div>
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="linkedin-section">
          <div className="section-header">
            <h2>Experience</h2>
            <button 
              className="add-section-btn"
              onClick={() => setIsEditing(true)}
            >
              +
            </button>
          </div>
          
          {user.experience && user.experience.length > 0 ? (
            <div className="section-content">
              {user.experience.map((exp, index) => (
                <div key={index} className="experience-item">
                  <h3>{exp.title}</h3>
                  <p>{exp.company}</p>
                  <p className="experience-period">{exp.period}</p>
                  {exp.description && <p className="experience-desc">{exp.description}</p>}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-section">
              <p>Show your experience to help people understand your career journey</p>
              <button className="add-content-button" onClick={() => setIsEditing(true)}>
                Add experience
              </button>
            </div>
          )}
        </div>

        {/* Skills Section */}
        <div className="linkedin-section">
          <div className="section-header">
            <h2>Skills</h2>
            <button 
              className="add-section-btn"
              onClick={() => setIsEditing(true)}
            >
              +
            </button>
          </div>
          
          {user.skills && user.skills.length > 0 ? (
            <div className="section-content">
              <div className="skills-grid">
                {user.skills.slice(0, 9).map((skill, index) => (
                  <div key={index} className="skill-item">
                    <span className="skill-name">{skill}</span>
                  </div>
                ))}
              </div>
              {user.skills.length > 9 && (
                <button className="show-more-btn">Show all {user.skills.length} skills</button>
              )}
            </div>
          ) : (
            <div className="empty-section">
              <p>Add skills to your profile to show what you know</p>
              <button className="add-content-button" onClick={() => setIsEditing(true)}>
                Add skills
              </button>
            </div>
          )}
        </div>

        {/* Interests Section */}
        <div className="linkedin-section">
          <div className="section-header">
            <h2>Interests</h2>
          </div>
          <div className="section-content">
            <div className="interests-tabs">
              <button className="tab-active">Companies</button>
              <button>Groups</button>
              <button>Schools</button>
              <button>Newsletters</button>
            </div>
            <div className="empty-section">
              <p>Follow companies and topics you're interested in</p>
            </div>
          </div>
        </div>
      </div>

        {/* Edit Modal */}
        {isEditing && (
          <div className="edit-modal-overlay">
            <div className="edit-modal">
              <div className="modal-header">
                <h2>Edit Profile</h2>
                <button className="close-btn" onClick={() => setIsEditing(false)}>
                  <i className="icon-close"></i>
                </button>
              </div>

              <div className="form-content">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Full Name *</label>
                    <input
                      name="name"
                      value={editedUser.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Email Address *</label>
                    <input
                      type="email"
                      name="email"
                      value={editedUser.email}
                      onChange={handleChange}
                      placeholder="Enter your email"
                    />
                    {errors.email && <span className="error">{errors.email}</span>}
                  </div>

                  <div className="form-group">
                    <label>Profile Image URL</label>
                    <input
                      name="profileImage"
                      value={editedUser.profileImage}
                      onChange={handleChange}
                      placeholder="https://example.com/image.jpg"
                    />
                    {errors.profileImage && <span className="error">{errors.profileImage}</span>}
                  </div>

                  <div className="form-group">
                    <label>Theme Preference</label>
                    <select
                      name="preferences.theme"
                      value={editedUser.preferences?.theme || 'auto'}
                      onChange={handleChange}
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto</option>
                    </select>
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Bio (max 500 characters)</label>
                  <textarea
                    name="bio"
                    value={editedUser.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself, your interests..."
                    rows="4"
                    maxLength="500"
                  />
                  <div className="char-count">{editedUser.bio?.length || 0}/500</div>
                  {errors.bio && <span className="error">{errors.bio}</span>}
                </div>

                <div className="form-group full-width">
                  <label>Skills & Interests</label>
                  <input
                    type="text"
                    value={skills.join(', ')}
                    onChange={(e) => {
                      const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setSkills(skillsArray);
                    }}
                    placeholder="e.g., React, JavaScript, UI/UX Design, Photography (separate with commas)"
                  />
                  <div className="char-count">{skills.length} skills added</div>
                </div>

                {/* Privacy Settings */}
                <div className="form-section">
                  <h3>Privacy Settings</h3>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editedUser.preferences?.privacy?.showLastSeen ?? true}
                        onChange={(e) => setEditedUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            privacy: {
                              ...prev.preferences?.privacy,
                              showLastSeen: e.target.checked
                            }
                          }
                        }))}
                      />
                      Show when I was last seen
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editedUser.preferences?.privacy?.showProfileImage ?? true}
                        onChange={(e) => setEditedUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            privacy: {
                              ...prev.preferences?.privacy,
                              showProfileImage: e.target.checked
                            }
                          }
                        }))}
                      />
                      Show my profile image
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editedUser.preferences?.privacy?.allowMessagesFromStrangers ?? true}
                        onChange={(e) => setEditedUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            privacy: {
                              ...prev.preferences?.privacy,
                              allowMessagesFromStrangers: e.target.checked
                            }
                          }
                        }))}
                      />
                      Allow messages from strangers
                    </label>
                  </div>
                </div>

                {/* Notification Settings */}
                <div className="form-section">
                  <h3>Notifications</h3>
                  <div className="checkbox-grid">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editedUser.preferences?.notifications?.sound ?? true}
                        onChange={(e) => setEditedUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences?.notifications,
                              sound: e.target.checked
                            }
                          }
                        }))}
                      />
                      Sound notifications
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editedUser.preferences?.notifications?.desktop ?? true}
                        onChange={(e) => setEditedUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences?.notifications,
                              desktop: e.target.checked
                            }
                          }
                        }))}
                      />
                      Desktop notifications
                    </label>
                    
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={editedUser.preferences?.notifications?.email ?? false}
                        onChange={(e) => setEditedUser(prev => ({
                          ...prev,
                          preferences: {
                            ...prev.preferences,
                            notifications: {
                              ...prev.preferences?.notifications,
                              email: e.target.checked
                            }
                          }
                        }))}
                      />
                      Email notifications
                    </label>
                  </div>
                </div>

                <div className="form-actions">
                  <button onClick={() => setIsEditing(false)} className="btn-cancel">
                    Cancel
                  </button>
                  <button onClick={handleSave} className="btn-save">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Edit Modal - Enhanced for LinkedIn structure */}
      {isEditing && (
        <div className="modal-overlay">
          <div className="linkedin-edit-modal">
            <div className="modal-header">
              <h2>Edit Profile</h2>
              <button className="close-btn" onClick={() => setIsEditing(false)}>
                ✕
              </button>
            </div>

            <div className="modal-content">
              {/* Basic Info Section */}
              <div className="edit-section">
                <h3>Basic Information</h3>
                <div className="form-row">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      name="name"
                      value={editedUser.name}
                      onChange={handleChange}
                      placeholder="Your full name"
                    />
                    {errors.name && <span className="error">{errors.name}</span>}
                  </div>

                  <div className="form-group">
                    <label>Headline</label>
                    <input
                      name="headline"
                      value={editedUser.headline || ''}
                      onChange={handleChange}
                      placeholder="e.g., Software Engineer at Microsoft"
                      maxLength="220"
                    />
                    <small>Describe what you do in a few words</small>
                    {errors.headline && <span className="error">{errors.headline}</span>}
                  </div>
                </div>

                <div className="form-row">
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

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      name="location"
                      value={editedUser.location || ''}
                      onChange={handleChange}
                      placeholder="e.g., San Francisco, CA"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Profile Image URL</label>
                  <input
                    name="profileImage"
                    value={editedUser.profileImage || ''}
                    onChange={handleChange}
                    placeholder="https://example.com/your-photo.jpg"
                  />
                  {errors.profileImage && <span className="error">{errors.profileImage}</span>}
                </div>
              </div>

              {/* About Section */}
              <div className="edit-section">
                <h3>About</h3>
                <div className="form-group full-width">
                  <textarea
                    name="bio"
                    value={editedUser.bio || ''}
                    onChange={handleChange}
                    placeholder="Write about your professional experience, what you're passionate about, and what makes you unique..."
                    rows="6"
                    maxLength="2600"
                  />
                  <div className="char-count">{editedUser.bio?.length || 0}/2600</div>
                  {errors.bio && <span className="error">{errors.bio}</span>}
                </div>
              </div>

              {/* Skills Section */}
              <div className="edit-section">
                <h3>Skills</h3>
                <div className="form-group full-width">
                  <input
                    type="text"
                    value={editedUser.skills?.join(', ') || ''}
                    onChange={(e) => {
                      const skillsArray = e.target.value.split(',').map(s => s.trim()).filter(s => s);
                      setEditedUser(prev => ({ ...prev, skills: skillsArray }));
                    }}
                    placeholder="e.g., JavaScript, React, Node.js, Project Management (separate with commas)"
                  />
                  <small>Add skills relevant to your industry</small>
                </div>
              </div>

              {/* Experience Section Preview */}
              <div className="edit-section">
                <h3>Experience</h3>
                <p className="section-note">
                  Experience details can be managed in the full profile editor. 
                  This version focuses on basic profile information.
                </p>
              </div>

              <div className="modal-actions">
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
                  Save Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;



    