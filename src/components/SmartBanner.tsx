// src/components/SmartBanner.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useThemeContext } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Function to detect mobile browsers
const isMobileBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;
  return mobileRegex.test(userAgent);
};

// Function to detect iOS specifically
const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent;
  return /iPad|iPhone|iPod/.test(userAgent);
};

// Function to detect Android specifically
const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator.userAgent;
  return /Android/.test(userAgent);
};

interface SmartBannerProps {
  appName: string;
  appScheme: string;
  currentPath: string;
}

export const SmartBanner = ({ 
  appName,
  appScheme,
  currentPath
}: SmartBannerProps) => {
  const { colors, isDark } = useThemeContext();
  const [isVisible, setIsVisible] = useState(false);
  const [hasDismissed, setHasDismissed] = useState(false);

  useEffect(() => {
    const checkBannerStatus = async () => {
      // Only show on web AND only on mobile devices
      if (Platform.OS !== 'web' || !isMobileBrowser()) {
        setIsVisible(false);
        return;
      }

      // Check if user has dismissed the banner recently
      const dismissedTime = await AsyncStorage.getItem('smartBannerDismissed');
      if (dismissedTime) {
        const dismissedTimestamp = parseInt(dismissedTime);
        const now = Date.now();
        // Show again after 1 day (24 hours)
        if (now - dismissedTimestamp < 24 * 60 * 60 * 1000) {
          setHasDismissed(true);
          return;
        }
      }

      // Show banner after a delay
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    };

    checkBannerStatus();
  }, []);

  const handleOpenApp = () => {
    try {
      // Generate deep link for current page
      const cleanPath = currentPath.startsWith('/') ? currentPath.substring(1) : currentPath;
      const deepLink = `${appScheme}://${cleanPath}`;
      
      // Try to open the app
      window.location.href = deepLink;
      
      // Show success message
      setTimeout(() => {
        const platform = isIOS() ? 'iOS' : isAndroid() ? 'Android' : 'mobile';
        alert(`Opening ${appName} app... If the app is not installed, please download it from your ${platform} device.`);
      }, 500);
    } catch (error) {
      console.error('Error opening app:', error);
      alert('Unable to open the app. Please make sure it is installed.');
    }
  };

  const handleDismiss = async () => {
    setIsVisible(false);
    setHasDismissed(true);
    await AsyncStorage.setItem('smartBannerDismissed', Date.now().toString());
  };

  if (!isVisible || hasDismissed || Platform.OS !== 'web' || !isMobileBrowser()) {
    return null;
  }

  return (
    <View style={[styles.container, { 
      backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF',
      borderColor: colors.border,
    }]}>
      <View style={styles.content}>
        <View style={styles.appInfo}>
          <View style={[styles.appIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="phone-portrait" size={20} color="white" />
          </View>
          <View style={styles.textContainer}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              Continue in {appName}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Open this page in our mobile app for the best experience
            </Text>
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={[styles.openButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenApp}
          >
            <Text style={styles.openButtonText}>Open App</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.dismissButton}
            onPress={handleDismiss}
          >
            <Ionicons name="close" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    maxWidth: 800,
    marginHorizontal: 'auto',
  },
  appInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  appIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  openButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 8,
  },
  openButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  dismissButton: {
    padding: 4,
    borderRadius: 12,
  },
});

export default SmartBanner;
