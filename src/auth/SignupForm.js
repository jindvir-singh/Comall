import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import { submitSignupForm } from '../middleware/userdetails'; // Function to handle form submission
import './SignupForm.css';

function SignupForm() {
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const navigate = useNavigate(); // Navigate function

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      setMessage('Passwords do not match!');
      return;
    }

    // Prepare JSON body for submission
    const dataToSubmit = {
      name: formData.name,
      username: formData.username,
      email: formData.email,
      mobile: formData.mobile,
      password: formData.password,
    };

    try {
      setIsSubmitting(true);
      const response = await submitSignupForm(dataToSubmit); // Send JSON data to backend
      setMessage(`Success! Welcome, ${response.username}.`);

      // Redirect to Login Page after successful signup
      navigate('/login');
    } catch (error) {
      setMessage('Failed to submit form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-container">
      {/* Background moving elements */}
      {/* Signup Form */}
      <div className="signup-form">
        <h2>Create Account</h2>
        {message && <p className="form-message">{message}</p>}
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            name="name"
            placeholder="Full Name"
            value={formData.name}
            onChange={handleChange}
            required
          />
          <input
            type="text"
            name="username"
            placeholder="Username"
            value={formData.username}
            onChange={handleChange}
            required
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={formData.email}
            onChange={handleChange}
            required
          />
          <input
            type="tel"
            name="mobile"
            placeholder="Mobile Number"
            value={formData.mobile}
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
          <input
            type="password"
            name="confirmPassword"
            placeholder="Confirm Password"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SignupForm;
