// components/Alert.tsx
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  BackHandler,
} from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

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
  cancelable?: boolean;
  onDismiss?: () => void;
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
    cancelable: true,
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

  // Handle back button on Android
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (alertState.visible && alertState.cancelable !== false) {
        handleCancel();
        return true; // Prevent default behavior
      }
      return false;
    });

    return () => backHandler.remove();
  }, [alertState.visible, alertState.cancelable]);

  // Handle ESC key on web
  useEffect(() => {
    if (Platform.OS === 'web' && alertState.visible) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && alertState.cancelable !== false) {
          handleCancel();
        }
      };

      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [alertState.visible, alertState.cancelable]);

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
      cancelable: options?.cancelable ?? true,
      onDismiss: options?.onDismiss,
    });
    setInputValue('');
  }, []);

  const showPrompt = useCallback((
    title: string,
    message?: string,
    callbackOrButtons?: ((text: string) => void) | AlertButton[],
    type?: AlertType,
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
      cancelable: true,
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
    if (alertState.cancelable === false) {
      return; // Don't dismiss if not cancelable
    }

    if (alertState.type === 'prompt') {
      alertState.onCancel?.();
      // Find cancel button and trigger its onPress
      const cancelButton = alertState.buttons?.find(btn => btn.style === 'cancel');
      cancelButton?.onPress?.(inputValue);
    }
    
    // Call onDismiss callback if provided
    alertState.onDismiss?.();
    
    setAlertState(prev => ({ ...prev, visible: false }));
  };

  const handleBackdropPress = () => {
    if (alertState.cancelable !== false) {
      handleCancel();
    }
  };

  const handleModalContentPress = (e: any) => {
    // Prevent backdrop press when clicking on modal content
    e.stopPropagation();
  };

  const getButtonStyle = (style?: AlertButtonStyle) => {
    switch (style) {
      case 'cancel':
        return [styles.button, { 
          backgroundColor: 'transparent',
        }];
      case 'destructive':
        return [styles.button, { 
          backgroundColor: 'transparent',
        }];
      default:
        return [styles.button, { 
          backgroundColor: 'transparent',
        }];
    }
  };

  const getButtonTextStyle = (style?: AlertButtonStyle) => {
    switch (style) {
      case 'cancel':
        return [styles.buttonText, { 
          color: colors.primary,
          fontWeight: '600'
        }];
      case 'destructive':
        return [styles.buttonText, { 
          color: colors.destructive || '#ff3b30',
          fontWeight: '600'
        }];
      default:
        return [styles.buttonText, { 
          color: colors.primary,
          fontWeight: '600'
        }];
    }
  };

  const renderButtons = () => {
    if (!alertState.buttons?.length) return null;

    return (
      <View style={[
        styles.buttonContainer,
        { 
          borderTopColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          flexDirection: 'row'
        }
      ]}>
        {alertState.buttons.map((button, index) => (
          <View 
            key={index}
            style={[
              styles.buttonWrapper,
              index > 0 && { 
                borderLeftWidth: 1, 
                borderLeftColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
              },
            ]}
          >
            <TouchableOpacity
              style={[
                getButtonStyle(button.style),
                styles.horizontalButton,
              ]}
              onPress={() => handleButtonPress(button)}
            >
              <Text style={getButtonTextStyle(button.style) as any}>
                {button.text}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

  const BlurBackground = ({ children }: { children: React.ReactNode }) => {
    if (Platform.OS === 'web') {
      return (
        <View style={[styles.webBlurBackground, styles.overlay]}>
          {children}
        </View>
      );
    }
    
    return (
      <BlurView
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        {children}
      </BlurView>
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
        <TouchableOpacity 
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleBackdropPress}
        >
          <BlurBackground>
            <View style={styles.overlayContent}>
              <TouchableOpacity 
                style={styles.modalContentContainer}
                activeOpacity={1}
                onPress={handleModalContentPress}
              >
                <View style={[styles.container, { 
                  backgroundColor: isDark ? 'rgba(44,44,46,0.8)' : 'rgba(250,250,250,0.8)',
                  shadowColor: isDark ? '#000' : '#gray',
                }]}>
                  {/* Header */}
                  <View style={styles.header}>
                    <Text style={[styles.title, { 
                      color: isDark ? '#ffffff' : '#000000',
                      fontFamily 
                    }]}>
                      {alertState.title}
                    </Text>
                    {alertState.message ? (
                      <Text style={[styles.message, { 
                        color: isDark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
                        fontFamily 
                      }]}>
                        {alertState.message}
                      </Text>
                    ) : null}
                  </View>

                  {/* Input for prompt */}
                  {alertState.type === 'prompt' && (
                    <View style={styles.inputContainer}>
                      <TextInput
                        style={[styles.input, {
                          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                          color: isDark ? '#ffffff' : '#000000',
                          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                          fontFamily
                        }]}
                        value={inputValue}
                        onChangeText={setInputValue}
                        secureTextEntry={alertState.secureTextEntry}
                        placeholder={alertState.placeholder}
                        placeholderTextColor={isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)'}
                        autoFocus
                        autoCapitalize="none"
                        autoCorrect={false}
                        onSubmitEditing={() => {
                          // Find the default/OK button and press it when Enter is pressed
                          const defaultButton = alertState.buttons?.find(btn => 
                            btn.style !== 'cancel' && btn.style !== 'destructive'
                          );
                          if (defaultButton) {
                            handleButtonPress(defaultButton);
                          }
                        }}
                      />
                    </View>
                  )}

                  {/* Buttons */}
                  {renderButtons()}
                </View>
              </TouchableOpacity>
            </View>
          </BlurBackground>
        </TouchableOpacity>
      </Modal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContentContainer: {
    width: '100%',
    alignItems: 'center',
  },
  webBlurBackground: {
    backdropFilter: 'blur(20px) saturate(180%)',
    WebkitBackdropFilter: 'blur(20px) saturate(180%)',
  },
  container: {
    width: '100%',
    maxWidth: 350,
    borderRadius: 14,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  header: {
    padding: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 20,
    marginTop: 4,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    paddingHorizontal: 16,
  },
  buttonContainer: {
    borderTopWidth: 1,
    minHeight: 44,
  },
  buttonWrapper: {
    flex: 1,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalButton: {
    minHeight: 44,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '400',
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