import React, { useState, useEffect } from 'react';
import './SignUp.css';
import SidePanel from './SidePanel';
import { setCurrentUser, setAuthToken } from '../data/storageService';

const SignUp = ({ onSignUp, onLogout, onLoginClick }) => {
  const [form, setForm] = useState({ name: '', username: '', email: '', id: '', year: '1st Year' });
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [theme, setTheme] = useState('light');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    try {
      const t = localStorage.getItem('theme') || 'light';
      setTheme(t);
    } catch (e) {}
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // simple validation
    if (!form.name || !form.username || !form.email) {
      alert('Please fill Name, Username and Email');
      return;
    }

    try {
      // Call backend signup API
      const response = await fetch('http://localhost:5000/api/users/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: form.name,
          username: form.username,
          email: form.email,
          id: form.id,
          year: form.year,
          password: ''
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(`Sign up failed: ${errorData.error || 'Unknown error'}`);
        return;
      }

      const data = await response.json();
      
      // Store user and token
      setCurrentUser(data.user);
      setAuthToken(data.token);
      localStorage.setItem('currentUser', JSON.stringify(data.user));

      alert('Sign up successful!');
      if (onSignUp) onSignUp(data.user);
    } catch (err) {
      console.error('Error during sign up:', err);
      alert('Error: ' + err.message);
    }
  };

  return (
    <div className={`signup-container ${theme === 'dark' ? 'dark-theme' : 'light-theme'}`}>
      <div className="signup-card">
        <div className="signup-content">
          <div className="signup-header-row">
            <h2 className="subtitle">Create an account</h2>
            <button type="button" className="theme-toggle" onClick={toggleTheme}>{theme === 'light' ? '🌙' : '☀️'}</button>
          </div>

          <form onSubmit={handleSubmit} className="signup-form">
            <label className="field-label">
              <span className="label-text">Full Name</span>
              <input className="input-field" name="name" placeholder="Full Name" value={form.name} onChange={handleChange} />
            </label>

            <label className="field-label">
              <span className="label-text">Username</span>
              <input className="input-field" name="username" placeholder="Username" value={form.username} onChange={handleChange} />
            </label>

            <label className="field-label">
              <span className="label-text">Email</span>
              <input className="input-field" name="email" type="email" placeholder="Email" value={form.email} onChange={handleChange} />
            </label>

            <label className="field-label">
              <span className="label-text">ID / Roll</span>
              <input className="input-field" name="id" placeholder="ID / Roll" value={form.id} onChange={handleChange} />
            </label>

            <label className="field-label">
              <span className="label-text">Academic Year</span>
              <select className="input-field" name="year" value={form.year} onChange={handleChange}>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </label>

            <button type="submit" className="continue-btn">Sign Up</button>
          </form>+          <p className="alternate-text">Already have an account? <a href="#" onClick={(e)=>{e.preventDefault(); onLoginClick&&onLoginClick();}}>Log in</a></p>
          <p className="footer-text">
            By signing up you agree to our <a href="#terms">Terms</a> and <a href="#privacy">Privacy</a>.
          </p>
        </div>

        <div className="home-indicator"></div>
        <SidePanel
          open={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          user={form}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};

export default SignUp;
