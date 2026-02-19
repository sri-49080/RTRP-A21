import React, { useState } from 'react';
import './Search.css';

const sampleEvents = [
  { id: 1, title: 'EVENT 1', details: 'date and venue', page: 'dashboard', type: 'event' },
  { id: 2, title: 'EVENT 2', details: 'date and venue', page: 'dashboard', type: 'event' },
  { id: 3, title: 'EVENT 3', details: 'date and venue', page: 'dashboard', type: 'event' },
  { id: 4, title: 'EVENT 4', details: 'date and venue', page: 'dashboard', type: 'event' },
  { id: 5, title: 'EVENT 5', details: 'date and venue', page: 'dashboard', type: 'event' },
  { id: 6, title: 'EVENT 6', details: 'date and venue', page: 'dashboard', type: 'event' }
];

const sampleNotices = [
  { id: 1, title: 'NOTICE 1', page: 'dashboard', type: 'notice' },
  { id: 2, title: 'NOTICE 2', page: 'dashboard', type: 'notice' },
  { id: 3, title: 'NOTICE 3', page: 'dashboard', type: 'notice' },
  { id: 4, title: 'NOTICE 4', page: 'dashboard', type: 'notice' }
];

const historyItems = [
  { id: 1, title: 'VIVITSU 2026', page: 'history', type: 'history' },
  { id: 2, title: 'NOTICE 1', page: 'history', type: 'history' },
  { id: 3, title: 'HACKATHON', page: 'history', type: 'history' },
  { id: 4, title: 'EVENT 2', page: 'history', type: 'history' },
  { id: 5, title: 'BIOLOGY', page: 'history', type: 'history' }
];

const allItems = [...sampleEvents, ...sampleNotices, ...historyItems];

const Search = ({ onSelect, onBack }) => {
  const [query, setQuery] = useState('');

  const results = query.trim()
    ? allItems.filter(i => i.title.toLowerCase().includes(query.toLowerCase()))
    : [];

  return (
    <div className="search-container">
      <div className="search-header">
        <button className="back-btn" onClick={onBack}>⟵</button>
        <div className="search-input-wrapper">
          <input
            autoFocus
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="search-input"
          />
          {query && <button className="clear-btn" onClick={() => setQuery('')}>✕</button>}
        </div>
      </div>

      <div className="search-results">
        {results.length === 0 && query && (
          <div className="no-results">No results</div>
        )}
        {results.map((r) => (
          <button
            key={`${r.type}-${r.id}`}
            className="search-result"
            onClick={() => onSelect(r)}
          >
            <div className="result-title">{r.title}</div>
            <div className="result-sub">{r.page} • {r.type}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Search;
