import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Homework } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function StudentHomeworkScreen() {
  const { user } = useAuth();
  const [homework, setHomework] = useState<Homework[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadHomework();
  }, []);

  const loadHomework = async () => {
    try {
      setLoading(true);
      // Mock data - replace with actual API call
      const mockHomework: Homework[] = [
        {
          id: '1',
          title: 'Algebra Practice Problems',
          description: 'Complete exercises 1-20 from chapter 3',
          subject: 'Mathematics',
          class: '10A',
          due_date: '2024-12-25',
          points: 20,
          attachments: true,
          teacher_id: '1',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          teacher: {
            id: '1',
            profile: { name: 'Dr. Smith' }
          }
        },
        {
          id: '2',
          title: 'Science Lab Report',
          description: 'Write a report on the chemical reactions experiment',
          subject: 'Science',
          class: '10A',
          due_date: '2024-12-20',
          points: 25,
          attachments: false,
          teacher_id: '2',
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
          teacher: {
            id: '2',
            profile: { name: 'Dr. Johnson' }
          }
        }
      ];
      setHomework(mockHomework);
    } catch (error) {
      console.error('Failed to load homework:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHomework();
  };

  const getDueStatus = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { status: 'overdue', color: 'bg-red-100 text-red-800', text: 'Overdue' };
    if (diffDays === 0) return { status: 'due', color: 'bg-orange-100 text-orange-800', text: 'Due Today' };
    if (diffDays <= 2) return { status: 'soon', color: 'bg-yellow-100 text-yellow-800', text: 'Due Soon' };
    return { status: 'pending', color: 'bg-green-100 text-green-800', text: 'Pending' };
  };

  const formatDueDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
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
            <Ionicons name="book-outline" size={64} color="#d1d5db" />
            <Text className="text-gray-500 text-lg mt-4 font-medium">No homework assigned</Text>
            <Text className="text-gray-400 text-sm mt-2 text-center">
              You&apos;re all caught up! Check back later for new assignments.
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {homework.map((item) => {
              const dueStatus = getDueStatus(item.due_date);
              return (
                <TouchableOpacity
                  key={item.id}
                  className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm active:bg-gray-50"
                  onPress={() => router.push(`/homework/${item.id}`)}
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
                        {item.subject} • {item.class}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${dueStatus.color}`}>
                      <Text className="text-xs font-medium">
                        {dueStatus.text}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center space-x-4">
                      <View className="flex-row items-center">
                        <Ionicons name="person" size={16} color="#6b7280" />
                        <Text className="text-gray-600 text-sm ml-1">
                          {item.teacher?.profile.name}
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
                        View Details
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
                {homework.filter(h => getDueStatus(h.due_date).status === 'pending').length}
              </Text>
              <Text className="text-gray-500 text-xs text-center">Pending</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {homework.filter(h => getDueStatus(h.due_date).status === 'overdue').length}
              </Text>
              <Text className="text-gray-500 text-xs text-center">Overdue</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}