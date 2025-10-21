// app/(student)/index.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { designTokens } from "../../src/utils/designTokens";
import { useThemeContext } from "../../src/contexts/ThemeContext";
import Animated, { FadeIn, FadeInUp } from 'react-native-reanimated';
import { useTranslation } from "@/hooks/useTranslation";

export default function StudentDashboard() {
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  const { isDark, colors, fontFamily, toggleTheme } = useThemeContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load real data from API
      const [statsResponse, examsResponse] = await Promise.all([
        apiService.getStudentDashboard(),
        apiService.getUpcomingExams()
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (examsResponse.data.success) {
        setUpcomingExams(examsResponse.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({ title, value, icon, color, index }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    index: number;
  }) => (
    <Animated.View
      entering={FadeInUp.delay(index * 100)}
      style={[
        styles.statCard,
        {
          backgroundColor: colors.backgroundElevated,
          ...designTokens.shadows.md,
        }
      ]}
    >
      <View style={[styles.statIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text
        style={[
          styles.statValue,
          { fontFamily, color: colors.textPrimary }
        ]}
      >
        {value}
      </Text>
      <Text
        style={[
          styles.statLabel,
          { fontFamily, color: colors.textTertiary }
        ]}
      >
        {title}
      </Text>
    </Animated.View>
  );

  const QuickAction = ({ title, icon, onPress, color }: {
    title: string;
    icon: string;
    onPress: () => void;
    color: string;
  }) => (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.quickAction,
        {
          backgroundColor: colors.backgroundElevated,
          ...designTokens.shadows.sm,
        }
      ]}
    >
      <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={24} color={color} />
      </View>
      <Text
        style={[
          styles.actionText,
          { fontFamily, color: colors.textPrimary }
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const UpcomingExamCard = ({ exam }: { exam: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/exam/${exam.id}`)}
      style={[
        styles.examCard,
        {
          backgroundColor: colors.backgroundElevated,
          ...designTokens.shadows.sm,
        }
      ]}
    >
      <View style={[styles.examCardRow, isRTL && styles.rtlRow]}>
        <View style={[styles.examIcon, { backgroundColor: '#007AFF15' }]}>
          <Ionicons name="document-text" size={20} color="#007AFF" />
        </View>
        <View style={styles.examInfo}>
          <Text
            style={[
              styles.examTitle,
              { fontFamily, color: colors.textPrimary }
            ]}
            numberOfLines={1}
          >
            {exam.title}
          </Text>
          <Text
            style={[
              styles.examDetails,
              { fontFamily, color: colors.textSecondary }
            ]}
          >
            {exam.subject} • {t('dashboard.due')} {new Date(exam.due_date).toLocaleDateString()}
          </Text>
        </View>
        <Ionicons 
          name={isRTL ? "chevron-back" : "chevron-forward"} 
          size={20} 
          color={colors.textTertiary} 
        />
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
          {t("dashboard.loading")}
        </Text>
      </View>
    );
  }

  return (
    <Animated.ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
      entering={FadeIn.duration(600)}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerRow, isRTL && styles.rtlRow]}>
          <View style={[styles.userInfo, isRTL && styles.rtlRow]}>
            <View style={[styles.userAvatar, { backgroundColor: '#007AFF15' }]}>
              <Text style={[styles.avatarText, { fontFamily, color: '#007AFF' }]}>
                {user?.profile?.name?.charAt(0) || 'S'}
              </Text>
            </View>
            <View>
              <Text
                style={[
                  styles.welcomeText,
                  { fontFamily, color: colors.textPrimary }
                ]}
              >
                {t('dashboard.welcomeBack')}
              </Text>
              <Text
                style={[
                  styles.userName,
                  { fontFamily, color: colors.textPrimary }
                ]}
              >
                {user?.profile?.name || t('common.student')}
              </Text>
              <Text
                style={[
                  styles.userClass,
                  { fontFamily, color: colors.textSecondary }
                ]}
              >
                {user?.profile?.class ? `${t('classes.class')} ${user.profile.class}` : t('dashboard.noClassAssigned')}
              </Text>
            </View>
          </View>

          {/* Dark Mode Toggle */}
          <TouchableOpacity
            onPress={toggleTheme}
            style={[styles.themeToggle, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm }]}
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={24}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={[styles.statsRow, isRTL && styles.rtlRow]}>
          <StatCard
            title={t("dashboard.avgScore")}
            value={stats?.averageScore ? `${stats.averageScore}%` : '--%'}
            icon="trending-up"
            color="#34C759"
            index={0}
          />

          <StatCard
            title={t("dashboard.examsTaken")}
            value={stats?.examsCompleted || 0}
            icon="checkmark-circle"
            color="#007AFF"
            index={1}
          />
        </View>

        <View style={[styles.statsRow, isRTL && styles.rtlRow]}>
          <StatCard
            title={t("dashboard.upcomingExams")}
            value={stats?.upcomingExams || 0}
            icon="calendar"
            color="#FF9500"
            index={2}
          />

          <StatCard
            title={t("dashboard.pendingHomework")}
            value={stats?.pendingHomework || 0}
            icon="book"
            color="#AF52DE"
            index={3}
          />
        </View>
      </View>

      {/* Quick Actions */}
      <View style={[styles.section, {marginBottom: designTokens.spacing.md}]}>
        <Text
          style={[
            styles.sectionTitle,
            {marginBottom: designTokens.spacing.md, fontFamily, color: colors.textPrimary }
          ]}
        >
          {t("dashboard.quickActions")}
        </Text>
        <View style={[styles.actionsRow, isRTL && styles.rtlRow]}>
          <QuickAction
            title={t("dashboard.takeExam")}
            icon="play-circle"
            onPress={() => router.push("/(student)/exams")}
            color="#007AFF"
          />

          <QuickAction
            title={t("dashboard.homework")}
            icon="book"
            onPress={() => router.push("/(student)/homework")}
            color="#34C759"
          />

          <QuickAction
            title={t("dashboard.results")}
            icon="bar-chart"
            onPress={() => router.push("/(student)/results")}
            color="#FF9500"
          />
        </View>
      </View>

      {/* Upcoming Exams */}
      <View style={[styles.section, {marginBottom: 110}]}>
        <View style={[styles.sectionHeader, isRTL && styles.rtlRow]}>
          <Text
            style={[
              styles.sectionTitle,
              { fontFamily, color: colors.textPrimary }
            ]}
          >
            {t("dashboard.upcomingExams")}
          </Text>
          <TouchableOpacity onPress={() => router.push("/(student)/exams")}>
            <Text
              style={[
                styles.viewAllText,
                { fontFamily, color: colors.primary }
              ]}
            >
              {t("common.viewAll")}
            </Text>
          </TouchableOpacity>
        </View>

        {upcomingExams.length === 0 ? (
          <View
            style={[
              styles.emptyContainer,
              {
                backgroundColor: colors.backgroundElevated,
                ...designTokens.shadows.sm,
              }
            ]}
          >
            <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            <Text
              style={[
                styles.emptyTitle,
                { fontFamily, color: colors.textSecondary }
              ]}
            >
              {t("dashboard.noUpcomingExams")}
            </Text>
            <Text
              style={[
                styles.emptyText,
                { fontFamily, color: colors.textTertiary }
              ]}
            >
              {t("dashboard.allCaughtUp")}
            </Text>
          </View>
        ) : (
          upcomingExams.slice(0, 3).map((exam) => (
            <UpcomingExamCard key={exam.id} exam={exam} />
          ))
        )}
      </View>
    </Animated.ScrollView>
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
  header: {
    padding: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
  },
  welcomeText: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight,
  },
  userName: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
  },
  userClass: {
    fontSize: designTokens.typography.footnote.fontSize,
    marginTop: 2,
  },
  themeToggle: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
  },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: -designTokens.spacing.xs,
    marginBottom: designTokens.spacing.xl,
  },
  statCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    flex: 1,
    marginHorizontal: designTokens.spacing.xs,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  section: {
    paddingHorizontal: designTokens.spacing.xl,
    marginBottom: designTokens.spacing.xxxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md,
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
  },
  actionsRow: {
    flexDirection: 'row',
    marginHorizontal: -designTokens.spacing.xs,
  },
  quickAction: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.sm,
    flex: 1,
    marginHorizontal: designTokens.spacing.xs,
    alignItems: 'center',
  },
  actionIcon: {
    width: 50,
    height: 50,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  actionText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  examCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm,
  },
  examCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  examIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md,
  },
  examInfo: {
    flex: 1,
  },
  examTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: designTokens.typography.headline.fontWeight,
    marginBottom: 2,
  },
  examDetails: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  viewAllText: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
  },
  emptyContainer: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xl,
    alignItems: 'center',
    ...designTokens.shadows.sm,
  },
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xs,
  },
  emptyText: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
  },
  rtlRow: {
    flexDirection: 'row-reverse',
  },
});
