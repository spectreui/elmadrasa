// src/contexts/AuthContext.tsx - Fixed version
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { User, AuthState } from '../types';
import { View, ActivityIndicator, Alert } from 'react-native';
import { router, usePathname } from 'expo-router';

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
  const [authCheckInProgress, setAuthCheckInProgress] = useState(false);
  
  // Use Expo Router's usePathname hook to get current path
  const currentPathname = usePathname();

  // Safe redirect function to prevent loops
  const safeRedirect = useCallback((path: string) => {
    // Check if we're already on the target path using currentPathname
    if (currentPathname !== path) {
      console.log(`➡️ Redirecting from ${currentPathname} to ${path}`);
      router.replace(path);
    } else {
      console.log(`⏸️ Already on target path: ${path}, skipping redirect`);
    }
  }, [currentPathname]);

  // Refresh authentication state
  const refreshAuth = useCallback(async () => {
    // Prevent multiple simultaneous auth checks
    if (authCheckInProgress) {
      console.log('🔄 Auth check already in progress, skipping...');
      return;
    }

    setAuthCheckInProgress(true);
    console.log('🔄 Refreshing authentication...');

    try {
      // Check if we have a valid token first
      const token = apiService.getToken();
      const isValid = await apiService.validateToken();
      
      if (!token || !isValid) {
        console.log('🚫 No valid token available');
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
        setAuthCheckInProgress(false);
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
      
      // Clear token to prevent corrupted state
      await apiService.clearToken();
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      
      // Only redirect if we're not already on auth screens
      if (!currentPathname?.includes('/(auth)')) {
        console.log('➡️ Redirecting to login due to auth failure');
        setTimeout(() => {
          safeRedirect('/(auth)/login');
        }, 100);
      }
    } finally {
      setAuthCheckInProgress(false);
    }
  }, [authCheckInProgress, safeRedirect, currentPathname]);

  // Initial auth check with error boundary
  useEffect(() => {
    let isMounted = true;
    
    const initializeAuth = async () => {
      if (!isMounted) return;
      
      console.log('🎯 Initializing authentication...');
      try {
        await refreshAuth();
      } catch (error) {
        console.error('❌ Initial auth failed:', error);
        // Set loading to false to prevent infinite loading
        if (isMounted) {
          setAuthState(prev => ({ ...prev, loading: false }));
        }
      }
    };

    initializeAuth();

    // Cleanup
    return () => {
      isMounted = false;
    };
  }, [refreshAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting login process...');
      const response = await apiService.login({ email, password });

      if (response.data.success && response.data.data) {
        // Fix: Properly extract user and token from nested response
        const authData = response.data.data; // Access the nested AuthResponse
        if (authData) {
          const { user, token } = authData;
          console.log('✅ Login successful for:', user.email);

          // Set the token explicitly
          if (token) {
            await apiService.setToken(token);
          }

          // Refresh auth state to get the latest user data
          await refreshAuth();
        } else {
          throw new Error('Invalid authentication data');
        }
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
      
      // Update auth state to ensure clean state
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      
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
      
      // Redirect to login
      setTimeout(() => {
        safeRedirect('/(auth)/login');
      }, 100);
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('Logout failed');
      // Still redirect to login even if cleanup fails
      setTimeout(() => {
        safeRedirect('/(auth)/login');
      }, 100);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  // Show loading only during initial app load
  if (authState.loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' }}>
        <ActivityIndicator size="large" color="#0ea5e9" />
        <View style={{ marginTop: 16 }}>
          <ActivityIndicator size="small" color="#94a3b8" />
        </View>
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