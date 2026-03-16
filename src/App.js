import React, { useState, useEffect } from 'react';
import SignUp from './components/SignUp';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import History from './components/History';
import AddNoticeEvent from './components/AddNoticeEvent';
import Search from './components/Search';
import SearchResultModal from './components/SearchResultModal';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [authMode, setAuthMode] = useState('signup'); // 'signup' or 'login'

  const handleNavigateToHistory = () => {
    setCurrentPage('history');
  };

  const handleNavigateToDashboard = () => {
    setCurrentPage('dashboard');
  };

  const handleNavigateToAdd = () => {
    setCurrentPage('add');
  };

  const handleNavigateToSearch = () => {
    setCurrentPage('search');
  };

  const [selectedItem, setSelectedItem] = useState(null);

  const handleSearchSelect = (item) => {
    // item: { page: 'dashboard'|'history', type: 'event'|'notice'|'history', id, title }
    setSelectedItem(item);
    setCurrentPage(item.page);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCurrentUser(null);
    try { localStorage.removeItem('currentUser'); } catch (e) {}
    setAuthMode('login');
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('currentUser');
      if (raw) {
        const parsed = JSON.parse(raw);
        setCurrentUser(parsed);
        setIsLoggedIn(true);
      }
    } catch (e) {
      console.error('Failed to read currentUser from storage', e);
    }
  }, []);

  const handleSignUp = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    try { localStorage.setItem('currentUser', JSON.stringify(user)); } catch (e) {}
  };
  const handleLogin = (user) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        {authMode === 'signup' ? (
          <SignUp
            onSignUp={handleSignUp}
            onLogout={handleLogout}
            onLoginClick={() => setAuthMode('login')}
          />
        ) : (
          <Login
            onLogin={handleLogin}
            onSwitchToSignUp={() => setAuthMode('signup')}
          />
        )}
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'history' ? (
        <History user={currentUser} onNavigateToDashboard={handleNavigateToDashboard} onNavigateToAdd={handleNavigateToAdd} onLogout={handleLogout} onNavigateToSearch={handleNavigateToSearch} selectedItem={selectedItem} />
      ) : currentPage === 'add' ? (
        <AddNoticeEvent user={currentUser} onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} onNavigateToSearch={handleNavigateToSearch} />
      ) : currentPage === 'search' ? (
        <Search onSelect={handleSearchSelect} onBack={() => setCurrentPage('dashboard')} />
      ) : (
        <Dashboard user={currentUser} onNavigateToHistory={handleNavigateToHistory} onNavigateToAdd={handleNavigateToAdd} onLogout={handleLogout} onNavigateToSearch={handleNavigateToSearch} selectedItem={selectedItem} />
      )}
      {selectedItem && (
        <SearchResultModal item={selectedItem} onClose={() => setSelectedItem(null)} />
      )}
    </div>
  );
}

export default App;
