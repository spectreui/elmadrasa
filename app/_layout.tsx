import "../global.css";
import React, { useEffect } from "react";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet } from "react-native";
import { AuthProvider } from "../src/contexts/AuthContext";
import { ThemeProvider, useThemeContext } from "../src/contexts/ThemeContext";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import * as Linking from "expo-linking";

const linking = {
  prefixes: [
    Linking.createURL("/"),                   // for development
    "elmadrasa://",                           // app scheme
    "https://elmadrasa-link.vercel.app",      // production universal link
  ],
};

/**
 * Dynamically route deep links:
 * - elmadrasa://homework/123        → /(student)/homework/123
 * - elmadrasa://teacher/exams/321   → /(teacher)/exams/321
 * - elmadrasa://admin/dashboard     → /(admin)/dashboard
 */
const handleDeepLink = (url: string) => {
  const { path } = Linking.parse(url);
  console.log("🔗 Deep link opened:", url, "→ path:", path);
  if (!path) return;

  let base = "(student)"; // default route group

  if (path.startsWith("teacher")) base = "(teacher)";
  if (path.startsWith("admin")) base = "(admin)";

  // remove "teacher/" or "admin/" prefix if present
  const cleanPath = path.replace(/^(teacher|admin)\//, "");

  // Construct final path and navigate
  const target = `/${base}/${cleanPath}`;
  console.log("➡️ Navigating to:", target);

  router.push(target);
};

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { isDark } = useThemeContext();
  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      {children}
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    // Handle the initial deep link if the app opened from one
    Linking.getInitialURL().then((url) => {
      if (url) handleDeepLink(url);
    });

    // Listen for new deep links while app is open
    const sub = Linking.addEventListener("url", (event) => {
      handleDeepLink(event.url);
    });

    return () => sub.remove();
  }, []);

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
        { backgroundColor: isDark ? "#1C1C1E" : "#fff" },
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
