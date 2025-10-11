// app/_layout.tsx - UPDATED
import "../global.css"
import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import { AuthProvider } from '../src/contexts/AuthContext';
import { ThemeProvider, useThemeContext } from '../src/contexts/ThemeContext';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import Toast from "react-native-toast-message";

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <ThemedSafeAreaView>
          <ThemeWrapper>
            <AuthProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(student)" />
                <Stack.Screen name="(teacher)" />
                <Stack.Screen name="(admin)" />
                <Stack.Screen name="index" />
              </Stack>
              <Toast /> {/* This is crucial for displaying toasts */}
            </AuthProvider>
          </ThemeWrapper>
        </ThemedSafeAreaView>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ThemedSafeAreaView({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();

  return (
    <SafeAreaView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#1C1C1E' : '#fff' }
      ]}
    >
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
