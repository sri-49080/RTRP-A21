import React, { useState } from 'react';
import './Dashboard.css';

const Dashboard = ({ onNavigateToHistory, onNavigateToAdd }) => {
  const [activeTab, setActiveTab] = useState('home');

  const events = [
    {
      id: 1,
      title: 'EVENT 1',
      details: 'date and venue',
      label: 'new'
    },
    {
      id: 2,
      title: 'EVENT 2',
      details: 'date and venue',
      label: 'new'
    },
    {
      id: 3,
      title: 'EVENT 3',
      details: 'date and venue',
      label: 'new'
    },
    {
      id: 4,
      title: 'EVENT 4',
      details: 'date and venue',
      label: 'new'
    },
    {
      id: 5,
      title: 'EVENT 5',
      details: 'date and venue',
      label: 'new'
    },
    {
      id: 6,
      title: 'EVENT 6',
      details: 'date and venue',
      label: 'new'
    }
  ];

  const academicsNotices = [
    {
      id: 1,
      title: 'NOTICE 1',
      color: '#90EE90',
      hasIcon: true
    },
    {
      id: 2,
      title: 'NOTICE 2',
      color: '#F0D872'
    },
    {
      id: 3,
      title: 'NOTICE 3',
      color: '#FF9999'
    }
  ];

  const notices = [
    {
      id: 1,
      title: 'NOTICE 1',
      type: 'urgent',
      category: 'Notices about to reach deadline'
    },
    {
      id: 2,
      title: 'NOTICE 2',
      type: 'urgent',
      category: 'Notices about to reach deadline'
    },
    {
      id: 3,
      title: 'NOTICE 3',
      type: 'urgent',
      category: 'Notices about to reach deadline'
    },
    {
      id: 4,
      title: 'NOTICE 4',
      type: 'new',
      category: 'new notices'
    }
  ];

  const urgentNotices = notices.filter(n => n.type === 'urgent');
  const newNotices = notices.filter(n => n.type === 'new');

  const renderContent = () => {
    if (activeTab === 'academics') {
      return (
        <div className="academics-content">
          <div className="academics-notices">
            {academicsNotices.map((notice) => (
              <div
                key={notice.id}
                className="academics-notice-card"
                style={{ backgroundColor: notice.color }}
              >
                <span className="academics-notice-title">{notice.title}</span>
                {notice.hasIcon && <span className="notice-icon">⋯</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (activeTab === 'events') {
      return (
        <div className="events-content">
          <div className="events-grid-full">
            {events.map((event) => (
              <div key={event.id} className="event-card-full">
                <span className="event-title-full">{event.title}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // Home tab
    return (
      <div className="home-content">
        {/* Events Section */}
        <div className="events-section">
          <div className="events-grid">
            {events.map((event) => (
              <div key={event.id} className="event-card">
                <span className="event-label">{event.label}</span>
                <h3 className="event-title">{event.title}</h3>
                <p className="event-details">{event.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent Notices Section */}
        <div className="notices-section">
          <h3 className="section-title">Notices about to reach deadline</h3>
          <div className="notices-list">
            {urgentNotices.map((notice) => (
              <div key={notice.id} className="notice-card urgent">
                <span className="notice-title">{notice.title}</span>
              </div>
            ))}
          </div>
        </div>

        {/* New Notices Section */}
        <div className="notices-section">
          <h3 className="section-title">new notices</h3>
          <div className="notices-list">
            {newNotices.map((notice) => (
              <div key={notice.id} className="notice-card new">
                <span className="notice-title">{notice.title}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-card">
        {/* Status Bar */}
        <div className="status-bar">
          <span className="time">9:41</span>
          <div className="status-icons">
            <span>📶</span>
            <span>📡</span>
            <span>🔋</span>
          </div>
        </div>

        {/* Header */}
        <div className="dashboard-header">
          <h1 className="web-title">web title</h1>
          <div className="profile-icon">👤</div>
        </div>

        {/* Navigation Tabs */}
        <div className="nav-tabs">
          <button
            className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
            onClick={() => setActiveTab('home')}
          >
            Home
          </button>
          <button
            className={`tab-btn ${activeTab === 'academics' ? 'active' : ''}`}
            onClick={() => setActiveTab('academics')}
          >
            Academics
          </button>
          <button
            className={`tab-btn ${activeTab === 'events' ? 'active' : ''}`}
            onClick={() => setActiveTab('events')}
          >
            Events/Tests
          </button>
        </div>

        {/* Main Content */}
        <div className="dashboard-content">
          {renderContent()}
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <button className="nav-icon active">🏠</button>
          <button className="nav-icon">🔍</button>
          <button className="nav-icon" onClick={onNavigateToHistory}>🕐</button>
          <button className="nav-icon" onClick={onNavigateToAdd}>➕</button>
        </div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
      </div>
    </div>
  );
};

export default Dashboard;
