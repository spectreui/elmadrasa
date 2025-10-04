import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { User, AuthState } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
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
      await AsyncStorage.removeItem('authToken');
      apiService.clearToken();
    }
    
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
    setError(null);
    
    try {
      const response = await apiService.login({ email, password });
      
      if (response.data.success && response.data.data) {
        const { user, token } = response.data.data;
        
        await AsyncStorage.setItem('authToken', token);
        apiService.setToken(token);
        
        setAuthState({
          user,
          token,
          isAuthenticated: true,
          loading: false,
        });
      } else {
        throw new Error(response.data.error || 'Login failed');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('authToken');
      apiService.clearToken();
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      setError(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
    error,
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