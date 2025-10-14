// src/contexts/AuthContext.tsx - Fixed version
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { User, AuthState } from '../types';
import { View, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
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
  
  // Refs to prevent loops
  const authCheckInProgress = useRef(false);
  const initialAuthCheckDone = useRef(false);
  const currentPathname = usePathname();

  // Safe redirect function
  const safeRedirect = useCallback((path: string) => {
    if (currentPathname !== path) {
      console.log(`➡️ Redirecting from ${currentPathname} to ${path}`);
      router.replace(path);
    }
  }, [currentPathname]);

  // Single initial auth check - runs only once
  useEffect(() => {
    if (initialAuthCheckDone.current) return;
    
    const initializeAuth = async () => {
      if (authCheckInProgress.current) return;
      
      authCheckInProgress.current = true;
      initialAuthCheckDone.current = true;
      
      console.log('🎯 Performing initial auth check...');

      try {
        const token = apiService.getToken();
        
        if (!token) {
          console.log('🚫 No token found');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
          return;
        }

        // Validate token
        const isValid = await apiService.validateToken();
        if (!isValid) {
          console.log('❌ Token invalid');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
          return;
        }

        // Get user data
        console.log('👤 Fetching current user...');
        const response = await apiService.getCurrentUser();

        if (response.data.success && response.data.data) {
          const user = response.data.data;
          console.log('✅ User authenticated:', user.email);

          setAuthState({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });
        } else {
          throw new Error('Failed to get user data');
        }
      } catch (error: any) {
        console.error('❌ Initial auth check failed:', error);
        
        // Clear invalid token
        await apiService.clearToken();
        
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        });
      } finally {
        authCheckInProgress.current = false;
      }
    };

    initializeAuth();
  }, []); // Empty dependency array - runs only once

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔐 Starting login process...');
      const response = await apiService.login({ email, password });

      console.log('📦 Login response:', {
        success: response.data.success,
        hasData: !!response.data.data,
        hasUser: !!response.data.data?.user,
        hasToken: !!response.data.data?.token
      });

      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        
        if (authData.user && authData.token) {
          const { user, token } = authData;
          console.log('✅ Login successful for:', user.email);

          // Update auth state directly
          setAuthState({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          console.log('✅ Auth state updated successfully');
        } else {
          console.error('❌ Missing user or token in auth data');
          throw new Error('Invalid authentication data received');
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
      
      // Reset auth state
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
      safeRedirect('/(auth)/login');
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('Logout failed');
      // Still reset state and redirect
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      safeRedirect('/(auth)/login');
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