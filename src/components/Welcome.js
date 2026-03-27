import React from 'react';
import './Welcome.css';

const Welcome = ({ user = {}, onContinue, onGotoHistory, onGotoAdd, onLogout }) => {
  return (
    <div className="welcome-container">
      <div className="welcome-card">
        <div className="welcome-header">
          <h1>Welcome, {user.name || 'Student'}!</h1>
          <p>You are ready to use the notices and events dashboard.</p>
        </div>

        <div className="welcome-actions">
          <button className="primary-btn" onClick={onContinue}>Go to Dashboard</button>
          <button className="secondary-btn" onClick={onGotoHistory}>View History</button>
          <button className="secondary-btn" onClick={onGotoAdd}>Add Notice / Event</button>
        </div>

        <div className="welcome-info">
          <div className="info-box">
            <h3>Daily updates</h3>
            <p>Receive latest notices and events tailored to your academic year.</p>
          </div>
          <div className="info-box">
            <h3>Fast search</h3>
            <p>Search for any notice or event in seconds with instant filtering.</p>
          </div>
          <div className="info-box">
            <h3>Track history</h3>
            <p>See upcoming and past notices/events in one place.</p>
          </div>
        </div>

        <button className="logout-btn" onClick={onLogout}>Log out</button>
      </div>
    </div>
  );
};

export default Welcome;
