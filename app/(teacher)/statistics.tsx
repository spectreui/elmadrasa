// app/(teacher)/statistics.tsx - iOS-like Statistics Page
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  I18nManager,
  Dimensions
} from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import { ClassStats, PerformanceTrend } from '../../src/types';
import { useTranslation } from "@/hooks/useTranslation";

const { width } = Dimensions.get('window');

interface StatisticsData {
  classStats: ClassStats[];
  performanceTrend: PerformanceTrend[];
  totalExams: number;
  avgCompletion: number;
  activeStudents: number;
  pendingGrading: number;
}

export default function StatisticsScreen() {
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalExams: 0,
    avgCompletion: 0,
    activeStudents: 0,
    pendingGrading: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);
  const { fontFamily, colors } = useThemeContext();

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);

      const response = await apiService.getTeacherStats();

      if (response.data.success) {
        const data: StatisticsData = response.data.data;
        setClassStats(data.classStats || []);
        setPerformanceTrend(data.performanceTrend || []);
        setQuickStats({
          totalExams: data.totalExams || 0,
          avgCompletion: data.avgCompletion || 0,
          activeStudents: data.activeStudents || 0,
          pendingGrading: data.pendingGrading || 0
        });
      } else {
        setClassStats([]);
        setPerformanceTrend([]);
        setQuickStats({
          totalExams: 0,
          avgCompletion: 0,
          activeStudents: 0,
          pendingGrading: 0
        });
      }

    } catch (error) {
      console.error('Failed to load statistics:', error);
      setClassStats([]);
      setPerformanceTrend([]);
      setQuickStats({
        totalExams: 0,
        avgCompletion: 0,
        activeStudents: 0,
        pendingGrading: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getImprovementColor = (improvement: number | undefined) => {
    if (!improvement) return colors.textSecondary;
    if (improvement > 0) return colors.success;
    if (improvement < 0) return colors.error;
    return colors.textSecondary;
  };

  const getImprovementIcon = (improvement: number | undefined) => {
    if (!improvement) return 'remove';
    if (improvement > 0) return 'trending-up';
    return 'trending-down';
  };

  const getImprovementValue = (improvement: number | undefined) => {
    if (!improvement) return '0%';
    return `${improvement > 0 ? '+' : ''}${improvement}%`;
  };

  if (loading) {
    return (
      <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("dashboard.analytics")}
          </Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { fontFamily, color: colors.textSecondary }]}>
            {t("common.loading")}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { fontFamily, backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background }]}>
        <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
          {t("dashboard.analytics")}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Period Selector */}
        <View style={[styles.periodSelector, { backgroundColor: colors.backgroundElevated }]}>
          {([
            { key: 'week', label: t("statistics.thisWeek") },
            { key: 'month', label: t("statistics.thisMonth") },
            { key: 'year', label: t("statistics.thisYear") }
          ] as const).map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && {
                  backgroundColor: colors.primary,
                  ...styles.selectedPeriodButton
                }
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodText,
                  selectedPeriod === period.key
                    ? { fontFamily, color: colors.background }
                    : { fontFamily, color: colors.textSecondary }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Quick Stats */}
        <View style={[styles.quickStatsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.quickStatCard, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.quickStatLabel, { fontFamily, color: colors.textSecondary }]}>
              {t("statistics.totalExams")}
            </Text>
            <Text style={[styles.quickStatValue, { fontFamily, color: colors.textPrimary }]}>
              {quickStats.totalExams}
            </Text>
          </View>
          
          <View style={[styles.quickStatCard, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.quickStatLabel, { fontFamily, color: colors.textSecondary }]}>
              {t("statistics.avgCompletion")}
            </Text>
            <Text style={[styles.quickStatValue, { fontFamily, color: colors.textPrimary }]}>
              {quickStats.avgCompletion}%
            </Text>
          </View>
          
          <View style={[styles.quickStatCard, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.quickStatLabel, { fontFamily, color: colors.textSecondary }]}>
              {t("statistics.activeStudents")}
            </Text>
            <Text style={[styles.quickStatValue, { fontFamily, color: colors.textPrimary }]}>
              {quickStats.activeStudents}
            </Text>
          </View>
          
          <View style={[styles.quickStatCard, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.quickStatLabel, { fontFamily, color: colors.textSecondary }]}>
              {t("statistics.pendingGrading")}
            </Text>
            <Text style={[styles.quickStatValue, { fontFamily, color: colors.textPrimary }]}>
              {quickStats.pendingGrading}
            </Text>
          </View>
        </View>

        {/* Class Performance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("profile.classPerformance")}
          </Text>
          
          <View style={styles.classStatsList}>
            {classStats.length > 0 ? (
              classStats.map((stats, index) => (
                <View
                  key={stats.id || index}
                  style={[styles.classStatCard, { backgroundColor: colors.backgroundElevated }]}
                >
                  <View style={[styles.classStatHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.className, { fontFamily, color: colors.textPrimary }]}>
                      {stats.className}
                    </Text>
                    <View style={[styles.improvementContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Ionicons
                        name={getImprovementIcon(stats.improvement) as any}
                        size={14}
                        color={getImprovementColor(stats.improvement)}
                      />
                      <Text style={[
                        styles.improvementText, 
                        { fontFamily, color: getImprovementColor(stats.improvement) }
                      ]}>
                        {getImprovementValue(stats.improvement)}
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.statsGrid, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.statItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                        {stats.averageScore}%
                      </Text>
                      <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t("dashboard.avgScore")}
                      </Text>
                    </View>
                    <View style={[styles.statItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                        {stats.studentCount}
                      </Text>
                      <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t("dashboard.students")}
                      </Text>
                    </View>
                    <View style={[styles.statItem, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                      <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                        {stats.completedExams}
                      </Text>
                      <Text style={[styles.statLabel, { fontFamily, color: colors.textSecondary }]}>
                        {t("exams")}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyState, { backgroundColor: colors.backgroundElevated }]}>
                <Ionicons name="stats-chart" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { fontFamily, color: colors.textSecondary }]}>
                  {t("statistics.noClassData")}
                </Text>
                <Text style={[styles.emptySubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("statistics.noClassDataDesc")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance Trend */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("statistics.performanceTrend")}
          </Text>
          
          <View style={[styles.trendCard, { backgroundColor: colors.backgroundElevated }]}>
            {performanceTrend.length > 0 ? (
              <View style={styles.trendList}>
                {performanceTrend.map((trend, index) => (
                  <View 
                    key={index} 
                    style={[styles.trendItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  >
                    <Text style={[styles.trendMonth, { fontFamily, color: colors.textPrimary }]}>
                      {t(`months.${trend.month}`) || trend.month}
                    </Text>

                    <View style={[styles.trendBar, { backgroundColor: colors.background }]}>
                      <View
                        style={[
                          styles.trendFill,
                          {
                            backgroundColor: colors.primary,
                            width: `${(trend.averageScore / 100) * 100}%`,
                            alignSelf: isRTL ? 'flex-end' : 'flex-start'
                          }
                        ]}
                      />
                    </View>

                    <View style={[styles.trendScore, { alignItems: isRTL ? 'flex-start' : 'flex-end' }]}>
                      <Text style={[styles.trendValue, { fontFamily, color: colors.textPrimary }]}>
                        {trend.averageScore}%
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="trending-up" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { fontFamily, color: colors.textSecondary }]}>
                  {t("statistics.noTrendData")}
                </Text>
                <Text style={[styles.emptySubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("statistics.noTrendDataDesc")}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  } as any,
  header: {
    paddingTop: 20,
    paddingBottom: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  } as any,
  headerTitle: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  } as any,
  scrollView: {
    flex: 1,
  } as any,
  contentContainer: {
    paddingBottom: 30,
  } as any,
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  } as any,
  loadingText: {
    marginTop: 12,
    fontSize: 17,
    fontWeight: '500',
  } as any,
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: '#f2f2f7',
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 24,
  } as any,
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
  } as any,
  selectedPeriodButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as any,
  periodText: {
    fontSize: 15,
    fontWeight: '600',
  } as any,
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 30,
    gap: 12,
  } as any,
  quickStatCard: {
    flex: 1,
    minWidth: (width - 60) / 2,
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  quickStatLabel: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
    opacity: 0.7,
  } as any,
  quickStatValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.3,
  } as any,
  section: {
    marginBottom: 30,
    paddingHorizontal: 20,
  } as any,
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 16,
    letterSpacing: -0.2,
  } as any,
  classStatsList: {
    gap: 12,
  } as any,
  classStatCard: {
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  classStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  } as any,
  className: {
    fontSize: 19,
    fontWeight: '700',
  } as any,
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  improvementText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
    marginRight: 0,
  } as any,
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  } as any,
  statItem: {
    alignItems: 'center',
  } as any,
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4,
  } as any,
  statLabel: {
    fontSize: 15,
    fontWeight: '500',
    opacity: 0.7,
  } as any,
  trendCard: {
    borderRadius: 16,
    padding: 20,
    ...designTokens.shadows.sm,
  } as any,
  trendList: {
    gap: 16,
  } as any,
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  } as any,
  trendMonth: {
    fontSize: 15,
    fontWeight: '600',
    width: 50,
  } as any,
  trendBar: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.05)',
  } as any,
  trendFill: {
    height: '100%',
    borderRadius: 4,
  } as any,
  trendScore: {
    width: 50,
    alignItems: 'flex-end',
  } as any,
  trendValue: {
    fontSize: 15,
    fontWeight: '700',
  } as any,
  emptyState: {
    alignItems: 'center',
    borderRadius: 16,
    paddingVertical: 40,
    paddingHorizontal: 20,
  } as any,
  emptyTitle: {
    fontSize: 19,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  } as any,
  emptySubtitle: {
    fontSize: 15,
    textAlign: 'center',
    opacity: 0.6,
    lineHeight: 22,
  } as any,
  bottomSpacing: {
    height: 20,
  } as any,
};
