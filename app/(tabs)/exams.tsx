import React, { useState, useEffect, useCallback } from 'react'; // Add useCallback
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native'; // Remove unused Alert
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Exam } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function ExamsScreen() {
  const { user } = useAuth(); // Keep this for future use
  const [exams, setExams] = useState<Exam[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Use useCallback to fix the useEffect dependency
  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.getExams();
      
      if (response.data.success) {
        setExams(response.data.data || []);
      } else {
        console.error('Failed to load exams:', response.data.error);
      }
    } catch (error) {
      console.error('Failed to load exams:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]); // Add loadExams to dependencies

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const getExamStatus = (exam: Exam) => {
    // In a real app, you'd check if the student has taken this exam
    return 'available'; // available, taken, upcoming
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800';
      case 'taken': return 'bg-blue-100 text-blue-800';
      case 'upcoming': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'available': return 'Available';
      case 'taken': return 'Completed';
      case 'upcoming': return 'Upcoming';
      default: return 'Unknown';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">Loading exams...</Text>
      </View>
    );
  }

  return (
    <ScrollView 
      className="flex-1 bg-slate-50" 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-900 mb-2">Available Exams</Text>
        <Text className="text-slate-600 mb-6">
          Take your exams and track your progress
        </Text>

        {exams.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center border border-slate-200">
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-500 text-lg mt-4 font-medium">No exams available</Text>
            <Text className="text-slate-400 text-sm mt-2 text-center">
              Check back later for new assignments
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <TouchableOpacity
                  key={exam.id}
                  className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm active:bg-slate-50"
                  onPress={() => router.push(`/exam/${exam.id}`)}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-slate-900 mb-1">
                        {exam.title}
                      </Text>
                      <Text className="text-slate-600 text-sm">
                        {exam.subject} • {exam.class}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(status)}`}>
                      <Text className="text-xs font-medium">
                        {getStatusText(status)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center mb-3">
                    <View className="flex-row items-center">
                      <Ionicons name="person" size={16} color="#64748b" />
                      <Text className="text-slate-600 text-sm ml-2">
                        {exam.teacher?.profile?.name || 'Teacher'}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <Ionicons name="time" size={16} color="#64748b" />
                      <Text className="text-slate-600 text-sm ml-1">
                        {exam.settings.timed ? `${exam.settings.duration}m` : 'Untimed'}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row justify-between items-center">
                    <Text className="text-slate-500 text-xs">
                      Created: {new Date(exam.created_at).toLocaleDateString()}
                    </Text>
                    <View className="flex-row items-center">
                      <Text className="text-blue-600 font-medium mr-2">
                        {status === 'taken' ? 'View Results' : 'Start Exam'}
                      </Text>
                      <Ionicons name="arrow-forward" size={16} color="#3b82f6" />
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Quick Stats */}
        <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm mt-6">
          <Text className="text-lg font-semibold text-slate-900 mb-4">Your Progress</Text>
          <View className="grid grid-cols-3 gap-4">
            <View className="items-center">
              <Text className="text-2xl font-bold text-slate-900">
                {exams.filter(e => getExamStatus(e) === 'taken').length}
              </Text>
              <Text className="text-slate-500 text-xs text-center">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-slate-900">
                {exams.filter(e => getExamStatus(e) === 'available').length}
              </Text>
              <Text className="text-slate-500 text-xs text-center">Available</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-slate-900">
                {exams.filter(e => getExamStatus(e) === 'upcoming').length}
              </Text>
              <Text className="text-slate-500 text-xs text-center">Upcoming</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}