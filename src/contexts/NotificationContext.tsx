// src/contexts/NotificationContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';
import { apiService } from '../services/api';

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | undefined;
  savePushToken: (token: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification>();
  const { user, isAuthenticated } = useAuth();

  const savePushToken = async (token: string) => {
    try {
      await apiService.savePushToken(token);
      console.log('Push token saved to backend successfully');
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  };

  useEffect(() => {
    const setupNotifications = async () => {
      if (!isAuthenticated || !user) return;

      // Setup notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#3b82f6',
        });
      }

      // Request permissions
      if (Device.isDevice) {
        const { status } = await Notifications.requestPermissionsAsync();
        if (status !== 'granted') {
          console.log('Failed to get push token for push notification!');
          return;
        }
        
        // Get push token
        const token = (await Notifications.getExpoPushTokenAsync({
          projectId: Constants.expoConfig?.extra?.eas?.projectId,
        })).data;
        
        setExpoPushToken(token);
        
        // Save token to your backend
        await savePushToken(token);
      }

      // Setup listeners
      const notificationListener = Notifications.addNotificationReceivedListener(notification => {
        setNotification(notification);
      });

      const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
        console.log('Notification response:', response);
        // Handle navigation based on notification data
        const { data } = response.notification.request.content;
        if (data?.screen) {
          // You can add navigation logic here if needed
        }
      });

      // Cleanup
      return () => {
        notificationListener.remove();
        responseListener.remove();
      };
    };

    setupNotifications();
  }, [isAuthenticated, user]);

  return (
    <NotificationContext.Provider value={{ expoPushToken, notification, savePushToken }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
