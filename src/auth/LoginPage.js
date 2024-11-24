import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate

import './LoginPage.css';

function LoginPage() {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate(); // Create navigate function

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');

    // Add validation for empty fields
    if (!formData.username || !formData.password) {
      setMessage('Please fill in both username and password.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:433/comall/user-login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          usernameOrEmail: formData.username,
          password: formData.password,
        }),
      });

      const result = await response.json();
      console.log(result)

      if (response.ok) {
        // Save user data to localStorage
        localStorage.setItem('currentUser', JSON.stringify(result));
        setMessage(`Login successful! Welcome, ${result.username}`);
        navigate('/dashboard');
      } else {
        setMessage(result.error || 'Login failed. Please try again.');
      }
    } catch (error) {
      setMessage('Error logging in. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-form">
        <h2>Login</h2>
        {message && <p className="form-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="username"
            placeholder="Username or Email"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            value={formData.password}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Logging In...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
