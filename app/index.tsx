import { useEffect } from "react";
import { useRouter, useSegments } from "expo-router";
import { View, ActivityIndicator, Platform } from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";

export default function IndexRedirector() {
  const router = useRouter();
  const segments = useSegments();
  const { isAuthenticated, loading, user } = useAuth();

    useEffect(() => {
    // ✅ Only run this when web is opened on mobile
    if (Platform.OS === "web") {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        const pathname = window.location.pathname;
        const appUrl = `elmadrasa://${pathname}`;

        // Try to open the native app
        window.location.href = appUrl;

        // If user doesn’t have the app installed, after a short delay fallback to web
        setTimeout(() => {
          console.log("App not installed, staying on web.");
        }, 1500);
      }
    }
  }, []);

  useEffect(() => {
    if (loading) return;

    // If user not logged in
    if (!isAuthenticated) {
      router.replace("/(auth)/login");
      return;
    }

    const role = user?.role;

    // Figure out what path they tried to open
    const currentPath = segments.join("/");

    // if user just opened root `/`
    if (currentPath === "" || currentPath === "(root)") {
      // send them to their dashboard or whatever
      router.replace(`(${role})/home`);
      return;
    }

    // otherwise, forward to that route within their role folder
    router.replace(`(${role})/${currentPath}`);
  }, [isAuthenticated, loading, user]);

  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <ActivityIndicator size="large" />
    </View>
  );
}
