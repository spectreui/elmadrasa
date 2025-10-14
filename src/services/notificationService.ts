// src/services/notificationService.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { apiService } from './api';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  static async registerForPushNotifications(): Promise<string | null> {
    let token: string | null = null;
    
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      // Get the token
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      token = expoPushToken.data;
      console.log('Push token:', token);
      
      // Save token to your backend
      await this.savePushTokenToBackend(token);
    } else {
      console.log('Must use physical device for Push Notifications');
    }

    return token;
  }

  static async savePushTokenToBackend(token: string): Promise<void> {
    try {
      // Use your existing API service
      await apiService.api.post('/users/save-push-token', { push_token: token });
      console.log('Push token saved to backend successfully');
    } catch (error) {
      console.error('Error saving push token to backend:', error);
    }
  }

  static async sendPushNotificationToUser(userId: string, title: string, body: string, data: any = {}): Promise<void> {
    try {
      // Send to your backend to handle the notification
      await apiService.api.post('/notifications/send-to-user', {
        user_id: userId,
        title,
        body,
        data
      });
    } catch (error) {
      console.error('Error sending push notification:', error);
    }
  }

  static async scheduleLocalNotification(title: string, body: string, delaySeconds: number = 5): Promise<string> {
    return await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: delaySeconds,
      },
    });
  }

  static addNotificationResponseReceivedListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  static addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}
