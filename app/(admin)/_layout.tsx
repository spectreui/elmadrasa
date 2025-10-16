import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { useThemeContext } from "@/contexts/ThemeContext";
import { useTranslation } from "@/hooks/useTranslation";

export default function TabLayout() {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const { isDark, colors } = useThemeContext();

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  } else if (user?.role !== "admin" && isAuthenticated) {
    return <Redirect href="/unauthorized" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.backgroundElevated,
          borderTopColor: colors.border,
          height: 70,
          paddingBottom: 0,
          paddingTop: 8
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "#6b7280",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500"
        }
      }}>

      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="teachers"
        options={{
          title: "Teachers",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="students"
        options={{
          title: t("dashboard.students"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "people" : "people-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="classes"
        options={{
          title: t("dashboard.classes"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "albums" : "albums-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="settings"
        options={{
          title: t("profile.settings"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "settings" : "settings-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="approvals"
        options={{
          title: "Approve",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "checkmark-circle" : "checkmark-circle-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="assign-teachers"
        options={{
          title: "Assign",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "link" : "link-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="users"
        options={{
          href: null
        }} />


    </Tabs>);

}