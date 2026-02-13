import React, { useState } from 'react';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';
import History from './components/History';
import AddNoticeEvent from './components/AddNoticeEvent';

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

  if (!isLoggedIn) {
    return (
      <div className="App">
        <SignUp onSignUp={() => setIsLoggedIn(true)} />
      </div>
    );
  }

  return (
    <div className="App">
      {currentPage === 'history' ? (
        <History onNavigateToDashboard={handleNavigateToDashboard} onNavigateToAdd={handleNavigateToAdd} />
      ) : currentPage === 'add' ? (
        <AddNoticeEvent onNavigateToDashboard={handleNavigateToDashboard} />
      ) : (
        <Dashboard onNavigateToHistory={handleNavigateToHistory} onNavigateToAdd={handleNavigateToAdd} />
      )}
    </div>
  );
}

export default App;
