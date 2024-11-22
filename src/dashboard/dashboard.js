import React, { useState, useEffect } from 'react';
import './dashboard.css';

function Dashboard() {

  const [allUsers, setAllUsers] = useState([]); // State to store all users
  const [searchTerm, setSearchTerm] = useState(''); // State to filter users by search term

  // Function to fetch all users
  const fetchAllUsers = async () => {
    try {
      const response = await fetch('http://localhost:433/comall/users'); // API endpoint to fetch users
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setAllUsers(data.users); // Store fetched users in state
    } catch (error) {
      console.error('Error fetching all users:', error);
    }
  };

  // Function to fetch current user data (e.g., username, image)
  const fetchUserData = async () => {
    
  };

  // Fetch user data and all users when the component mounts
  useEffect(() => {
    fetchUserData();
    fetchAllUsers(); // Fetch all users
  }, []); // Empty dependency array means this runs only once when the component mounts

  // Handle search input change
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  return (
    <div className="dashboard-container">
      <div className="header">
        <div className="logo">
          <p>comall.</p>
        </div>
        
      </div>

      <div className="main-content">
        <div className="left-section">
          <h3>All Users</h3>
          <input
            type="text"
            placeholder="Search for users"
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-bar"
          />
          <ul className="friend-list">
            {allUsers
              .filter((user) =>
                user.username.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((user) => (
                <li key={user.id} className="friend-item">
                  <p>{user.username}</p>
                  <button className="add-friend-btn">Add Friend</button>
                </li>
              ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
