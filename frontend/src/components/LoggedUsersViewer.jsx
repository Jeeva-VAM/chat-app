import React, { useState } from 'react';
import { 
  getLoggedUsers, 
  clearAllLoggedUsers,
  removeLoggedUser 
} from '../utils/loggedUsers';
import JSONExporter from './JSONExporter';

const LoggedUsersViewer = () => {
  const [loggedUsers, setLoggedUsers] = useState([]);
  const [showJSON, setShowJSON] = useState(false);
  const [loading, setLoading] = useState(true);

  const refreshUsers = async () => {
    setLoading(true);
    const users = await getLoggedUsers();
    setLoggedUsers(users);
    setLoading(false);
  };

  const handleClearAll = async () => {
    await clearAllLoggedUsers();
    await refreshUsers();
  };

  const handleRemoveUser = async (userEmail) => {
    await removeLoggedUser(userEmail);
    await refreshUsers();
  };
  React.useEffect(() => {
    refreshUsers();
  }, []);

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px', borderRadius: '8px' }}>
      <h3>Logged Users Manager</h3>
      <p>Total logged users: {loggedUsers.length}</p>
      
      {loading && <p>Loading users...</p>}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={refreshUsers}
          style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          Refresh
        </button>
        <button 
          onClick={() => setShowJSON(!showJSON)}
          style={{ marginRight: '10px', padding: '8px 16px', cursor: 'pointer' }}
        >
          {showJSON ? 'Hide JSON' : 'Show JSON'}
        </button>
        <button 
          onClick={handleClearAll}
          style={{ padding: '8px 16px', cursor: 'pointer', backgroundColor: '#ff4444', color: 'white' }}
        >
          Clear All Users
        </button>
      </div>

      {showJSON && (
        <div style={{ marginBottom: '20px' }}>
          <h4>JSON Format:</h4>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '10px', 
            borderRadius: '4px', 
            overflow: 'auto',
            fontSize: '12px'
          }}>
            {JSON.stringify(loggedUsers, null, 2)}
          </pre>
        </div>
      )}

      <div>
        <h4>Logged Users List:</h4>
        {loggedUsers.length === 0 ? (
          <p>No users logged in yet.</p>
        ) : (
          <div style={{ display: 'grid', gap: '10px' }}>
            {loggedUsers.map((user, index) => (
              <div key={index} style={{ 
                border: '1px solid #ddd', 
                padding: '10px', 
                borderRadius: '4px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <strong>{user.name}</strong> ({user.email})
                  <br />
                  <small>Login Time: {new Date(user.loginTime).toLocaleString()}</small>
                  <br />
                  <small>Session ID: {user.sessionId}</small>
                </div>
                <button 
                  onClick={() => handleRemoveUser(user.email)}
                  style={{ 
                    padding: '4px 8px', 
                    backgroundColor: '#ff6666', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <JSONExporter />
    </div>
  );
};

export default LoggedUsersViewer;
