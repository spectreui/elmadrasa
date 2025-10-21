// app/(student)/homework/index.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import Alert from '@/components/Alert';

import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import Animated, { FadeInUp, Layout, FadeIn } from 'react-native-reanimated';
import { useTranslation } from '@/hooks/useTranslation';

// Add this helper function before the StudentHomeworkScreen component
const getGradeColor = (grade: number, maxPoints: number) => {
  const percentage = (grade / maxPoints) * 100;

  if (percentage >= 70) {
    return {
      text: '#10B981', // green
      bg: '#10B98115'
    };
  } else if (percentage >= 50) {
    return {
      text: '#F59E0B', // yellow
      bg: '#F59E0B15'
    };
  } else {
    return {
      text: '#EF4444', // red
      bg: '#EF444415'
    };
  }
};

export default function StudentHomeworkScreen() {
  const { t, isRTL } = useTranslation();
  const { fontFamily, colors, isDark } = useThemeContext();
  const [homework, setHomework] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHomework();

      if (response.data.success) {
        console.log('📚 Loaded homework:', response.data.data);
        setHomework(response.data.data || []);
      } else {
        throw new Error(response.data.error || t('homework.errors.loadFailed'));
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert(t('common.error'), error.message || t('homework.errors.loadFailed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomework();
  };

  const getDueStatus = (dueDate: string, submitted: boolean, grade: number | null) => {
    if (submitted) {
      if (grade !== null) {
        return {
          status: 'graded',
          color: { bg: '#3B82F615', border: '#3B82F6', text: '#3B82F6' },
          text: t('homework.graded')
        };
      } else {
        return {
          status: 'submitted',
          color: { bg: '#8B5CF615', border: '#8B5CF6', text: '#8B5CF6' },
          text: t('homework.submitted')
        };
      }
    }

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();

    if (diffTime < 0) return {
      status: 'overdue',
      color: { bg: '#EF444415', border: '#EF4444', text: '#EF4444' },
      text: t('homework.overdue')
    };

    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));

    if (diffHours <= 24) return {
      status: 'due',
      color: { bg: '#F59E0B15', border: '#F59E0B', text: '#F59E0B' },
      text: `${t('homework.dueIn')} ${diffHours}${t('homework.hours')}`
    };
    if (diffDays <= 2) return {
      status: 'soon',
      color: { bg: '#F59E0B15', border: '#F59E0B', text: '#F59E0B' },
      text: `${t('homework.dueIn')} ${diffDays}${t('homework.days')}`
    };
    return {
      status: 'pending',
      color: { bg: '#10B98115', border: '#10B981', text: '#10B981' },
      text: `${diffDays}${t('homework.daysLeft')}`
    };
  };

  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  const HomeworkCard = ({ item }: { item: any }) => {
    const dueStatus = getDueStatus(item.due_date, item.submitted, item.grade);

    return (
      <TouchableOpacity
        style={[
          styles.card,
          {
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
          },
          isRTL && styles.rtlCard
        ]}
        onPress={() => router.push(`/homework/${item.id}?t=${Date.now()}`)}
        activeOpacity={0.8}
      >
        {/* Header with title and status */}
        <View style={[styles.cardHeader, isRTL && styles.rtlRow]}>
          <View style={styles.titleContainer}>
            <Text
              style={[
                styles.title,
                {
                  fontFamily,
                  color: colors.textPrimary,
                }
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[
                styles.description,
                { fontFamily, color: colors.textSecondary }
              ]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          </View>

          <View style={[
            styles.statusBadge,
            {
              backgroundColor: dueStatus.color.bg,
              borderColor: dueStatus.color.border,
            }
          ]}>
            <Text style={[
              styles.statusText,
              { fontFamily, color: dueStatus.color.text }
            ]}>
              {dueStatus.text}
            </Text>
          </View>
        </View>

        {/* Tags section */}
        <View style={[styles.tagContainer, isRTL && styles.rtlRow]}>
          <View style={styles.tag}>
            <Ionicons name="book" size={12} color={colors.textSecondary} />
            <Text style={[styles.tagText, { fontFamily, color: colors.textSecondary }]}>
              {item.subject}
            </Text>
          </View>
          <View style={styles.tag}>
            <Ionicons name="star" size={12} color={colors.textSecondary} />
            <Text style={[styles.tagText, { fontFamily, color: colors.textSecondary }]}>
              {item.points} {t('common.points')}
            </Text>
          </View>
          {item.attachments && (
            <View style={[styles.tag, { backgroundColor: '#3B82F615' }]}>
              <Ionicons name="attach" size={12} color="#3B82F6" />
              <Text style={[styles.tagText, { fontFamily, color: '#3B82F6' }]}>
                {t('homework.file')}
              </Text>
            </View>
          )}
        </View>

        {/* Footer with teacher and due date */}
        <View style={[styles.cardFooter, isRTL && styles.rtlRow]}>
          <View style={[styles.footerLeft, isRTL && styles.rtlRow]}>
            <View style={[styles.footerItem, isRTL && styles.rtlRow]}>
              <Ionicons name="person-circle" size={16} color={colors.textSecondary} />
              <Text style={[styles.footerText, { fontFamily, color: colors.textSecondary, ...(isRTL ? { marginRight: 4 } : { marginLeft: 4 }) }]}>
                {item.teacher?.profile?.name || t('common.teacher')}
              </Text>
            </View>
            <View style={styles.dot} />
            <View style={[styles.footerItem, isRTL && styles.rtlRow]}>
              <Ionicons name="calendar" size={16} color={colors.textSecondary} />
              <Text style={[styles.footerText, { fontFamily, color: colors.textSecondary, ...(isRTL ? { marginRight: 4 } : { marginLeft: 4 }) }]}>
                {formatDueDate(item.due_date)}
              </Text>
            </View>
          </View>

          <View style={[styles.footerRight, isRTL && styles.rtlRow]}>
            {item.submitted && item.grade !== null ? (
              <View style={[
                styles.gradeBadge,
                {
                  backgroundColor: getGradeColor(item.grade, item.points).bg,
                  borderColor: getGradeColor(item.grade, item.points).text + '40'
                }
              ]}>
                <Text style={[
                  styles.gradeText,
                  { fontFamily, color: getGradeColor(item.grade, item.points).text }
                ]}>
                  {item.grade}/{item.points}
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.actionText, { fontFamily, color: colors.primary }]}>
                  {item.submitted ? t('homework.view') : t('homework.start')}
                </Text>
                <Ionicons 
                  name={isRTL ? "chevron-back" : "chevron-forward"} 
                  size={16} 
                  color={colors.primary} 
                />
              </>
            )}
          </View>
        </View>

        {/* Feedback section */}
        {item.feedback && (
          <View style={[
            styles.feedbackContainer,
            {
              backgroundColor: isDark ? '#1E40AF20' : '#3B82F610',
              borderLeftColor: '#3B82F6',
            },
            isRTL && styles.rtlFeedback
          ]}>
            <View style={[styles.feedbackHeader, isRTL && styles.rtlRow]}>
              <Ionicons name="chatbubble-ellipses" size={14} color="#3B82F6" />
              <Text style={[styles.feedbackTitle, { fontFamily, color: '#3B82F6' }]}>
                {t('homework.teacherFeedback')}
              </Text>
            </View>
            <Text style={[styles.feedbackText, { fontFamily, color: colors.textSecondary }]}>
              {item.feedback}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t('homework.loading')}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
          {t('homework.title')}
        </Text>
        <Text style={[styles.headerSubtitle, { fontFamily, color: colors.textSecondary }]}>
          {homework.length} {t('homework.assignments')}
        </Text>
      </View>

      <Animated.ScrollView
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(600)}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.content}>
          {homework.length === 0 ? (
            <View style={[
              styles.emptyContainer,
              {
                backgroundColor: colors.backgroundElevated,
                ...designTokens.shadows.sm,
              }
            ]}>
              <View style={[
                styles.emptyIconContainer,
                { backgroundColor: isDark ? '#37415130' : '#E5E7EB' }
              ]}>
                <Ionicons name="checkmark-circle" size={48} color={colors.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { fontFamily, color: colors.textPrimary }]}>
                {t('homework.emptyState.title')}
              </Text>
              <Text style={[styles.emptyText, { fontFamily, color: colors.textSecondary }]}>
                {t('homework.emptyState.subtitle')}
              </Text>
            </View>
          ) : (
            homework.map((item, index) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(index * 100)}
                layout={Layout.springify()}
              >
                <HomeworkCard item={item} />
              </Animated.View>
            ))
          )}
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    paddingTop: designTokens.spacing.xxxl,
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.lg,
  },
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    marginBottom: designTokens.spacing.xs,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    opacity: 0.7,
  },
  content: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: 70,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
  },
  card: {
    borderRadius: 20,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.md,
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md,
  },
  titleContainer: {
    flex: 1,
    marginRight: designTokens.spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
    lineHeight: 24,
  },
  description: {
    fontSize: designTokens.typography.body.fontSize,
    lineHeight: 20,
    opacity: 0.8,
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  gradeBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
    borderWidth: 1,
    marginLeft: designTokens.spacing.xs,
  },
  gradeText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.lg,
  },
  tag: {
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '500',
    marginLeft: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  footerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  footerText: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginLeft: 4,
    opacity: 0.8,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(156, 163, 175, 0.5)',
    marginHorizontal: designTokens.spacing.sm,
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginLeft: 4,
    marginRight: 2,
  },
  feedbackContainer: {
    marginTop: designTokens.spacing.md,
    padding: designTokens.spacing.md,
    borderRadius: 16,
    borderLeftWidth: 3,
  },
  feedbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
  },
  feedbackTitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginLeft: designTokens.spacing.xs,
  },
  feedbackText: {
    fontSize: designTokens.typography.caption1.fontSize,
    lineHeight: 18,
  },
  emptyContainer: {
    borderRadius: 20,
    padding: designTokens.spacing.xxl,
    alignItems: 'center',
    marginTop: designTokens.spacing.xl,
  },
  emptyIconContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.lg,
  },
  emptyTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginBottom: designTokens.spacing.xs,
  },
  emptyText: {
    fontSize: designTokens.typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    opacity: 0.7,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
  rtlCard: {
    borderLeftWidth: 0,
    borderRightWidth: 0.5,
  },
  rtlFeedback: {
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderRightColor: '#3B82F6',
  },
});
