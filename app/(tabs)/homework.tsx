// app/(student)/homework/index.tsx - Updated with real data
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

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
  submitted: boolean;
  submission_date?: string;
  grade?: number;
  feedback?: string;
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

export default function StudentHomeworkScreen() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHomework = async () => {
    try {
      setLoading(true);
      const response = await apiService.getHomework();
      
      if (response.data.success) {
        console.log('📚 Loaded homework:', response.data.data);
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

  const getDueStatus = (dueDate: string, submitted: boolean) => {
    if (submitted) {
      return { status: 'submitted', color: 'bg-blue-500/10 border-blue-200', text: 'Submitted', textColor: 'text-blue-600' };
    }

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'bg-red-500/10 border-red-200', text: 'Overdue', textColor: 'text-red-600' };
    if (diffDays === 0) return { status: 'due', color: 'bg-orange-500/10 border-orange-200', text: 'Due Today', textColor: 'text-orange-600' };
    if (diffDays <= 2) return { status: 'soon', color: 'bg-yellow-500/10 border-yellow-200', text: 'Due Soon', textColor: 'text-yellow-600' };
    return { status: 'pending', color: 'bg-green-500/10 border-green-200', text: 'Pending', textColor: 'text-green-600' };
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleHomeworkPress = (homeworkItem: Homework) => {
    router.push(`/homework/${homeworkItem.id}`);
  };

  const getButtonText = (homeworkItem: Homework) => {
    if (homeworkItem.submitted) {
      return homeworkItem.grade ? `View Grade: ${homeworkItem.grade}/${homeworkItem.points}` : 'View Submission';
    }
    
    const status = getDueStatus(homeworkItem.due_date, homeworkItem.submitted);
    return status.status === 'overdue' ? 'Submit Now' : 'Start Assignment';
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
        <View className="mb-6">
          <Text className={cn('text-4xl font-bold tracking-tight mb-2', Theme.text.primary)}>
            Homework
          </Text>
          <Text className={cn('text-lg opacity-70', Theme.text.secondary)}>
            Your assigned tasks and deadlines
          </Text>
        </View>

        {/* Stats Card */}
        <View className={cn('p-5 rounded-2xl border mb-6', Theme.elevated, Theme.border)}>
          <Text className={cn('text-xl font-semibold mb-4', Theme.text.primary)}>Summary</Text>
          <View className="flex-row justify-between">
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1', Theme.text.primary)}>
                {homework.length}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Total</Text>
            </View>
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1', Theme.text.primary)}>
                {homework.filter(h => !h.submitted).length}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Pending</Text>
            </View>
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1', Theme.text.primary)}>
                {homework.filter(h => h.submitted).length}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Submitted</Text>
            </View>
            <View className="items-center">
              <Text className={cn('text-3xl font-bold mb-1 text-emerald-600')}>
                {homework.filter(h => h.grade).length}
              </Text>
              <Text className={cn('text-sm', Theme.text.secondary)}>Graded</Text>
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
              <Ionicons name="checkmark-circle" size={80} className="opacity-20 mb-4" />
              <Text className={cn('text-2xl font-bold mb-2', Theme.text.primary)}>
                No Homework
              </Text>
              <Text className={cn('text-center opacity-70 text-lg', Theme.text.secondary)}>
                You're all caught up! Check back later for new assignments.
              </Text>
            </View>
          ) : (
            <View className="space-y-4">
              {homework.map((item) => {
                const dueStatus = getDueStatus(item.due_date, item.submitted);
                return (
                  <TouchableOpacity
                    key={item.id}
                    className={cn(
                      'rounded-2xl p-5 border-2 transition-all active:scale-95',
                      dueStatus.color,
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
                              {item.points} points
                            </Text>
                          </View>
                          {item.attachments && (
                            <View className="px-3 py-1 bg-blue-500/10 rounded-full">
                              <Text className="text-blue-600 text-sm font-medium">
                                Attachments
                              </Text>
                            </View>
                          )}
                          {item.grade && (
                            <View className="px-3 py-1 bg-emerald-500/10 rounded-full">
                              <Text className="text-emerald-600 text-sm font-medium">
                                Graded
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                      <View className={cn('px-3 py-1 rounded-full', dueStatus.color)}>
                        <Text className={cn('text-sm font-medium', dueStatus.textColor)}>
                          {dueStatus.text}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row justify-between items-center">
                      <View className="flex-row items-center space-x-4">
                        <View className="flex-row items-center">
                          <Ionicons name="person" size={16} className={Theme.text.secondary} />
                          <Text className={cn('text-sm ml-1', Theme.text.secondary)}>
                            {item.teacher?.profile?.name || 'Teacher'}
                          </Text>
                        </View>
                        <View className="flex-row items-center">
                          <Ionicons name="calendar" size={16} className={Theme.text.secondary} />
                          <Text className={cn('text-sm ml-1', Theme.text.secondary)}>
                            Due: {formatDueDate(item.due_date)}
                          </Text>
                        </View>
                      </View>
                      <View className="flex-row items-center">
                        <Text className={cn('font-medium mr-2', Theme.text.primary)}>
                          {getButtonText(item)}
                        </Text>
                        <Ionicons name="chevron-forward" size={16} className={Theme.text.secondary} />
                      </View>
                    </View>

                    {/* Show feedback if available */}
                    {item.feedback && (
                      <View className={cn('mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200')}>
                        <Text className={cn('text-sm font-medium mb-1 text-blue-800 dark:text-blue-200')}>
                          Teacher Feedback:
                        </Text>
                        <Text className={cn('text-blue-700 dark:text-blue-300 text-sm')}>
                          {item.feedback}
                        </Text>
                      </View>
                    )}
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