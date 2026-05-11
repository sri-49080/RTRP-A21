import React, { useState, useEffect, useCallback } from 'react';
import './History.css';
import SidePanel from './SidePanel';
import { getHistory, updateHistoryItem, removeFromHistory, getAuthToken } from '../data/storageService';
import { isAdmin } from '../utils/roleUtils';

const API_BASE = 'http://localhost:5000';

const History = ({ user = {}, onClose, onNavigateToDashboard, onNavigateToAdd, onLogout, onNavigateToSearch }) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState('active');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [upcomingItems, setUpcomingItems] = useState([]);
  const [activeItems, setActiveItems] = useState([]);
  const [pastItems, setPastItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // FIX: Fetch from /api/notices/history-feed for Upcoming/Active/Past segregation
  const loadFeed = useCallback(async () => {
    try {
      const token = getAuthToken();
      const headers = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const userYear = user.year || '1st Year';
      const res = await fetch(`${API_BASE}/api/notices/history-feed?year=${encodeURIComponent(userYear)}`, { headers });
      if (res.ok) {
        const { upcoming, active, past } = await res.json();
        setUpcomingItems(upcoming || []);
        setActiveItems(active || []);
        setPastItems(past || []);
        console.log('[History] Feed loaded — upcoming:', upcoming?.length, 'active:', active?.length, 'past:', past?.length);
      }
    } catch (err) {
      console.error('[History] Failed to load feed:', err.message);
    } finally {
      setLoading(false);
    }
  }, [user.year]);

  // Also load clicked-items from the user's personal history
  const [personalHistory, setPersonalHistory] = useState([]);
  const loadPersonalHistory = useCallback(async () => {
    const token = getAuthToken();
    const history = await getHistory(token);
    setPersonalHistory(history || []);
  }, []);

  useEffect(() => {
    loadFeed();
    loadPersonalHistory();
    const interval = setInterval(() => { loadFeed(); loadPersonalHistory(); }, 30000);
    return () => clearInterval(interval);
  }, [loadFeed, loadPersonalHistory]);

  const formatDate = (dateString) => {
    if (!dateString) return '—';
    try {
      return new Date(dateString).toLocaleString('en-IN', {
        dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Kolkata'
      });
    } catch { return dateString; }
  };

  const handleMarkAttended = async (itemId) => {
    const token = getAuthToken();
    await updateHistoryItem(itemId, { isAttended: true }, token);
    await loadPersonalHistory();
  };

  const handleRemoveFromHistory = async (itemId) => {
    const token = getAuthToken();
    await removeFromHistory(itemId, token);
    await loadPersonalHistory();
  };

  const tabs = [
    { key: 'upcoming', label: 'UPCOMING', count: upcomingItems.length },
    { key: 'active',   label: 'ACTIVE',   count: activeItems.length },
    { key: 'past',     label: 'PAST',     count: pastItems.length },
  ];

  const displayItems = {
    upcoming: upcomingItems,
    active:   activeItems,
    past:     pastItems,
  }[activeHistoryTab] || [];

  const emptyMessages = {
    upcoming: 'No upcoming notices or events.',
    active:   'No active notices or events right now.',
    past:     'No past notices or events yet.',
  };

  const renderItem = (item) => (
    <div key={item.id || item._id} className="history-item">
      <div className="history-bullet" style={{
        backgroundColor: item.status === 'past' ? '#999' : item.status === 'upcoming' ? '#1a73e8' : '#34a853'
      }} />
      <div className="history-item-content">
        <div className="history-item-header">
          <h3 className="history-item-title">{item.title}</h3>
          <span className={`history-status-badge status-${item.status || 'active'}`}>
            {item.status || 'active'}
          </span>
        </div>
        {item.details && <p className="history-item-description">{item.details}</p>}
        <p className="history-item-date">
          {item.visibilityDate ? `From: ${formatDate(item.visibilityDate)}` : ''}
          {item.visibilityDate && item.visibilityEndDate ? ' · ' : ''}
          {item.visibilityEndDate ? `Until: ${formatDate(item.visibilityEndDate)}` : ''}
        </p>
        {item.years && item.years.length > 0 && (
          <p className="history-item-years">For: {item.years.join(', ')}</p>
        )}
        {item.hyperlink && (
          <a href={item.hyperlink} target="_blank" rel="noopener noreferrer" className="history-item-link">
            View Details →
          </a>
        )}
      </div>
      {/* Personal history actions only for items the user has clicked */}
      {personalHistory.some(h => h.id === (item.id || item._id)?.toString()) && (
        <div className="history-item-actions">
          {activeHistoryTab !== 'past' && (
            <button
              className="history-action-btn mark-attended"
              onClick={() => handleMarkAttended((item.id || item._id).toString())}
              title="Mark as attended"
            >✓</button>
          )}
          <button
            className="history-action-btn remove"
            onClick={() => handleRemoveFromHistory((item.id || item._id).toString())}
            title="Remove from history"
          >✕</button>
        </div>
      )}
    </div>
  );

  return (
    <div className="history-container">
      <div className="history-card">
        {/* Header */}
        <div className="history-header">
          <h1 className="history-title">History</h1>
          <button className="profile-icon" onClick={() => setIsPanelOpen(true)}>👤</button>
        </div>

        {/* Tabs — Upcoming / Active / Past */}
        <div className="history-tabs">
          {tabs.map(t => (
            <button
              key={t.key}
              className={`history-tab-btn ${activeHistoryTab === t.key ? 'active' : ''}`}
              onClick={() => setActiveHistoryTab(t.key)}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="history-content">
          {loading ? (
            <div className="history-empty"><p className="empty-msg">Loading…</p></div>
          ) : displayItems.length === 0 ? (
            <div className="history-empty">
              <p className="empty-msg">{emptyMessages[activeHistoryTab]}</p>
            </div>
          ) : (
            <div className="history-list">
              {displayItems.map(renderItem)}
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

        <div className="home-indicator"></div>
        <SidePanel open={isPanelOpen} onClose={() => setIsPanelOpen(false)} user={user} onLogout={onLogout} />
      </div>
    </div>
  );
};

export default History;
