import { useState } from "react";
import "../styles/profile.css";
import { useNavigate } from "react-router";

function Profile() {

    const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "Keerthana Sadhasivam", // From OAuth provider
    email: "keerthana@gmail.com",     // From OAuth provider
    role: "",
    phone: "",
    bio: "",
    location: "",
    company: "",
    joinDate: "February 2026", // Account creation date
    projects: 0,
    followers: 0,
    following: 0
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState(user);
  const [errors, setErrors] = useState({});

  const [skills, setSkills] = useState([]);
  const [recentActivity] = useState([
    { action: "Account created via Google OAuth", time: "Just now" }
  ]);

  // Helper function to check if profile is complete
  const getProfileCompleteness = () => {
    const fields = ['role', 'bio', 'location', 'company', 'phone'];
    const filledFields = fields.filter(field => user[field]?.trim());
    return Math.round((filledFields.length / fields.length) * 100);
  };

  // Helper function to get placeholder text
  const getPlaceholderText = (field) => {
    const placeholders = {
      role: "Add your job title",
      bio: "Tell us about yourself",
      location: "Add your location",
      company: "Add your company",
      phone: "Add your phone number"
    };
    return placeholders[field] || `Add ${field}`;
  };

  // 🔥 Validation Function
  const validate = (name, value) => {
    let error = "";

    // Only validate required fields - email and username are required from OAuth
    if (name === "username" || name === "email") {
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

    if (name === "phone" && value.trim()) {
      if (!/^\d+$/.test(value)) {
        error = "Phone must contain only numbers";
      } else if (value.length !== 10) {
        error = "Phone number must be exactly 10 digits";
      }
    }

    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setEditedUser({
      ...editedUser,
      [name]: value
    });

    const error = validate(name, value);

    setErrors({
      ...errors,
      [name]: error
    });
  };

  const handleSave = () => {

    let newErrors = {};

    // Only validate truly required fields from OAuth
    const requiredFields = ['username', 'email'];
    
    requiredFields.forEach((key) => {
      const error = validate(key, editedUser[key]);
      if (error) newErrors[key] = error;
    });

    // Validate optional fields only if they have content
    const optionalFields = ['phone'];
    optionalFields.forEach((key) => {
      if (editedUser[key]?.trim()) {
        const error = validate(key, editedUser[key]);
        if (error) newErrors[key] = error;
      }
    });

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      setUser(editedUser);
      setIsEditing(false);
    }
  };

  
  const handleBack=()=>{
    console.log("back")
    navigate(-1)
  }
  return (
    <div className="profile-page">
      <div className="profile-container">
        
        {/* Header Section */}
        <div className="profile-header">
          <div className="cover-image">
          </div>
          <div className="profile-main">
            <div className="avatar-section">
              <div className="avatar">
                <img src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" alt="Profile" />
                <div className="status-indicator"></div>
              </div>
            </div>
            
            <div className="profile-info">
              <h1 className="user-name">{user.username}</h1>
              <div className="role-section">
                {user.role ? (
                  <p className="user-role">{user.role}</p>
                ) : (
                  <button 
                    className="add-info-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="icon-plus"></i>
                    Add job title
                  </button>
                )}
              </div>
              
              {/* Profile Completeness Bar */}
              <div className="completeness-section">
                <div className="completeness-text">
                  <span>Profile completeness: {getProfileCompleteness()}%</span>
                </div>
                <div className="completeness-bar">
                  <div 
                    className="completeness-fill" 
                    style={{width: `${getProfileCompleteness()}%`}}
                  ></div>
                </div>
              </div>
              
              <div className="user-meta">
                {user.location ? (
                  <span className="location">
                    <i className="icon-location"></i>
                    {user.location}
                  </span>
                ) : (
                  <button 
                    className="add-meta-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="icon-location"></i>
                    Add location
                  </button>
                )}
                
                {user.company ? (
                  <span className="company">
                    <i className="icon-briefcase"></i>
                    {user.company}
                  </span>
                ) : (
                  <button 
                    className="add-meta-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="icon-briefcase"></i>
                    Add company
                  </button>
                )}
                
                <span className="join-date">
                  <i className="icon-calendar"></i>
                  Member since {user.joinDate}
                </span>
              </div>
            </div>
            
            <div className="profile-actions">
              <button onClick={() => setIsEditing(true)} className="btn-primary">
                <i className="icon-edit"></i>
                Edit Profile
              </button>
              <button className="btn-secondary">
                <i className="icon-message"></i>
                Message
              </button>
            </div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="stats-section">
          <div className="stat-card">
            <h3>{user.projects}</h3>
            <p>Projects</p>
          </div>
          <div className="stat-card">
            <h3>{user.followers}</h3>
            <p>Followers</p>
          </div>
          <div className="stat-card">
            <h3>{user.following}</h3>
            <p>Following</p>
          </div>
        </div>

        {/* Content Grid */}
        <div className="content-grid">
          {/* About Section */}
          <div className="content-card">
            <div className="card-header">
              <h2>About</h2>
              {!user.bio && (
                <button 
                  className="add-section-btn"
                  onClick={() => setIsEditing(true)}
                >
                  <i className="icon-plus"></i>
                </button>
              )}
            </div>
            <div className="card-content">
              {user.bio ? (
                <p className="bio">{user.bio}</p>
              ) : (
                <div className="empty-state">
                  <p className="empty-text">Add a bio to tell people about yourself</p>
                  <button 
                    className="add-content-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Add bio
                  </button>
                </div>
              )}
              
              <div className="contact-info">
                <div className="contact-item">
                  <i className="icon-mail"></i>
                  <span>{user.email}</span>
                </div>
                {user.phone ? (
                  <div className="contact-item">
                    <i className="icon-phone"></i>
                    <span>{user.phone}</span>
                  </div>
                ) : (
                  <button 
                    className="add-contact-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <i className="icon-phone"></i>
                    Add phone number
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Skills Section */}
          <div className="content-card">
            <div className="card-header">
              <h2>Skills</h2>
              <button 
                className="add-section-btn"
                onClick={() => setIsEditing(true)}
              >
                <i className="icon-plus"></i>
              </button>
            </div>
            <div className="card-content">
              {skills.length > 0 ? (
                <div className="skills-grid">
                  {skills.map((skill, index) => (
                    <span key={index} className="skill-tag">{skill}</span>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <p className="empty-text">Show your skills to stand out</p>
                  <button 
                    className="add-content-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    Add skills
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity Section */}
          <div className="content-card">
            <div className="card-header">
              <h2>Recent Activity</h2>
            </div>
            <div className="card-content">
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-dot"></div>
                    <div className="activity-content">
                      <p>{activity.action}</p>
                      <span className="activity-time">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
         <button onClick={handleBack}>back</button>

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
                      name="username"
                      value={editedUser.username}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                    />
                    {errors.username && <span className="error">{errors.username}</span>}
                  </div>

                  <div className="form-group">
                    <label>Job Title</label>
                    <input
                      name="role"
                      value={editedUser.role}
                      onChange={handleChange}
                      placeholder="e.g. Full Stack Developer, Product Manager"
                    />
                    {errors.role && <span className="error">{errors.role}</span>}
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
                    <label>Phone Number</label>
                    <input
                      name="phone"
                      value={editedUser.phone}
                      onChange={handleChange}
                      placeholder="1234567890 (10 digits)"
                    />
                    {errors.phone && <span className="error">{errors.phone}</span>}
                  </div>

                  <div className="form-group">
                    <label>Location</label>
                    <input
                      name="location"
                      value={editedUser.location}
                      onChange={handleChange}
                      placeholder="e.g. San Francisco, CA"
                    />
                  </div>

                  <div className="form-group">
                    <label>Company</label>
                    <input
                      name="company"
                      value={editedUser.company}
                      onChange={handleChange}
                      placeholder="e.g. Google, Microsoft, Freelance"
                    />
                  </div>
                </div>

                <div className="form-group full-width">
                  <label>Bio</label>
                  <textarea
                    name="bio"
                    value={editedUser.bio}
                    onChange={handleChange}
                    placeholder="Tell us about yourself, your interests, and what you do..."
                    rows="4"
                  />
                  {errors.bio && <span className="error">{errors.bio}</span>}
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

      </div>
    </div>
  );
}

export default Profile;



