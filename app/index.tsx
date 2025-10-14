import { useEffect, useState } from "react";
import { View, ActivityIndicator, Platform } from "react-native";
import { useRouter, useSegments } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";

export default function IndexRedirector() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading, user } = useAuth();
  const [webHandled, setWebHandled] = useState(false);

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
    if (Platform.OS === "web" && !webHandled) return; // wait for open-in-app logic
    if (loading) return;

    // Not logged in → go to login screen
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    const role = user?.role; // "student" | "teacher" | "admin"
    const currentPath = segments.join("/");

    // If user just opened root `/`
    if (!currentPath || currentPath === "(root)" || currentPath === "index") {
      router.replace(`(${role})/`);
      return;
    }

    // Redirect to the proper folder for their role
    router.replace(`(${role})/${currentPath}`);
  }, [isAuthenticated, loading, user, webHandled]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
