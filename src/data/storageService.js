const STORAGE_KEY_CURRENT_USER = 'currentUser';
const STORAGE_KEY_AUTH_TOKEN = 'authToken';
const STORAGE_KEY_ITEMS = 'noticesEvents';
const STORAGE_KEY_HISTORY = 'historyItems';

const sampleItems = [
  {
    id: 'item-1',
    section: 'notice',
    type: 'urgent',
    title: 'Semester 2 Course Registration',
    details: 'Register before 15 April to avoid penalty.',
    photo: 'https://via.placeholder.com/280x150?text=Notice+1',
    year: '1st Year',
    visibilityDate: '2026-04-12'
  },
  {
    id: 'item-2',
    section: 'event',
    type: 'new',
    title: 'Spring Hackathon',
    details: 'Compete with peers on April 30.',
    photo: 'https://via.placeholder.com/280x150?text=Event+1',
    year: '3rd Year',
    visibilityDate: '2026-04-29'
  },
  {
    id: 'item-3',
    section: 'notice',
    type: 'new',
    title: 'Scholarship Application Open',
    details: 'Apply before May 5 for 50% fee waiver.',
    photo: 'https://via.placeholder.com/280x150?text=Notice+2',
    year: '2nd Year',
    visibilityDate: '2026-05-04'
  }
];


// User session management (in-memory for frontend)
let currentUser = null;
let authToken = null;

const getCurrentUser = () => currentUser;
const setCurrentUser = (user) => { currentUser = user; };
const clearCurrentUser = () => { currentUser = null; };


// Items (notices/events) API
const getItems = async (token, year) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    let url = 'http://localhost:5000/api/notices';
    if (year) url += `?year=${encodeURIComponent(year)}`;
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error('Failed to fetch items');
    return await response.json();
  } catch (e) {
    console.error('Failed to fetch items from API', e);
    return [];
  }
};

// addItem is intentionally a no-op here — the real POST is performed
// directly in AddNoticeEvent.handleSubmit. Keeping this stub so existing
// call-sites don't break.
const addItem = (item) => item;

const findUserByEmailOrUsername = (value) => {
  const user = getCurrentUser();
  if (!user) return null;
  if (user.email.toLowerCase() === value.toLowerCase() || user.username.toLowerCase() === value.toLowerCase()) {
    return user;
  }
  return null;
};


// JWT Token Management (in-memory)
const getAuthToken = () => authToken;
const setAuthToken = (token) => { authToken = token; };
const clearAuthToken = () => { authToken = null; };
const isAuthenticated = () => !!authToken && !!currentUser;


// History Management (API)
const getHistory = async (token) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch('http://localhost:5000/api/history', { headers });
    if (!response.ok) throw new Error('Failed to fetch history');
    return await response.json();
  } catch (e) {
    console.error('Failed to fetch history from API', e);
    return [];
  }
};

const addToHistory = async (item, token) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch('http://localhost:5000/api/history', {
      method: 'POST',
      headers,
      body: JSON.stringify(item)
    });
    if (!response.ok) throw new Error('Failed to add to history');
    return await response.json();
  } catch (e) {
    console.error('Failed to add to history', e);
    return null;
  }
};

const updateHistoryItem = async (itemId, updates, token) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`http://localhost:5000/api/history/${itemId}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(updates)
    });
    if (!response.ok) throw new Error('Failed to update history item');
    return await response.json();
  } catch (e) {
    console.error('Failed to update history item', e);
    return null;
  }
};

const removeFromHistory = async (itemId, token) => {
  try {
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const response = await fetch(`http://localhost:5000/api/history/${itemId}`, {
      method: 'DELETE',
      headers
    });
    if (!response.ok) throw new Error('Failed to remove from history');
    return await response.json();
  } catch (e) {
    console.error('Failed to remove from history', e);
    return null;
  }
};

const clearHistory = () => {};

export {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getAuthToken,
  setAuthToken,
  clearAuthToken,
  isAuthenticated,
  getItems,
  addItem,
  findUserByEmailOrUsername,
  getHistory,
  addToHistory,
  updateHistoryItem,
  removeFromHistory,
  clearHistory
};
