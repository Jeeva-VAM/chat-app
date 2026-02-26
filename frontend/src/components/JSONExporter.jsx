import React from 'react';
import { 
  getLoggedUsers, 
  getLoggedUsersAsJSON 
} from '../utils/loggedUsers';

const JSONExporter = () => {
  const downloadJSON = async () => {
    const jsonData = await getLoggedUsersAsJSON();
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `logged_users_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    try {
      const jsonData = await getLoggedUsersAsJSON();
      await navigator.clipboard.writeText(jsonData);
      alert('JSON copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Failed to copy to clipboard');
    }
  };

  const [userCount, setUserCount] = React.useState(0);

  React.useEffect(() => {
    const fetchUserCount = async () => {
      const users = await getLoggedUsers();
      setUserCount(users.length);
    };
    fetchUserCount();
  }, []);

  return (
    <div style={{ 
      padding: '20px', 
      border: '1px solid #ddd', 
      borderRadius: '8px', 
      marginTop: '20px',
      backgroundColor: '#f9f9f9'
    }}>
      <h4>Export Logged Users Data</h4>
      <p>Total users: {userCount}</p>
      
      <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
        <button 
          onClick={downloadJSON}
          style={{
            padding: '10px 16px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📥 Download JSON
        </button>
        
        <button 
          onClick={copyToClipboard}
          style={{
            padding: '10px 16px',
            backgroundColor: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          📋 Copy JSON
        </button>
      </div>
      
      <div style={{ marginTop: '15px' }}>
        <small style={{ color: '#666' }}>
          The JSON contains user details like name, email, login time, and session ID for all logged-in users.
        </small>
      </div>
    </div>
  );
};

export default JSONExporter;
