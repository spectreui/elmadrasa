// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { User, AuthState } from '../types';
import { View, ActivityIndicator } from 'react-native';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  refreshAuth: () => Promise<void>;
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
  

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    console.log('🔄 Refreshing authentication...');

    if (!apiService.isAuthenticated()) {
      console.log('🚫 No token available');
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      return;
    }

    try {
      console.log('👤 Fetching current user...');
      const response = await apiService.getCurrentUser();

      if (response.data.success && response.data.data) {
        const user = response.data.data;
        console.log('✅ User authenticated:', user.email);

        setAuthState({
          user,
          token: apiService.getToken(),
          isAuthenticated: true,
          loading: false,
        });
      } else {
        throw new Error('Invalid user data');
      }
    } catch (error: any) {
      console.error('❌ Auth refresh failed:', error);
      await apiService.clearToken();
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
    }
  }, []);

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🎯 Initializing authentication...');
      await refreshAuth();
    };

    initializeAuth();
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting login process...');
      const response = await apiService.login({ email, password });

      if (response.data.success && response.data.data) {
        const { user } = response.data.data;
        console.log('✅ Login successful for:', user.email);

        // Refresh auth state to get the latest user data
        await refreshAuth();
      } else {
        const errorMsg = response.data.error || 'Login failed';
        throw new Error(errorMsg);
      }
    } catch (error: any) {
      console.error('💥 Login error:', error);

      // Clear any potentially corrupted token
      await apiService.clearToken();

      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 Logging out...');
      setIsLoading(true);
      await apiService.clearToken();

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      setError(null);

      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Show loading only during initial app load
  if (authState.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  const value: AuthContextType = {
    ...authState,
    login,
    logout,
    isLoading,
    error,
    clearError,
    refreshAuth,
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