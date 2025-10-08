// app/(teacher)/exam-results/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

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

export default function TeacherExamResultsScreen() {
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

  useEffect(() => {
    loadExamResults();
  }, [id]);

  // In your app/(teacher)/exam-results/[id].tsx - Update the loadExamResults function
const loadExamResults = async () => {
  try {
    setLoading(true);
    console.log('📊 Loading teacher exam results for:', id);
    
    // ✅ FIX: Use the teacher-specific endpoint
    const response = await apiService.getTeacherExamResults(id as string);
    
    if (response.data.success) {
      const data = response.data.data;
      console.log('✅ Exam results loaded:', data);
      
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
          percentage: sub.percentage || Math.round((sub.score / (sub.totalPoints || sub.total_points || 1)) * 100),
          submitted_at: sub.submittedAt || sub.submitted_at,
          answers: sub.answers || [],
          time_spent: sub.time_spent
        }))
      };

      // Calculate statistics if not provided
      if (!data.statistics && transformedResults.submissions.length > 0) {
        const stats = calculateStatistics(transformedResults.submissions);
        transformedResults.statistics = { ...transformedResults.statistics, ...stats };
      }

      // Calculate score distribution if not provided
      if (!data.scoreDistribution && transformedResults.submissions.length > 0) {
        transformedResults.scoreDistribution = calculateScoreDistribution(transformedResults.submissions);
      }

      setResults(transformedResults);
    } else {
      throw new Error(response.data.error);
    }
  } catch (error: any) {
    console.error('❌ Failed to load exam results:', error);
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
      { range: '0-59', count: 0 },
    ];

    submissions.forEach(submission => {
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
    const percentages = submissions.map(sub => sub.percentage);
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
    if (percentage >= 90) return 'text-green-600';
    if (percentage >= 80) return 'text-blue-600';
    if (percentage >= 70) return 'text-yellow-600';
    if (percentage >= 60) return 'text-orange-600';
    return 'text-red-600';
  };

  const getGradeBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 80) return 'bg-blue-500';
    if (percentage >= 70) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
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
      // TODO: Implement feedback API endpoint
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
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
      { text: 'Cancel', style: 'cancel' }
    ]);
  };

  const shareResults = () => {
    Alert.alert('Share Results', 'Share exam results with:', [
      { text: 'All Students', onPress: () => console.log('Sharing with all students...') },
      { text: 'Selected Students', onPress: () => console.log('Sharing with selected students...') },
      { text: 'Other Teachers', onPress: () => console.log('Sharing with teachers...') },
      { text: 'Cancel', style: 'cancel' }
    ]);
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

    const lowPerformers = results.submissions.filter(sub => sub.percentage < 60).length;
    if (lowPerformers > results.submissions.length * 0.3) {
      insights.push(`${lowPerformers} students scored below 60%. May need remediation.`);
    }

    return insights;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-gray-600 mt-4 text-base font-medium">Loading exam results...</Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="alert-circle" size={64} color="#D1D5DB" />
        <Text className="text-gray-500 text-lg font-medium mt-4">No results found</Text>
        <Text className="text-gray-400 text-sm text-center mt-2 px-8">
          Unable to load exam results. The exam may not exist or you may not have permission to view it.
        </Text>
        <TouchableOpacity 
          className="bg-blue-500 px-6 py-3 rounded-xl mt-6 flex-row items-center"
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={20} color="white" />
          <Text className="text-white font-semibold ml-2">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const performanceInsights = getPerformanceInsights();

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100">
        <View className="flex-row items-center justify-between mb-4">
          <TouchableOpacity 
            className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={20} color="#007AFF" />
          </TouchableOpacity>
          <Text className="text-xl font-bold text-gray-900 flex-1 text-center">Exam Analytics</Text>
          <View className="flex-row space-x-2">
            <TouchableOpacity 
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={shareResults}
            >
              <Ionicons name="share" size={18} color="#007AFF" />
            </TouchableOpacity>
            <TouchableOpacity 
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={exportResults}
            >
              <Ionicons name="download" size={18} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="mb-4">
          <Text className="text-2xl font-bold text-gray-900 mb-1">
            {results.exam.title}
          </Text>
          <Text className="text-gray-500 text-base font-medium">
            {results.exam.subject} • {results.exam.class}
          </Text>
          {results.exam.teacher && (
            <Text className="text-gray-400 text-sm mt-1">
              Created by: {results.exam.teacher.profile.name}
            </Text>
          )}
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {[
            { key: 'overview', label: 'Overview', icon: 'stats-chart' },
            { key: 'submissions', label: 'Submissions', icon: 'document-text' },
            { key: 'analytics', label: 'Analytics', icon: 'analytics' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${
                activeTab === tab.key ? 'bg-white shadow-sm' : ''
              }`}
              onPress={() => setActiveTab(tab.key as any)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#007AFF' : '#8E8E93'}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${
                  activeTab === tab.key ? 'text-blue-600' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTab === 'overview' ? (
          <View className="p-6">
            {/* Performance Insights */}
            {performanceInsights.length > 0 && (
              <View className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 mb-6">
                <View className="flex-row items-start">
                  <Ionicons name="bulb" size={20} color="#D97706" className="mt-0.5 mr-3" />
                  <View className="flex-1">
                    <Text className="text-yellow-800 font-semibold text-base mb-2">Performance Insights</Text>
                    {performanceInsights.map((insight, index) => (
                      <Text key={index} className="text-yellow-700 text-sm mb-1">• {insight}</Text>
                    ))}
                  </View>
                </View>
              </View>
            )}

            {/* Statistics Cards */}
            <View className="grid grid-cols-2 gap-4 mb-6">
              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-500 text-sm font-medium">Submissions</Text>
                  <Ionicons name="people" size={20} color="#007AFF" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                  {results.statistics.totalSubmissions}
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  {results.statistics.totalStudents ? `of ${results.statistics.totalStudents} students` : 'Total submissions'}
                </Text>
              </View>

              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-500 text-sm font-medium">Avg. Score</Text>
                  <Ionicons name="trophy" size={20} color="#34C759" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                  {results.statistics.averageScore}%
                </Text>
                <Text className="text-gray-400 text-xs mt-1">Class average</Text>
              </View>

              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-500 text-sm font-medium">Highest</Text>
                  <Ionicons name="trending-up" size={20} color="#FF9500" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                  {results.statistics.highestScore}%
                </Text>
                <Text className="text-gray-400 text-xs mt-1">Top score</Text>
              </View>

              <View className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <View className="flex-row items-center justify-between mb-3">
                  <Text className="text-gray-500 text-sm font-medium">Lowest</Text>
                  <Ionicons name="trending-down" size={20} color="#FF3B30" />
                </View>
                <Text className="text-2xl font-bold text-gray-900">
                  {results.statistics.lowestScore}%
                </Text>
                <Text className="text-gray-400 text-xs mt-1">Lowest score</Text>
              </View>
            </View>

            {/* Score Distribution */}
            <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
              <Text className="text-lg font-semibold text-gray-900 mb-4">Score Distribution</Text>
              <View className="space-y-3">
                {results.scoreDistribution.map((item, index) => (
                  <View key={index} className="flex-row items-center justify-between">
                    <Text className="text-gray-700 font-medium text-sm w-12">{item.range}</Text>
                    <View className="flex-1 mx-3">
                      <View className="w-full bg-gray-200 rounded-full h-3">
                        <View 
                          className={`h-3 rounded-full ${getGradeBgColor(parseInt(item.range.split('-')[0]))}`}
                          style={{ 
                            width: `${(item.count / Math.max(...results.scoreDistribution.map(s => s.count), 1) * 100)}%` 
                          }}
                        />
                      </View>
                    </View>
                    <Text className="text-gray-500 text-sm font-medium w-8 text-right">
                      {item.count}
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Top Performers */}
            <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-lg font-semibold text-gray-900">Top Performers</Text>
                <Text className="text-gray-500 text-sm">
                  Showing top 3 of {results.submissions.length}
                </Text>
              </View>
              {results.submissions
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 3)
                .map((submission, index) => (
                <View 
                  key={submission.id}
                  className={`flex-row items-center justify-between py-3 ${
                    index < 2 ? 'border-b border-gray-100' : ''
                  }`}
                >
                  <View className="flex-row items-center">
                    <View className="w-8 h-8 bg-blue-100 rounded-full items-center justify-center mr-3">
                      <Text className="text-blue-600 font-bold text-sm">{index + 1}</Text>
                    </View>
                    <View>
                      <Text className="text-gray-900 font-semibold text-base">
                        {submission.student.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {submission.student.studentId}
                      </Text>
                    </View>
                  </View>
                  <Text className={`text-lg font-bold ${getGradeColor(submission.percentage)}`}>
                    {submission.percentage}%
                  </Text>
                </View>
              ))}
            </View>
          </View>
        ) : activeTab === 'submissions' ? (
          <View className="p-6">
            {/* Submissions List */}
            <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {results.submissions.length > 0 ? (
                results.submissions
                  .sort((a, b) => b.percentage - a.percentage)
                  .map((submission, index) => (
                  <TouchableOpacity
                    key={submission.id}
                    className={`flex-row items-center justify-between p-4 ${
                      index !== results.submissions.length - 1 ? 'border-b border-gray-100' : ''
                    } active:bg-gray-50`}
                    onPress={() => handleViewSubmission(submission)}
                  >
                    <View className="flex-1">
                      <Text className="text-gray-900 font-semibold text-base mb-1">
                        {submission.student.name}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {submission.student.studentId} • {submission.student.class}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className={`text-lg font-bold ${getGradeColor(submission.percentage)}`}>
                        {submission.percentage}%
                      </Text>
                      <Text className="text-gray-400 text-xs">
                        {new Date(submission.submitted_at).toLocaleDateString()}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#8E8E93" className="ml-3" />
                  </TouchableOpacity>
                ))
              ) : (
                <View className="p-8 items-center">
                  <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 text-base font-medium mt-3">No submissions yet</Text>
                  <Text className="text-gray-400 text-sm text-center mt-1">
                    Students haven't submitted this exam yet
                  </Text>
                </View>
              )}
            </View>
          </View>
        ) : (
          <View className="p-6">
            {/* Analytics Tab */}
            <View className="space-y-6">
              {/* Performance Trends */}
              <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Performance Analysis</Text>
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center py-2">
                    <Text className="text-gray-700 font-medium">Class Average</Text>
                    <Text className="text-gray-900 font-semibold">{results.statistics.averageScore}%</Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-t border-gray-100">
                    <Text className="text-gray-700 font-medium">Performance Range</Text>
                    <Text className="text-gray-900 font-semibold">
                      {results.statistics.lowestScore}% - {results.statistics.highestScore}%
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center py-2 border-t border-gray-100">
                    <Text className="text-gray-700 font-medium">Standard Deviation</Text>
                    <Text className="text-gray-900 font-semibold">
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
              <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Question Analysis</Text>
                <Text className="text-gray-500 text-sm mb-4">
                  Detailed question-by-question analysis coming soon...
                </Text>
                <TouchableOpacity className="bg-blue-50 rounded-xl p-4 items-center">
                  <Text className="text-blue-600 font-semibold">Generate Detailed Report</Text>
                </TouchableOpacity>
              </View>

              {/* Action Recommendations */}
              <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Recommended Actions</Text>
                <View className="space-y-3">
                  {performanceInsights.map((insight, index) => (
                    <View key={index} className="flex-row items-start">
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" className="mt-1 mr-3" />
                      <Text className="text-gray-700 text-sm flex-1">{insight}</Text>
                    </View>
                  ))}
                  {performanceInsights.length === 0 && (
                    <Text className="text-gray-500 text-sm">No specific recommendations at this time.</Text>
                  )}
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Submission Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View className="flex-1 bg-gray-50">
          {/* Modal Header */}
          <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100">
            <View className="flex-row items-center justify-between mb-4">
              <TouchableOpacity 
                className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
                onPress={() => setDetailModalVisible(false)}
              >
                <Ionicons name="close" size={20} color="#007AFF" />
              </TouchableOpacity>
              <Text className="text-xl font-bold text-gray-900 flex-1 text-center">Submission Details</Text>
              <TouchableOpacity 
                className="w-10 h-10 bg-blue-100 rounded-full items-center justify-center"
                onPress={handleSendFeedback}
              >
                <Ionicons name="chatbubble" size={18} color="#007AFF" />
              </TouchableOpacity>
            </View>
          </View>

          {selectedSubmission && (
            <ScrollView className="flex-1 p-6">
              <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm mb-6">
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-1">
                    <Text className="text-lg font-semibold text-gray-900">
                      {selectedSubmission.student.name}
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {selectedSubmission.student.studentId} • {selectedSubmission.student.class}
                    </Text>
                    {selectedSubmission.student.email && (
                      <Text className="text-gray-400 text-sm">
                        {selectedSubmission.student.email}
                      </Text>
                    )}
                  </View>
                  <View className="items-end">
                    <Text className={`text-2xl font-bold ${getGradeColor(selectedSubmission.percentage)}`}>
                      {selectedSubmission.percentage}%
                    </Text>
                    <Text className="text-gray-500 text-sm">
                      {selectedSubmission.score}/{selectedSubmission.total_points} points
                    </Text>
                  </View>
                </View>

                <View className="flex-row justify-between items-center">
                  <Text className="text-gray-400 text-sm">
                    Submitted: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </Text>
                  {selectedSubmission.time_spent && (
                    <Text className="text-gray-400 text-sm">
                      Time: {selectedSubmission.time_spent}
                    </Text>
                  )}
                </View>
              </View>

              {/* Answers Section */}
              <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <Text className="text-lg font-semibold text-gray-900 mb-4">Question Analysis</Text>
                <View className="space-y-4">
                  {selectedSubmission.answers.map((answer: any, index: number) => (
                    <View key={index} className="border border-gray-200 rounded-xl p-4">
                      <View className="flex-row justify-between items-start mb-2">
                        <Text className="text-gray-900 font-medium text-base flex-1">
                          Q{index + 1}
                        </Text>
                        <View className={`px-2 py-1 rounded-full ${
                          answer.is_correct ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <Text className={`text-xs font-semibold ${
                            answer.is_correct ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {answer.is_correct ? 'Correct' : 'Incorrect'}
                          </Text>
                        </View>
                      </View>
                      <Text className="text-gray-500 text-sm mb-2">
                        Points: {answer.points}
                      </Text>
                      {answer.answer && (
                        <Text className="text-gray-700 text-sm">
                          Answer: {answer.answer}
                        </Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 mt-6">
                <TouchableOpacity 
                  className="flex-1 bg-blue-500 rounded-xl p-4 items-center"
                  onPress={exportResults}
                >
                  <Text className="text-white font-semibold text-base">Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  className="flex-1 bg-gray-100 rounded-xl p-4 items-center"
                  onPress={handleSendFeedback}
                >
                  <Text className="text-gray-700 font-semibold text-base">Send Feedback</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}
      >
        <View className="flex-1 justify-center items-center bg-black/50 p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-sm">
            <Text className="text-xl font-bold text-gray-900 mb-2">Send Feedback</Text>
            <Text className="text-gray-500 text-sm mb-4">
              Send personalized feedback to {selectedSubmission?.student.name}
            </Text>
            
            <TextInput
              className="border border-gray-300 rounded-xl p-4 h-32 text-base mb-4"
              placeholder="Write your feedback here..."
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />
            
            <View className="flex-row space-x-3">
              <TouchableOpacity 
                className="flex-1 bg-gray-100 rounded-xl p-4 items-center"
                onPress={() => setFeedbackModalVisible(false)}
              >
                <Text className="text-gray-700 font-semibold">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                className="flex-1 bg-blue-500 rounded-xl p-4 items-center"
                onPress={sendFeedback}
                disabled={!feedback.trim() || sendingFeedback}
              >
                {sendingFeedback ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-semibold">Send</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}