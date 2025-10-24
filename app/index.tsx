// app/index.tsx - Minimal entry point - let AuthProvider handle everything
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/src/contexts/AuthContext";

export default function Index() {
  const { loading } = useAuth();

  // Show loading while auth is initializing
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // Let AuthProvider handle all routing
  return null;
}
