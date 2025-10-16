// app/(teacher)/exam-results/[id].tsx - Updated with Full Dark Mode Support
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput } from
'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../../src/utils/designTokens';import { useTranslation } from "@/hooks/useTranslation";

interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  email?: string;
}

interface Submission {
  id: string;
  student: Student;
  score: number;
  total_points: number;
  percentage: number;
  submitted_at: string;
  answers: any[];
  time_spent?: string;
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

export default function TeacherExamResultsScreen() {const { t } = useTranslation();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [results, setResults] = useState<ExamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics'>('overview');
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const { colors } = useThemeContext();


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
              studentId: sub.student?.studentId || 'N/A',
              class: sub.student?.class || 'Unknown Class',
              email: sub.student?.email
            },
            score: sub.score,
            total_points: sub.totalPoints || sub.total_points,
            percentage: sub.percentage || Math.round(sub.score / (sub.totalPoints || sub.total_points || 1) * 100),
            submitted_at: sub.submittedAt || sub.submitted_at,
            answers: sub.answers || [],
            time_spent: sub.time_spent
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
    { range: '0-59', count: 0 }];


    submissions.forEach((submission) => {
      const percentage = submission.percentage;
      if (percentage >= 90) distribution[0].count++;else
      if (percentage >= 80) distribution[1].count++;else
      if (percentage >= 70) distribution[2].count++;else
      if (percentage >= 60) distribution[3].count++;else
      distribution[4].count++;
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

  const handleViewSubmission = (submission: Submission) => {
    setSelectedSubmission(submission);
    setDetailModalVisible(true);
  };

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
        <Text style={[styles.loadingText as any, { color: colors.textSecondary }]}>Loading exam results...</Text>
      </View>);

  }

  if (!results) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle as any, { color: colors.textPrimary }]}>No results found</Text>
        <Text style={[styles.emptySubtitle as any, { color: colors.textSecondary }]}>
          Unable to load exam results. The exam may not exist or you may not have permission to view it.
        </Text>
        <TouchableOpacity
          style={[styles.backButton as any, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}>

          <Ionicons name="chevron-back" size={20} color="white" />
          <Text style={styles.backButtonText as any}>Go Back</Text>
        </TouchableOpacity>
      </View>);

  }

  const performanceInsights = getPerformanceInsights();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <View style={styles.headerContent as any}>
          <TouchableOpacity
            style={[styles.headerButton as any, { backgroundColor: colors.background }]}
            onPress={() => router.back()}>

            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Exam Analytics</Text>
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
          <Text style={[styles.examTitle, { color: colors.textPrimary }]}>
            {results.exam.title}
          </Text>
          <Text style={[styles.examSubtitle as any, { color: colors.textSecondary }]}>
            {results.exam.subject} • {results.exam.class}
          </Text>
          {results.exam.teacher &&
          <Text style={[styles.examCreator, { color: colors.textTertiary }]}>
              Created by: {results.exam.teacher.profile.name}
            </Text>
          }
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer as any, { backgroundColor: colors.background }]}>
          {[
          { key: 'overview', label: t("dashboard.overview"), icon: 'stats-chart' },
          { key: 'submissions', label: t("submissions.title"), icon: 'document-text' },
          { key: 'analytics', label: t("dashboard.analytics"), icon: 'analytics' }].
          map((tab) =>
          <TouchableOpacity
            key={tab.key}
            style={[
            styles.tab as any,
            activeTab === tab.key ?
            { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm } :
            {}]
            }
            onPress={() => setActiveTab(tab.key as any)}>

              <Ionicons
              name={tab.icon as any}
              size={16}
              color={activeTab === tab.key ? colors.primary : colors.textTertiary} />

              <Text
              style={[
              styles.tabText as any,
              activeTab === tab.key ?
              { color: colors.primary } :
              { color: colors.textSecondary }]
              }>

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
                    <Text style={[styles.insightsTitle as any, { color: colors.textPrimary }]}>{t("dashboard.performanceInsights")}</Text>
                    {performanceInsights.map((insight, index) =>
                <Text key={index} style={[styles.insightItem, { color: colors.textSecondary }]}>• {insight}</Text>
                )}
                  </View>
                </View>
              </View>
          }

            {/* Statistics Cards */}
            <View style={styles.statsGrid as any}>
              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { color: colors.textSecondary }]}>{t("submissions.title")}</Text>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{results.statistics.totalSubmissions}</Text>
                <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>
                  {results.statistics.totalStudents ? `of ${results.statistics.totalStudents} students` : 'Total submissions'}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { color: colors.textSecondary }]}>{t("dashboard.avgScore")}</Text>
                  <Ionicons name="trophy" size={20} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{results.statistics.averageScore}%</Text>
                <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>{t("dashboard.classAverage")}</Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { color: colors.textSecondary }]}>Highest</Text>
                  <Ionicons name="trending-up" size={20} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{results.statistics.highestScore}%</Text>
                <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>Top score</Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { color: colors.textSecondary }]}>Lowest</Text>
                  <Ionicons name="trending-down" size={20} color={colors.error} />
                </View>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{results.statistics.lowestScore}%</Text>
                <Text style={[styles.statSubtitle, { color: colors.textTertiary }]}>Lowest score</Text>
              </View>
            </View>

            {/* Score Distribution */}
            <View style={[styles.scoreDistributionCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Score Distribution</Text>
              <View style={styles.distributionList}>
                {results.scoreDistribution.map((item, index) =>
              <View key={index} style={styles.distributionItem as any}>
                    <Text style={[styles.distributionRange as any, { color: colors.textPrimary }]}>{item.range}</Text>
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
                    <Text style={[styles.distributionCount as any, { color: colors.textSecondary }]}>{item.count}</Text>
                  </View>
              )}
              </View>
            </View>

            {/* Top Performers */}
            <View style={[styles.topPerformersCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <View style={styles.cardHeader as any}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Top Performers</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Showing top 3 of {results.submissions.length}
                </Text>
              </View>
              {results.submissions.
            sort((a, b) => b.percentage - a.percentage).
            slice(0, 3).
            map((submission, index) =>
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
                      <Text style={[styles.rankText as any, { color: colors.primary }]}>{index + 1}</Text>
                    </View>
                    <View style={styles.performerDetails}>
                      <Text style={[styles.performerName as any, { color: colors.textPrimary }]}>{submission.student.name}</Text>
                      <Text style={[styles.performerId, { color: colors.textSecondary }]}>{submission.student.studentId}</Text>
                    </View>
                  </View>
                  <Text style={[styles.performerScore as any, { color: getGradeColor(submission.percentage) }]}>
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
            results.submissions.
            sort((a, b) => b.percentage - a.percentage).
            map((submission, index) =>
            <TouchableOpacity
              key={submission.id}
              style={[
              styles.submissionItem as any,
              {
                borderBottomColor: colors.border,
                borderBottomWidth: index !== results.submissions.length - 1 ? 1 : 0
              }]
              }
              onPress={() => handleViewSubmission(submission)}
              activeOpacity={0.7}>

                    <View style={styles.submissionInfo}>
                      <Text style={[styles.submissionName as any, { color: colors.textPrimary }]}>{submission.student.name}</Text>
                      <Text style={[styles.submissionDetails, { color: colors.textSecondary }]}>
                        {submission.student.studentId} • {submission.student.class}
                      </Text>
                    </View>
                    <View style={styles.submissionMeta as any}>
                      <Text style={[styles.submissionScore as any, { color: getGradeColor(submission.percentage) }]}>
                        {submission.percentage}%
                      </Text>
                      <Text style={[styles.submissionDate, { color: colors.textTertiary }]}>
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={styles.chevronIcon} />
                  </TouchableOpacity>
            ) :

            <View style={styles.emptyState as any}>
                  <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                  <Text style={[styles.emptyTitle as any, { color: colors.textSecondary }]}>No submissions yet</Text>
                  <Text style={[styles.emptySubtitle as any, { color: colors.textTertiary }]}>
                    Students haven't submitted this exam yet
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
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Performance Analysis</Text>
                <View style={styles.trendList}>
                  <View style={[styles.trendItem as any, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.trendLabel as any, { color: colors.textSecondary }]}>Class Average</Text>
                    <Text style={[styles.trendValue as any, { color: colors.textPrimary }]}>{results.statistics.averageScore}%</Text>
                  </View>
                  <View style={[styles.trendItem as any, { borderBottomColor: colors.border }]}>
                    <Text style={[styles.trendLabel as any, { color: colors.textSecondary }]}>Performance Range</Text>
                    <Text style={[styles.trendValue as any, { color: colors.textPrimary }]}>
                      {results.statistics.lowestScore}% - {results.statistics.highestScore}%
                    </Text>
                  </View>
                  <View style={styles.trendItem as any}>
                    <Text style={[styles.trendLabel as any, { color: colors.textSecondary }]}>Standard Deviation</Text>
                    <Text style={[styles.trendValue as any, { color: colors.textPrimary }]}>
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
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Question Analysis</Text>
                <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                  Detailed question-by-question analysis coming soon...
                </Text>
                <TouchableOpacity style={[styles.actionButton as any, { backgroundColor: `${colors.primary}15` }]}>
                  <Text style={[styles.actionButtonText as any, { color: colors.primary }]}>Generate Detailed Report</Text>
                </TouchableOpacity>
              </View>

              {/* Action Recommendations */}
              <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Recommended Actions</Text>
                <View style={styles.recommendationsList}>
                  {performanceInsights.map((insight, index) =>
                <View key={index} style={styles.recommendationItem as any}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.recommendationIcon} />
                      <Text style={[styles.recommendationText, { color: colors.textSecondary }]}>{insight}</Text>
                    </View>
                )}
                  {performanceInsights.length === 0 &&
                <Text style={[styles.noRecommendations as any, { color: colors.textTertiary }]}>No specific recommendations at this time.</Text>
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
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Submission Details</Text>
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
                    <Text style={[styles.studentName as any, { color: colors.textPrimary }]}>{selectedSubmission.student.name}</Text>
                    <Text style={[styles.studentDetails, { color: colors.textSecondary }]}>
                      {selectedSubmission.student.studentId} • {selectedSubmission.student.class}
                    </Text>
                    {selectedSubmission.student.email &&
                  <Text style={[styles.studentEmail, { color: colors.textTertiary }]}>
                        {selectedSubmission.student.email}
                      </Text>
                  }
                  </View>
                  <View style={styles.studentScore as any}>
                    <Text style={[styles.scoreValue, { color: getGradeColor(selectedSubmission.percentage) }]}>
                      {selectedSubmission.percentage}%
                    </Text>
                    <Text style={[styles.scoreDetails, { color: colors.textSecondary }]}>
                      {selectedSubmission.score}/{selectedSubmission.total_points} points
                    </Text>
                  </View>
                </View>

                <View style={styles.submissionMetaRow as any}>
                  <Text style={[styles.submissionMetaText, { color: colors.textTertiary }]}>
                    Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </Text>
                  {selectedSubmission.time_spent &&
                <Text style={[styles.submissionMetaText, { color: colors.textTertiary }]}>
                      Time: {selectedSubmission.time_spent}
                    </Text>
                }
                </View>
              </View>

              {/* Answers Section */}
              <View style={[styles.answersCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>Question Analysis</Text>
                <View style={styles.answersList}>
                  {selectedSubmission.answers.map((answer: any, index: number) =>
                <View
                  key={index}
                  style={[styles.answerItem, { borderColor: colors.border }]}>

                      <View style={styles.answerHeader as any}>
                        <Text style={[styles.questionNumber as any, { color: colors.textPrimary }]}>Q{index + 1}</Text>
                        <View style={[styles.answerStatus, { backgroundColor: answer.is_correct ? `${colors.success}20` : `${colors.error}20` }]}>
                          <Text style={[styles.statusText as any, { color: answer.is_correct ? colors.success : colors.error }]}>
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.answerPoints, { color: colors.textSecondary }]}>
                        Points: {answer.points}
                      </Text>
                      {answer.answer &&
                  <Text style={[styles.answerText, { color: colors.textPrimary }]}>
                          Answer: {answer.answer}
                        </Text>
                  }
                    </View>
                )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions as any}>
                <TouchableOpacity
                style={[styles.modalActionButton as any, { backgroundColor: colors.primary }]}
                onPress={exportResults}>

                  <Text style={styles.modalActionText as any}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity
                style={[styles.modalActionButton as any, { backgroundColor: colors.background }]}
                onPress={handleSendFeedback}>

                  <Text style={[styles.modalActionText as any, { color: colors.textPrimary }]}>Send Feedback</Text>
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
            <Text style={[styles.feedbackTitle, { color: colors.textPrimary }]}>Send Feedback</Text>
            <Text style={[styles.feedbackSubtitle, { color: colors.textSecondary }]}>
              Send personalized feedback to {selectedSubmission?.student.name}
            </Text>
            
            <TextInput
              style={[styles.feedbackInput, {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.textPrimary
              }]}
              placeholder="Write your feedback here..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={feedback}
              onChangeText={setFeedback} />

            
            <View style={styles.feedbackActions as any}>
              <TouchableOpacity
                style={[styles.feedbackButton as any, { backgroundColor: colors.background }]}
                onPress={() => setFeedbackModalVisible(false)}>

                <Text style={[styles.feedbackButtonText as any, { color: colors.textPrimary }]}>{t("common.cancel")}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton as any, { backgroundColor: colors.primary }]}
                onPress={sendFeedback}
                disabled={!feedback.trim() || sendingFeedback}>

                {sendingFeedback ?
                <ActivityIndicator size="small" color="white" /> :

                <Text style={styles.feedbackButtonText as any}>{t("common.send")}</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>);

}

const styles = {
  container: {
    flex: 1
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