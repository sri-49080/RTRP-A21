import React, { useState } from 'react';
import './SearchResultModal.css';

const SearchResultModal = ({ item, onClose }) => {
  const [showDetail, setShowDetail] = useState(false);

  if (!item) return null;

  const renderSummary = () => {
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

  const renderDetailView = () => {
    return (
      <div className="srm-overlay" onClick={onClose}>
        <div className="srm-detail-card" onClick={(e) => e.stopPropagation()}>
          <button className="srm-detail-close" onClick={onClose}>✕</button>
          
          {item.photo ? (
            <img src={item.photo} alt={item.title} className="srm-detail-photo" />
          ) : (
            <div className="srm-detail-photo-placeholder">No photo</div>
          )}
          
          <div className="srm-detail-content">
            <h2 className="srm-detail-title">{item.title}</h2>
            {item.details && <p className="srm-detail-details">{item.details}</p>}
            {item.category && <p className="srm-detail-category">{item.category}</p>}
            {item.hyperlink && (
              <a href={item.hyperlink} target="_blank" rel="noopener noreferrer" className="srm-detail-link">
                View Link
              </a>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (showDetail) {
    return renderDetailView();
  }

  return (
    <div className="srm-overlay" onClick={onClose}>
      <div className="srm-card" onClick={(e) => e.stopPropagation()}>
        <button className="srm-close" onClick={onClose}>✕</button>
        {renderSummary()}
        <div className="srm-actions">
          <button className="srm-action" onClick={() => setShowDetail(true)}>Open</button>
        </div>
      </div>
    </div>
  );
};

export default SearchResultModal;
