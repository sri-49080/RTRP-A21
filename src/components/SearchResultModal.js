import React from 'react';
import './SearchResultModal.css';

const SearchResultModal = ({ item, onClose }) => {
  if (!item) return null;

  const renderContent = () => {
    if (item.type === 'event') {
      return (
        <div className="srm-event">
          <div className="srm-label">EVENT</div>
          <h2 className="srm-title">{item.title}</h2>
          {item.details && <p className="srm-sub">{item.details}</p>}
        </div>
      );
    }

    if (item.type === 'notice') {
      return (
        <div className="srm-notice">
          <div className="srm-label">NOTICE</div>
          <h2 className="srm-title">{item.title}</h2>
          {item.category && <p className="srm-sub">{item.category}</p>}
        </div>
      );
    }

    // history or fallback
    return (
      <div className="srm-history">
        <div className="srm-label">ITEM</div>
        <h2 className="srm-title">{item.title}</h2>
        {item.date && <p className="srm-sub">{item.date}</p>}
      </div>
    );
  };

  return (
    <div className="srm-overlay" onClick={onClose}>
      <div className="srm-card" onClick={(e) => e.stopPropagation()}>
        <button className="srm-close" onClick={onClose}>✕</button>
        {renderContent()}
        <div className="srm-actions">
          <button className="srm-action">Open</button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultModal;
