import React, { useState } from 'react';
import './SignUp.css';

const SignUp = ({ onSignUp }) => {
  const [email, setEmail] = useState('');

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleContinue = (e) => {
    e.preventDefault();
    if (email) {
      console.log('Email submitted:', email);
      // Handle email submission here
      if (onSignUp) {
        onSignUp();
      }
    }
  };

  const handleGoogleSignUp = () => {
    console.log('Google sign-up clicked');
    // Handle Google OAuth here
  };

  const handleAppleSignUp = () => {
    console.log('Apple sign-up clicked');
    // Handle Apple OAuth here
  };

  return (
    <div className="signup-container">
      <div className="signup-card">
        {/* Main Content */}
        <div className="signup-content">
          <h1 className="title">TITLE</h1>

          <h2 className="subtitle">Create an account</h2>

          <p className="description">Enter your email to sign up for this app</p>

          {/* Email Form */}
          <form onSubmit={handleContinue}>
            <input
              type="email"
              className="email-input"
              placeholder="email@domain.com"
              value={email}
              onChange={handleEmailChange}
            />

            <button type="submit" className="continue-btn">
              Continue
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>or</span>
          </div>

          {/* OAuth Buttons */}
          <button className="oauth-btn google-btn" onClick={handleGoogleSignUp}>
            <span className="google-icon">🔍</span>
            <span>Continue with Google</span>
          </button>

          <button className="oauth-btn apple-btn" onClick={handleAppleSignUp}>
            <span className="apple-icon">🍎</span>
            <span>Continue with Apple</span>
          </button>

          {/* Footer */}
          <p className="footer-text">
            By clicking continue, you agree to our{' '}
            <a href="#terms">Terms of Service</a> and{' '}
            <a href="#privacy">Privacy Policy</a>
          </p>
        </div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
      </div>
    </div>
  );
};

export default SignUp;
