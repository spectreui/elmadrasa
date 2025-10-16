import { Platform } from 'react-native';
import { useState } from 'react';

// For web, we'll create a simple modal-based alert
export const useAlert = () => {
  const [alertState, setAlertState] = useState({
    visible: false,
    title: '',
    message: '',
    buttons: [] as { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[]
  });

  const showAlert = (
    title: string,
    message?: string,
    buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[]
  ) => {
    if (Platform.OS === 'web') {
      // Web implementation using browser alerts as fallback
      if (buttons && buttons.length > 0) {
        const confirmButton = buttons.find(b => b.style !== 'cancel');
        const cancelButton = buttons.find(b => b.style === 'cancel');
        
        if (confirmButton && window.confirm(`${title}\n\n${message}`)) {
          confirmButton.onPress?.();
        } else if (cancelButton) {
          cancelButton.onPress?.();
        }
      } else {
        window.alert(`${title}\n\n${message}`);
      }
    } else {
      // Native implementation
      const { Alert } = require('react-native');
      Alert.alert(title, message, buttons);
    }
  };

  return { showAlert, alertState, setAlertState };
};
