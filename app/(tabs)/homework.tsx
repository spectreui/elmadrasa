import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

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
      
      // Use the real getHomework API call
      const response = await apiService.getHomework();
      
      if (response.data.success) {
        setHomework(response.data.data || []);
      } else {
        throw new Error(response.data.error || 'Failed to load homework');
      }

    } catch (error: any) {
      console.error('Failed to load homework:', error);
      Alert.alert('Error', error.message || 'Failed to load homework assignments. Please try again.');
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
      return { status: 'submitted', color: 'bg-blue-100 border-blue-200', text: 'Submitted' };
    }

    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'bg-red-100 border-red-200', text: 'Overdue' };
    if (diffDays === 0) return { status: 'due', color: 'bg-orange-100 border-orange-200', text: 'Due Today' };
    if (diffDays <= 2) return { status: 'soon', color: 'bg-yellow-100 border-yellow-200', text: 'Due Soon' };
    return { status: 'pending', color: 'bg-green-100 border-green-200', text: 'Pending' };
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'submitted': return 'text-blue-800';
      case 'overdue': return 'text-red-800';
      case 'due': return 'text-orange-800';
      case 'soon': return 'text-yellow-800';
      case 'pending': return 'text-green-800';
      default: return 'text-gray-800';
    }
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleHomeworkPress = (homeworkItem: Homework) => {
    if (homeworkItem.submitted) {
      router.push(`/homework/${homeworkItem.id}/results`);
    } else {
      router.push(`/homework/${homeworkItem.id}`);
    }
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-base">Loading homework...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-6">
        <View className="mb-6">
          <Text className="text-3xl font-bold text-gray-900">Homework</Text>
          <Text className="text-gray-600 mt-2">Your assigned tasks and deadlines</Text>
        </View>

        {homework.length === 0 ? (
          <View className="bg-white rounded-2xl p-8 items-center border border-gray-200 mt-8">
            <Ionicons name="checkmark-circle" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4 font-medium">No homework assigned</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
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
                  className={`bg-white rounded-2xl p-5 border-2 ${dueStatus.color} shadow-sm active:opacity-80`}
                  onPress={() => handleHomeworkPress(item)}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-gray-900 mb-1">
                        {item.title}
                      </Text>
                      <Text className="text-gray-600 text-sm mb-2">
                        {item.description}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        {item.subject} • {item.class} • {item.points} points
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${dueStatus.color}`}>
                      <Text className={`text-xs font-medium ${getStatusTextColor(dueStatus.status)}`}>
                        {dueStatus.text}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={16} color="#6b7280" />
                        <Text className="text-gray-600 text-sm ml-1">
                          {item.teacher?.profile?.name || 'Teacher'}
                        </Text>
                      </View>
                      <View className="flex-row items-center">
                        <Ionicons name="calendar" size={16} color="#6b7280" />
                        <Text className="text-gray-600 text-sm ml-1">
                          Due: {formatDueDate(item.due_date)}
                        </Text>
                      </View>
                      {item.attachments && (
                        <View className="flex-row items-center">
                          <Ionicons name="attach" size={16} color="#6b7280" />
                          <Text className="text-gray-600 text-sm ml-1">
                            Attachments
                          </Text>
                        </View>
                      )}
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-blue-600 font-medium mr-2">
                        {getButtonText(item)}
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color="#3b82f6" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Stats Card */}
        <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm mt-6">
          <Text className="text-lg font-semibold text-gray-900 mb-4">Summary</Text>
          <View className="grid grid-cols-3 gap-4">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {homework.length}
              </Text>
              <Text className="text-gray-500 text-xs text-center">Total</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {homework.filter(h => !h.submitted).length}
              </Text>
              <Text className="text-gray-500 text-xs text-center">Pending</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {homework.filter(h => h.submitted).length}
              </Text>
              <Text className="text-gray-500 text-xs text-center">Submitted</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}