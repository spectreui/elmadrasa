// components/Alert.tsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

type AlertType = 'default' | 'plain-text' | 'secure-text' | 'login-password';
type AlertButtonStyle = 'default' | 'cancel' | 'destructive';

interface AlertButton {
  text: string;
  onPress?: (value?: string) => void;
  style?: AlertButtonStyle;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  type: 'alert' | 'prompt';
  // Prompt specific
  defaultValue?: string;
  placeholder?: string;
  secureTextEntry?: boolean;
  onSubmit?: (value: string) => void;
  onCancel?: () => void;
}

interface AlertContextType {
  showAlert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean; onDismiss?: () => void }
  ) => void;
  showPrompt: (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type?: AlertType,
    defaultValue?: string,
    placeholder?: string
  ) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

// Global reference for imperative API
let alertFunctions: AlertContextType | null = null;

export const AlertProvider = ({ children }: { children: React.ReactNode }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    visible: false,
    title: '',
    type: 'alert',
  });
  const [inputValue, setInputValue] = useState('');
  const { fontFamily, colors, isDark } = useThemeContext();

  // Set global reference
  React.useEffect(() => {
    alertFunctions = {
      showAlert,
      showPrompt,
    };
  }, []);

  const showAlert = useCallback((
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean; onDismiss?: () => void }
  ) => {
    setAlertState({
      visible: true,
      title,
      message,
      buttons: buttons || [{ text: 'OK' }],
      type: 'alert',
    });
    setInputValue('');
  }, []);

  const showPrompt = useCallback((
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type: AlertType = 'plain-text',
    defaultValue?: string,
    placeholder?: string
  ) => {
    let onSubmit: (value: string) => void;
    let onCancel: () => void;
    let buttons: AlertButton[];

    if (typeof callbackOrButtons === 'function') {
      // Callback format
      onSubmit = callbackOrButtons;
      onCancel = () => {};
      buttons = [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'OK', onPress: () => onSubmit(inputValue) },
      ];
    } else {
      // Buttons array format
      buttons = callbackOrButtons || [
        { text: 'Cancel', style: 'cancel' },
        { text: 'OK' },
      ];
    }

    setAlertState({
      visible: true,
      title,
      message,
      buttons,
      type: 'prompt',
      defaultValue,
      placeholder,
      secureTextEntry: type === 'secure-text',
      onSubmit,
      onCancel,
    });
    setInputValue(defaultValue || '');
  }, []);

  const handleButtonPress = (button: AlertButton) => {
    if (alertState.type === 'prompt') {
      button.onPress?.(inputValue);
    } else {
      button.onPress?.();
    }
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const handleCancel = () => {
    if (alertState.type === 'prompt') {
      alertState.onCancel?.();
      // Find cancel button and trigger its onPress
      const cancelButton = alertState.buttons?.find(btn => btn.style === 'cancel');
      cancelButton?.onPress?.(inputValue);
    }
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const getButtonStyle = (style?: AlertButtonStyle) => {
    switch (style) {
      case 'cancel':
        return [styles.button, { backgroundColor: 'transparent' }];
      case 'destructive':
        return [styles.button, { backgroundColor: colors.destructive || '#dc2626' }];
      default:
        return [styles.button, { backgroundColor: colors.primary }];
    }
  };

  const getButtonTextStyle = (style?: AlertButtonStyle) => {
    switch (style) {
      case 'cancel':
        return [styles.buttonText, { color: colors.textSecondary }];
      case 'destructive':
        return [styles.buttonText, { color: '#ffffff' }];
      default:
        return [styles.buttonText, { color: '#ffffff' }];
    }
  };

  const renderButtons = () => {
    if (!alertState.buttons?.length) return null;

    return (
      <View style={styles.buttonContainer}>
        {alertState.buttons.map((button, index) => (
          <TouchableOpacity
            key={index}
            style={[
              getButtonStyle(button.style),
              alertState.buttons!.length > 2 && styles.verticalButton,
            ]}
            onPress={() => handleButtonPress(button)}
          >
            <Text style={getButtonTextStyle(button.style)}>
              {button.text}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <AlertContext.Provider value={{ showAlert, showPrompt }}>
      {children}
      
      <Modal
        visible={alertState.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={[styles.container, { fontFamily, 
            backgroundColor: colors.backgroundElevated,
            shadowColor: isDark ? '#000' : '#gray',
          }]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {alertState.title}
              </Text>
              {alertState.message ? (
                <Text style={[styles.message, { color: colors.textSecondary }]}>
                  {alertState.message}
                </Text>
              ) : null}
            </View>

            {/* Input for prompt */}
            {alertState.type === 'prompt' && (
              <TextInput
                style={[styles.input, {
                  borderColor: colors.border,
                  color: colors.textPrimary,
                  backgroundColor: colors.background,
                }]}
                value={inputValue}
                onChangeText={setInputValue}
                secureTextEntry={alertState.secureTextEntry}
                placeholder={alertState.placeholder}
                placeholderTextColor={colors.textTertiary}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
              />
            )}

            {/* Buttons */}
            {renderButtons()}
          </View>
        </View>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 14,
    padding: 0,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    overflow: 'hidden',
  },
  header: {
    padding: 24,
    paddingBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 20,
  },
  input: {
    margin: 24,
    marginTop: 0,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  verticalButton: {
    flexDirection: 'column',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

// Hook for using alert in components
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
};

// Imperative API (works exactly like native Alert)
const Alert = {
  alert: (
    title: string,
    message?: string,
    buttons?: AlertButton[],
    options?: { cancelable?: boolean; onDismiss?: () => void }
  ) => {
    if (alertFunctions) {
      alertFunctions.showAlert(title, message, buttons, options);
    } else {
      console.warn('AlertProvider is not mounted');
      // Fallback to native alert for emergency
      if (Platform.OS === 'web') {
        if (buttons && buttons.length > 0) {
          const confirmButton = buttons.find(b => b.style !== 'cancel');
          if (confirmButton && window.confirm(`${title}\n\n${message}`)) {
            confirmButton.onPress?.();
          }
        } else {
          window.alert(`${title}\n\n${message}`);
        }
      } else {
        const { Alert: NativeAlert } = require('react-native');
        NativeAlert.alert(title, message, buttons, options);
      }
    }
  },

  prompt: (
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type?: AlertType,
    defaultValue?: string,
    placeholder?: string
  ) => {
    if (alertFunctions) {
      alertFunctions.showPrompt(title, message, callbackOrButtons, type, defaultValue, placeholder);
    } else {
      console.warn('AlertProvider is not mounted');
      // Fallback to native prompt
      if (Platform.OS === 'web') {
        const result = window.prompt(message || title, defaultValue || '');
        if (typeof callbackOrButtons === 'function') {
          callbackOrButtons(result || '');
        }
      } else {
        const { Alert: NativeAlert } = require('react-native');
        if (Platform.OS === 'ios') {
          // @ts-ignore - iOS has prompt
          NativeAlert.prompt(title, message, callbackOrButtons, type, defaultValue);
        } else {
          // Android fallback to alert with input simulation would be complex
          // For now, just use regular alert
          NativeAlert.alert(title, 'Prompt not available in fallback mode');
        }
      }
    }
  },
};

export default Alert;