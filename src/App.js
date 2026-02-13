import React, { useState } from 'react';
import SignUp from './components/SignUp';
import Dashboard from './components/Dashboard';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <div className="App">
      {isLoggedIn ? (
        <Dashboard />
      ) : (
        <SignUp onSignUp={() => setIsLoggedIn(true)} />
      )}
    </div>
  );
}

export default App;
