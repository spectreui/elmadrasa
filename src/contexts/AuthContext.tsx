// src/contexts/AuthContext.tsx - Fixed role-based routing for root dashboard
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { AuthState } from '../types/index.js';
import { View, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { getFromCache, saveToCache } from '../utils/cache';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  isOnline: boolean;
  checkNetworkStatus: () => Promise<boolean>;
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
  
  const authCheckInProgress = useRef(false);
  const initialAuthCheckDone = useRef(false);
  const currentPathname = usePathname();
  const networkListener = useRef<any>(null);

  const safeRedirect = useCallback((path: string) => {
    if (currentPathname !== path) {
      console.log(`➡️ Redirecting from ${currentPathname} to ${path}`);
      router.replace(path);
    }
  }, [currentPathname]);

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

  useEffect(() => {
    checkNetworkStatus();

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

  // Fixed automatic role-based routing for root dashboard
  useEffect(() => {
    if (authState.loading) return;
    
    // Only handle authenticated users
    if (!authState.isAuthenticated || !authState.user?.role) return;
    
    // Don't redirect public pages
    const publicPages = ['/', '/login', '/register', '/forgot-password', '/unauthorized', '/network-error', '/not-found'];
    if (publicPages.includes(currentPathname)) return;
    
    // Get user role
    const userRole = authState.user.role;
    
    // Special case: root path redirects to user's role group root
    if (currentPathname === '/') {
      const roleGroupPath = `/(${userRole})`;
      console.log(`🏠 Redirecting root to ${userRole} role group: ${roleGroupPath}`);
      safeRedirect(roleGroupPath);
      return;
    }
    
    // Check if current path is already in correct role format
    const roleGroupRegex = new RegExp(`^/\\(${userRole}\\)/*`);
    if (roleGroupRegex.test(currentPathname)) {
      // Already in correct role path, no redirect needed
      return;
    }
    
    // Check if current path is in a different role format
    const anyRoleGroupRegex = /^\/\([^)]+\)\//;
    if (anyRoleGroupRegex.test(currentPathname)) {
      // Replace with correct role
      const newPath = currentPathname.replace(anyRoleGroupRegex, `/(${userRole})/`);
      console.log(`🔄 Mapping role group ${currentPathname} to ${newPath} for ${userRole}`);
      safeRedirect(newPath);
      return;
    }
    
    // Handle flat paths (without role) - convert to role-specific path
    if (currentPathname.startsWith('/') && !currentPathname.startsWith('/_')) {
      // Skip if already in correct format
      if (!currentPathname.startsWith(`/(${userRole})`)) {
        // For root path, go to role group root
        // For other paths, add role group prefix
        const newPath = currentPathname === '/' 
          ? `/(${userRole})` 
          : `/(${userRole})${currentPathname}`;
        console.log(`🔄 Mapping flat path ${currentPathname} to ${newPath} for ${userRole}`);
        safeRedirect(newPath);
      }
    }
  }, [authState, currentPathname, safeRedirect]);

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

        console.log('👤 Fetching current user...');
        try {
          const response = await apiService.getCurrentUser();
          
          if (response.data.success && response.data.data) {
            const user = response.data.data;
            console.log('✅ User authenticated:', user.email, 'Role:', user.role);

            // Cache user profile
            await saveToCache('user_profile', response.data);

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
          console.log('❌ User fetch failed:', error.message);
          
          // Try to get user from cache when offline
          if (!isOnline) {
            console.log('📱 Trying to get user from cache...');
            const cachedProfile = await getFromCache('user_profile');
            if (cachedProfile?.data) {
              console.log('📱 Using cached user data, Role:', cachedProfile.data.role);
              setAuthState({
                user: cachedProfile.data,
                token,
                isAuthenticated: true,
                loading: false,
              });
              return;
            } else {
              // If no cached data, but we have a valid token, create minimal user object
              console.log('📱 No cached user data, creating minimal user object');
              const minimalUser = {
                id: 'offline-user',
                email: 'offline@user.com',
                role: 'student', // Default to student when offline
                name: 'Offline User'
              };
              setAuthState({
                user: minimalUser,
                token,
                isAuthenticated: true,
                loading: false,
              });
              return;
            }
          }
          
          if (isOnline && error.response?.status === 401) {
            console.log('❌ Token expired or invalid - clearing token');
            await apiService.clearToken();
          }
          
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      } catch (error: any) {
        console.error('❌ Initial auth check failed:', error);
        
        // Try to get user from cache when offline
        if (!isOnline) {
          console.log('📱 Trying to get user from cache (offline auth check)...');
          const cachedProfile = await getFromCache('user_profile');
          if (cachedProfile?.data) {
            console.log('📱 Using cached user data for offline auth, Role:', cachedProfile.data.role);
            setAuthState({
              user: cachedProfile.data,
              token: apiService.getToken(),
              isAuthenticated: true,
              loading: false,
            });
            return;
          } else {
            // If no cached data, but we have a valid token, create minimal user object
            console.log('📱 No cached user data, creating minimal user object for offline');
            const token = apiService.getToken();
            if (token) {
              const minimalUser = {
                id: 'offline-user',
                email: 'offline@user.com',
                role: 'student', // Default to student when offline
                name: 'Offline User'
              };
              setAuthState({
                user: minimalUser,
                token,
                isAuthenticated: true,
                loading: false,
              });
              return;
            }
          }
        }
        
        if (isOnline && error.response?.status === 401) {
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

    if (!isOnline) {
      const error = new Error('Cannot login while offline');
      setError('Cannot login while offline');
      setIsLoading(false);
      throw error;
    }

    try {
      console.log('🔐 Starting login process...');
      const response = await apiService.login({ email, password });

      if (response.data.success && response.data.data) {
        const authData = response.data.data;
        
        if (authData.user && authData.token) {
          const { user, token } = authData;
          console.log('✅ Login successful for:', user.email, 'Role:', user.role);

          // Cache user profile
          await saveToCache('user_profile', response.data);

          setAuthState({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          // Redirect to user's dashboard (role group root)
          const dashboardPath = `/(${user.role})`;
          setTimeout(() => safeRedirect(dashboardPath), 100);

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

      if (isOnline && error.response?.status === 401) {
        await apiService.clearToken();
      }

      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      setError(errorMessage);
      
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
      
      if (isOnline) {
        safeRedirect('/login');
      }
    } catch (error) {
      console.error('❌ Logout error:', error);
      setError('Logout failed');
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
      });
      
      if (isOnline) {
        safeRedirect('/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

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
    checkNetworkStatus,
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
