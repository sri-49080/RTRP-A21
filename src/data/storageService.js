const STORAGE_KEY_CURRENT_USER = 'currentUser';
const STORAGE_KEY_ITEMS = 'noticesEvents';

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

export {
  getCurrentUser,
  setCurrentUser,
  clearCurrentUser,
  getItems,
  addItem,
  saveItems,
  findUserByEmailOrUsername
};
