import React, { useState } from 'react';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import History from './components/History';
import AddNoticeEvent from './components/AddNoticeEvent';
import Search from './components/Search';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

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
  };

  if (!isLoggedIn) {
    return (
      <div className="App">
        <SignUp onSignUp={() => setIsLoggedIn(true)} onLogout={handleLogout} />
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'history' ? (
        <History onNavigateToDashboard={handleNavigateToDashboard} onNavigateToAdd={handleNavigateToAdd} onLogout={handleLogout} onNavigateToSearch={handleNavigateToSearch} selectedItem={selectedItem} />
      ) : currentPage === 'add' ? (
        <AddNoticeEvent onNavigateToDashboard={handleNavigateToDashboard} onLogout={handleLogout} onNavigateToSearch={handleNavigateToSearch} />
      ) : currentPage === 'search' ? (
        <Search onSelect={handleSearchSelect} onBack={() => setCurrentPage('dashboard')} />
      ) : (
        <Dashboard onNavigateToHistory={handleNavigateToHistory} onNavigateToAdd={handleNavigateToAdd} onLogout={handleLogout} onNavigateToSearch={handleNavigateToSearch} selectedItem={selectedItem} />
      )}
    </div>
  );
}

export default App;
