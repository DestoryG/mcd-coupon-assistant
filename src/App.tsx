import { useState, useEffect } from 'react';
import { mcpClient } from './services/mcpClient';
import { storage } from './utils/storage';
import Dashboard from './components/Dashboard';
import './App.css';

function App() {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = storage.getToken();
    if (savedToken) {
      setToken(savedToken);
      mcpClient.setToken(savedToken);
    }
    setIsLoading(false);
  }, []);

  const handleTokenSet = (newToken: string) => {
    setToken(newToken);
    storage.setToken(newToken);
    mcpClient.setToken(newToken);
  };

  const handleTokenClear = () => {
    setToken(null);
    storage.clearToken();
    mcpClient.clearToken();
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>加载中...</p>
      </div>
    );
  }

  return (
    <div className="app">
      <Dashboard 
        token={token} 
        onTokenSet={handleTokenSet}
        onTokenClear={handleTokenClear} 
      />
    </div>
  );
}

export default App;
