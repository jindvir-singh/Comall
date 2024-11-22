import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'; // Import Router and Routes
import './index.css';
import LandingPage from './auth/LandingPage';  // Import LandingPage
import SignupForm from './auth/SignupForm';   // Import SignupForm
import LoginPage from './auth/LoginPage';     // Import LoginPage
import DashBoard from './dashboard/dashboard';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <Router> {/* Wrap the entire app in Router */}
      <Routes> {/* Define Routes for each page */}
        {/* Route for the Landing page with SignupForm */}
        <Route path="/" element={<><LandingPage /><SignupForm /></>} /> 

        {/* Route for LoginPage */}
        <Route path="/login" element={<><LandingPage /><LoginPage /></>} />  
        <Route path="/dashboard" element={<DashBoard />} />  
      </Routes>
    </Router>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
