// Utility to manage logged-in users in JSON file format

const JSON_FILE_PATH = '/logged-users.json';

// Helper function to read from JSON file
const readJSONFile = async () => {
  try {
    const response = await fetch(JSON_FILE_PATH);
    if (response.ok) {
      return await response.json();
    }
    return [];
  } catch (error) {
    console.error('Error reading JSON file:', error);
    return [];
  }
};

// Helper function to write to JSON file
const writeJSONFile = async (data) => {
  try {
    // Since we can't directly write to files from frontend, we'll use a workaround
    // We'll store in localStorage as backup and also download the file
    localStorage.setItem('loggedUsersBackup', JSON.stringify(data));
    
    // Create and download the JSON file
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Auto-download the updated file
    const link = document.createElement('a');
    link.href = url;
    link.download = 'logged-users.json';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    return data;
  } catch (error) {
    console.error('Error writing JSON file:', error);
    return [];
  }
};

// Get all logged-in users
export const getLoggedUsers = async () => {
  // Try to read from file first, fallback to localStorage backup
  let users = await readJSONFile();
  if (users.length === 0) {
    const backup = localStorage.getItem('loggedUsersBackup');
    if (backup) {
      users = JSON.parse(backup);
    }
  }
  return users;
};

// Add a new logged-in user
export const addLoggedUser = async (userDetails) => {
  const currentUsers = await getLoggedUsers();
  
  // Check if user already exists (by email or sub id)
  const existingUserIndex = currentUsers.findIndex(
    user => user.email === userDetails.email || user.sub === userDetails.sub
  );
  
  // If user exists, update their login time, otherwise add new user
  const userToAdd = {
    ...userDetails,
    loginTime: new Date().toISOString(),
    sessionId: Date.now() + Math.random() // Simple session ID
  };
  
  if (existingUserIndex !== -1) {
    // Update existing user's login time
    currentUsers[existingUserIndex] = userToAdd;
  } else {
    // Add new user
    currentUsers.push(userToAdd);
  }
  
  await writeJSONFile(currentUsers);
  return currentUsers;
};

// Remove a user from logged users (for logout)
export const removeLoggedUser = async (userEmail) => {
  const currentUsers = await getLoggedUsers();
  const filteredUsers = currentUsers.filter(user => user.email !== userEmail);
  await writeJSONFile(filteredUsers);
  return filteredUsers;
};

// Get current logged users as formatted JSON
export const getLoggedUsersAsJSON = async () => {
  const users = await getLoggedUsers();
  return JSON.stringify(users, null, 2);
};

// Clear all logged users (admin function)
export const clearAllLoggedUsers = async () => {
  await writeJSONFile([]);
  return [];
};

// Get logged users count
export const getLoggedUsersCount = async () => {
  const users = await getLoggedUsers();
  return users.length;
};
