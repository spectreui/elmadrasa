// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User, AuthState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // Start with loading true
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      // Check if we have a stored token
      const token = await AsyncStorage.getItem('authToken'); // Or your storage method
      if (token) {
        apiService.setToken(token);
        const response = await apiService.getCurrentUser();
        if (response.data.success && response.data.data) {
          setAuthState({
            user: response.data.data,
            token,
            isAuthenticated: true,
            loading: false,
          });
          return;
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      // Clear invalid token
      await AsyncStorage.removeItem('authToken');
      apiService.clearToken();
    }
    // If no token or auth check failed
    setAuthState(prev => ({ 
      ...prev, 
      user: null, 
      token: null, 
      isAuthenticated: false, 
      loading: false 
    }));
  };

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiService.login({ email, password });
      console.log('🔐 Login response:', response.data); // Add this log
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        
        // Store token persistently
        await AsyncStorage.setItem('authToken', token);
        apiService.setToken(token);
        
        // Update state
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });
        
        console.log('✅ Auth state updated:', { user, isAuthenticated: true }); // Add this log
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      console.error('❌ Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('authToken');
    apiService.clearToken();
    setAuthState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
    });
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}