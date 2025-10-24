// src/contexts/AuthContext.tsx - Fixed for Expo Router flat paths
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/api';
import { AuthState } from '../types/index.js';
import { View, ActivityIndicator } from 'react-native';
import { router, usePathname, Redirect } from 'expo-router';
import NetInfo from '@react-native-community/netinfo';

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

// Define route protection rules based on actual resolved paths
const ROUTE_RULES = {
  // Teacher-only routes (these are the actual resolved paths)
  teacher: [
    '/',     // Resolves from (teacher)/
    '/exams',         // Resolves from (teacher)/exams
    '/homework',      // Resolves from (teacher)/homework
    '/students',      // Resolves from (teacher)/students
    '/classes',       // Resolves from (teacher)/classes
    '/profile',       // Teacher profile
    '/settings'       // Teacher settings
  ],
  // Student-only routes
  student: [
    '/',     // Resolves from (student)/
    '/exams',         // Resolves from (student)/exams
    '/homework',      // Resolves from (student)/homework
    '/profile',       // Student profile
    '/progress',      // Student progress
    '/results'        // Student results
  ],
  // Admin-only routes
  admin: [
    '/',     // Resolves from (admin)/
    '/users',         // Resolves from (admin)/users
    '/classes',       // Resolves from (admin)/classes
    '/subjects',      // Resolves from (admin)/subjects
    '/reports'        // Resolves from (admin)/reports
  ],
  // Authenticated routes (any role)
  authenticated: [
    '/profile',
    '/settings',
    '/notifications'
  ],
  // Public routes (no auth required)
  public: [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/unauthorized',
    '/network-error',
    '/not-found'
  ]
};

// Check if a route requires specific role
const getRequiredRole = (pathname: string, userRole: string | undefined): string | null => {
  // Check if this is a shared path that needs role-based access
  const isSharedPath = ['/', '/exams', '/homework', '/profile'].includes(pathname);
  
  if (isSharedPath && userRole) {
    // For shared paths, the current user's role determines access
    return userRole;
  }
  
  // Check teacher routes
  if (ROUTE_RULES.teacher.some(route => pathname === route)) {
    return 'teacher';
  }
  
  // Check student routes
  if (ROUTE_RULES.student.some(route => pathname === route)) {
    return 'student';
  }
  
  // Check admin routes
  if (ROUTE_RULES.admin.some(route => pathname === route)) {
    return 'admin';
  }
  
  // Check authenticated routes
  if (ROUTE_RULES.authenticated.some(route => pathname === route)) {
    return 'any'; // Any authenticated user
  }
  
  // Check public routes
  if (ROUTE_RULES.public.includes(pathname)) {
    return null; // No auth required
  }
  
  // Default to authenticated for unknown routes
  return 'any';
};

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
  const lastPathname = useRef<string | null>(null);

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

  // Route protection effect
  useEffect(() => {
    // Don't run during initial auth check or if pathname hasn't changed
    if (authState.loading || lastPathname.current === currentPathname) return;
    
    lastPathname.current = currentPathname;
    const requiredRole = getRequiredRole(currentPathname, authState.user?.role);
    
    console.log('🛡️ Route protection check:', {
      pathname: currentPathname,
      requiredRole,
      isAuthenticated: authState.isAuthenticated,
      userRole: authState.user?.role
    });

    // Handle unauthenticated access to protected routes
    if (requiredRole && !authState.isAuthenticated) {
      console.log('🚫 Unauthenticated access to protected route');
      safeRedirect('/login');
      return;
    }

    // Handle authenticated access to role-specific routes
    if (requiredRole && requiredRole !== 'any' && authState.isAuthenticated) {
      // For shared paths, check if user's role matches what they should be accessing
      const isSharedPath = ['/', '/exams', '/homework', '/profile'].includes(currentPathname);
      
      if (isSharedPath) {
        // Get the expected dashboard path for this user
        const expectedDashboard = getDashboardForRole(authState.user?.role);
        if (currentPathname === '/' && expectedDashboard !== currentPathname) {
          // They're on the wrong dashboard
          console.log(`🚫 User on wrong dashboard, redirecting to ${expectedDashboard}`);
          safeRedirect(expectedDashboard);
          return;
        }
        // For other shared paths, they're allowed if authenticated
      } else if (authState.user?.role !== requiredRole) {
        // For non-shared paths, strict role checking
        console.log(`🚫 User role ${authState.user?.role} not allowed for ${requiredRole} route`);
        safeRedirect('/unauthorized');
        return;
      }
    }

    // Handle authenticated users accessing auth pages
    if (currentPathname === '/login' && authState.isAuthenticated) {
      // Redirect to appropriate dashboard
      const dashboard = getDashboardForRole(authState.user?.role);
      console.log('🏠 Authenticated user accessing login - redirecting to dashboard');
      safeRedirect(dashboard);
    }
  }, [authState, currentPathname, safeRedirect]);

  // Get appropriate dashboard for user role
  const getDashboardForRole = (role: string | undefined): string => {
    switch (role) {
      case 'teacher': return '/';
      case 'student': return '/';
      case 'admin': return '/';
      default: return '/'; // fallback
    }
  };

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
          console.log('❌ User fetch failed:', error.message);
          
          if (!isOnline) {
            console.log('📱 Allowing offline access with existing token');
            setAuthState({
              user: null,
              token,
              isAuthenticated: true,
              loading: false,
            });
          } else {
            if (error.response?.status === 401) {
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
        }
      } catch (error: any) {
        console.error('❌ Initial auth check failed:', error);
        
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
          console.log('✅ Login successful for:', user.email);

          setAuthState({
            user,
            token,
            isAuthenticated: true,
            loading: false,
          });

          // Redirect to appropriate dashboard after login
          const dashboard = getDashboardForRole(user.role);
          setTimeout(() => safeRedirect(dashboard), 100);

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
