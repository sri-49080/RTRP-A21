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

const getCurrentUser = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const setCurrentUser = (user) => {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
  } catch (e) {
    console.error('Failed to save user to localStorage', e);
  }
};

const clearCurrentUser = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
  } catch (e) {
    console.error('Failed to remove currentUser from localStorage', e);
  }
};

const getItems = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ITEMS);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to load items from localStorage', e);
  }
  return sampleItems;
};

const saveItems = (items) => {
  try {
    localStorage.setItem(STORAGE_KEY_ITEMS, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save items to localStorage', e);
  }
};

const addItem = (item) => {
  const current = getItems();
  const next = [...current, item];
  saveItems(next);
  return next;
};

const findUserByEmailOrUsername = (value) => {
  const user = getCurrentUser();
  if (!user) return null;
  if (user.email.toLowerCase() === value.toLowerCase() || user.username.toLowerCase() === value.toLowerCase()) {
    return user;
  }
  return null;
};

// JWT Token Management
const getAuthToken = () => {
  try {
    return localStorage.getItem(STORAGE_KEY_AUTH_TOKEN);
  } catch (e) {
    console.error('Failed to get auth token', e);
    return null;
  }
};

const setAuthToken = (token) => {
  try {
    localStorage.setItem(STORAGE_KEY_AUTH_TOKEN, token);
  } catch (e) {
    console.error('Failed to save auth token', e);
  }
};

const clearAuthToken = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_AUTH_TOKEN);
  } catch (e) {
    console.error('Failed to remove auth token', e);
  }
};

const isAuthenticated = () => {
  return !!getAuthToken() && !!getCurrentUser();
};

// History Management
const getHistory = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to load history from localStorage', e);
    return [];
  }
};

const saveHistory = (history) => {
  try {
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history to localStorage', e);
  }
};

const addToHistory = (item) => {
  const history = getHistory();
  
  // Prevent duplicates - check if item already exists by id
  const exists = history.some(h => h.id === item.id);
  if (exists) {
    return history; // Don't add if already exists
  }
  
  // Create history entry with required fields
  const historyEntry = {
    id: item.id,
    title: item.title,
    description: item.details || item.description || '',
    link: item.hyperlink || item.link || '',
    startDate: item.visibilityDate || new Date().toISOString(),
    endDate: item.visibilityEndDate || new Date().toISOString(),
    isAttended: false,
    clickedDate: new Date().toISOString(),
    section: item.section || 'notice',
    photo: item.photo || ''
  };
  
  const updatedHistory = [historyEntry, ...history]; // Add to beginning
  saveHistory(updatedHistory);
  return updatedHistory;
};

const updateHistoryItem = (itemId, updates) => {
  const history = getHistory();
  const updated = history.map(item => 
    item.id === itemId ? { ...item, ...updates } : item
  );
  saveHistory(updated);
  return updated;
};

const removeFromHistory = (itemId) => {
  const history = getHistory();
  const filtered = history.filter(item => item.id !== itemId);
  saveHistory(filtered);
  return filtered;
};

const clearHistory = () => {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
  } catch (e) {
    console.error('Failed to clear history', e);
  }
};

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
  saveItems,
  findUserByEmailOrUsername,
  getHistory,
  addToHistory,
  updateHistoryItem,
  removeFromHistory,
  clearHistory
};
