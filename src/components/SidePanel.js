import React from 'react';
import './SidePanel.css';

const SidePanel = ({ open, onClose, user = {}, onLogout }) => {
  return (
    <div className={`sidepanel-overlay ${open ? 'open' : ''}`} onClick={onClose}>
      <div className={`sidepanel ${open ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="sidepanel-header">
          <button className="sidepanel-back" onClick={onClose}>←</button>
          <h3 className="sidepanel-title">Profile</h3>
        </div>

        <div className="sidepanel-body">
          <div className="profile-row"><strong>Name:</strong> <span>{user.name || 'User Name'}</span></div>
          <div className="profile-row"><strong>Username:</strong> <span>{user.username || 'username'}</span></div>
          <div className="profile-row"><strong>Email:</strong> <span>{user.email || 'email@example.com'}</span></div>
          <div className="profile-row"><strong>ID / Roll:</strong> <span>{user.id || '12345'}</span></div>
          <div className="profile-row"><strong>Academic Year:</strong> <span>{user.year || '3rd Year'}</span></div>
        </div>

        <div className="sidepanel-footer">
          <button className="logout-btn" onClick={onLogout}>Logout</button>
        </div>
      </div>
    </div>
  );
};

export default SidePanel;
