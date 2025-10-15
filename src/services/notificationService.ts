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
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#3b82f6',
      });
    }

    if (Device.isDevice) {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return null;
      }
      
      const expoPushToken = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });
      
      const token = expoPushToken.data;
      await this.savePushTokenToBackend(token);
      return token;
    }
    
    console.log('Must use physical device for Push Notifications');
    return null;
  }

  static async savePushTokenToBackend(token: string): Promise<void> {
    try {
      await apiService.api.post('/users/save-push-token', { push_token: token });
    } catch (error) {
      console.error('Error saving push token:', error);
    }
  }
}
