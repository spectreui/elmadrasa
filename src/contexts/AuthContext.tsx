// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { User, AuthState } from '../types';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

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
  const redirectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authCheckInProgress = useRef(false);

  // Clear any existing timeouts to prevent loops
  const clearRedirectTimeout = useCallback(() => {
    if (redirectTimeoutRef.current) {
      clearTimeout(redirectTimeoutRef.current);
      redirectTimeoutRef.current = null;
    }
  }, []);

  // Refresh authentication state with loop prevention
  const refreshAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress.current) {
      console.log('🔄 Auth check already in progress, skipping...');
      return;
    }

    authCheckInProgress.current = true;
    console.log('🔄 Refreshing authentication...');

    try {
      if (!apiService.isAuthenticated()) {
        console.log('🚫 No valid token available');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
        authCheckInProgress.current = false;
        return;
      }

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
      
      // Clear token and redirect to login
      await apiService.clearToken();
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      
      // Redirect to login with debounce
      clearRedirectTimeout();
      redirectTimeoutRef.current = setTimeout(() => {
        if (!authState.isAuthenticated) {
          console.log('➡️ Redirecting to login due to auth failure');
          router.replace('/(auth)/login');
        }
      }, 100);
    } finally {
      authCheckInProgress.current = false;
    }
  }, [authState.isAuthenticated, clearRedirectTimeout]);

  // Initial auth check
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🎯 Initializing authentication...');
      await refreshAuth();
    };

    initializeAuth();

    // Cleanup on unmount
    return () => {
      clearRedirectTimeout();
      authCheckInProgress.current = false;
    };
  }, [refreshAuth, clearRedirectTimeout]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    clearRedirectTimeout();

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
      clearRedirectTimeout();
      
      await apiService.clearToken();

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      setError(null);

      console.log('✅ Logout successful');
      
      // Redirect to login with debounce
      redirectTimeoutRef.current = setTimeout(() => {
        router.replace('/(auth)/login');
      }, 100);
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('Logout failed');
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearRedirectTimeout();
    };
  }, [clearRedirectTimeout]);

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
