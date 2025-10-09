// app/index.tsx
import { useRouter } from 'expo-router';
import { useAuth } from '../src/contexts/AuthContext';
import { View, Text, ActivityIndicator } from 'react-native';
import { useEffect } from 'react';

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();
  const router = useRouter();

  console.log('🔐 Auth State:', {
    isAuthenticated,
    loading,
    userRole: user?.role
  });

  // Handle navigation based on auth state changes
  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        console.log('➡️ Redirecting to login');
        router.replace('/(auth)/login');
      } else if (user?.role === 'teacher') {
        console.log('➡️ Redirecting teacher to teacher dashboard');
        router.replace('/(teacher)');
      } else if (user?.role === 'admin') {
        console.log('➡️ Redirecting teacher to teacher dashboard');
        router.replace('/(admin)');
      } else {
        console.log('➡️ Redirecting student to tabs');
        router.replace('/(tabs)');
      }
    }
  }, [isAuthenticated, loading, user, router]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4">Loading...</Text>
      </View>
    );
  }

  // Show loading while redirecting
  return (
    <View className="flex-1 justify-center items-center bg-gray-50">
      <ActivityIndicator size="large" color="#3b82f6" />
      <Text className="text-gray-600 mt-4">Redirecting...</Text>
    </View>
  );
}