import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { Redirect, usePathname } from "expo-router";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Index() {
  const { isAuthenticated, loading, user } = useAuth();
  const pathname = usePathname();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Only redirect if the user is actually at root "/"
  if (pathname === "/" && isAuthenticated && user?.role) {
    return <Redirect href={`(${user.role})/`} />;
  }

  if (pathname === "/" && !isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Otherwise, render nothing (or fallback)
  return null;
}
