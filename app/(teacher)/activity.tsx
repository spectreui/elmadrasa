// app/(teacher)/activity.tsx - Teacher Recent Activities Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { router } from 'expo-router';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { RecentActivity } from '../../src/types';
import { designTokens } from '../../src/utils/designTokens';
import { useTranslation } from '@/hooks/useTranslation';
import { useAuth } from '@/contexts/AuthContext';
import Alert from '@/components/Alert';

export default function TeacherActivity() {
  const { fontFamily, colors } = useThemeContext();
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, language, isRTL } = useTranslation();
  const { isOnline } = useAuth();

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const response = await apiService.getRecentTeacherActivity();
      
      if (response.data.success) {
        setActivities(response.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Show offline message if offline
      if (!isOnline) {
        Alert.alert(
          t("common.offline"),
          t("dashboard.offlineMessage"),
          [{ text: t("common.ok") }]
        );
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadActivities();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return colors.success;
      case 'pending': return colors.warning;
      case 'grading': return colors.primary;
      default: return colors.textTertiary;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return 'document-text';
      case 'homework': return 'book';
      case 'announcement': return 'megaphone';
      case 'grading': return 'checkmark-circle';
      default: return 'document';
    }
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t("common.loading")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { fontFamily, backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl 
          refreshing={refreshing} 
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          enabled={isOnline}
        />
      }
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons 
              name={isRTL ? "arrow-forward" : "arrow-back"} 
              size={24} 
              color={colors.textPrimary} 
            />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
            {t("dashboard.recentActivity")}
          </Text>
          <View style={{ width: 24 }} /> {/* Spacer for alignment */}
        </View>
      </View>

      {/* Activities List */}
      <View style={styles.section}>
        {activities.length > 0 ? (
          activities.map((activity, index) => (
            <TouchableOpacity
              key={activity.id}
              style={[
                styles.activityItem,
                { 
                  backgroundColor: colors.backgroundElevated,
                  borderBottomColor: colors.border,
                  borderBottomWidth: index !== activities.length - 1 ? 1 : 0,
                  flexDirection: isRTL ? 'row-reverse' : 'row'
                }
              ]}
              activeOpacity={0.7}
              onPress={() => {
                // Navigate based on activity type
                if (activity.type === 'exam') {
                  router.push(`/(teacher)/exams/${activity.id}`);
                } else if (activity.type === 'homework') {
                  router.push(`/(teacher)/homework/${activity.id}/submissions`);
                }
              }}
            >
              <View style={[styles.activityIcon, { backgroundColor: `${getStatusColor(activity.status)}15` }]}>
                <Ionicons
                  name={getTypeIcon(activity.type) as any}
                  size={20}
                  color={getStatusColor(activity.status)}
                />
              </View>
              <View style={[styles.activityContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                <Text style={[styles.activityTitle, {  fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {activity.title}
                </Text>
                <Text style={[styles.activityDescription, {  fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {activity.description.replace('Created for', t("dashboard.createdFor")).replace('Score', t("dashboard.score")).replace('Assigned to', t("dashboard.assignedTo"))}
                </Text>
                <Text style={[styles.activityDate, { fontFamily, color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {new Date(activity.date).toLocaleDateString(language === 'ar' ? 'ar-eg' : 'en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </Text>
              </View>
              <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(activity.status)}15` }]}>
                <Text
                  style={[styles.statusText, { fontFamily, color: getStatusColor(activity.status) }]}
                >
                  {t(activity.status)}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={[styles.emptyState, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="time" size={48} color={colors.textTertiary} />
            <Text style={[styles.emptyStateTitle, { fontFamily, color: colors.textSecondary }]}>
              {t("dashboard.noActivity")}
            </Text>
            <Text style={[styles.emptyStateSubtitle, { fontFamily, color: colors.textTertiary }]}>
              {t("dashboard.noActivityDesc")}
            </Text>
          </View>
        )}
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingBottom: 40
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  } as any,
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  } as any,
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
  } as any,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  } as any,
  backButton: {
    padding: designTokens.spacing.sm,
  } as any,
  headerTitle: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
  } as any,
  section: {
    paddingHorizontal: designTokens.spacing.xl,
    marginTop: designTokens.spacing.md,
  } as any,
  activityItem: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
    ...designTokens.shadows.sm,
  } as any,
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: designTokens.spacing.md,
  } as any,
  activityContent: {
    flex: 1,
  } as any,
  activityTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  } as any,
  activityDescription: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xs,
  } as any,
  activityDate: {
    fontSize: designTokens.typography.caption2.fontSize,
  } as any,
  statusBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
    alignSelf: 'flex-start',
    marginTop: designTokens.spacing.sm,
  } as any,
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  } as any,
  emptyState: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xxl,
    alignItems: 'center',
    ...designTokens.shadows.sm,
  } as any,
  emptyStateTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs,
  } as any,
  emptyStateSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
  } as any,
  bottomSpacing: {
    height: designTokens.spacing.xxl,
  } as any,
};
