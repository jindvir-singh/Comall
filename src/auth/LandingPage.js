import React from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate(); // Initialize useNavigate

  // Navigate to the Login page
  const goToLogin = () => {
    navigate('/login');
  };

  // Navigate to the Signup page
  const goToSignup = () => {
    navigate('/');
  };

  return (
    <div className="header">
      <div className="app-name">
        <p>comall.</p>
      </div>
      <div className="auth-buttons">
        <button className="login-button" onClick={goToLogin}>Login</button>
        <button className="signup-button" onClick={goToSignup}>Sign Up</button>
      </div>
    </div>
  );
}

export default LandingPage;
