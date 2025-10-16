import React, { createContext, useContext, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet } from 'react-native';
import { useThemeContext } from '@/contexts/ThemeContext';

interface PromptState {
  visible: boolean;
  title: string;
  message: string;
  defaultValue: string;
  onSubmit: (value: string) => void;
  onCancel: () => void;
  type: 'plain-text' | 'secure-text';
}

interface PromptContextType {
  showUniversalPrompt: (
    title: string,
    message: string,
    onSubmit: (value: string) => void,
    onCancel: () => void,
    defaultValue?: string,
    type?: 'plain-text' | 'secure-text'
  ) => void;
}

const PromptContext = createContext<PromptContextType | undefined>(undefined);

export const UniversalPromptProvider = ({ children }: { children: React.ReactNode }) => {
  const [promptState, setPromptState] = useState<PromptState>({
    visible: false,
    title: '',
    message: '',
    defaultValue: '',
    onSubmit: () => {},
    onCancel: () => {},
    type: 'plain-text'
  });
  const { colors } = useThemeContext();
  const [inputValue, setInputValue] = useState('');

  const showUniversalPrompt = (
    title: string,
    message: string,
    onSubmit: (value: string) => void,
    onCancel: () => void,
    defaultValue: string = '',
    type: 'plain-text' | 'secure-text' = 'plain-text'
  ) => {
    setPromptState({
      visible: true,
      title,
      message,
      defaultValue,
      onSubmit,
      onCancel,
      type
    });
    setInputValue(defaultValue);
  };

  const handleConfirm = () => {
    promptState.onSubmit(inputValue);
    setPromptState(prev => ({ ...prev, visible: false }));
  };

  const handleCancel = () => {
    promptState.onCancel();
    setPromptState(prev => ({ ...prev, visible: false }));
  };

  return (
    <PromptContext.Provider value={{ showUniversalPrompt }}>
      {children}
      <Modal
        visible={promptState.visible}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View style={styles.overlay}>
          <View style={[styles.container, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{promptState.title}</Text>
            {promptState.message ? (
              <Text style={[styles.message, { color: colors.textSecondary }]}>
                {promptState.message}
              </Text>
            ) : null}
            
            <TextInput
              style={[styles.input, { 
                borderColor: colors.border, 
                color: colors.textPrimary,
                backgroundColor: colors.background 
              }]}
              value={inputValue}
              onChangeText={setInputValue}
              secureTextEntry={promptState.type === 'secure-text'}
              placeholderTextColor={colors.textTertiary}
              autoFocus
            />
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton, { backgroundColor: colors.background }]}
                onPress={handleCancel}
              >
                <Text style={[styles.buttonText, { color: colors.textSecondary }]}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.button, styles.confirmButton, { backgroundColor: colors.primary }]}
                onPress={handleConfirm}
              >
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </PromptContext.Provider>
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
    maxWidth: 300,
    borderRadius: 12,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    minWidth: 60,
    alignItems: 'center',
  },
  cancelButton: {
    borderWidth: 1,
  },
  confirmButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export const useUniversalPrompt = () => {
  const context = useContext(PromptContext);
  if (!context) {
    throw new Error('useUniversalPrompt must be used within UniversalPromptProvider');
  }
  return context;
};
