import React, { useState, useEffect } from 'react';
import './SignUp.css';
import SidePanel from './SidePanel';

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

  const handleSubmit = (e) => {
    e.preventDefault();
    // simple validation
    if (!form.name || !form.username || !form.email) {
      alert('Please fill Name, Username and Email');
      return;
    }

    const user = {
      name: form.name,
      username: form.username,
      email: form.email,
      id: form.id || '',
      year: form.year
    };

    try {
      localStorage.setItem('currentUser', JSON.stringify(user));
    } catch (err) {
      console.error('Failed to save user:', err);
    }

    if (onSignUp) onSignUp(user);
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
