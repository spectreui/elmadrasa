// app/index.tsx - Fixed version
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect, useState, useRef } from 'react';
import * as Linking from 'expo-linking';

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();
  const [initialUrl, setInitialUrl] = useState<string | null>(null);
  const hasHandledInitialUrl = useRef(false);
  const isRedirecting = useRef(false);

  console.log('🔐 Auth State:', {
    isAuthenticated,
    loading,
    userRole: user?.role,
    initialUrl,
  });

  // Capture initial URL on mount
  useEffect(() => {
    const getInitialUrl = async () => {
      try {
        const url = await Linking.getInitialURL();
        console.log('🔗 Initial URL:', url);
        setInitialUrl(url);
      } catch (error) {
        console.error('❌ Error getting initial URL:', error);
      }
    };

    getInitialUrl();
  }, []);

  // Handle deep links and navigation based on auth state
  useEffect(() => {
    // Don't proceed if still loading or already redirecting
    if (loading || isRedirecting.current) {
      return;
    }

    isRedirecting.current = true;
    console.log('🔄 Processing navigation...');

    const handleNavigation = async () => {
      try {
        // If we have a deep link and user is authenticated
        if (initialUrl && isAuthenticated && user) {
          const { path, queryParams } = Linking.parse(initialUrl);
          console.log('➡️ Processing deep link:', { path, queryParams });

          // Build the target path based on user role and deep link
          let targetPath = '';

          if (path) {
            // Check if path already includes role-based routing
            if (path.includes('(student)') || path.includes('(teacher)') || path.includes('(admin)')) {
              targetPath = `/${path}`;
            } else {
              // Prepend role-based route
              targetPath = `/(${user.role})/${path}`;
            }

            // Preserve query parameters
            if (queryParams) {
              const queryString = new URLSearchParams(queryParams as any).toString();
              if (queryString) {
                targetPath += `?${queryString}`;
              }
            }

            console.log('🎯 Redirecting to deep link:', targetPath);
            router.replace(targetPath);
            return;
          }
        }

        // Default navigation based on auth state
        if (!isAuthenticated) {
          console.log('➡️ Redirecting to login');
          router.replace('/(auth)/login');
        } else if (user?.role === 'teacher') {
          console.log('➡️ Redirecting teacher to teacher dashboard');
          router.replace('/(teacher)');
        } else if (user?.role === 'admin') {
          console.log('➡️ Redirecting admin to admin dashboard');
          router.replace('/(admin)');
        } else {
          console.log('➡️ Redirecting student to tabs');
          router.replace('/(student)');
        }
      } catch (error) {
        console.error('❌ Navigation error:', error);
        // Fallback to default route
        if (isAuthenticated && user) {
          router.replace(`/(${user.role})`);
        } else {
          router.replace('/(auth)/login');
        }
      } finally {
        // Reset redirecting flag after a delay to prevent rapid re-runs
        setTimeout(() => {
          isRedirecting.current = false;
        }, 1000);
      }
    };

    handleNavigation();
  }, [isAuthenticated, loading, user, initialUrl, router]);

  // Handle URL events while app is running
  useEffect(() => {
    const subscription = Linking.addEventListener('url', (event) => {
      if (isAuthenticated && !loading && user) {
        console.log('🔗 URL event while app running:', event.url);
        
        const { path, queryParams } = Linking.parse(event.url);
        if (path) {
          let targetPath = '';
          
          if (path.includes('(student)') || path.includes('(teacher)') || path.includes('(admin)')) {
            targetPath = `/${path}`;
          } else {
            targetPath = `/(${user.role})/${path}`;
          }

          // Preserve query parameters
          if (queryParams) {
            const queryString = new URLSearchParams(queryParams as any).toString();
            if (queryString) {
              targetPath += `?${queryString}`;
            }
          }

          console.log('➡️ Navigating to URL:', targetPath);
          router.push(targetPath);
        }
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="text-gray-600 mt-4">Redirecting...</Text>
    </View>
  );
}