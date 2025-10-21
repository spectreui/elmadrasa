// app/(teacher)/exam-results/[id].tsx - Updated with Grading Features
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput
} from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../../src/utils/designTokens';
import { useTranslation } from "@/hooks/useTranslation";

interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  email?: string;
}

interface Answer {
  question_id: string;
  answer: string;
  is_correct: boolean;
  points: number;
  needs_grading: boolean;
  is_manually_graded?: boolean;
  feedback?: string;
  is_section?: boolean;
}

interface Submission {
  id: string;
  student: Student;
  score: number;
  total_points: number;
  percentage: number;
  submitted_at: string;
  answers: Answer[];
  time_spent?: string;
  needs_manual_grading: boolean;
  is_manually_graded: boolean;
  feedback?: string;
}

interface ExamResults {
  exam: {
    id: string;
    title: string;
    subject: string;
    class: string;
    created_at: string;
    settings: any;
    teacher?: {
      id: string;
      profile: {
        name: string;
      };
    };
  };
  statistics: {
    totalSubmissions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
    totalStudents?: number;
  };
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  submissions: Submission[];
}

export default function TeacherExamResultsScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const [results, setResults] = useState<ExamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics'>('overview');
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [gradingAnswers, setGradingAnswers] = useState<Record<string, { points: number; feedback: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const { fontFamily, colors, isDark } = useThemeContext();

  useEffect(() => {
    loadExamResults();
  }, [id]);

  const loadExamResults = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeacherExamResults(id as string);

      if (response.data.success) {
        const data = response.data.data;

        const transformedResults: ExamResults = {
          exam: {
            id: data.exam.id,
            title: data.exam.title,
            subject: data.exam.subject,
            class: data.exam.class,
            created_at: data.exam.created_at,
            settings: data.exam.settings,
            teacher: data.exam.teacher
          },
          statistics: data.statistics || {
            totalSubmissions: data.submissions?.length || 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            completionRate: 0
          },
          scoreDistribution: data.scoreDistribution || [],
          submissions: (data.submissions || []).map((sub: any) => ({
            id: sub.id,
            student: {
              id: sub.student?.id || 'unknown',
              name: sub.student?.name || 'Unknown Student',
              studentId: sub.student?.student_id || 'N/A',
              class: sub.student?.class || 'Unknown Class',
              email: sub.student?.email
            },
            score: sub.score,
            total_points: sub.totalPoints || sub.total_points,
            percentage: sub.percentage || Math.round(sub.score / (sub.totalPoints || sub.total_points || 1) * 100),
            submitted_at: sub.submittedAt || sub.submitted_at,
            answers: sub.answers || [],
            time_spent: sub.time_spent,
            needs_manual_grading: sub.needs_manual_grading,
            is_manually_graded: sub.is_manually_graded,
            feedback: sub.feedback
          }))
        };

        if (!data.statistics && transformedResults.submissions.length > 0) {
          const stats = calculateStatistics(transformedResults.submissions);
          transformedResults.statistics = { ...transformedResults.statistics, ...stats };
        }

        if (!data.scoreDistribution && transformedResults.submissions.length > 0) {
          transformedResults.scoreDistribution = calculateScoreDistribution(transformedResults.submissions);
        }

        setResults(transformedResults);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Failed to load exam results:', error);
      Alert.alert('Error', 'Failed to load exam results. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateScoreDistribution = (submissions: Submission[]) => {
    const distribution = [
      { range: '90-100', count: 0 },
      { range: '80-89', count: 0 },
      { range: '70-79', count: 0 },
      { range: '60-69', count: 0 },
      { range: '0-59', count: 0 }
    ];

    submissions.forEach((submission) => {
      const percentage = submission.percentage;
      if (percentage >= 90) distribution[0].count++;
      else if (percentage >= 80) distribution[1].count++;
      else if (percentage >= 70) distribution[2].count++;
      else if (percentage >= 60) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  };

  const calculateStatistics = (submissions: Submission[]) => {
    const percentages = submissions.map((sub) => sub.percentage);
    const averageScore = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const highestScore = Math.max(...percentages);
    const lowestScore = Math.min(...percentages);

    return {
      averageScore,
      highestScore,
      lowestScore,
      totalSubmissions: submissions.length
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExamResults();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return colors.success;
    if (percentage >= 80) return colors.primary;
    if (percentage >= 70) return colors.warning;
    if (percentage >= 60) return colors.error;
    return colors.error;
  };

  const getGradingStatus = (submission: Submission) => {
    if (submission.needs_manual_grading) {
      return { text: t("submissions.pending"), color: colors.warning };
    } else if (submission.is_manually_graded) {
      return { text: t("submissions.graded"), color: colors.success };
    } else {
      return { text: t("submissions.autoGraded"), color: colors.primary };
    }
  }

  const handleSendFeedback = () => {
    setFeedbackModalVisible(true);
  };

  const sendFeedback = async () => {
    if (!feedback.trim() || !selectedSubmission) return;

    try {
      setSendingFeedback(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Feedback sent to student successfully!');
      setFeedbackModalVisible(false);
      setFeedback('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleGradeAnswer = (questionId: string, points: number, feedback: string) => {
    setGradingAnswers(prev => ({
      ...prev,
      [questionId]: { points, feedback }
    }));
  };

  const submitGrading = async () => {
    if (!selectedSubmission) return;

    try {
      setIsGrading(true);

      // Calculate new total score
      let newScore = 0;
      const updatedAnswers = selectedSubmission.answers.map(answer => {
        if (answer.is_section) {
          return answer; // Skip sections
        }

        if (answer.needs_grading && gradingAnswers[answer.question_id]) {
          const gradedAnswer = gradingAnswers[answer.question_id];
          newScore += gradedAnswer.points;
          return {
            ...answer,
            points: gradedAnswer.points,
            feedback: gradedAnswer.feedback,
            is_manually_graded: true
          };
        }
        newScore += answer.points;
        return answer;
      });

      // Update submission
      const response = await apiService.gradeSubmission(
        selectedSubmission.id,
        newScore,
        overallFeedback,
        updatedAnswers,
      );

      if (response.data.success) {
        // Update local state
        setResults(prev => {
          if (!prev) return null;
          return {
            ...prev,
            submissions: prev.submissions.map(sub =>
              sub.id === selectedSubmission.id
                ? {
                  ...sub,
                  score: newScore,
                  percentage: Math.round((newScore / sub.total_points) * 100),
                  answers: updatedAnswers,
                  is_manually_graded: true,
                  feedback: overallFeedback
                }
                : sub
            )
          };
        });

        setSelectedSubmission({
          ...selectedSubmission,
          score: newScore,
          percentage: Math.round((newScore / selectedSubmission.total_points) * 100),
          answers: updatedAnswers,
          is_manually_graded: true,
          feedback: overallFeedback
        });

        Alert.alert(t("common.success"), t("submissions.gradingSuccess"));
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("submissions.gradingFailed"));
    } finally {
      setIsGrading(false);
    }
  };

  const exportResults = () => {
    Alert.alert('Export Results', 'Choose export format:', [
      { text: 'PDF Report', onPress: () => console.log('Exporting PDF...') },
      { text: 'Excel Sheet', onPress: () => console.log('Exporting Excel...') },
      { text: 'CSV Data', onPress: () => console.log('Exporting CSV...') },
      { text: 'Cancel', style: 'cancel' }]
    );
  };

  const shareResults = () => {
    Alert.alert('Share Results', 'Share exam results with:', [
      { text: 'All Students', onPress: () => console.log('Sharing with all students...') },
      { text: 'Selected Students', onPress: () => console.log('Sharing with selected students...') },
      { text: 'Other Teachers', onPress: () => console.log('Sharing with teachers...') },
      { text: 'Cancel', style: 'cancel' }]
    );
  };

  const getPerformanceInsights = () => {
    if (!results || results.submissions.length === 0) return [];

    const insights = [];
    const avgScore = results.statistics.averageScore;

    if (avgScore < 60) {
      insights.push('Class average is below passing. Consider reviewing the material.');
    } else if (avgScore > 85) {
      insights.push('Excellent class performance! Students mastered this material.');
    }

    if (results.statistics.highestScore - results.statistics.lowestScore > 40) {
      insights.push('Large performance gap between students. Consider differentiated instruction.');
    }

    const lowPerformers = results.submissions.filter((sub) => sub.percentage < 60).length;
    if (lowPerformers > results.submissions.length * 0.3) {
      insights.push(`${lowPerformers} students scored below 60%. May need remediation.`);
    }

    return insights;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText as any, { fontFamily, color: colors.textSecondary }]}>
          {t("exams.loadingResults")}
        </Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle as any, { fontFamily, color: colors.textPrimary }]}>
          {t("exams.noResultsFound")}
        </Text>
        <Text style={[styles.emptySubtitle as any, { fontFamily, color: colors.textSecondary }]}>
          {t("exams.resultsLoadFailed")}
        </Text>
        <TouchableOpacity
          style={[styles.backButton as any, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="white" />
          <Text style={styles.backButtonText as any}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const performanceInsights = getPerformanceInsights();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <View style={[styles.headerContent] as any}>
          <TouchableOpacity
            style={[styles.headerButton as any, { backgroundColor: colors.background }]}
            onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("exams.examAnalytics")}
          </Text>
          <View style={styles.headerActions as any}>
            <TouchableOpacity
              style={[styles.headerButton as any, { backgroundColor: colors.background }]}
              onPress={shareResults}>
              <Ionicons name="share" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton as any, { backgroundColor: colors.background }]}
              onPress={exportResults}>
              <Ionicons name="download" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.examInfo}>
          <Text style={[styles.examTitle, { fontFamily, color: colors.textPrimary }]}>
            {results.exam.title}
          </Text>
          <Text style={[styles.examSubtitle as any, { fontFamily, color: colors.textSecondary }]}>
            {results.exam.subject} • {results.exam.class}
          </Text>
          {results.exam.teacher &&
            <Text style={[styles.examCreator, { fontFamily, color: colors.textTertiary }]}>
              {t("exams.createdBy")}: {results.exam.teacher.profile.name}
            </Text>
          }
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer as any, { backgroundColor: colors.background }]}>
          {[
            { key: 'overview', label: t("dashboard.overview"), icon: 'stats-chart' },
            { key: 'submissions', label: t("submissions.title"), icon: 'document-text' },
            { key: 'analytics', label: t("dashboard.analytics"), icon: 'analytics' }
          ].map((tab) =>
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab as any,
                activeTab === tab.key ?
                  { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm } :
                  {}
              ]}
              onPress={() => setActiveTab(tab.key as any)}>
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textTertiary} />
              <Text
                style={[
                  styles.tabText as any,
                  activeTab === tab.key ?
                    { fontFamily, color: colors.primary } :
                    { fontFamily, color: colors.textSecondary }
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary} />
        }>

        {activeTab === 'overview' ?
          <View style={styles.tabContent}>
            {/* Performance Insights */}
            {performanceInsights.length > 0 &&
              <View style={[styles.insightsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.warning }]}>
                <View style={styles.insightsHeader as any}>
                  <Ionicons name="bulb" size={20} color={colors.warning} style={styles.insightsIcon} />
                  <View style={styles.insightsText}>
                    <Text style={[styles.insightsTitle as any, { fontFamily, color: colors.textPrimary }]}>
                      {t("dashboard.performanceInsights")}
                    </Text>
                    {performanceInsights.map((insight, index) =>
                      <Text key={index} style={[styles.insightItem, { fontFamily, color: colors.textSecondary }]}>
                        • {insight}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            }

            {/* Statistics Cards */}
            <View style={styles.statsGrid as any}>
              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("submissions.title")}
                  </Text>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.totalSubmissions}
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {results.statistics.totalStudents ?
                    `${t("exams.of")} ${results.statistics.totalStudents} ${t("exams.students")}` :
                    t("exams.totalSubmissions")}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("dashboard.avgScore")}
                  </Text>
                  <Ionicons name="trophy" size={20} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.averageScore}%
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("dashboard.classAverage")}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("exams.highest")}
                  </Text>
                  <Ionicons name="trending-up" size={20} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.highestScore}%
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("exams.topScore")}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("exams.lowest")}
                  </Text>
                  <Ionicons name="trending-down" size={20} color={colors.error} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.lowestScore}%
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("exams.lowestScore")}
                </Text>
              </View>
            </View>

            {/* Score Distribution */}
            <View style={[styles.scoreDistributionCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                {t("exams.scoreDistribution")}
              </Text>
              <View style={styles.distributionList}>
                {results.scoreDistribution.map((item, index) =>
                  <View key={index} style={styles.distributionItem as any}>
                    <Text style={[styles.distributionRange as any, { fontFamily, color: colors.textPrimary }]}>
                      {item.range}
                    </Text>
                    <View style={[styles.distributionBar as any, { backgroundColor: colors.background }]}>
                      <View
                        style={[
                          styles.distributionFill as any,
                          {
                            backgroundColor: getGradeColor(parseInt(item.range.split('-')[0])),
                            width: `${item.count / Math.max(...results.scoreDistribution.map((s) => s.count), 1) * 100}%`
                          }]
                        } />
                    </View>
                    <Text style={[styles.distributionCount as any, { fontFamily, color: colors.textSecondary }]}>
                      {item.count}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Top Performers */}
            <View style={[styles.topPerformersCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <View style={styles.cardHeader as any}>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t("exams.topPerformers")}
                </Text>
                <Text style={[styles.cardSubtitle, { fontFamily, color: colors.textSecondary }]}>
                  {t("exams.showingTop")} 3 {t("exams.of")} {results.submissions.length}
                </Text>
              </View>
              {results.submissions
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 3)
                .map((submission, index) =>
                  <View
                    key={submission.id}
                    style={[
                      styles.performerItem as any,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: index < 2 ? 1 : 0
                      }]
                    }>
                    <View style={styles.performerInfo as any}>
                      <View style={[styles.rankBadge as any, { backgroundColor: `${colors.primary}20` }]}>
                        <Text style={[styles.rankText as any, { fontFamily, color: colors.primary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.performerDetails}>
                        <Text style={[styles.performerName as any, { fontFamily, color: colors.textPrimary }]}>
                          {submission.student.name}
                        </Text>
                        <Text style={[styles.performerId, { fontFamily, color: colors.textSecondary }]}>
                          {submission.student.studentId}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.performerScore as any, { fontFamily, color: getGradeColor(submission.percentage) }]}>
                      {submission.percentage}%
                    </Text>
                  </View>
                )}
            </View>
          </View> :
          activeTab === 'submissions' ?
            <View style={styles.tabContent}>
              {/* Submissions List */}
              <View style={[styles.submissionsCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                {results.submissions.length > 0 ?
                  results.submissions
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((submission, index) =>
                      <TouchableOpacity
                        key={submission.id}
                        style={[
                          styles.submissionItem as any,
                          {
                            borderBottomColor: colors.border,
                            borderBottomWidth: index !== results.submissions.length - 1 ? 1 : 0
                          }]
                        }
                        onPress={() => router.push(`/(teacher)/exams/grading/${submission.id}`)}
                        activeOpacity={0.7}>
                        <View style={styles.submissionInfo}>
                          <Text style={[styles.submissionName as any, { fontFamily, color: colors.textPrimary }]}>
                            {submission.student.name}
                          </Text>
                          <Text style={[styles.submissionDetails, { fontFamily, color: colors.textSecondary }]}>
                            {submission.student.studentId} • {submission.student.class}
                          </Text>
                        </View>
                        <View style={styles.submissionMeta as any}>
                          <Text style={[styles.submissionScore as any, { fontFamily, color: getGradeColor(submission.percentage) }]}>
                            {submission.percentage}%
                          </Text>
                          <View style={[styles.gradingStatus, { backgroundColor: getGradingStatus(submission).color + '20' }]}>
                            <Text style={[styles.gradingStatusText as any, { color: getGradingStatus(submission).color, fontFamily }]}>
                              {getGradingStatus(submission).text}
                            </Text>
                          </View>
                          <Text style={[styles.submissionDate, { fontFamily, color: colors.textTertiary }]}>
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={styles.chevronIcon} />
                      </TouchableOpacity>
                    ) :
                  <View style={styles.emptyState as any}>
                    <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyTitle as any, { fontFamily, color: colors.textSecondary }]}>
                      {t("exams.noSubmissionsYet")}
                    </Text>
                    <Text style={[styles.emptySubtitle as any, { fontFamily, color: colors.textTertiary }]}>
                      {t("exams.studentsNotSubmitted")}
                    </Text>
                  </View>
                }
              </View>
            </View> :
            <View style={styles.tabContent}>
              {/* Analytics Tab */}
              <View style={styles.analyticsSection}>
                {/* Performance Trends */}
                <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.performanceAnalysis")}
                  </Text>
                  <View style={styles.trendList}>
                    <View style={[styles.trendItem as any, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.trendLabel as any, { fontFamily, color: colors.textSecondary }]}>
                        {t("dashboard.classAverage")}
                      </Text>
                      <Text style={[styles.trendValue as any, { fontFamily, color: colors.textPrimary }]}>
                        {results.statistics.averageScore}%
                      </Text>
                    </View>
                    <View style={[styles.trendItem as any, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.trendLabel as any, { fontFamily, color: colors.textSecondary }]}>
                        {t("exams.performanceRange")}
                      </Text>
                      <Text style={[styles.trendValue as any, { fontFamily, color: colors.textPrimary }]}>
                        {results.statistics.lowestScore}% - {results.statistics.highestScore}%
                      </Text>
                    </View>
                    <View style={styles.trendItem as any}>
                      <Text style={[styles.trendLabel as any, { fontFamily, color: colors.textSecondary }]}>
                        {t("exams.standardDeviation")}
                      </Text>
                      <Text style={[styles.trendValue as any, { fontFamily, color: colors.textPrimary }]}>
                        {Math.round(Math.sqrt(
                          results.submissions.reduce((acc, sub) =>
                            acc + Math.pow(sub.percentage - results.statistics.averageScore, 2), 0
                          ) / results.submissions.length
                        ))}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Question Analysis */}
                <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.questionAnalysis")}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily, color: colors.textSecondary }]}>
                    {t("exams.detailedAnalysisComing")}
                  </Text>
                  <TouchableOpacity style={[styles.actionButton as any, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.actionButtonText as any, { fontFamily, color: colors.primary }]}>
                      {t("exams.generateReport")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Action Recommendations */}
                <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.recommendedActions")}
                  </Text>
                  <View style={styles.recommendationsList}>
                    {performanceInsights.map((insight, index) =>
                      <View key={index} style={styles.recommendationItem as any}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.recommendationIcon} />
                        <Text style={[styles.recommendationText, { fontFamily, color: colors.textSecondary }]}>
                          {insight}
                        </Text>
                      </View>
                    )}
                    {performanceInsights.length === 0 &&
                      <Text style={[styles.noRecommendations as any, { fontFamily, color: colors.textTertiary }]}>
                        {t("exams.noRecommendations")}
                      </Text>
                    }
                  </View>
                </View>
              </View>
            </View>
        }
      </ScrollView>

      {/* Submission Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderContent as any}>
              <TouchableOpacity
                style={[styles.modalButton as any, { backgroundColor: colors.background }]}
                onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontFamily, color: colors.textPrimary }]}>
                {t("exams.submissionDetails")}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton as any, { backgroundColor: `${colors.primary}15` }]}
                onPress={handleSendFeedback}>
                <Ionicons name="chatbubble" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {selectedSubmission &&
            <ScrollView style={styles.modalContent}>
              <View style={[styles.studentCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.studentHeader as any}>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName as any, { fontFamily, color: colors.textPrimary }]}>
                      {selectedSubmission.student.name}
                    </Text>
                    <Text style={[styles.studentDetails, { fontFamily, color: colors.textSecondary }]}>
                      {selectedSubmission.student.studentId} • {selectedSubmission.student.class}
                    </Text>
                    {selectedSubmission.student.email &&
                      <Text style={[styles.studentEmail, { fontFamily, color: colors.textTertiary }]}>
                        {selectedSubmission.student.email}
                      </Text>
                    }
                  </View>
                  <View style={styles.studentScore as any}>
                    <Text style={[styles.scoreValue, { fontFamily, color: getGradeColor(selectedSubmission.percentage) }]}>
                      {selectedSubmission.percentage}%
                    </Text>
                    <Text style={[styles.scoreDetails, { fontFamily, color: colors.textSecondary }]}>
                      {selectedSubmission.score}/{selectedSubmission.total_points} {t("exams.points")}
                    </Text>
                    <View style={[styles.gradingStatusBadge as any, { backgroundColor: getGradingStatus(selectedSubmission).color + '20' }]}>
                      <Text style={[styles.gradingStatusBadgeText as any, { color: getGradingStatus(selectedSubmission).color, fontFamily }]}>
                        {getGradingStatus(selectedSubmission).text}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.submissionMetaRow as any}>
                  <Text style={[styles.submissionMetaText, { fontFamily, color: colors.textTertiary }]}>
                    {t("exams.submitted")}: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </Text>
                  {selectedSubmission.time_spent &&
                    <Text style={[styles.submissionMetaText, { fontFamily, color: colors.textTertiary }]}>
                      {t("exams.time")}: {selectedSubmission.time_spent}
                    </Text>
                  }
                </View>
              </View>

              {/* Overall Feedback Section */}
              <View style={[styles.feedbackCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t("exams.overallFeedback")}
                </Text>
                <TextInput
                  style={[styles.feedbackInput, {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }]}
                  placeholder={t("exams.addOverallFeedback")}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  value={overallFeedback}
                  onChangeText={setOverallFeedback}
                />
              </View>

              {/* Answers Section */}
              <View style={[styles.answersCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t("exams.questionAnalysis")}
                </Text>
                <View style={styles.answersList}>
                  {selectedSubmission.answers
                    .filter(answer => !answer.is_section) // Filter out sections
                    .map((answer: Answer, index: number) =>
                      <View
                        key={index}
                        style={[styles.answerItem, { borderColor: colors.border }]}>
                        <View style={styles.answerHeader as any}>
                          <Text style={[styles.questionNumber as any, { fontFamily, color: colors.textPrimary }]}>
                            {t("exams.question")} {index + 1}
                          </Text>
                          <View style={[styles.answerStatus, {
                            backgroundColor: answer.needs_grading ?
                              (answer.is_manually_graded ? `${colors.success}20` : `${colors.warning}20`) :
                              `${colors.primary}20`
                          }]}>
                            <Text style={[styles.statusText as any, {
                              fontFamily,
                              color: answer.needs_grading ?
                                (answer.is_manually_graded ? colors.success : colors.warning) :
                                colors.primary
                            }]}>
                              {answer.needs_grading ?
                                (answer.is_manually_graded ? t("exams.manuallyGraded") : t("exams.needsGrading")) :
                                t("exams.autoGraded")}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.answerPoints, { fontFamily, color: colors.textSecondary }]}>
                          {t("exams.points")}: {answer.points}
                        </Text>

                        {answer.answer && (
                          <View style={styles.answerContainer}>
                            <Text style={[styles.answerLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.studentAnswer")}:
                            </Text>
                            <Text style={[styles.answerText, { fontFamily, color: colors.textPrimary }]}>
                              {answer.answer}
                            </Text>
                          </View>
                        )}

                        {answer.needs_grading && (
                          <View style={[styles.gradingSection, { borderTopColor: isDark ? designTokens.colors.dark.border : designTokens.colors.light.border }]}>
                            <Text style={[styles.gradingLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.pointsAwarded")}:
                            </Text>
                            <View style={styles.pointsInputContainer as any}>
                              <TextInput
                                style={[styles.pointsInput, {
                                  borderColor: colors.border,
                                  backgroundColor: colors.background,
                                  color: colors.textPrimary
                                }]}
                                value={gradingAnswers[answer.question_id]?.points.toString() || answer.points.toString()}
                                onChangeText={(text) => handleGradeAnswer(
                                  answer.question_id,
                                  parseInt(text) || 0,
                                  gradingAnswers[answer.question_id]?.feedback || ''
                                )}
                                keyboardType="numeric"
                              />
                              <Text style={[styles.pointsMax, { fontFamily, color: colors.textSecondary }]}>
                                / {answer.points}
                              </Text>
                            </View>

                            <Text style={[styles.gradingLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.feedback")}:
                            </Text>
                            <TextInput
                              style={[styles.feedbackInputSmall, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.textPrimary
                              }]}
                              placeholder={t("exams.addFeedback")}
                              placeholderTextColor={colors.textTertiary}
                              multiline
                              value={gradingAnswers[answer.question_id]?.feedback || ''}
                              onChangeText={(text) => handleGradeAnswer(
                                answer.question_id,
                                gradingAnswers[answer.question_id]?.points || answer.points,
                                text
                              )}
                            />
                          </View>
                        )}

                        {answer.feedback && !answer.needs_grading && (
                          <View style={styles.feedbackSection}>
                            <Text style={[styles.feedbackLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.feedback")}:
                            </Text>
                            <Text style={[styles.feedbackText, { fontFamily, color: colors.textPrimary }]}>
                              {answer.feedback}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions as any}>
                <TouchableOpacity
                  style={[styles.modalActionButton as any, { backgroundColor: colors.background }]}
                  onPress={exportResults}>
                  <Text style={[styles.modalActionText as any, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.downloadPDF")}
                  </Text>
                </TouchableOpacity>

                {selectedSubmission.needs_manual_grading && !selectedSubmission.is_manually_graded && (
                  <TouchableOpacity
                    style={[styles.modalActionButton as any, { backgroundColor: colors.primary }]}
                    onPress={submitGrading}
                    disabled={isGrading}>
                    {isGrading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.modalActionText as any}>
                        {t("exams.submitGrading")}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalActionButton as any, { backgroundColor: colors.background }]}
                  onPress={handleSendFeedback}>
                  <Text style={[styles.modalActionText as any, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.sendFeedback")}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          }
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}>
        <View style={[styles.feedbackOverlay as any, { backgroundColor: `${colors.textPrimary}80` }]}>
          <View style={[styles.feedbackModal as any, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.feedbackTitle, { fontFamily, color: colors.textPrimary }]}>
              {t("exams.sendFeedback")}
            </Text>
            <Text style={[styles.feedbackSubtitle, { fontFamily, color: colors.textSecondary }]}>
              {t("exams.sendFeedbackTo")} {selectedSubmission?.student.name}
            </Text>

            <TextInput
              style={[styles.feedbackInput, {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.textPrimary
              }]}
              placeholder={t("exams.writeFeedback")}
              placeholderTextColor={colors.textTertiary}
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <View style={styles.feedbackActions as any}>
              <TouchableOpacity
                style={[styles.feedbackButton as any, { backgroundColor: colors.background }]}
                onPress={() => setFeedbackModalVisible(false)}>
                <Text style={[styles.feedbackButtonText as any, { fontFamily, color: colors.textPrimary }]}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton as any, { backgroundColor: colors.primary }]}
                onPress={sendFeedback}
                disabled={!feedback.trim() || sendingFeedback}>
                {sendingFeedback ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.feedbackButtonText as any}>
                    {t("common.send")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const originalStyles = {
  container: {
    flex: 1,
    paddingBottom: 40
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500'
  },
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs
  },
  emptySubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.xl
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.sm
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.xs
  },
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
    borderBottomWidth: 1
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm
  },
  examInfo: {
    marginBottom: designTokens.spacing.lg
  },
  examTitle: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xs
  },
  examSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xs
  },
  examCreator: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.xs
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md
  },
  tabText: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: designTokens.spacing.xl
  },
  insightsCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg
  },
  insightsHeader: {
    flexDirection: 'row'
  },
  insightsIcon: {
    marginTop: designTokens.spacing.xxs,
    marginRight: designTokens.spacing.md
  },
  insightsText: {
    flex: 1
  },
  insightsTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs
  },
  insightItem: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xxs
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500'
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xxs
  },
  statSubtitle: {
    fontSize: designTokens.typography.caption2.fontSize
  },
  scoreDistributionCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.sm
  },
  cardTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.md
  },
  distributionList: {
    gap: designTokens.spacing.md
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  distributionRange: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    width: 40
  },
  distributionBar: {
    flex: 1,
    height: 12,
    borderRadius: designTokens.borderRadius.full,
    marginHorizontal: designTokens.spacing.md,
    overflow: 'hidden'
  },
  distributionFill: {
    height: '100%',
    borderRadius: designTokens.borderRadius.full
  },
  distributionCount: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    width: 30,
    textAlign: 'right'
  },
  topPerformersCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  cardSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md
  },
  performerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md
  },
  rankText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600'
  },
  performerDetails: {
    flex: 1
  },
  performerName: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs
  },
  performerId: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  performerScore: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: '700'
  },
  submissionsCard: {
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...designTokens.shadows.sm
  },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.lg
  },
  submissionInfo: {
    flex: 1,
    marginRight: designTokens.spacing.md
  },
  submissionName: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs
  },
  submissionDetails: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  submissionMeta: {
    alignItems: 'flex-end',
    marginRight: designTokens.spacing.md
  },
  submissionScore: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: '700',
    marginBottom: designTokens.spacing.xxs
  },
  submissionDate: {
    fontSize: designTokens.typography.caption2.fontSize
  },
  chevronIcon: {
    marginLeft: designTokens.spacing.xs
  },
  emptyState: {
    padding: designTokens.spacing.xxl,
    alignItems: 'center'
  },
  analyticsSection: {
    gap: designTokens.spacing.lg
  },
  analyticsCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  trendList: {
    gap: designTokens.spacing.md
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xs,
    borderBottomWidth: 1
  },
  trendLabel: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500'
  },
  trendValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600'
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    marginTop: designTokens.spacing.md
  },
  actionButtonText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600'
  },
  recommendationsList: {
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.md
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  recommendationIcon: {
    marginTop: designTokens.spacing.xxs,
    marginRight: designTokens.spacing.md
  },
  recommendationText: {
    flex: 1,
    fontSize: designTokens.typography.caption1.fontSize
  },
  noRecommendations: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
    marginTop: designTokens.spacing.md
  },
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.md,
    borderBottomWidth: 1
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md
  },
  modalButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any
  },
  modalContent: {
    flex: 1,
    padding: designTokens.spacing.xl
  },
  studentCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.sm
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md
  },
  studentInfo: {
    flex: 1,
    marginRight: designTokens.spacing.md
  },
  studentName: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs
  },
  studentDetails: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xs
  },
  studentEmail: {
    fontSize: designTokens.typography.caption2.fontSize
  },
  studentScore: {
    alignItems: 'flex-end'
  },
  scoreValue: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xxs
  },
  scoreDetails: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  submissionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  submissionMetaText: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  answersCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  answersList: {
    gap: designTokens.spacing.md
  },
  answerItem: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.lg
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.sm
  },
  questionNumber: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    flex: 1
  },
  answerStatus: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full
  },
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  answerPoints: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.sm
  },
  answerText: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  modalActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
    marginTop: designTokens.spacing.lg
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center'
  },
  modalActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize
  },
  feedbackOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl
  },
  feedbackModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.lg
  },
  feedbackTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.xs
  },
  feedbackSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.lg
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    height: 120,
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: designTokens.spacing.lg
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.md
  },
  feedbackButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center'
  },
  feedbackButtonText: {
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize
  }
};

const additionalStyles = {
  gradingStatus: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    borderRadius: designTokens.borderRadius.full,
    marginBottom: designTokens.spacing.xxs
  },
  gradingStatusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  gradingStatusBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    borderRadius: designTokens.borderRadius.full,
    alignSelf: 'flex-end',
    marginTop: designTokens.spacing.xs
  },
  gradingStatusBadgeText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  feedbackCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.sm
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    height: 100,
    fontSize: designTokens.typography.body.fontSize,
    marginTop: designTokens.spacing.sm
  },
  answerContainer: {
    marginTop: designTokens.spacing.sm
  },
  answerLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs
  },
  answerText: {
    fontSize: designTokens.typography.caption1.fontSize,
    lineHeight: designTokens.typography.caption1.fontSize * 1.4
  },
  gradingSection: {
    marginTop: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 1,
  },
  gradingLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs
  },
  pointsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  pointsInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.sm,
    width: 80,
    fontSize: designTokens.typography.body.fontSize
  },
  pointsMax: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.caption1.fontSize
  },
  feedbackInputSmall: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.sm,
    height: 80,
    fontSize: designTokens.typography.caption1.fontSize
  },
  feedbackSection: {
    marginTop: designTokens.spacing.md
  },
  feedbackLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs
  },
  feedbackText: {
    fontSize: designTokens.typography.caption1.fontSize,
    lineHeight: designTokens.typography.caption1.fontSize * 1.4
  }
};

// Merge additional styles with existing styles object
const styles = {
  ...originalStyles,
  ...additionalStyles
};
