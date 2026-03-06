import React, { useState, useEffect } from 'react';
import './Search.css';
import ItemDetailModal from './ItemDetailModal';

const Search = ({ onBack }) => {
  const [query, setQuery] = useState('');
  const [allItems, setAllItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);

  // Fetch all active notices/events from backend on mount
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/notices');
        if (res.ok) {
          const data = await res.json();
          setAllItems(data);
        }
      } catch (err) {
        console.error('Failed to fetch notices for search:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const results = query.trim()
    ? allItems.filter(item =>
      item.title && item.title.toLowerCase().includes(query.toLowerCase())
    )
    : [];

  return (
    <div className="search-container">
      {/* Header */}
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>⟵</button>
        <div className="search-input-wrapper">
          <span className="search-icon">🔍</span>
          <input
            autoFocus
            placeholder="Search notices or events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          {query && (
            <button className="clear-btn" onClick={() => setQuery('')}>✕</button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="search-loading">Loading...</div>
      )}

      {/* Results */}
      <div className="search-results">
        {!loading && query && results.length === 0 && (
          <div className="no-results">No results found for "<strong>{query}</strong>"</div>
        )}

        {results.map((item) => (
          <button
            key={item.id}
            className="search-result"
            onClick={() => setSelectedItem(item)}
          >
            {item.photo && (
              <img src={item.photo} alt={item.title} className="result-thumb" />
            )}
            <div className="result-info">
              <div className="result-title">{item.title}</div>
              <div className="result-sub">
                <span className={`result-badge ${item.section}`}>
                  {item.section === 'event' ? '📅 Event' : '📋 Notice'}
                </span>
              </div>
            </div>
          </button>
        ))}

        {/* Hint when no query */}
        {!loading && !query && (
          <div className="search-hint">
            <div className="search-hint-icon">🔍</div>
            <p>Type to search for notices or events by name</p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
};

export default Search;
