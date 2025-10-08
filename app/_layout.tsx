// app/_layout.tsx
import '../global.css';
import { Stack } from 'expo-router';
import { AuthProvider } from '../src/contexts/AuthContext';
import { Platform, SafeAreaView, StatusBar } from 'react-native';

export default function RootLayout() {
  return (
    <AuthProvider>
    <SafeAreaView style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>

      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(teacher)" />
        <Stack.Screen name="exams/[id]" />
      </Stack>
    </SafeAreaView>
    </AuthProvider>
  );
}