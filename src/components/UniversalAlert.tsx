// UniversalAlert.tsx
import { Platform } from 'react-native';

type AlertType = 'default' | 'plain-text' | 'secure-text' | 'login-password';
type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

interface AlertButton {
  text: string;
  onPress?: (value?: string) => void;
  style?: AlertButtonStyle;
}

// Initialize with a function that warns if used before setup
let showUniversalPrompt: (
  title: string,
  message: string,
  onSubmit: (value: string) => void,
  onCancel: () => void,
  defaultValue?: string,
  type?: 'plain-text' | 'secure-text'
) => void = (title, message, onSubmit, onCancel, defaultValue, type) => {
  console.warn('⚠️ UniversalPrompt not initialized yet. Please make sure UniversalPromptProvider is mounted.');
  // Fallback to default alert for now
  const { Alert } = require('react-native');
  Alert.alert(
    title, 
    message, 
    [
      { text: 'Cancel', style: 'cancel', onPress: onCancel },
      { text: 'OK', onPress: () => onSubmit(defaultValue || '') }
    ]
  );
};

export const setUniversalPromptFunction = (func: typeof showUniversalPrompt) => {
  showUniversalPrompt = func;
};

export const UniversalAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean; onDismiss?: () => void }
  ) => {
    if (Platform.OS === 'web') {
      // Web implementation
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
      Alert.alert(title, message, buttons, options);
    }
  },

  prompt: (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type: AlertType = 'plain-text',
    defaultValue?: string
  ) => {
    // Handle both callback and buttons array formats
    let onSubmit: (value: string) => void;
    let onCancel: () => void;

    if (typeof callbackOrButtons === 'function') {
      // Legacy callback format
      onSubmit = callbackOrButtons;
      onCancel = () => {};
    } else {
      // Buttons array format
      const buttons = callbackOrButtons || [];
      const confirmButton = buttons.find(b => b.style !== 'cancel');
      const cancelButton = buttons.find(b => b.style === 'cancel');
      
      onSubmit = (value: string) => confirmButton?.onPress?.(value);
      onCancel = () => cancelButton?.onPress?.();
    }

    if (Platform.OS === 'web') {
      // Web implementation
      const result = window.prompt(message || title, defaultValue || '');
      if (result !== null) {
        onSubmit(result);
      } else {
        onCancel();
      }
    } else if (Platform.OS === 'android') {
      // Android implementation using custom modal
      // This will now use the fallback if showUniversalPrompt hasn't been set yet
      showUniversalPrompt(
        title,
        message || '',
        onSubmit,
        onCancel,
        defaultValue || '',
        type === 'secure-text' ? 'secure-text' : 'plain-text'
      );
    } else {
      // iOS implementation
      const { Alert } = require('react-native');
      // @ts-ignore - Alert.prompt exists on iOS
      Alert.prompt(title, message, callbackOrButtons, type, defaultValue);
    }
  }
};

// Export it as Alert to match your existing code
export const Alert = UniversalAlert;