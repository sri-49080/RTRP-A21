import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import SidePanel from './SidePanel';
import ItemDetailModal from './ItemDetailModal';
import { getItems, addToHistory, getAuthToken } from '../data/storageService';
import { isAdmin } from '../utils/roleUtils';

const Dashboard = ({ user = {}, onNavigateToHistory, onNavigateToAdd, onLogout, onNavigateToSearch, selectedItem }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNoticeEvent, setSelectedNoticeEvent] = useState(null);

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [academicsNotices, setAcademicsNotices] = useState([]);

  const isVisibleForYear = (item, year) => {
    if (!item) return false;
    if (item.year === 'All') return true;
    if (Array.isArray(item.year)) return item.year.includes(year);
    return item.year === year;
  };


  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const userYear = user.year || '1st Year';
        const token = getAuthToken();
        const data = await getItems(token, userYear);
        const fetchedEvents = data.filter(item => item.section === 'event');
        const fetchedNotices = data.filter(item => item.section === 'notice');
        setEvents(fetchedEvents);
        setNotices(fetchedNotices);
        setAcademicsNotices(fetchedNotices);
      } catch (error) {
        console.error('Error fetching notices:', error);
        setEvents([]);
        setNotices([]);
        setAcademicsNotices([]);
      }
    };
    fetchNotices();
    const interval = setInterval(fetchNotices, 10 * 1000);
    return () => clearInterval(interval);
  }, [user]);

  const handleItemClick = async (item) => {
    // Add to history when clicked
    const token = getAuthToken();
    await addToHistory(item, token);
    // Then show the detail modal
    setSelectedNoticeEvent(item);
  };
  // Server sets type based on remaining visibility: 'urgent'=red(<=2days), 'warning'=orange, 'new'=green
  const urgentNotices = notices.filter(n => n.type === 'urgent' || n.type === 'warning');
  const newNotices = notices.filter(n => n.type === 'new');
  const allNoticesForHome = notices; // show all on home tab

  const renderContent = () => {
    if (activeTab === 'academics') {
      return (
        <div className="academics-content">
          <div className="academics-notices">
            {notices.length === 0 && <p className="empty-msg">No notices available.</p>}
            {notices.map((notice) => (
              <div
                key={notice.id}
                className="academics-notice-card"
                style={{ backgroundColor: notice.color, cursor: 'pointer' }}
                onClick={() => handleItemClick(notice)}
              >
                {notice.photo && (
                  <img src={notice.photo} alt={notice.title} className="academics-notice-img" />
                )}
                <span className="academics-notice-title">{notice.title}</span>
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
            {events.length === 0 && <p className="empty-msg">No events available.</p>}
            {events.map((event) => (
              <div
                key={event.id}
                className="event-card-full"
                style={{ backgroundColor: event.color, cursor: 'pointer' }}
                onClick={() => handleItemClick(event)}
              >
                {event.photo && (
                  <img src={event.photo} alt={event.title} className="event-card-full-img" />
                )}
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
              <div
                key={event.id}
                className="event-card"
                onClick={() => handleItemClick(event)}
                style={{ backgroundColor: event.color, cursor: 'pointer' }}
              >
                {event.photo && (
                  <img src={event.photo} alt={event.title} className="event-card-img" />
                )}
                <span className="event-label">{event.label}</span>
                <h3 className="event-title">{event.title}</h3>
                <p className="event-details">{event.details}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Urgent / Warning Notices Section */}
        {urgentNotices.length > 0 && (
          <div className="notices-section">
            <h3 className="section-title">⚠ Notices about to reach deadline</h3>
            <div className="notices-list">
              {urgentNotices.map((notice) => (
                <div
                  key={notice.id}
                  className="notice-card urgent"
                  onClick={() => handleItemClick(notice)}
                  style={{ backgroundColor: notice.color, cursor: 'pointer' }}
                >
                  {notice.photo && (
                    <img src={notice.photo} alt={notice.title} className="notice-card-img" />
                  )}
                  <div className="notice-card-body">
                    <span className="notice-title">{notice.title}</span>
                    {notice.visibilityEndDate && (
                      <span className="notice-deadline">
                        Expires: {new Date(notice.visibilityEndDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New / Active Notices Section */}
        <div className="notices-section">
          <h3 className="section-title">new notices</h3>
          <div className="notices-list">
            {allNoticesForHome.length === 0 && <p className="empty-msg">No notices available.</p>}
            {allNoticesForHome.map((notice) => (
              <div
                key={notice.id}
                className={`notice-card ${notice.type === 'urgent' || notice.type === 'warning' ? 'urgent' : 'new'}`}
                onClick={() => handleItemClick(notice)}
                style={{ backgroundColor: notice.color, cursor: 'pointer' }}
              >
                {notice.photo && (
                  <img src={notice.photo} alt={notice.title} className="notice-card-img" />
                )}
                <div className="notice-card-body">
                  <span className="notice-title">{notice.title}</span>
                  {notice.visibilityDate && (
                    <span className="notice-deadline">
                      From: {new Date(notice.visibilityDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}
                      {notice.visibilityEndDate && ` → ${new Date(notice.visibilityEndDate).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })}`}
                    </span>
                  )}
                </div>
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
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="web-title">web title</h1>
          <button className="profile-icon" onClick={() => setIsPanelOpen(true)}>👤</button>
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
          <button className="nav-icon" onClick={onNavigateToSearch}>🔍</button>
          <button className="nav-icon" onClick={onNavigateToHistory}>🕐</button>
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
      {selectedNoticeEvent && (
        <ItemDetailModal
          item={selectedNoticeEvent}
          onClose={() => setSelectedNoticeEvent(null)}
        />
      )}
    </div>
  );
};

export default Dashboard;
