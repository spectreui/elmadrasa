import { Platform } from 'react-native';

export const UniversalAlert = {
  alert: (
    title: string,
    message?: string,
    buttons?: Array<{ text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }>,
    options?: { cancelable?: boolean; onDismiss?: () => void }
  ) => {
    if (Platform.OS === 'web') {
      // Web implementation
      if (typeof window !== 'undefined') {
        if (!buttons || buttons.length === 0) {
          window.alert(`${title}${message ? `\n\n${message}` : ''}`);
        } else if (buttons.length === 1) {
          window.alert(`${title}${message ? `\n\n${message}` : ''}`);
          buttons[0].onPress?.();
        } else if (buttons.length === 2) {
          const result = window.confirm(`${title}${message ? `\n\n${message}` : ''}`);
          if (result) {
            const defaultButton = buttons.find(b => b.style !== 'cancel');
            defaultButton?.onPress?.();
          } else {
            const cancelButton = buttons.find(b => b.style === 'cancel');
            cancelButton?.onPress?.();
          }
        } else {
          window.alert(`${title}${message ? `\n\n${message}` : ''}`);
          const defaultButton = buttons.find(b => b.style !== 'cancel' && b.style !== 'destructive');
          defaultButton?.onPress?.();
        }
      }
    } else {
      // Native implementation
      import('react-native').then(({ Alert }) => {
        Alert.alert(title, message, buttons, options);
      });
    }
  }
};
