import React, { useEffect, useState } from 'react';
import Announcements from '../Admin/Announcements';  // Import Announcements from the correct path
import './UserDashboard.css';

const UserDashboard = ({ API_URL, token }) => {
  // State to store the username
  const [username, setUsername] = useState('');

  useEffect(() => {
    // Retrieve username from localStorage
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsername(storedUsername); // Set the username if found
    }
  }, []);

  return (
    <div className="user-dashboard">
      {/* Display Hello with the logged-in user's username */}
      <h2>Hello, {username ? username : 'User'}!</h2>
      <p>Welcome to your user dashboard! You can access the different sections from the sidebar.</p>

      {/* Announcements Component */}
      <div className="announcements-container">
        <Announcements API_URL={API_URL} token={token} />
      </div>
    </div>
  );
};

export default UserDashboard;
