// app/(teacher)/index.tsx - REDESIGNED
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

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { colors } = useThemeContext();
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

  useEffect(() => {
    loadDashboardData();
  }, []);

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
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
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
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: `${color}20` }]}>
          <Ionicons name={icon as any} size={20} color={color} />
        </View>
        {trend && (
          <Text style={[styles.trendText, { color: colors.success }]}>{trend}</Text>
        )}
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
      <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>{subtitle}</Text>
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
      <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>{title}</Text>
      <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>{description}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading your dashboard...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
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
        <View style={styles.headerContent}>
          <View style={styles.headerText}>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: colors.textPrimary }]}>
              {user?.profile?.name || 'Teacher'}
            </Text>
            <Text style={[styles.date, { color: colors.textTertiary }]}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric'
              })}
            </Text>
          </View>
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
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Overview</Text>
        <View style={styles.statsGrid}>
          <StatCard
            title="Active Exams"
            value={stats.activeExams}
            subtitle="Currently running"
            icon="document-text"
            color={colors.primary}
            trend="+12%"
          />
          <StatCard
            title="Students"
            value={stats.totalStudents}
            subtitle="Total enrolled"
            icon="people"
            color={colors.success}
            trend="+8%"
          />
          <StatCard
            title="Avg. Score"
            value={`${stats.averageScore}%`}
            subtitle="Class average"
            icon="trending-up"
            color={colors.warning}
            trend="+5%"
          />
          <StatCard
            title="Engagement"
            value={`${stats.studentEngagement}%`}
            subtitle="Student activity"
            icon="pulse"
            color={colors.error}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <QuickActionCard
            title="Create Exam"
            description="Design new assessment"
            icon="document-text"
            color={colors.primary}
            onPress={() => router.push('/(teacher)/create-exam')}
          />
          <QuickActionCard
            title="Assign Work"
            description="Create homework"
            icon="book"
            color={colors.success}
            onPress={() => router.push('/(teacher)/create-homework')}
          />
          <QuickActionCard
            title="My Classes"
            description="Manage students"
            icon="people"
            color={colors.purple}
            onPress={() => router.push('/(teacher)/my-classes')}
          />
          <QuickActionCard
            title="Analytics"
            description="View insights"
            icon="bar-chart"
            color={colors.warning}
            onPress={() => router.push('/(teacher)/statistics')}
          />
        </View>
      </View>

      {/* Recent Activity */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Recent Activity</Text>
          <TouchableOpacity onPress={() => router.push('/(teacher)/activity')}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>View All</Text>
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
                    borderBottomWidth: index !== recentActivity.length - 1 ? 1 : 0
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
                <View style={styles.activityContent}>
                  <Text style={[styles.activityTitle, { color: colors.textPrimary }]}>
                    {activity.title}
                  </Text>
                  <Text style={[styles.activityDescription, { color: colors.textSecondary }]}>
                    {activity.description}
                  </Text>
                  <Text style={[styles.activityDate, { color: colors.textTertiary }]}>
                    {new Date(activity.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(activity.status)}15` }]}>
                  <Text
                    style={[styles.statusText, { color: getStatusColor(activity.status) }]}
                  >
                    {activity.status}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="time" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyStateTitle, { color: colors.textSecondary }]}>
                No recent activity
              </Text>
              <Text style={[styles.emptyStateSubtitle, { color: colors.textTertiary }]}>
                Your recent activities will appear here
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Additional Stats */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Performance Insights</Text>
        <View style={styles.insightsGrid}>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="school" size={24} color={colors.success} />
            <Text style={[styles.insightValue, { color: colors.textPrimary }]}>
              {stats.classesCount}
            </Text>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Classes</Text>
          </View>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="library" size={24} color={colors.primary} />
            <Text style={[styles.insightValue, { color: colors.textPrimary }]}>
              {stats.subjectsCount}
            </Text>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Subjects</Text>
          </View>
          <View style={[styles.insightCard, { backgroundColor: colors.backgroundElevated }]}>
            <Ionicons name="time" size={24} color={colors.warning} />
            <Text style={[styles.insightValue, { color: colors.textPrimary }]}>
              {stats.responseTime}
            </Text>
            <Text style={[styles.insightLabel, { color: colors.textSecondary }]}>Avg. Response</Text>
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
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerText: {
    flex: 1,
  },
  greeting: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  },
  userName: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  },
  date: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...designTokens.shadows.sm,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: designTokens.borderRadius.full,
  },
  section: {
    paddingHorizontal: designTokens.spacing.xl,
    marginTop: designTokens.spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.md,
  },
  viewAllText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.sm,
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  },
  statTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  },
  statSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
  },
  quickActionCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.sm,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.md,
  },
  actionTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  },
  actionDescription: {
    fontSize: designTokens.typography.caption1.fontSize,
  },
  activityCard: {
    borderRadius: designTokens.borderRadius.xl,
    ...designTokens.shadows.sm,
    overflow: 'hidden',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.lg,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs,
  },
  activityDescription: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xs,
  },
  activityDate: {
    fontSize: designTokens.typography.caption2.fontSize,
  },
  statusBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  emptyState: {
    padding: designTokens.spacing.xxl,
    alignItems: 'center',
  },
  emptyStateTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs,
  },
  emptyStateSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
  },
  insightsGrid: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
  },
  insightCard: {
    flex: 1,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  insightValue: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginTop: designTokens.spacing.sm,
    marginBottom: designTokens.spacing.xs,
  },
  insightLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
  },
  bottomSpacing: {
    height: designTokens.spacing.xxl,
  },
};
