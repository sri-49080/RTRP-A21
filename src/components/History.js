import React, { useState } from 'react';
import './History.css';
import SidePanel from './SidePanel';

const History = ({ user = {}, onClose, onNavigateToDashboard, onNavigateToAdd, onLogout, onNavigateToSearch, selectedItem }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState('past');
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const pastItems = [
    {
      id: 1,
      title: 'VIVITSU 2026',
      date: 'date:23-01-2028'
    },
    {
      id: 2,
      title: 'NOTICE 1',
      date: 'date:12-12-2025'
    },
    {
      id: 3,
      title: 'HACKATHON',
      date: 'date:01-12-2025'
    },
    {
      id: 4,
      title: 'EVENT 2',
      date: 'date:11-11-2025'
    },
    {
      id: 5,
      title: 'BIOLOGY',
      date: 'date:02-11-2025'
    }
  ];

  const upcomingItems = [
    {
      id: 1,
      title: 'VIVITSU 2026',
      date: 'date:23-01-2028'
    },
    {
      id: 2,
      title: 'NOTICE 1',
      date: 'date:12-12-2025'
    },
    {
      id: 3,
      title: 'HACKATHON',
      date: 'date:01-12-2025'
    },
    {
      id: 4,
      title: 'EVENT 2',
      date: 'date:11-11-2025'
    },
    {
      id: 5,
      title: 'BIOLOGY',
      date: 'date:02-11-2025'
    }
  ];

  const displayItems = activeHistoryTab === 'past' ? pastItems : upcomingItems;

  return (
    <div className="history-container">
      <div className="history-card">
        {/* Header */}
        <div className="history-header">
          <h1 className="history-title">History</h1>
          <button className="profile-icon" onClick={() => setIsPanelOpen(true)}>👤</button>
        </div>

        

        {/* History Tabs */}
        <div className="history-tabs">
          <button
            className={`history-tab-btn ${activeHistoryTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveHistoryTab('past')}
          >
            PAST
          </button>
          <button
            className={`history-tab-btn ${activeHistoryTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveHistoryTab('upcoming')}
          >
            UPCOMING
          </button>
        </div>

        {/* History Content */}
        <div className="history-content">
          <div className="history-list">
            {displayItems.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-bullet"></div>
                <div className="history-item-content">
                  <h3 className="history-item-title">{item.title}</h3>
                  <p className="history-item-date">{item.date}</p>
                </div>
              </div>
            ))}
          </div>

          <button className="more-btn">MORE</button>
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <button className="nav-icon" onClick={onNavigateToDashboard}>🏠</button>
          <button className="nav-icon" onClick={onNavigateToSearch}>🔍</button>
          <button className="nav-icon active">🕐</button>
          <button className="nav-icon" onClick={onNavigateToAdd}>➕</button>
        </div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
        <SidePanel
          open={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          user={user}
          onLogout={onLogout}
        />
      </div>
    </div>
  );
};

export default History;
