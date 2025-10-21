import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../src/contexts/AuthContext";
import { colors } from "@/utils/designSystem";
import { useThemeContext } from "@/contexts/ThemeContext"; import { useTranslation } from "@/hooks/useTranslation";

export default function TabLayout() {
  const { t } = useTranslation();
  const { isAuthenticated, loading, user } = useAuth();
  const { isDark, colors, toggleTheme } = useThemeContext();


  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  } else if (user?.role !== "student" && isAuthenticated) {
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
        name="exams"
        options={{
          title: "Exams",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="homework"
        options={{
          title: "Homework",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="results"
        options={{
          title: "Results",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="join-subject"
        options={{
          title: "Join Subject",
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "add" : "add-outline"}
              size={size}
              color={color} />


        }} />

      <Tabs.Screen
        name="homework/[id]"
        options={{
          href: null
        }
        } />

      <Tabs.Screen
        name="exam/[id]"
        options={{
          href: null,
          tabBarStyle: {
            display: 'none'
          }
        }
        } />

      <Tabs.Screen
        name="exam/results/[id]"
        options={{
          href: null
        }
        } />


      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "person" : "person-outline"}
              size={size}
              color={color} />


        }} />

    </Tabs>);

}