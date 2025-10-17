// context/FancyTabBarContext.tsx
import React, { createContext, useContext, useState } from 'react';

const FancyTabBarContext = createContext({
  isTabBarVisible: true,
  hideTabBar: () => {},
  showTabBar: () => {},
});

export const useFancyTabBar = () => {
  return useContext(FancyTabBarContext);
};

export const FancyTabBarProvider = ({ children }) => {
  const [isTabBarVisible, setIsTabBarVisible] = useState(true);

  const value = {
    isTabBarVisible,
    hideTabBar: () => setIsTabBarVisible(false),
    showTabBar: () => setIsTabBarVisible(true),
  };

  return (
    <FancyTabBarContext.Provider value={value}>
      {children}
    </FancyTabBarContext.Provider>
  );
};