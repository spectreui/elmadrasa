// app/(teacher)/homework/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '..../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../../src/utils/themeUtils';
import { router } from 'expo-router';

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
  submissions_count?: number;
  graded_count?: number;
  average_score?: number;
}

export default function TeacherHomeworkScreen() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomework = async () => {
    try {
      setLoading(true);
      // Use the new teacher-specific endpoint
      const response = await apiService.getTeacherHomework();

      if (response.data.success) {
        setHomework(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to load homework');
      }
    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert('Error', error.message || 'Failed to load homework assignments');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHomework();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadHomework();
  };

  const getSubmissionStats = (homeworkItem: Homework) => {
    const totalStudents = 25; // This should come from your database
    const submitted = homeworkItem.submissions_count || 0;
    const graded = homeworkItem.graded_count || 0;
    const pending = submitted - graded;

    return {
      totalStudents,
      submitted,
      graded,
      pending,
      submissionRate: Math.round((submitted / totalStudents) * 100),
      averageScore: homeworkItem.average_score || 0
    };
  };

  const getStatusColor = (submissionRate: number) => {
    if (submissionRate >= 80) return 'bg-emerald-500';
    if (submissionRate >= 50) return 'bg-amber-500';
    return 'bg-red-500';
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const handleHomeworkPress = (homeworkItem: Homework) => {
    router.push(`/homework/${homeworkItem.id}/submissions`);
  };

  const handleCreateHomework = () => {
    router.push('/homework/create');
  };

  if (loading) {
    return (
      <View className={cn('flex-1 justify-center items-center', Theme.background)}>
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className={cn('text-lg mt-4', Theme.text.secondary)}>Loading homework...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-16 pb-6', Theme.background)}>
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className={cn('text-4xl font-bold tracking-tight mb-2', Theme.text.primary)}>
              Homework
            </Text>
            <Text className={cn('text-lg opacity-70', Theme.text.secondary)}>
              Manage and grade assignments
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCreateHomework}
            className="bg-blue-500 px-6 py-4 rounded-2xl flex-row items-center space-x-3 shadow-lg shadow-blue-500/25"
          >
            <Ionicons name="add" size={22} color="#FFFFFF" />
            <Text className="text-white font-semibold text-base">New</Text>
          </TouchableOpacity>
        </View>

        {/* Statistics Overview */}
        <View className={cn('p-5 rounded-2xl border mb-6', Theme.elevated, Theme.border)}>
          <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>Overview</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1', Theme.text.primary)}>
                {homework.length}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Total</Text>
            </View>
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1', Theme.text.primary)}>
                {homework.reduce((acc, hw) => acc + (hw.submissions_count || 0), 0)}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Submissions</Text>
            </View>
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1', Theme.text.primary)}>
                {homework.reduce((acc, hw) => acc + (hw.graded_count || 0), 0)}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Graded</Text>
            </View>
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1 text-emerald-600')}>
                {homework.length > 0
                  ? Math.round(homework.reduce((acc, hw) => acc + (hw.average_score || 0), 0) / homework.length)
                  : 0}%
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Avg. Score</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="px-6 pb-6">
          {homework.length === 0 ? (
            <View className={cn('items-center py-16 rounded-2xl border-2 border-dashed', Theme.border)}>
              <Ionicons name="document-text-outline" size={80} className="opacity-20 mb-4" />
              <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
                No Homework Yet
              </Text>
              <Text className={cn('text-center opacity-70 text-lg mb-6', Theme.text.secondary)}>
                Create your first homework assignment to get started
              </Text>
              <TouchableOpacity
                onPress={handleCreateHomework}
                className="bg-blue-500 px-8 py-4 rounded-2xl shadow-lg shadow-blue-500/25"
              >
                <Text className="text-white font-semibold text-lg">Create Homework</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View className="space-y-4">
              {homework.map((item) => {
                const stats = getSubmissionStats(item);
                const isOverdue = new Date(item.due_date) < new Date();

                return (
                  <TouchableOpacity
                    key={item.id}
                    className={cn(
                      'rounded-2xl p-5 border-2 transition-all active:scale-95',
                      isOverdue ? 'border-red-200 bg-red-50 dark:bg-red-900/20' : 'border-blue-200 bg-blue-50 dark:bg-blue-900/20',
                      Theme.elevated
                    )}
                    onPress={() => handleHomeworkPress(item)}
                  >
                    <View className="flex-row justify-between items-start mb-4">
                      <View className="flex-1">
                        <Text className={cn('text-xl font-semibold mb-2', Theme.text.primary)}>
                          {item.title}
                        </Text>
                        <Text className={cn('text-base mb-3', Theme.text.secondary)}>
                          {item.description}
                        </Text>
                        <View className="flex-row flex-wrap gap-2">
                          <View className="px-3 py-1 bg-gray-500/10 rounded-full">
                            <Text className="text-gray-600 text-sm font-medium">
                              {item.subject}
                            </Text>
                          </View>
                          <View className="px-3 py-1 bg-gray-500/10 rounded-full">
                            <Text className="text-gray-600 text-sm font-medium">
                              {item.class}
                            </Text>
                          </View>
                          <View className="px-3 py-1 bg-gray-500/10 rounded-full">
                            <Text className="text-gray-600 text-sm font-medium">
                              {item.points} points
                            </Text>
                          </View>
                          {isOverdue && (
                            <View className="px-3 py-1 bg-red-500/10 rounded-full">
                              <Text className="text-red-600 text-sm font-medium">
                                Overdue
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={20}
                        className={cn(isOverdue ? 'text-red-400' : 'text-blue-400')}
                      />
                    </View>

                    {/* Progress Bars */}
                    <View className="space-y-3">
                      {/* Submission Progress */}
                      <View>
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className={cn('text-sm font-medium', Theme.text.primary)}>
                            Submissions
                          </Text>
                          <Text className={cn('text-sm', Theme.text.secondary)}>
                            {stats.submitted}/{stats.totalStudents} ({stats.submissionRate}%)
                          </Text>
                        </View>
                        <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <View
                            className={`h-2 rounded-full ${getStatusColor(stats.submissionRate)}`}
                            style={{ width: `${stats.submissionRate}%` }}
                          />
                        </View>
                      </View>

                      {/* Grading Progress */}
                      <View>
                        <View className="flex-row justify-between items-center mb-2">
                          <Text className={cn('text-sm font-medium', Theme.text.primary)}>
                            Grading Progress
                          </Text>
                          <Text className={cn('text-sm', Theme.text.secondary)}>
                            {stats.graded}/{stats.submitted} graded
                          </Text>
                        </View>
                        <View className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <View
                            className="h-2 rounded-full bg-emerald-500"
                            style={{ width: `${stats.submitted > 0 ? (stats.graded / stats.submitted) * 100 : 0}%` }}
                          />
                        </View>
                      </View>
                    </View>

                    {/* Footer Info */}
                    <View className="flex-row justify-between items-center mt-4">
                      <View className="flex-row items-center space-x-4">
                        <View className="flex-row items-center">
                          <Ionicons name="calendar" size={16} className={Theme.text.secondary} />
                          <Text className={cn('text-sm ml-1', Theme.text.secondary)}>
                            Due: {formatDueDate(item.due_date)}
                          </Text>
                        </View>
                        {stats.averageScore > 0 && (
                          <View className="flex-row items-center">
                            <Ionicons name="trophy" size={16} className="text-amber-500" />
                            <Text className="text-amber-600 text-sm font-medium ml-1">
                              Avg: {stats.averageScore}%
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text className={cn('font-medium', Theme.text.primary)}>
                        View Submissions →
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}