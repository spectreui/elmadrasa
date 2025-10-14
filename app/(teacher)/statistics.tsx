// app/(teacher)/statistics.tsx - Updated with Full Dark Mode Support
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import { ClassStats, PerformanceTrend } from '../../src/types';

interface StatisticsData {
  classStats: ClassStats[];
  performanceTrend: PerformanceTrend[];
  totalExams: number;
  avgCompletion: number;
  activeStudents: number;
  pendingGrading: number;
}

export default function StatisticsScreen() {
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
  const { colors } = useThemeContext();

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
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText as any, { color: colors.textSecondary }]}>Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.content}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Analytics</Text>

        {/* Period Selector */}
        <View style={[styles.periodSelector as any, { backgroundColor: colors.background }]}>
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'year', label: 'This Year' }
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key 
                  ? { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm } 
                  : {}
              ]}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text 
                style={[
                  styles.periodText as any,
                  selectedPeriod === period.key 
                    ? { color: colors.primary } 
                    : { color: colors.textSecondary }
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Class Performance */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Class Performance</Text>
          <View style={styles.classStatsList}>
            {classStats.length > 0 ? (
              classStats.map((stats, index) => (
                <View 
                  key={stats.id || index} 
                  style={[styles.classStatCard, { 
                    backgroundColor: colors.backgroundElevated,
                    borderColor: colors.border,
                    ...designTokens.shadows.sm
                  }]}
                >
                  <View style={styles.classStatHeader as any}>
                    <Text style={[styles.className as any, { color: colors.textPrimary }]}>{stats.className as any}</Text>
                    <View style={styles.improvementContainer as any}>
                      <Ionicons 
                        name={getImprovementIcon(stats.improvement) as any} 
                        size={16} 
                        color={getImprovementColor(stats.improvement)} 
                      />
                      <Text style={[styles.improvementText as any, { color: getImprovementColor(stats.improvement) }]}>
                        {getImprovementValue(stats.improvement)}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.statsGrid as any}>
                    <View style={styles.statItem as any}>
                      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.averageScore}%</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Avg. Score</Text>
                    </View>
                    <View style={styles.statItem as any}>
                      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.studentCount}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Students</Text>
                    </View>
                    <View style={styles.statItem as any}>
                      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{stats.completedExams}</Text>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Exams</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={[styles.emptyState as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Ionicons name="stats-chart" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle as any, { color: colors.textSecondary }]}>No class data available</Text>
                <Text style={[styles.emptySubtitle as any, { color: colors.textTertiary }]}>
                  Class performance data will appear here once available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance Trend */}
        <View style={[styles.trendCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Performance Trend</Text>
          
          {performanceTrend.length > 0 ? (
            <View style={styles.trendList}>
              {performanceTrend.map((trend, index) => (
                <View key={index} style={styles.trendItem as any}>
                  <Text style={[styles.trendMonth as any, { color: colors.textPrimary }]}>{trend.month}</Text>
                  
                  <View style={[styles.trendBar as any, { backgroundColor: colors.background }]}>
                    <View 
                      style={[
                        styles.trendFill as any,
                        { 
                          backgroundColor: colors.primary,
                          width: `${(trend.averageScore / 100) * 100}%` 
                        }
                      ]}
                    />
                  </View>
                  
                  <View style={styles.trendScore as any}>
                    <Text style={[styles.trendValue as any, { color: colors.textPrimary }]}>{trend.averageScore}%</Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState as any}>
              <Ionicons name="trending-up" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle as any, { color: colors.textSecondary }]}>No trend data available</Text>
              <Text style={[styles.emptySubtitle as any, { color: colors.textTertiary }]}>
                Performance trends will appear here once available
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View style={styles.quickStatsGrid as any}>
          <View style={[styles.quickStatCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
            <Text style={[styles.quickStatLabel as any, { color: colors.textSecondary }]}>Total Exams</Text>
            <Text style={[styles.quickStatValue, { color: colors.textPrimary }]}>{quickStats.totalExams}</Text>
          </View>
          <View style={[styles.quickStatCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
            <Text style={[styles.quickStatLabel as any, { color: colors.textSecondary }]}>Avg. Completion</Text>
            <Text style={[styles.quickStatValue, { color: colors.textPrimary }]}>{quickStats.avgCompletion}%</Text>
          </View>
          <View style={[styles.quickStatCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
            <Text style={[styles.quickStatLabel as any, { color: colors.textSecondary }]}>Active Students</Text>
            <Text style={[styles.quickStatValue, { color: colors.textPrimary }]}>{quickStats.activeStudents}</Text>
          </View>
          <View style={[styles.quickStatCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
            <Text style={[styles.quickStatLabel as any, { color: colors.textSecondary }]}>Pending Grading</Text>
            <Text style={[styles.quickStatValue, { color: colors.textPrimary }]}>{quickStats.pendingGrading}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  content: {
    padding: designTokens.spacing.xl,
  },
  headerTitle: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xl,
  },
  periodSelector: {
    flexDirection: 'row',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.xl,
  },
  periodButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.md,
  },
  periodText: {
    textAlign: 'center',
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  section: {
    marginBottom: designTokens.spacing.xxl,
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.lg,
  },
  classStatsList: {
    gap: designTokens.spacing.md,
  },
  classStatCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
  },
  classStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.lg,
  },
  className: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
  },
  improvementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  improvementText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginLeft: designTokens.spacing.xxs,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xxs,
  },
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
  },
  emptyState: {
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xxxl,
    borderWidth: 1,
  },
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs,
  },
  emptySubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
  },
  trendCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.xl,
    ...designTokens.shadows.sm,
  },
  cardTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.lg,
  },
  trendList: {
    gap: designTokens.spacing.md,
  },
  trendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendMonth: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    width: 40,
  },
  trendBar: {
    flex: 1,
    height: 8,
    borderRadius: designTokens.borderRadius.full,
    marginHorizontal: designTokens.spacing.md,
    overflow: 'hidden',
  },
  trendFill: {
    height: '100%',
    borderRadius: designTokens.borderRadius.full,
  },
  trendScore: {
    width: 60,
    alignItems: 'flex-end',
  },
  trendValue: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  quickStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
  },
  quickStatCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm,
  },
  quickStatLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xs,
  },
  quickStatValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
  },
};
