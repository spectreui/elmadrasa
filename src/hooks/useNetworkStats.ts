// src/hooks/useNetworkStatus.ts
import { useState, useEffect } from 'react';

export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const checkNetwork = async () => {
      try {
        const response = await fetch('https://www.google.com', { 
          method: 'HEAD', 
          mode: 'no-cors',
          cache: 'no-cache'
        });
        setIsOnline(true);
      } catch {
        setIsOnline(false);
      }
    };

    // Check immediately
    checkNetwork();

    // Check every 30 seconds
    const interval = setInterval(checkNetwork, 30000);

    return () => clearInterval(interval);
  }, []);

  return { isOnline };
};
