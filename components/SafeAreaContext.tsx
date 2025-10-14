// src/contexts/SafeAreaContext.tsx
import React, { createContext, useContext } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface SafeAreaContextType {
  insets: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

const SafeAreaContext = createContext<SafeAreaContextType | undefined>(undefined);

export function SafeAreaProviderWrapper({ children }: { children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  
  return (
    <SafeAreaContext.Provider value={{ insets }}>
      {children}
    </SafeAreaContext.Provider>
  );
}

export function useSafeArea() {
  const context = useContext(SafeAreaContext);
  if (context === undefined) {
    throw new Error('useSafeArea must be used within a SafeAreaProviderWrapper');
  }
  return context.insets;
}
