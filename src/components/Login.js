import React, { useState, useEffect } from 'react';
import './SignUp.css';

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
      const response = await fetch('http://localhost:5000/api/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: credentials.email || undefined,
          username: credentials.username || undefined
        })
      });

      if (response.ok) {
        const user = await response.json();
        console.log('Login successful:', user);

        // Save to localStorage for offline support
        try {
          localStorage.setItem('currentUser', JSON.stringify({
            id: user.id,
            name: user.name,
            username: user.username,
            email: user.email,
            year: user.year
          }));
        } catch (err) {
          console.error('Failed to save to localStorage:', err);
        }

        onLogin && onLogin({
          id: user.id,
          name: user.name,
          username: user.username,
          email: user.email,
          year: user.year
        });
      } else {
        const error = await response.json();
        alert('Login failed: ' + (error.error || 'Unknown error'));
      }
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
