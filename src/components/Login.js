import React, { useState, useEffect } from 'react';
import './SignUp.css';

const Login = ({ onLogin, onSwitchToSignUp }) => {
  const [credentials, setCredentials] = useState({ email: '', username: '' });
  const [storedUser, setStoredUser] = useState(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) setStoredUser(JSON.parse(raw));
    } catch (e) {
      console.error('read stored user', e);
    }
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!storedUser) {
      alert('No account found, please sign up.');
      return;
    }
    const match =
      (credentials.email && credentials.email === storedUser.email) ||
      (credentials.username && credentials.username === storedUser.username);
    if (match) {
      onLogin && onLogin(storedUser);
    } else {
      alert('Credentials do not match our records.');
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
              />
            </label>
            <button type="submit" className="continue-btn">
              Log In
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
