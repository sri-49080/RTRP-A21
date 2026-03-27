import React, { useState } from 'react';
import './SignUp.css';
import { getCurrentUser } from '../data/storageService';

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
      const user = getCurrentUser();
      if (!user) {
        alert('No user found yet; please sign up first.');
        return;
      }

      const lookup = (credentials.email && user.email.toLowerCase() === credentials.email.toLowerCase()) ||
                     (credentials.username && user.username.toLowerCase() === credentials.username.toLowerCase());

      if (!lookup) {
        alert('Login failed: email or username not found.');
        return;
      }

      localStorage.setItem('currentUser', JSON.stringify(user));
      onLogin && onLogin(user);
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
