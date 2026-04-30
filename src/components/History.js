import React, { useState, useEffect } from 'react';
import './History.css';
import SidePanel from './SidePanel';
import { getHistory, updateHistoryItem, removeFromHistory } from '../data/storageService';
import { isAdmin } from '../utils/roleUtils';

const History = ({ user = {}, onClose, onNavigateToDashboard, onNavigateToAdd, onLogout, onNavigateToSearch, selectedItem }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState('upcoming');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [pastItems, setPastItems] = useState([]);

  useEffect(() => {
    processHistory();
  }, []);

  const processHistory = () => {
    const history = getHistory();
    const now = new Date();

    let upcoming = [];
    let past = [];

    history.forEach((item) => {
      const endDate = new Date(item.endDate);
      
      // Check if event has expired
      if (now > endDate) {
        // Move to past and mark as attended
        updateHistoryItem(item.id, { isAttended: true });
        past.push({ ...item, isAttended: true });
      } else {
        // Still upcoming
        upcoming.push(item);
      }
    });

    // Sort by date
    upcoming.sort((a, b) => new Date(a.endDate) - new Date(b.endDate));
    past.sort((a, b) => new Date(b.endDate) - new Date(a.endDate));

    setUpcomingItems(upcoming);
    setPastItems(past);
  };

  const displayItems = activeHistoryTab === 'past' ? pastItems : upcomingItems;

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return dateString;
    }
  };

  const handleMarkAttended = (itemId) => {
    updateHistoryItem(itemId, { isAttended: true });
    processHistory();
  };

  const handleRemoveFromHistory = (itemId) => {
    removeFromHistory(itemId);
    processHistory();
  };

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
            className={`history-tab-btn ${activeHistoryTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => setActiveHistoryTab('upcoming')}
          >
            UPCOMING ({upcomingItems.length})
          </button>
          <button
            className={`history-tab-btn ${activeHistoryTab === 'past' ? 'active' : ''}`}
            onClick={() => setActiveHistoryTab('past')}
          >
            PAST ({pastItems.length})
          </button>
        </div>

        {/* History Content */}
        <div className="history-content">
          {displayItems.length === 0 ? (
            <div className="history-empty">
              <p className="empty-msg">
                {activeHistoryTab === 'past' 
                  ? 'No past events yet.' 
                  : 'No upcoming events. Click on events/notices from the dashboard to add them to your history.'}
              </p>
            </div>
          ) : (
            <div className="history-list">
              {displayItems.map((item) => (
                <div key={item.id} className="history-item">
                  <div className="history-bullet"></div>
                  <div className="history-item-content">
                    <div className="history-item-header">
                      <h3 className="history-item-title">{item.title}</h3>
                      {item.isAttended && activeHistoryTab === 'past' && (
                        <span className="history-attended-badge">✓ Attended</span>
                      )}
                    </div>
                    {item.description && (
                      <p className="history-item-description">{item.description}</p>
                    )}
                    <p className="history-item-date">Ends: {formatDate(item.endDate)}</p>
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noopener noreferrer" className="history-item-link">
                        View Details →
                      </a>
                    )}
                  </div>
                  <div className="history-item-actions">
                    {activeHistoryTab === 'upcoming' && (
                      <button
                        className="history-action-btn mark-attended"
                        onClick={() => handleMarkAttended(item.id)}
                        title="Mark as attended"
                      >
                        ✓
                      </button>
                    )}
                    <button
                      className="history-action-btn remove"
                      onClick={() => handleRemoveFromHistory(item.id)}
                      title="Remove from history"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="bottom-nav">
          <button className="nav-icon" onClick={onNavigateToDashboard}>🏠</button>
          <button className="nav-icon" onClick={onNavigateToSearch}>🔍</button>
          <button className="nav-icon active">🕐</button>
          {isAdmin(user) ? (
            <button className="nav-icon" onClick={onNavigateToAdd}>➕</button>
          ) : (
            <button className="nav-icon disabled" title="Admin only" disabled>➕</button>
          )}
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
