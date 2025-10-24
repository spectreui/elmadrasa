// src/contexts/AuthContext.tsx - Enhanced with offline support
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { AuthState } from '../types/index.js';
import { View, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isOnline: boolean;
  checkNetworkStatus: () => Promise<boolean>; // Add this
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
  const [isOnline, setIsOnline] = useState(true);
  
  // Refs to prevent loops
  const authCheckInProgress = useRef(false);
  const initialAuthCheckDone = useRef(false);
  const currentPathname = usePathname();
  const networkListener = useRef<any>(null);

  // Safe redirect function
  const safeRedirect = useCallback((path: string) => {
    if (currentPathname !== path) {
      console.log(`➡️ Redirecting from ${currentPathname} to ${path}`);
      router.replace(path);
    }
  }, [currentPathname]);

  // Check network connectivity using NetInfo
  const checkNetworkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      const online = state.isConnected === true && state.isInternetReachable === true;
      setIsOnline(online);
      return online;
    } catch (error) {
      console.log('🌐 Network check failed:', error);
      setIsOnline(false);
      return false;
    }
  }, []);

  // Setup network listener
  useEffect(() => {
    // Initial check
    checkNetworkStatus();

    // Setup listener
    networkListener.current = NetInfo.addEventListener(state => {
      const online = state.isConnected === true && state.isInternetReachable === true;
      console.log('🌐 Network status changed:', online ? 'Online' : 'Offline');
      setIsOnline(online);
    });

    return () => {
      if (networkListener.current) {
        networkListener.current();
      }
    };
  }, [checkNetworkStatus]);

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

        // Validate token (allow expired tokens when offline)
        const isValid = await apiService.validateToken();
        if (!isValid && isOnline) {
          console.log('❌ Token invalid');
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
          return;
        }

        // Get user data (will use cache when offline)
        console.log('👤 Fetching current user...');
        try {
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
          // If offline, allow access with existing token
          if (!isOnline) {
            console.log('📱 Allowing offline access with existing token');
            setAuthState({
              user: null, // Will use cached data in components
              token,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error('❌ Initial auth check failed:', error);
        
        // Only clear token if online
        if (isOnline) {
          await apiService.clearToken();
        }
        
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
  }, [isOnline]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    // Prevent login when offline
    if (!isOnline) {
      const error = new Error('Cannot login while offline');
      setError('Cannot login while offline');
      setIsLoading(false);
      throw error;
    }

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

      // Only clear token if online
      if (isOnline) {
        await apiService.clearToken();
      }

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
      
      // Only clear token if online
      if (isOnline) {
        await apiService.clearToken();
      } else {
        console.log('📱 Offline logout - preserving token for offline access');
      }

      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      setError(null);

      console.log('✅ Logout successful');
      
      // Only redirect if online
      if (isOnline) {
        safeRedirect('/(auth)/login');
      }
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
      
      // Only redirect if online
      if (isOnline) {
        safeRedirect('/(auth)/login');
      }
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
    isOnline,
    checkNetworkStatus, // Add this
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
