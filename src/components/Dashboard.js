import React, { useState, useEffect } from 'react';
import './Dashboard.css';
import SidePanel from './SidePanel';
import ItemDetailModal from './ItemDetailModal';

const Dashboard = ({ onNavigateToHistory, onNavigateToAdd, onLogout, onNavigateToSearch, selectedItem }) => {
  const [activeTab, setActiveTab] = useState('home');
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [selectedNoticeEvent, setSelectedNoticeEvent] = useState(null);

  const [events, setEvents] = useState([
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
  ]);

  const [notices, setNotices] = useState([
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
  ]);

  const [academicsNotices, setAcademicsNotices] = useState([
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
  ]);

  // Check localStorage for newly added notice/event and add it to the appropriate list
  useEffect(() => {
    const newItem = localStorage.getItem('newNoticeEvent');
    if (newItem) {
      try {
        const parsedItem = JSON.parse(newItem);
        console.log('New item detected:', parsedItem);

        if (parsedItem.section === 'event') {
          // Add to events list
          setEvents(prev => [
            ...prev,
            {
              id: parsedItem.id,
              title: parsedItem.title || 'New Event',
              details: parsedItem.details || 'date and venue',
              label: 'new',
              photo: parsedItem.photo,
              hyperlink: parsedItem.hyperlink
            }
          ]);
        } else if (parsedItem.section === 'notice') {
          // Add to notices list
          const newNotice = {
            id: parsedItem.id,
            title: parsedItem.title || 'New Notice',
            type: 'new',
            category: 'new notices',
            photo: parsedItem.photo,
            hyperlink: parsedItem.hyperlink
          };
          setNotices(prev => [...prev, newNotice]);
          
          // Also add to academics notices with a color
          const colors = ['#90EE90', '#F0D872', '#FF9999', '#87CEEB', '#DDA0DD'];
          const color = colors[Math.floor(Math.random() * colors.length)];
          setAcademicsNotices(prev => [
            ...prev,
            {
              id: parsedItem.id,
              title: parsedItem.title || 'New Notice',
              color: color,
              photo: parsedItem.photo,
              hyperlink: parsedItem.hyperlink
            }
          ]);
        }

        // Clear the localStorage key after consuming it
        localStorage.removeItem('newNoticeEvent');
      } catch (error) {
        console.error('Error processing new notice/event:', error);
      }
    }
  }, []);

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
