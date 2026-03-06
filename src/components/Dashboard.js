import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import SidePanel from './SidePanel';
import ItemDetailModal from './ItemDetailModal';

const Dashboard = ({ onNavigateToHistory, onNavigateToAdd, onLogout, onNavigateToSearch, selectedItem }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNoticeEvent, setSelectedNoticeEvent] = useState(null);

  const [events, setEvents] = useState([]);
  const [notices, setNotices] = useState([]);
  const [academicsNotices, setAcademicsNotices] = useState([]);

  useEffect(() => {
    const fetchNotices = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/notices');
        if (response.ok) {
          const data = await response.json();

          // Separate into events and notices
          const fetchedEvents = data.filter(item => item.section === 'event');
          const fetchedNotices = data.filter(item => item.section === 'notice');

          setEvents(fetchedEvents);
          setNotices(fetchedNotices);
          setAcademicsNotices(fetchedNotices);
        } else {
          console.error('Failed to fetch notices');
        }
      } catch (error) {
        console.error('Error fetching notices:', error);
      }
    };

    fetchNotices();
  }, []);

  const urgentNotices = notices.filter(n => n.type === 'urgent');
  const newNotices = notices.filter(n => n.type === 'new');

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
                onClick={() => setSelectedNoticeEvent(notice)}
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
                style={{ cursor: 'pointer' }}
                onClick={() => setSelectedNoticeEvent(event)}
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
                onClick={() => setSelectedNoticeEvent(event)}
                style={{ cursor: 'pointer' }}
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

        {/* Urgent Notices Section */}
        <div className="notices-section">
          <h3 className="section-title">Notices about to reach deadline</h3>
          <div className="notices-list">
            {urgentNotices.map((notice) => (
              <div
                key={notice.id}
                className="notice-card urgent"
                onClick={() => setSelectedNoticeEvent(notice)}
                style={{ cursor: 'pointer' }}
              >
                {notice.photo && (
                  <img src={notice.photo} alt={notice.title} className="notice-card-img" />
                )}
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
              <div
                key={notice.id}
                className="notice-card new"
                onClick={() => setSelectedNoticeEvent(notice)}
                style={{ cursor: 'pointer' }}
              >
                {notice.photo && (
                  <img src={notice.photo} alt={notice.title} className="notice-card-img" />
                )}
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
          <button className="nav-icon" onClick={onNavigateToAdd}>➕</button>
        </div>

        {/* Home Indicator */}
        <div className="home-indicator"></div>
        <SidePanel
          open={isPanelOpen}
          onClose={() => setIsPanelOpen(false)}
          user={{ name: 'John Doe', username: 'jdoe', email: 'jdoe@example.com', id: '12345', year: '3rd Year' }}
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
