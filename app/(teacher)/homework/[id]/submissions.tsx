// app/(teacher)/homework/[id]/submissions.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, RefreshControl } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../../../src/contexts/AuthContext';
import { apiService } from '../../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../../../src/utils/themeUtils';

interface Submission {
  id: string;
  student_id: string;
  homework_id: string;
  submitted_at: string;
  content: string;
  attachments: string[];
  grade?: number;
  feedback?: string;
  graded_at?: string;
  student?: {
    id: string;
    profile: {
      name: string;
      class?: string;
    };
  };
}

interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  points: number;
  attachments: boolean;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

export default function HomeworkSubmissionsScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [gradingSubmission, setGradingSubmission] = useState<Submission | null>(null);
  const [grade, setGrade] = useState('');
  const [feedback, setFeedback] = useState('');
  const [grading, setGrading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomeworkAndSubmissions();
  }, [id]);

  const loadHomeworkAndSubmissions = async () => {
    try {
      setLoading(true);
      
      // Load homework details
      const homeworkResponse = await apiService.getHomeworkById(id as string);
      if (homeworkResponse.data.success) {
        setHomework(homeworkResponse.data.data);
      } else {
        throw new Error(homeworkResponse.data.error || 'Failed to load homework');
      }

      // Load submissions using the real API endpoint
      const submissionsResponse = await apiService.getHomeworkSubmissions(id as string);
      if (submissionsResponse.data.success) {
        setSubmissions(submissionsResponse.data.data || []);
      } else {
        throw new Error(submissionsResponse.data.error || 'Failed to load submissions');
      }

    } catch (error: any) {
      console.error('Failed to load homework submissions:', error);
      Alert.alert('Error', error.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadHomeworkAndSubmissions();
  };

  const handleGradeSubmission = async () => {
    if (!gradingSubmission || !grade) {
      Alert.alert('Error', 'Please enter a grade');
      return;
    }

    const gradeValue = parseInt(grade);
    if (isNaN(gradeValue) || gradeValue < 0 || gradeValue > (homework?.points || 100)) {
      Alert.alert('Error', `Please enter a valid grade between 0 and ${homework?.points || 100}`);
      return;
    }

    setGrading(true);
    try {
      // Use the real grading API endpoint
      const response = await apiService.gradeSubmission(
        gradingSubmission.id, 
        gradeValue, 
        feedback
      );

      if (response.data.success) {
        // Update local state with the graded submission
        setSubmissions(prev => prev.map(sub => 
          sub.id === gradingSubmission.id 
            ? { 
                ...sub, 
                grade: gradeValue, 
                feedback,
                graded_at: new Date().toISOString()
              }
            : sub
        ));
        
        Alert.alert('Success', 'Submission graded successfully');
        setGradingSubmission(null);
        setGrade('');
        setFeedback('');
      } else {
        throw new Error(response.data.error || 'Failed to grade submission');
      }
    } catch (error: any) {
      console.error('Failed to grade submission:', error);
      Alert.alert('Error', error.message || 'Failed to grade submission');
    } finally {
      setGrading(false);
    }
  };

  const openGradeModal = (submission: Submission) => {
    setGradingSubmission(submission);
    setGrade(submission.grade?.toString() || '');
    setFeedback(submission.feedback || '');
  };

  const getGradeColor = (grade?: number) => {
    if (!grade) return 'bg-gray-100 text-gray-600';
    if (grade >= 90) return 'bg-emerald-100 text-emerald-700';
    if (grade >= 80) return 'bg-blue-100 text-blue-700';
    if (grade >= 70) return 'bg-amber-100 text-amber-700';
    return 'bg-red-100 text-red-700';
  };

  const getGradeStatus = (submission: Submission) => {
    if (submission.grade !== undefined && submission.grade !== null) {
      return 'graded';
    }
    return 'pending';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateAverageGrade = () => {
    const gradedSubmissions = submissions.filter(s => s.grade !== undefined && s.grade !== null);
    if (gradedSubmissions.length === 0) return 0;
    
    const total = gradedSubmissions.reduce((sum, sub) => sum + (sub.grade || 0), 0);
    return Math.round(total / gradedSubmissions.length);
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading submissions...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-16 pb-6 border-b', Theme.background, Theme.border)}>
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-1">
            <TouchableOpacity 
              onPress={() => router.back()}
              className="flex-row items-center mb-2"
            >
              <Ionicons name="arrow-back" size={20} className={Theme.text.secondary} />
              <Text className={cn('ml-2', Theme.text.secondary)}>Back</Text>
            </TouchableOpacity>
            <Text className={cn('text-3xl font-bold mb-2', Theme.text.primary)}>
              {homework?.title}
            </Text>
            <Text className={cn('text-lg opacity-70', Theme.text.secondary)}>
              {homework?.class} • {homework?.subject} • {submissions.length} submissions
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row space-x-4">
          <View className="flex-1 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-200">
            <Text className="text-blue-600 text-2xl font-bold">
              {submissions.length}
            </Text>
            <Text className="text-blue-600 text-sm">Submitted</Text>
          </View>
          <View className="flex-1 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-200">
            <Text className="text-emerald-600 text-2xl font-bold">
              {submissions.filter(s => s.grade !== undefined && s.grade !== null).length}
            </Text>
            <Text className="text-emerald-600 text-sm">Graded</Text>
          </View>
          <View className="flex-1 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200">
            <Text className="text-amber-600 text-2xl font-bold">
              {submissions.filter(s => s.grade === undefined || s.grade === null).length}
            </Text>
            <Text className="text-amber-600 text-sm">Pending</Text>
          </View>
          <View className="flex-1 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-2xl border border-purple-200">
            <Text className="text-purple-600 text-2xl font-bold">
              {calculateAverageGrade()}%
            </Text>
            <Text className="text-purple-600 text-sm">Avg Grade</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        <View className="p-6 space-y-4">
          {submissions.length === 0 ? (
            <View className={cn('items-center py-16 rounded-2xl border-2 border-dashed', Theme.border)}>
              <Ionicons name="document-text-outline" size={80} className="opacity-20 mb-4" />
              <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
                No Submissions Yet
              </Text>
              <Text className={cn('text-center opacity-70 text-lg', Theme.text.secondary)}>
                Students haven't submitted this homework yet
              </Text>
            </View>
          ) : (
            submissions.map((submission) => (
              <View
                key={submission.id}
                className={cn('rounded-2xl p-5 border', Theme.elevated, Theme.border)}
              >
                <View className="flex-row justify-between items-start mb-4">
                  <View className="flex-1">
                    <Text className={cn('text-xl font-semibold mb-1', Theme.text.primary)}>
                      {submission.student?.profile?.name || 'Student'}
                    </Text>
                    <Text className={cn('text-sm', Theme.text.secondary)}>
                      {submission.student?.profile?.class && `${submission.student.profile.class} • `}
                      Submitted {formatDate(submission.submitted_at)}
                    </Text>
                  </View>
                  {getGradeStatus(submission) === 'graded' ? (
                    <View className={cn('px-3 py-1 rounded-full', getGradeColor(submission.grade))}>
                      <Text className="font-semibold text-sm">
                        {submission.grade}/{homework?.points}
                      </Text>
                    </View>
                  ) : (
                    <View className="px-3 py-1 bg-amber-100 rounded-full">
                      <Text className="text-amber-700 font-semibold text-sm">
                        Pending
                      </Text>
                    </View>
                  )}
                </View>

                <Text className={cn('text-base mb-4', Theme.text.primary)}>
                  {submission.content || 'No content provided'}
                </Text>

                {submission.attachments && submission.attachments.length > 0 && (
                  <View className="mb-4">
                    <Text className={cn('text-sm font-medium mb-2', Theme.text.primary)}>Attachments:</Text>
                    <View className="flex-row flex-wrap gap-2">
                      {submission.attachments.map((attachment, index) => (
                        <TouchableOpacity
                          key={index}
                          className="flex-row items-center bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-full"
                        >
                          <Ionicons name="document" size={16} className={Theme.text.secondary} />
                          <Text className={cn('text-sm ml-2', Theme.text.primary)}>
                            {attachment}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {submission.feedback && (
                  <View className={cn('p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 mb-4')}>
                    <Text className={cn('text-sm font-medium mb-1 text-blue-800 dark:text-blue-200')}>
                      Your Feedback:
                    </Text>
                    <Text className={cn('text-blue-700 dark:text-blue-300')}>
                      {submission.feedback}
                    </Text>
                    {submission.graded_at && (
                      <Text className={cn('text-xs mt-1 text-blue-600 dark:text-blue-400')}>
                        Graded on {formatDate(submission.graded_at)}
                      </Text>
                    )}
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => openGradeModal(submission)}
                  className={cn(
                    'flex-row items-center justify-center py-3 rounded-xl border',
                    getGradeStatus(submission) === 'graded' 
                      ? 'bg-gray-100 border-gray-200' 
                      : 'bg-blue-500 border-blue-500'
                  )}
                >
                  <Ionicons 
                    name={getGradeStatus(submission) === 'graded' ? "create" : "school"} 
                    size={18} 
                    color={getGradeStatus(submission) === 'graded' ? '#6b7280' : '#ffffff'} 
                  />
                  <Text className={
                    getGradeStatus(submission) === 'graded' 
                      ? 'text-gray-600 font-semibold ml-2'
                      : 'text-white font-semibold ml-2'
                  }>
                    {getGradeStatus(submission) === 'graded' ? 'Edit Grade' : 'Grade Submission'}
                  </Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>
      </ScrollView>

      {/* Grading Modal */}
      <Modal
        visible={!!gradingSubmission}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setGradingSubmission(null)}
      >
        <View className={cn('flex-1', Theme.background)}>
          <View className={cn('px-6 pt-8 pb-6 border-b', Theme.background, Theme.border)}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className={cn('text-2xl font-bold', Theme.text.primary)}>
                Grade Submission
              </Text>
              <TouchableOpacity 
                onPress={() => setGradingSubmission(null)}
                className="w-10 h-10 rounded-full items-center justify-center bg-gray-100 dark:bg-gray-800"
              >
                <Ionicons name="close" size={20} className={Theme.text.secondary} />
              </TouchableOpacity>
            </View>
            <Text className={cn('text-lg', Theme.text.secondary)}>
              {gradingSubmission?.student?.profile?.name}
            </Text>
            {gradingSubmission && (
              <Text className={cn('text-sm mt-1', Theme.text.secondary)}>
                Submitted on {formatDate(gradingSubmission.submitted_at)}
              </Text>
            )}
          </View>

          <ScrollView className="flex-1">
            <View className="p-6 space-y-6">
              {/* Submission Content Preview */}
              {gradingSubmission?.content && (
                <View>
                  <Text className={cn('text-lg font-semibold mb-3', Theme.text.primary)}>
                    Student's Submission
                  </Text>
                  <View className={cn('p-4 rounded-2xl border', Theme.border)}>
                    <Text className={cn('text-base', Theme.text.primary)}>
                      {gradingSubmission.content}
                    </Text>
                  </View>
                </View>
              )}

              {/* Grade Input */}
              <View>
                <Text className={cn('text-lg font-semibold mb-3', Theme.text.primary)}>
                  Grade *
                </Text>
                <View className="flex-row items-center space-x-3">
                  <TextInput
                    className={cn(
                      'flex-1 rounded-2xl p-4 border text-lg',
                      Theme.border,
                      Theme.background,
                      Theme.text.primary
                    )}
                    placeholder={`0-${homework?.points || 100}`}
                    keyboardType="numeric"
                    value={grade}
                    onChangeText={setGrade}
                  />
                  <Text className={cn('text-lg font-semibold', Theme.text.primary)}>
                    / {homework?.points}
                  </Text>
                </View>
              </View>

              {/* Feedback Input */}
              <View>
                <Text className={cn('text-lg font-semibold mb-3', Theme.text.primary)}>
                  Feedback
                </Text>
                <TextInput
                  className={cn(
                    'rounded-2xl p-4 border text-lg h-32',
                    Theme.border,
                    Theme.background,
                    Theme.text.primary
                  )}
                  placeholder="Add your feedback and notes for the student..."
                  value={feedback}
                  onChangeText={setFeedback}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row space-x-3 pt-4">
                <TouchableOpacity
                  onPress={() => setGradingSubmission(null)}
                  className="flex-1 px-6 py-4 rounded-2xl bg-gray-100 dark:bg-gray-800 items-center"
                >
                  <Text className={cn('font-semibold text-lg', Theme.text.primary)}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleGradeSubmission}
                  disabled={grading || !grade}
                  className={cn(
                    'flex-1 px-6 py-4 rounded-2xl items-center',
                    grading || !grade ? 'bg-blue-400' : 'bg-blue-500'
                  )}
                >
                  {grading ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text className="text-white font-semibold text-lg">Save Grade</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}