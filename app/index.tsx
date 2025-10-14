import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform, Text } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";

export default function IndexRedirector() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading, user } = useAuth();
  const [webHandled, setWebHandled] = useState(false);
  const [hasRedirected, setHasRedirected] = useState(false);

  console.log('🔄 IndexRedirector - State:', {
    isAuthenticated,
    loading,
    user: user?.email,
    userRole: user?.role,
    hasRedirected,
    webHandled
  });

  useEffect(() => {
    // ✅ On web: try to open native app if user is on mobile browser
    if (Platform.OS === "web") {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

      if (isMobile && !webHandled) {
        setWebHandled(true);
        const pathname = window.location.pathname;
        const appUrl = `elmadrasa://${pathname}`;
 
        // Try to open app
        window.location.href = appUrl;

        // Fallback: stay on web if app not installed
        setTimeout(() => {
          console.log("App not installed — staying on web.");
        }, 1500);
      }
    }
  }, [webHandled]);

  useEffect(() => {
    // Prevent multiple redirects
    if (hasRedirected) {
      console.log('⏭️ Already redirected, skipping');
      return;
    }
    
    // Wait for loading to complete
    if (loading) {
      console.log('⏳ Still loading auth state...');
      return;
    }

    // If on web and still handling app redirect, wait
    if (Platform.OS === "web" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) && !webHandled) {
      console.log('📱 Waiting for web app redirect handling...');
      return;
    }

    // Get current path
    const currentPath = segments.join("/");
    console.log('📍 Current path:', currentPath);
    console.log('🔐 Auth state:', { isAuthenticated, userRole: user?.role });

    // Not logged in → go to login screen
    if (!isAuthenticated) {
      console.log('➡️ Redirecting to login - NOT AUTHENTICATED');
      setHasRedirected(true);
      router.replace('/(auth)/login');
      return;
    }

    // No user data
    if (!user) {
      console.log('❌ No user data, redirecting to login');
      setHasRedirected(true);
      router.replace('/(auth)/login');
      return;
    }

    const role = user?.role; // "student" | "teacher" | "admin"
    console.log('👤 User role:', role);

    // If user just opened root `/`
    if (!currentPath || currentPath === "(root)" || currentPath === "index" || currentPath === "") {
      console.log(`🏠 Redirecting ${role} to dashboard`);
      setHasRedirected(true);
      const targetPath = `(${role})/`;
      console.log('🎯 Target path:', targetPath);
      router.replace(targetPath);
      return;
    }

    console.log('✅ No redirect needed, user is authenticated');
    setHasRedirected(true);
  }, [isAuthenticated, loading, user, webHandled, hasRedirected, segments, router]);

  // Always show something while processing
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
      <Text style={{ marginTop: 10, color: '#666' }}>
        {loading ? 'Loading...' : 'Redirecting...'}
      </Text>
    </View>
  );
}
