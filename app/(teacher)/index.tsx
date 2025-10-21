// app/(teacher)/index.tsx - RTL SUPPORT ADDED
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Pressable,
  Image
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { TeacherDashboardStats, RecentActivity } from '../../src/types';
import { designTokens } from '../../src/utils/designTokens';
import { useTranslation } from '@/hooks/useTranslation';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { fontFamily, colors } = useThemeContext();
  const [stats, setStats] = useState<TeacherDashboardStats>({
    activeExams: 0,
    totalStudents: 0,
    averageScore: 0,
    pendingGrading: 0,
    classesCount: 0,
    totalExams: 0,
    totalSubmissions: 0,
    subjectsCount: 0,
    recentActivity: [],
    studentEngagement: 0,
    responseTime: 'N/A',
    performanceTrends: [],
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { t, language, setLanguage, isRTL } = useTranslation();

  useEffect(() => {
    loadDashboardData();
  }, []);


  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [statsResponse, activityResponse, profileStatsResponse] = await Promise.all([
        apiService.getTeacherDashboardStats(),
        apiService.getRecentTeacherActivity(),
        apiService.getTeacherProfileStats()
      ]);

      if (statsResponse.data.success) {
        setStats(prev => ({ ...prev, ...statsResponse.data.data }));
      }

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data || []);
      }

      if (profileStatsResponse.data.success) {
        setStats(prev => ({ ...prev, ...profileStatsResponse.data.data }));
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'goodMorning';
    if (hour < 17) return 'goodAfternoon';
    return 'goodEvening';
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

  const StatCard = ({
    title,
    value,
    subtitle,
    icon,
    color,
    trend
  }: {
    title: string;
    value: string | number;
    subtitle: string;
    icon: string;
    color: string;
    trend?: string;
  }) => (
    <View style={[styles.statCard, { backgroundColor: colors.backgroundElevated }]}>
      <View style={[styles.statHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trend && (
          <Text style={[styles.trendText, { fontFamily, color: colors.success }]}>{trend}</Text>
        )}
      </View>
      <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statTitle, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>{subtitle}</Text>
    </View>
  );

  const QuickActionCard = ({
    title,
    description,
    icon,
    color,
    onPress
  }: {
    title: string;
    description: string;
    icon: string;
    color: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity
      style={[styles.quickActionCard, { backgroundColor: colors.backgroundElevated }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.actionIcon, { backgroundColor: color }]}>
        <Ionicons name={icon as any} size={24} color="white" />
      </View>
      <Text style={[styles.actionTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <Text style={[styles.actionDescription, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{description}</Text>
    </TouchableOpacity>
  );

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
        />
      }
    >
      {/* Header Section */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated }]}>
        <View style={[styles.headerContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.headerText, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[styles.greeting, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
              {t(getGreeting())},
            </Text>
            <Text style={[styles.userName, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
              {user?.profile?.name || 'Teacher'}
            </Text>
            <Text style={[styles.date, { fontFamily, color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
              {new Date().toLocaleDateString(language === 'ar' ? 'ar-eg' : 'en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
          <TouchableOpacity
            onPress={toggleLanguage}
            style={[styles.profileButton, { backgroundColor: `${colors.primary}15` }]}
          >
            <Ionicons
              name={language === 'en' ? 'language' : 'globe'}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          <Pressable
            style={[styles.profileButton, { backgroundColor: `${colors.primary}15` }]}
            onPress={() => router.push('/(teacher)/profile')}
          >
            {user?.profile?.avatar ? (
              <Image
                source={{ uri: user.profile.avatar }}
                style={styles.avatar}
              />
            ) : (
              <Ionicons name="person" size={20} color={colors.primary} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.overview")}</Text>
        <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <StatCard
            title={t("dashboard.activeExams")}
            value={stats.activeExams}
            subtitle={t("dashboard.currentlyRunning")}
            icon="document-text"
            color={colors.primary}
            trend="+12%"
          />
          <StatCard
            title={t('dashboard.students')}
            value={stats.totalStudents}
            subtitle={t('dashboard.totalEnrolled')}
            icon="people"
            color={colors.success}
            trend="+8%"
          />
          <StatCard
            title={t('dashboard.avgScore')}
            value={`${stats.averageScore}%`}
            subtitle={t('dashboard.classAverage')}
            icon="trending-up"
            color={colors.warning}
            trend="+5%"
          />
          <StatCard
            title={t('dashboard.engagement')}
            value={`${stats.studentEngagement}%`}
            subtitle={t('dashboard.studentActivity')}
            icon="pulse"
            color={colors.error}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.quickActions")}</Text>
        <View style={[styles.actionsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <QuickActionCard
            title={t("dashboard.createExam")}
            description={t("dashboard.designAssessment")}
            icon="document-text"
            color={colors.primary}
            onPress={() => router.push('/(teacher)/create-exam')}
          />
          <QuickActionCard
            title={t("dashboard.assignWork")}
            description={t("dashboard.createHomework")}
            icon="book"
            color={colors.success}
            onPress={() => router.push('/(teacher)/homework/create')}
          />
          <QuickActionCard
            title={t("dashboard.myClasses")}
            description={t("dashboard.manageStudents")}
            icon="people"
            color={colors.accentSecondary}
            onPress={() => router.push('/(teacher)/my-classes')}
          />
          <QuickActionCard
            title={t("dashboard.analytics")}
            description={t("dashboard.viewInsights")}
            icon="bar-chart"
            color={colors.warning}
            onPress={() => router.push('/(teacher)/statistics')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={[styles.sectionHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.recentActivity")}</Text>
          <TouchableOpacity onPress={() => router.push('/(teacher)/activity')}>
            <Text style={[styles.viewAllText, { fontFamily, color: colors.primary }]}>{t("common.viewAll")}</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.activityCard, { backgroundColor: colors.backgroundElevated }]}>
          {recentActivity.length > 0 ? (
            recentActivity.map((activity, index) => (
              <TouchableOpacity
                key={activity.id}
                style={[
                  styles.activityItem,
                  {
                    borderBottomColor: colors.border,
                    borderBottomWidth: index !== recentActivity.length - 1 ? 1 : 0,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.activityIcon, { backgroundColor: `${getStatusColor(activity.status)}15` }]}>
                  <Ionicons
                    name={getTypeIcon(activity.type) as any}
                    size={20}
                    color={getStatusColor(activity.status)}
                  />
                </View>
                <View style={[styles.activityContent, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.activityTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityDescription, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
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
            <View style={styles.emptyState}>
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
      </View>

      {/* Additional Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.performanceInsights")}</Text>
        <View style={[styles.insightsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="school" size={24} color={colors.success} />
            <Text style={[styles.insightValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.classesCount}
            </Text>
            <Text style={[styles.insightLabel, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.classes")}</Text>
          </View>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="library" size={24} color={colors.primary} />
            <Text style={[styles.insightValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.subjectsCount}
            </Text>
            <Text style={[styles.insightLabel, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.subjects")}</Text>
          </View>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="time" size={24} color={colors.warning} />
            <Text style={[styles.insightValue, { fontFamily, color: colors.textPrimary }]}>
              {stats.responseTime}
            </Text>
            <Text style={[styles.insightLabel, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t("dashboard.avgResponse")}</Text>
          </View>
        </View>
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
    paddingBottom: designTokens.spacing.xl,
  } as any,
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  } as any,
  headerText: {
    flex: 1,
  } as any,
  greeting: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  } as any,
  userName: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  } as any,
  date: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  } as any,
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    margin: designTokens.spacing.xxs,
    ...designTokens.shadows.sm,
  } as any,
  avatar: {
    width: 32,
    height: 32,
    borderRadius: designTokens.borderRadius.full,
  } as any,
  section: {
    paddingHorizontal: designTokens.spacing.xl,
    marginTop: designTokens.spacing.xl,
  } as any,
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  } as any,
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.md,
  } as any,
  viewAllText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
  } as any,
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
  } as any,
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.sm,
  } as any,
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  } as any,
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  trendText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  } as any,
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  } as any,
  statTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  } as any,
  statSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
  } as any,
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
  } as any,
  quickActionCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.sm,
  } as any,
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.md,
  } as any,
  actionTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  } as any,
  actionDescription: {
    fontSize: designTokens.typography.caption1.fontSize,
  } as any,
  activityCard: {
    borderRadius: designTokens.borderRadius.xl,
    ...designTokens.shadows.sm,
    overflow: 'hidden',
  } as any,
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.lg,
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
  } as any,
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  } as any,
  emptyState: {
    padding: designTokens.spacing.xxl,
    alignItems: 'center',
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
  insightsGrid: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
  } as any,
  insightCard: {
    flex: 1,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    alignItems: 'center',
    ...designTokens.shadows.sm,
  } as any,
  insightValue: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginTop: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
  } as any,
  insightLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
  } as any,
  bottomSpacing: {
    height: designTokens.spacing.xxxl,
    paddingBottom: 100
  } as any,
};
