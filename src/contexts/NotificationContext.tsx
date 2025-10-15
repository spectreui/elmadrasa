import React, { createContext, useContext, useEffect, useState } from "react";
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { useAuth } from "./AuthContext";
import { apiService } from "../services/api";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | undefined;
  refreshPushToken: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification>();
  const { user, isAuthenticated } = useAuth();

  /**
   * 🧹 Auto-remove push token on logout or account switch
   */
  useEffect(() => {
    const cleanupPushToken = async () => {
      if (!isAuthenticated && expoPushToken) {
        try {
          await apiService.savePushToken(null);
          console.log("🧹 Removed push token after logout.");
          setExpoPushToken(null);
        } catch (err) {
          console.error("❌ Error removing push token on logout:", err);
        }
      }
    };
    cleanupPushToken();
  }, [isAuthenticated]);

  /**
   * 🧩 Helper: Save token to backend only if changed
   */
  const savePushToken = async (token: string | null) => {
    if (!user || !isAuthenticated || !token) return;

    try {
      if (user.push_token !== token) {
        await apiService.savePushToken(token);
        console.log("✅ Push token saved for user:", user.id);
      } else {
        console.log("⚙️ Token unchanged — skipping re-save");
      }
    } catch (error) {
      console.error("❌ Error saving push token:", error);
    }
  };

  /**
   * 🚀 Request permissions + register token
   */
  const getAndSaveToken = async () => {
    if (!Device.isDevice) {
      console.log("⚠️ Must use a physical device for push notifications");
      return;
    }

    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== "granted") {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== "granted") {
        console.log("🚫 Notification permissions not granted");
        return;
      }

      // Android channel setup
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: "#3b82f6",
        });
      }

      // Get Expo push token
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

      if (!token) return;

      if (token !== expoPushToken) {
        setExpoPushToken(token);
        await savePushToken(token);
      }

      console.log("📲 Push token ready:", token);
    } catch (error) {
      console.error("❌ Error getting Expo push token:", error);
    }
  };

  /**
   * 🔄 Public method to manually refresh the push token
   */
  const refreshPushToken = async () => {
    console.log("🔁 Refreshing push token...");
    await getAndSaveToken();
  };

  /**
   * 🔔 Setup notifications after login
   */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    console.log("🔔 Setting up notifications for:", user.email);
    getAndSaveToken();

    // Listener: receive notifications while app is foregrounded
    const notificationListener = Notifications.addNotificationReceivedListener((notif) => {
      console.log("📩 Notification received:", notif.request.content);
      setNotification(notif);
    });

    // Listener: user taps notification
    const responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
      console.log("🎯 Notification tapped:", response.notification.request.content.data);
      // navigation logic can go here
    });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, refreshPushToken }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error("useNotification must be used within a NotificationProvider");
  return context;
}
