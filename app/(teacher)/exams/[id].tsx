// app/(teacher)/exams/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Exam, Question } from '../../../src/types';

interface ExamDetails extends Exam {
  questions: Question[];
  submissions_count: number;
  average_score: number;
  total_points: number;
}

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [exam, setExam] = useState<ExamDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'questions' | 'submissions'>('overview');

  useEffect(() => {
    if (id) {
      loadExamDetails();
    }
  }, [id]);

  const loadExamDetails = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamById(id as string);

      if (response.data.success && response.data.data) {
        const examData = response.data.data;
        // Ensure we have all required properties with defaults
        const examDetails: ExamDetails = {
          ...examData,
          questions: examData.questions || [],
          submissions_count: examData.submissions_count || 0,
          average_score: examData.average_score || 0,
          total_points: examData.total_points || 0,
        };
        setExam(examDetails);
      } else {
        Alert.alert('Error', 'Failed to load exam details');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load exam details:', error);
      Alert.alert('Error', 'Failed to load exam details');
      router.back();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExamDetails();
  };

  const deleteExam = () => {
    if (!exam) return;

    Alert.alert(
      'Delete Exam',
      `Are you sure you want to delete "${exam.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.deleteExam(exam.id);
              if (response.data.success) {
                Alert.alert('Success', 'Exam deleted successfully');
                router.back();
              } else {
                Alert.alert('Error', response.data.error || 'Failed to delete exam');
              }
            } catch (error) {
              console.error('Delete exam error:', error);
              Alert.alert('Error', 'Failed to delete exam');
            }
          },
        },
      ]
    );
  };

  // In your [id].tsx file, update the toggleExamStatus function:
const toggleExamStatus = async () => {
  if (!exam) return;

  try {
    const newStatus = !exam.is_active;
    const response = await apiService.updateExam(exam.id, { is_active: newStatus });

    if (response.data.success) {
      setExam(prev => prev ? { ...prev, is_active: newStatus } : null);
      
      // ✅ Send push notification when exam status changes
      if (newStatus) {
        // Exam activated - notify students
        try {
          // Get exam submissions to find students who should be notified
          const submissionsResponse = await apiService.getExamSubmissions(exam.id);
          if (submissionsResponse.data.success) {
            const submissions = submissionsResponse.data.data || [];
            const studentIds = [...new Set(submissions.map((sub: any) => sub.student_id))];
            
            // Notify each student
            for (const studentId of studentIds) {
              try {
                // Get the student's user ID
                const studentResponse = await apiService.getUserById(studentId);
                if (studentResponse.data.success) {
                  await apiService.sendNotificationToUser(
                    studentResponse.data.data.id, // user_id
                    'Exam Activated',
                    `The exam "${exam.title}" is now available for you to take`,
                    {
                      screen: 'exam',
                      examId: exam.id,
                      type: 'exam_activated'
                    }
                  );
                }
              } catch (notificationError) {
                console.log(`Failed to notify student ${studentId}:`, notificationError);
              }
            }
          }
        } catch (error) {
          console.log('Failed to send exam activation notifications:', error);
        }
      }
      Alert.alert('Success', `Exam ${newStatus ? 'activated' : 'deactivated'} successfully`);
    } else {
      Alert.alert('Error', response.data.error || 'Failed to update exam status');
    }
  } catch (error) {
    console.error('Toggle exam status error:', error);
    Alert.alert('Error', 'Failed to update exam status');
  }
};


  const getTotalPoints = () => {
    if (!exam?.questions) return 0;
    return exam.questions.reduce((sum, question) => sum + question.points, 0);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-gray-600 mt-4 text-base font-medium">Loading exam details...</Text>
      </View>
    );
  }

  if (!exam) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <Ionicons name="document-text" size={64} color="#D1D5DB" />
        <Text className="text-gray-500 text-lg font-medium mt-4">Exam not found</Text>
        <TouchableOpacity
          className="bg-blue-500 px-6 py-3 rounded-xl flex-row items-center mt-6"
          onPress={() => router.back()}
        >
          <Text className="text-white font-semibold text-base">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header */}
      <View className="bg-white dark:bg-gray-800 px-6 pt-16 pb-6 border-b border-gray-100">
        <View className="flex-row justify-between items-start mb-4">
          <View className="flex-1">
            <TouchableOpacity
              className="flex-row items-center mb-4"
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={20} color="#007AFF" />
              <Text className="text-blue-600 font-medium ml-2">Back to Exams</Text>
            </TouchableOpacity>

            <View className="flex-row justify-between items-start">
              <View className="flex-1">
                <Text className="text-2xl font-bold text-gray-900 mb-2">
                  {exam.title}
                </Text>
                <View className="flex-row items-center space-x-4">
                  <View className="flex-row items-center">
                    <Ionicons name="book" size={16} color="#8E8E93" />
                    <Text className="text-gray-500 text-sm font-medium ml-1">
                      {exam.subject}
                    </Text>
                  </View>
                  <View className="flex-row items-center">
                    <Ionicons name="people" size={16} color="#8E8E93" />
                    <Text className="text-gray-500 text-sm font-medium ml-1">
                      {exam.class}
                    </Text>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${exam.is_active ? 'bg-green-100' : 'bg-gray-100'
                    }`}>
                    <Text className={`text-xs font-semibold ${exam.is_active ? 'text-green-600' : 'text-gray-600'
                      }`}>
                      {exam.is_active ? 'Active' : 'Inactive'}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="flex-row space-x-2">
                <TouchableOpacity
                  className="w-10 h-10 bg-blue-50 rounded-lg items-center justify-center"
                  onPress={() => router.push(`/(teacher)/create-exam?edit=${exam.id}`)}
                >
                  <Ionicons name="create" size={18} color="#007AFF" />
                </TouchableOpacity>
                <TouchableOpacity
                  className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center"
                  onPress={deleteExam}
                >
                  <Ionicons name="trash" size={18} color="#FF3B30" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mt-4">
          {[
            { key: 'overview' as const, label: 'Overview', icon: 'grid' },
            { key: 'questions' as const, label: 'Questions', icon: 'help-circle' },
            { key: 'submissions' as const, label: 'Submissions', icon: 'document' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              className={`flex-1 py-3 rounded-lg flex-row justify-center items-center ${activeTab === tab.key ? 'bg-white dark:bg-gray-800 shadow-sm' : ''
                }`}
              onPress={() => setActiveTab(tab.key)}
            >
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? '#007AFF' : '#8E8E93'}
              />
              <Text
                className={`ml-2 text-sm font-semibold ${activeTab === tab.key ? 'text-blue-600' : 'text-gray-500'
                  }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Content */}
      <View className="p-6">
        {activeTab === 'overview' && (
          <View className="space-y-6">
            {/* Exam Stats */}
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <Text className="text-xl font-semibold text-gray-900 mb-4">Exam Overview</Text>

              <View className="grid grid-cols-2 gap-4 mb-6">
                <View className="bg-blue-50 rounded-xl p-4">
                  <Text className="text-blue-600 text-2xl font-bold">{exam.submissions_count || 0}</Text>
                  <Text className="text-blue-600 text-sm font-medium mt-1">Submissions</Text>
                </View>
                <View className="bg-green-50 rounded-xl p-4">
                  <Text className="text-green-600 text-2xl font-bold">
                    {exam.average_score ? `${exam.average_score}%` : 'N/A'}
                  </Text>
                  <Text className="text-green-600 text-sm font-medium mt-1">Average Score</Text>
                </View>
                <View className="bg-purple-50 rounded-xl p-4">
                  <Text className="text-purple-600 text-2xl font-bold">{exam.questions?.length || 0}</Text>
                  <Text className="text-purple-600 text-sm font-medium mt-1">Questions</Text>
                </View>
                <View className="bg-orange-50 rounded-xl p-4">
                  <Text className="text-orange-600 text-2xl font-bold">{getTotalPoints()}</Text>
                  <Text className="text-orange-600 text-sm font-medium mt-1">Total Points</Text>
                </View>
              </View>

              {/* Exam Settings */}
              <View className="border-t border-gray-100 pt-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">Settings</Text>
                <View className="space-y-3">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-700">Timed Exam</Text>
                    <Text className="text-gray-900 font-medium">
                      {exam.settings?.timed ? `${exam.settings.duration} minutes` : 'No time limit'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-700">Allow Retake</Text>
                    <Text className="text-gray-900 font-medium">
                      {exam.settings?.allow_retake ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-700">Random Order</Text>
                    <Text className="text-gray-900 font-medium">
                      {exam.settings?.random_order ? 'Yes' : 'No'}
                    </Text>
                  </View>
                  <View className="flex-row justify-between items-center">
                    <Text className="text-gray-700">Created</Text>
                    <Text className="text-gray-900 font-medium">
                      {new Date(exam.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Actions */}
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <Text className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</Text>
              <View className="grid grid-cols-2 gap-3">
                <TouchableOpacity
                  className="bg-blue-50 rounded-xl p-4 flex-row items-center justify-center border border-blue-200"
                  onPress={toggleExamStatus}
                >
                  <Ionicons
                    name={exam.is_active ? 'pause' : 'play'}
                    size={20}
                    color="#007AFF"
                  />
                  <Text className="text-blue-700 font-medium ml-2 text-sm">
                    {exam.is_active ? 'Pause Exam' : 'Activate Exam'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-green-50 rounded-xl p-4 flex-row items-center justify-center border border-green-200"
                  onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                >
                  <Ionicons name="bar-chart" size={20} color="#34C759" />
                  <Text className="text-green-700 font-medium ml-2 text-sm">View Results</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-purple-50 rounded-xl p-4 flex-row items-center justify-center border border-purple-200"
                  onPress={() => Alert.alert('Info', 'Share feature coming soon')}
                >
                  <Ionicons name="share" size={20} color="#8B5CF6" />
                  <Text className="text-purple-700 font-medium ml-2 text-sm">Share Exam</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className="bg-orange-50 rounded-xl p-4 flex-row items-center justify-center border border-orange-200"
                  onPress={() => Alert.alert('Info', 'Analytics feature coming soon')}
                >
                  <Ionicons name="analytics" size={20} color="#F59E0B" />
                  <Text className="text-orange-700 font-medium ml-2 text-sm">Analytics</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'questions' && (
          <View className="space-y-4">
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-semibold text-gray-900">Questions</Text>
                <Text className="text-gray-500 text-sm">
                  {exam.questions?.length || 0} questions • {getTotalPoints()} points
                </Text>
              </View>

              {exam.questions && exam.questions.length > 0 ? (
                <View className="space-y-4">
                  {exam.questions.map((question, index) => (
                    <View key={question.id} className="border border-gray-200 rounded-xl p-4">
                      <View className="flex-row justify-between items-start mb-3">
                        <Text className="text-gray-900 font-semibold flex-1">
                          {index + 1}. {question.question}
                        </Text>
                        <View className="bg-blue-100 px-2 py-1 rounded-full">
                          <Text className="text-blue-600 text-xs font-semibold">
                            {question.points} pt{question.points !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>

                      <View className="mb-2">
                        <Text className="text-gray-600 text-sm font-medium mb-2">Type:
                          <Text className="text-gray-900 capitalize"> {question.type}</Text>
                        </Text>
                      </View>

                      {question.type === 'mcq' && question.options && (
                        <View className="space-y-2">
                          <Text className="text-gray-600 text-sm font-medium">Options:</Text>
                          {question.options.map((option, optIndex) => (
                            <View key={optIndex} className="flex-row items-center space-x-2">
                              <View className={`w-5 h-5 rounded-full border-2 ${option === question.correct_answer
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300'
                                }`} />
                              <Text className={`text-sm ${option === question.correct_answer
                                  ? 'text-green-600 font-semibold'
                                  : 'text-gray-700'
                                }`}>
                                {option}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}

                      {question.explanation && (
                        <View className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <Text className="text-gray-600 text-sm font-medium">Explanation:</Text>
                          <Text className="text-gray-700 text-sm mt-1">{question.explanation}</Text>
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              ) : (
                <View className="py-8 items-center">
                  <Ionicons name="help-circle" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 text-base font-medium mt-4">No questions added</Text>
                  <Text className="text-gray-400 text-sm text-center mt-2">
                    Add questions to this exam to get started
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {activeTab === 'submissions' && (
          <View className="space-y-4">
            <View className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 shadow-sm">
              <View className="flex-row justify-between items-center mb-4">
                <Text className="text-xl font-semibold text-gray-900">Submissions</Text>
                <Text className="text-gray-500 text-sm">
                  {exam.submissions_count || 0} submissions
                </Text>
              </View>

              {exam.submissions_count > 0 ? (
                <TouchableOpacity
                  className="bg-blue-500 rounded-xl p-4 flex-row justify-center items-center"
                  onPress={() => router.push(`/(teacher)/exam-results/${exam.id}`)}
                >
                  <Ionicons name="bar-chart" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">View All Results</Text>
                </TouchableOpacity>
              ) : (
                <View className="py-8 items-center">
                  <Ionicons name="document" size={48} color="#D1D5DB" />
                  <Text className="text-gray-500 text-base font-medium mt-4">No submissions yet</Text>
                  <Text className="text-gray-400 text-sm text-center mt-2">
                    Student submissions will appear here once they take the exam
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>
    </ScrollView>
  );
}