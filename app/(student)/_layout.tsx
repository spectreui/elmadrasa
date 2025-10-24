import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "@/hooks/useTranslation";
import LiquidGlassTabBar from "@/components/TabBar";

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={props => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: 70,
          paddingBottom: 0,
          paddingTop: 8,
          position: 'relative',
        },
        tabBarActiveTintColor: "#3b82f6",
        tabBarInactiveTintColor: "rgba(107, 114, 128, 0.7)",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500"
        },
      }}
    >

      <Tabs.Screen
        name="index"
        options={{
          title: t("home"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "home" : "home-outline"}
              size={size}
              color={color} />
        }} />

      <Tabs.Screen
        name="exams"
        options={{
          title: t("exams"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "document-text" : "document-text-outline"}
              size={size}
              color={color} />
        }} />

      <Tabs.Screen
        name="homework"
        options={{
          title: t("dashboard.homework"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "book" : "book-outline"}
              size={size}
              color={color} />
        }} />

      <Tabs.Screen
        name="results"
        options={{
          title: t("dashboard.results"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "bar-chart" : "bar-chart-outline"}
              size={size}
              color={color} />
        }} />

      <Tabs.Screen
        name="join-subject"
        options={{
          title: t("classes.joinSubject"),
          tabBarIcon: ({ color, size, focused }) =>
            <Ionicons
              name={focused ? "add" : "add-outline"}
              size={size}
              color={color} />
        }} />

      <Tabs.Screen
        name="homework/[id]"
        options={{
          tabBarStyle: {
            display: 'none'
          },
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
          tabBarStyle: {
            display: 'none'
          },
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
    </Tabs>
  );
}