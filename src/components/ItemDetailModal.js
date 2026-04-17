import React from 'react';
import './ItemDetailModal.css';

const ItemDetailModal = ({ item, onClose }) => {
  if (!item) return null;

  return (
    <div className="idm-overlay" onClick={onClose}>
      <div className="idm-card" onClick={(e) => e.stopPropagation()}>
        <button className="idm-close" onClick={onClose}>✕</button>
        
        {item.photo ? (
          <img src={item.photo} alt={item.title} className="idm-photo" />
        ) : (
          <div className="idm-photo-placeholder">No photo</div>
        )}
        
        <div className="idm-content">
          <h2 className="idm-title">{item.title}</h2>
          {item.details && <p className="idm-details">{item.details}</p>}
          {item.category && <p className="idm-category">{item.category}</p>}
          {item.visibilityDate && (
            <p className="idm-visibility-date">
              Visible since: {new Date(item.visibilityDate).toLocaleDateString()}
            </p>
          )}
          {item.hyperlink && (
            <a href={item.hyperlink} target="_blank" rel="noopener noreferrer" className="idm-link">
              View Link
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ItemDetailModal;
