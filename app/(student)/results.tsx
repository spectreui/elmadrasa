// app/(student)/results.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import Alert from '@/components/Alert';
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { useThemeContext } from "../../src/contexts/ThemeContext";
import { designTokens } from "../../src/utils/designTokens";
import Animated, { FadeIn } from "react-native-reanimated";
import { useTranslation } from "@/hooks/useTranslation";

export default function ResultsScreen() {
  const { t, isRTL } = useTranslation();
  const { fontFamily, colors } = useThemeContext();
  const [results, setResults] = useState<any[]>([]);
  const [subjectPerformance, setSubjectPerformance] = useState<any[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<"all" | "recent" | "top">("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    try {
      setLoading(true);
      const resultsResponse = await apiService.getStudentResults();
      if (resultsResponse.data.success) {
        setResults(
          Array.isArray(resultsResponse.data.data)
            ? resultsResponse.data.data
            : []
        );
      } else {
        Alert.alert(t("common.error"), t("results.loadFailed"));
      }

      const performanceResponse = await apiService.getSubjectPerformance();
      if (performanceResponse.data.success) {
        setSubjectPerformance(
          Array.isArray(performanceResponse.data.data)
            ? performanceResponse.data.data
            : []
        );
      }
    } catch (error: any) {
      Alert.alert(t("common.error"), t("results.loadFailed"));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadResults();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return { text: '#34C759', bg: '#34C75915', border: '#34C759' };
    if (percentage >= 80) return { text: '#007AFF', bg: '#007AFF15', border: '#007AFF' };
    if (percentage >= 70) return { text: '#FFCC00', bg: '#FFCC0015', border: '#FFCC00' };
    return { text: '#FF3B30', bg: '#FF3B3015', border: '#FF3B30' };
  };

  const getGradeLabel = (percentage: number) => {
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const filteredResults = results.filter((result) => {
    if (selectedFilter === "recent") {
      return results.indexOf(result) < 5;
    }
    if (selectedFilter === "top") {
      return result.percentage >= 80;
    }
    return true;
  });

  const ResultCard = ({ result }: { result: any }) => {
    const gradeColors = getGradeColor(result.percentage);

    return (
      <View style={[styles.resultCard, { 
        backgroundColor: colors.backgroundElevated,
        ...designTokens.shadows.sm
      }]}>
        <View style={[styles.resultHeader, { 
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }]}>
          <View style={{ flex: 1 }}>
            <Text
              style={[styles.resultTitle, { color: colors.textPrimary }]}
              numberOfLines={1}
            >
              {result.examTitle}
            </Text>
            <Text style={[styles.resultSubtitle, { color: colors.textSecondary }]}>
              {result.subject} • {new Date(result.date).toLocaleDateString()}
            </Text>
          </View>
          <View style={[styles.gradeBadge, { 
            backgroundColor: gradeColors.bg,
            borderColor: gradeColors.border
          }]}>
            <Text style={[styles.gradeText, { color: gradeColors.text }]}>
              {getGradeLabel(result.percentage)}
            </Text>
          </View>
        </View>

        <View style={[styles.statsRow, { 
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {result.percentage}%
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("results.score")}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {result.correctAnswers}/{result.totalQuestions}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("results.correct")}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: colors.separator }]} />
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.textPrimary }]}>
              {result.timeSpent}
            </Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t("results.time")}
            </Text>
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: colors.separator }]}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${result.percentage}%`,
                backgroundColor: gradeColors.text
              }
            ]}
          />
        </View>
      </View>
    );
  };

  const SubjectPerformanceCard = ({ subject }: { subject: any }) => (
    <View
      style={[
        styles.performanceCard,
        {
          backgroundColor: colors.backgroundElevated,
          ...designTokens.shadows.sm,
          [isRTL ? 'marginLeft' : 'marginRight']: designTokens.spacing.sm
        }
      ]}
    >
      <Text
        style={[styles.subjectTitle, { color: colors.textPrimary }]}
        numberOfLines={1}
      >
        {subject.subject}
      </Text>
      <View style={[styles.trendRow, { 
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }]}>
        <Text
          style={[styles.averageScore, { color: colors.textPrimary }]}
        >
          {subject.averageScore}%
        </Text>
        <Ionicons
          name={
            subject.trend === "up"
              ? "trending-up"
              : subject.trend === "down"
                ? "trending-down"
                : "remove"
          }
          size={16}
          color={
            subject.trend === "up"
              ? "#34C759"
              : subject.trend === "down"
                ? "#FF3B30"
                : "#8E8E93"
          }
        />
      </View>
      <Text style={[styles.examCount, { color: colors.textSecondary }]}>
        {subject.examsTaken} {t("results.exams")}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textSecondary, fontFamily }]}>
          {t("results.loading")}
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, fontFamily }]}>
          {t("results.title")}
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, fontFamily }]}>
          {t("results.overview")}
        </Text>
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
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
        <View style={styles.content}>
          {/* Performance Overview */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily }]}>
              {t("results.performanceOverview")}
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingBottom: designTokens.spacing.sm
              }}
            >
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row' }}>
                {subjectPerformance.map((subject, index) => (
                  <SubjectPerformanceCard key={index} subject={subject} />
                ))}
              </View>
            </ScrollView>
          </View>

          {/* Filter Tabs */}
          <View style={[styles.filterTabs, { 
            backgroundColor: colors.separator,
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }]}>
            {[
              { key: "all", label: t("results.allResults") },
              { key: "recent", label: t("results.recent") },
              { key: "top", label: t("results.topScores") }
            ].map((filter) => (
              <TouchableOpacity
                key={filter.key}
                style={[
                  styles.filterTab,
                  {
                    backgroundColor: selectedFilter === filter.key ? colors.backgroundElevated : 'transparent'
                  }
                ]}
                onPress={() => setSelectedFilter(filter.key as any)}
              >
                <Text
                  style={[
                    styles.filterText,
                    {
                      color: selectedFilter === filter.key
                        ? colors.textPrimary
                        : colors.textSecondary
                    }
                  ]}
                >
                  {filter.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Results List */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary, fontFamily }]}>
              {selectedFilter === "recent"
                ? t("results.recentResults")
                : selectedFilter === "top"
                  ? t("results.topPerformances")
                  : t("results.allResults")}
            </Text>

            {filteredResults.length === 0 ? (
              <View style={[styles.emptyState, { 
                backgroundColor: colors.backgroundElevated,
                ...designTokens.shadows.sm
              }]}>
                <Ionicons name="stats-chart" size={48} color={colors.textTertiary} />
                <Text style={[styles.emptyTitle, { color: colors.textPrimary, fontFamily }]}>
                  {t("results.noResults")}
                </Text>
                <Text style={[styles.emptySubtitle, { color: colors.textSecondary, fontFamily }]}>
                  {selectedFilter === "top"
                    ? t("results.noTopScores")
                    : t("results.completeExams")}
                </Text>
              </View>
            ) : (
              filteredResults.map((result) => (
                <ResultCard key={result.id} result={result} />
              ))
            )}
          </View>

          {/* Overall Stats */}
          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: colors.backgroundElevated,
                ...designTokens.shadows.sm
              }
            ]}
          >
            <Text
              style={[styles.summaryTitle, { color: colors.textPrimary, fontFamily }]}
            >
              {t("results.summary")}
            </Text>
            <View style={[styles.summaryGrid, { 
              marginHorizontal: -designTokens.spacing.xs,
              flexDirection: isRTL ? 'row-reverse' : 'row'
            }]}>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t("results.totalExams")}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary, fontFamily }]}>
                  {results.length}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t("results.averageScore")}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary, fontFamily }]}>
                  {results.length > 0
                    ? Math.round(
                      results.reduce((sum, r) => sum + r.percentage, 0) /
                      results.length
                    )
                    : 0}%
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t("results.bestSubject")}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary, fontFamily }]}>
                  {subjectPerformance.length > 0
                    ? subjectPerformance.reduce((best, current) =>
                      current.averageScore > best.averageScore ? current : best
                    ).subject
                    : t("results.na")}
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
                  {t("results.totalTime")}
                </Text>
                <Text style={[styles.summaryValue, { color: colors.textPrimary, fontFamily }]}>
                  {results.reduce((total, result) => {
                    const time = parseInt(result.timeSpent);
                    return total + (isNaN(time) ? 0 : time);
                  }, 0)}{t("results.minutes")}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize
  },
  header: {
    paddingTop: designTokens.spacing.xxxl,
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.lg
  },
  headerTitle: {
    fontSize: designTokens.typography.largeTitle.fontSize,
    fontWeight: designTokens.typography.largeTitle.fontWeight,
    marginBottom: designTokens.spacing.xs
  },
  headerSubtitle: {
    fontSize: designTokens.typography.body.fontSize
  },
  content: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.xxxl
  },
  section: {
    marginBottom: designTokens.spacing.xl
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginBottom: designTokens.spacing.md
  },
  resultCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.sm
  },
  resultHeader: {
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md
  },
  resultTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: designTokens.typography.headline.fontWeight,
    marginBottom: 2
  },
  resultSubtitle: {
    fontSize: designTokens.typography.footnote.fontSize
  },
  gradeBadge: {
    paddingHorizontal: designTokens.spacing.md,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
    borderWidth: 1
  },
  gradeText: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: designTokens.typography.headline.fontWeight
  },
  statsRow: {
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  statItem: {
    alignItems: 'center'
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginBottom: 2
  },
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  divider: {
    height: 30,
    width: 1
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 3
  },
  performanceCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    minWidth: 140
  },
  subjectTitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.sm
  },
  trendRow: {
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2
  },
  averageScore: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight
  },
  examCount: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  filterTabs: {
    borderRadius: designTokens.borderRadius.full,
    padding: 2,
    marginBottom: designTokens.spacing.xl
  },
  filterTab: {
    flex: 1,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full
  },
  filterText: {
    textAlign: 'center',
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600'
  },
  emptyState: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.xxl,
    alignItems: 'center'
  },
  emptyTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginTop: designTokens.spacing.md,
    marginBottom: designTokens.spacing.xs
  },
  emptySubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22
  },
  summaryCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg
  },
  summaryTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginBottom: designTokens.spacing.md
  },
  summaryGrid: {
    flexWrap: 'wrap'
  },
  summaryItem: {
    width: '50%',
    paddingHorizontal: designTokens.spacing.xs,
    marginBottom: designTokens.spacing.md
  },
  summaryLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: 2
  },
  summaryValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight
  }
});
