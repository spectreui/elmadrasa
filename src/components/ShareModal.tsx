// src/components/ShareModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Platform,
  Linking,
  ToastAndroid,
  Alert as RNAlert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
// @ts-ignore
import * as Clipboard from 'expo-clipboard';
import { useThemeContext } from '../contexts/ThemeContext';
import { designTokens } from '../utils/designTokens';

interface ShareModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  link: string;
  subject?: string;
}

export const ShareModal = ({ visible, onClose, title, link, subject }: ShareModalProps) => {
  const { fontFamily, colors, isDark } = useThemeContext();
  const [copying, setCopying] = useState(false);
    

  const copyToClipboard = async () => {
    setCopying(true);
    try {
      await Clipboard.setStringAsync(link);
      
      if (Platform.OS === 'android') {
        ToastAndroid.show('Link copied to clipboard!', ToastAndroid.SHORT);
      } else {
        RNAlert.alert('Success', 'Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      RNAlert.alert('Error', 'Failed to copy link');
    } finally {
      setCopying(false);
      onClose();
    }
  };

  const shareLink = async () => {
    try {
      await Sharing.shareAsync(link, {
        dialogTitle: `Share ${subject || 'Assignment'}`,
        message: `${title}\n\n${link}`,
      });
    } catch (error) {
      console.error('Sharing failed:', error);
      RNAlert.alert('Error', 'Unable to share at this time');
    }
  };

  const openInBrowser = async () => {
    try {
      await Linking.openURL(link);
      onClose();
    } catch (error) {
      console.error('Failed to open link:', error);
      RNAlert.alert('Error', 'Unable to open link in browser');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.backgroundElevated }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
              Share {subject || 'Assignment'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <Text style={[styles.linkPreview, { color: colors.textSecondary }]} numberOfLines={1}>
            {link}
          </Text>

          <View style={styles.optionsContainer}>
            <TouchableOpacity 
              style={[styles.optionButton, { backgroundColor: colors.background }]}
              onPress={copyToClipboard}
              disabled={copying}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#3B82F615' }]}>
                <Ionicons name="copy" size={20} color="#3B82F6" />
              </View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                {copying ? 'Copying...' : 'Copy Link'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, { backgroundColor: colors.background }]}
              onPress={shareLink}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#10B98115' }]}>
                <Ionicons name="share-social" size={20} color="#10B981" />
              </View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                Share
              </Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.optionButton, { backgroundColor: colors.background }]}
              onPress={openInBrowser}
            >
              <View style={[styles.optionIcon, { backgroundColor: '#8B5CF615' }]}>
                <Ionicons name="open" size={20} color="#8B5CF6" />
              </View>
              <Text style={[styles.optionText, { color: colors.textPrimary }]}>
                Open in Browser
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={[styles.cancelButton, { backgroundColor: colors.background }]}
            onPress={onClose}
          >
            <Text style={[styles.cancelText, { color: colors.textPrimary }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
    padding: designTokens.spacing.lg,
  },
  modalContainer: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  modalTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  linkPreview: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xl,
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.md,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.lg,
  },
  optionButton: {
    alignItems: 'center',
    padding: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    width: '30%',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  optionText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
  },
});
