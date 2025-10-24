// src/contexts/AuthContext.tsx - Fixed offline authenticated user detection
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { AuthState } from '../types/index.js';
import { View, ActivityIndicator } from 'react-native';
import { router, usePathname } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';
import { getFromCache, saveToCache, CACHE_KEYS } from '../utils/cache';

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
    console.log(`➡️ Redirecting from ${currentPathname} to ${path}`);
    router.replace(path);
  }, [currentPathname]);

  const checkNetworkStatus = useCallback(async (): Promise<boolean> => {
    try {
      const state = await NetInfo.fetch();
      // More reliable check - isConnected is enough for most cases
      const online = state.isConnected === true;
      console.log('🌐 Network check result:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        online
      });
      setIsOnline(online);
      return online;
    } catch (error) {
      console.log('🌐 Network check failed, assuming online:', error);
      setIsOnline(true);
      return true;
    }
  }, []);

  useEffect(() => {
    checkNetworkStatus();

    networkListener.current = NetInfo.addEventListener(state => {
      // More reliable check
      const online = state.isConnected === true;
      console.log('🌐 Network status changed:', online ? 'Online' : 'Offline', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type
      });
      setIsOnline(online);
    });

    return () => {
      if (networkListener.current) {
        networkListener.current();
      }
    };
  }, [checkNetworkStatus]);

  // Handle ALL routing logic including root path
  // Handle ALL routing logic including root path
  useEffect(() => {
    if (authState.loading) return;

    console.log('🔄 Routing check:', {
      path: currentPathname,
      isAuthenticated: authState.isAuthenticated,
      isOnline,
      userRole: authState.user?.role,
      hasUser: !!authState.user
    });

    // Define public pages that don't require authentication
    const publicPages = ['/', '/login', '/register', '/forgot-password', '/unauthorized', '/network-error', '/not-found'];

    // If NOT authenticated and trying to access a protected page, redirect to login
    if (!authState.isAuthenticated || !authState.user) {
      if (!publicPages.includes(currentPathname)) {
        console.log('🚫 Unauthenticated access to protected page, redirecting to login');
        safeRedirect('/login');
        return;
      }
    }

    // Handle root path redirection
    if (currentPathname === '/') {
      if (authState.isAuthenticated && authState.user) {
        // Authenticated users go to their role dashboard
        const roleGroupPath = `/(${authState.user.role})`;
        console.log(`🏠 Redirecting authenticated user from root to ${roleGroupPath}`);
        safeRedirect(roleGroupPath);
      } else {
        // NOT authenticated (either offline with no cache, or online with no user) - go to login
        console.log('🏠 Redirecting unauthenticated user to login');
        safeRedirect('/login');
      }
      return;
    }

    // Handle login page specifically - if already authenticated, redirect to dashboard
    if (currentPathname === '/login' && authState.isAuthenticated && authState.user) {
      const roleGroupPath = `/(${authState.user.role})`;
      console.log(`🔐 Already authenticated, redirecting from login to ${roleGroupPath}`);
      safeRedirect(roleGroupPath);
      return;
    }

    // Handle authenticated users' routing
    if (authState.isAuthenticated && authState.user?.role) {
      // Don't redirect public pages
      const publicPages = ['/', '/login', '/register', '/forgot-password', '/unauthorized', '/network-error', '/not-found'];
      if (publicPages.includes(currentPathname)) return;

      // Get user role
      const userRole = authState.user.role;

      // Check if we're in the wrong role group
      const roleGroupRegex = /^\/\(([^)]+)\)/;
      const match = currentPathname.match(roleGroupRegex);

      if (match && match[1] !== userRole) {
        // Wrong role - redirect to correct role path
        const newPath = currentPathname.replace(roleGroupRegex, `/(${userRole})`);
        console.log(`🔄 Wrong role detected, redirecting to: ${newPath}`);
        safeRedirect(newPath);
      } else if (!match && !currentPathname.startsWith('/_')) {
        // No role group - add it
        const newPath = `/(${userRole})${currentPathname}`;
        console.log(`🔄 Adding role group, redirecting to: ${newPath}`);
        safeRedirect(newPath);
      }
    }
  }, [authState, currentPathname, safeRedirect, isOnline]);

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

        // OFFLINE MODE: If we're offline, use cached data immediately
        if (!isOnline) {
          console.log('📱 Offline mode - using cached authentication data');
          const cachedProfile = await getFromCache(CACHE_KEYS.PROFILE);

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
            // Try to extract user info from token as fallback
            console.log('📱 No cached user data, extracting from token');
            const tokenData = apiService.decodeToken(token);

            if (tokenData) {
              const role = tokenData.role;
              const email = tokenData.email;
              const name = tokenData.name;
              const id = tokenData.sub;
              const profile = tokenData.profile;
              const is_approved = tokenData.is_approved;
              const created_at = tokenData.created_at;
              const updated_at = tokenData.updated_at;


              console.log('📱 Created offline user from token, Role:', role);
              setAuthState({
                user: { id, email, role, name, profile, is_approved, created_at, updated_at },
                token,
                isAuthenticated: true,
                loading: false,
              });
              return;
            } else {
              console.log('📱 No valid token data found');
              await apiService.clearToken();
              setAuthState({
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
              });
              return;
            }
          }
        }

        // ONLINE MODE: Try to validate token and get fresh user data
        console.log('🌐 Online mode - validating token...');
        const isValid = await apiService.validateToken();
        console.log('🔑 Token validation result:', isValid);

        if (isValid) {
          console.log('👤 Fetching current user with valid token...');
          try {
            const response = await apiService.getCurrentUser();

            if (response.data.success && response.data.data) {
              const user = response.data.data;
              console.log('✅ User authenticated:', user.email, 'Role:', user.role);

              // Cache user profile for offline use
              await saveToCache(CACHE_KEYS.PROFILE, response.data);

              setAuthState({
                user,
                token,
                isAuthenticated: true,
                loading: false,
              });
              return;
            } else {
              throw new Error('Failed to get user data');
            }
          } catch (error: any) {
            console.log('❌ User fetch failed:', error.message);

            // Fallback to cached data if available
            const cachedProfile = await getFromCache(CACHE_KEYS.PROFILE);
            if (cachedProfile?.data) {
              console.log('🔄 Using cached user data as fallback, Role:', cachedProfile.data.role);
              setAuthState({
                user: cachedProfile.data,
                token,
                isAuthenticated: true,
                loading: false,
              });
              return;
            }

            // Clear invalid token
            if (error.response?.status === 401) {
              await apiService.clearToken();
            }

            throw error;
          }
        } else {
          console.log('❌ Token invalid');
          await apiService.clearToken();
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      } catch (error: any) {
        console.error('❌ Initial auth check failed:', error);

        // Final fallback: try cached data
        const cachedProfile = await getFromCache(CACHE_KEYS.PROFILE);
        const token = apiService.getToken();

        if (cachedProfile?.data && token) {
          console.log('🔄 Using cached user data as final fallback, Role:', cachedProfile.data.role);
          setAuthState({
            user: cachedProfile.data,
            token,
            isAuthenticated: true,
            loading: false,
          });
        } else {
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
        }
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
          await saveToCache(CACHE_KEYS.PROFILE, response.data);

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

      // Only clear token for online 401 errors
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
