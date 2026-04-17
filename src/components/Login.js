import React, { useState } from 'react';
import './SignUp.css';
import { getCurrentUser, setCurrentUser, setAuthToken } from '../data/storageService';

const Login = ({ onLogin, onSwitchToSignUp }) => {
  const [credentials, setCredentials] = useState({ email: '', username: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!credentials.email && !credentials.username) {
      alert('Please enter email or username');
      return;
    }

    setIsLoading(true);
    try {
      // Call backend login API
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: credentials.email,
          username: credentials.username
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Login failed: ${errorData.error || 'Unknown error'}`);
        setIsLoading(false);
        return;
      }

      const data = await response.json();
      
      // Store user and token
      setCurrentUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      onLogin && onLogin(data.user);
      alert('Login successful!');
    } catch (error) {
      console.error('Error during login:', error);
      alert('Error: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        <div className="signup-content">
          <h2 className="subtitle">Log in</h2>
          <form onSubmit={handleSubmit} className="signup-form">
            <label className="field-label">
              <span className="label-text">Email</span>
              <input
                className="input-field"
                name="email"
                type="email"
                placeholder="Email"
                value={credentials.email}
                onChange={handleChange}
                disabled={isLoading}
              />
            </label>
            <label className="field-label">
              <span className="label-text">Username</span>
              <input
                className="input-field"
                name="username"
                placeholder="Username"
                value={credentials.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </label>
            <button type="submit" className="continue-btn" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
          <p className="alternate-text">
            Don't have an account?{' '}
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                onSwitchToSignUp && onSwitchToSignUp();
              }}
            >
              Sign up
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
