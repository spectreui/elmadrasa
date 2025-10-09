import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Exam } from '../../src/types';
import { Ionicons } from '@expo/vector-icons';

export default function ExamsScreen() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [upcomingExams, setUpcomingExams] = useState<Exam[]>([]);
  const [takenExams, setTakenExams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState({
    completed: 0,
    available: 0,
    upcoming: 0
  });

  const loadExams = useCallback(async () => {
    try {
      setLoading(true);
      
      console.log("🔄 Loading exams for student...");
      
      // Load exams data
      const examsResponse = await apiService.getExams();
      console.log("📊 Exams response:", examsResponse.data);

      if (examsResponse.data.success) {
        const allExams = examsResponse.data.data || [];
        console.log("✅ Loaded exams:", allExams.length);
        setExams(allExams);
        
        // Check which exams have been taken
        const takenStatuses = await Promise.all(
          allExams.map(async (exam) => {
            try {
              const status = await apiService.checkExamTaken(exam.id);
              return { examId: exam.id, taken: status };
            } catch (error) {
              console.error(`Error checking status for exam ${exam.id}:`, error);
              return { examId: exam.id, taken: false };
            }
          })
        );
        
        const takenSet = new Set<string>();
        takenStatuses.forEach(({ examId, taken }) => {
          if (taken) {
            takenSet.add(examId);
          }
        });
        setTakenExams(takenSet);
        
        // Calculate stats
        const completed = takenSet.size;
        const available = allExams.filter(exam => !takenSet.has(exam.id)).length;
        
        setStats({
          completed,
          available,
          upcoming: upcomingExams.length
        });
      } else {
        console.error("❌ Failed to load exams:", examsResponse.data.error);
        Alert.alert('Error', 'Failed to load exams data');
      }

    } catch (error) {
      console.error('❌ Failed to load exams:', error);
      Alert.alert('Error', 'Failed to load exams. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
  }, [loadExams]);

  const onRefresh = () => {
    setRefreshing(true);
    loadExams();
  };

  const getExamStatus = (exam: Exam): 'available' | 'taken' | 'upcoming' => {
    if (takenExams.has(exam.id)) {
      return 'taken';
    }
    return 'available';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 border-green-200';
      case 'taken': return 'bg-blue-100 border-blue-200';
      case 'upcoming': return 'bg-yellow-100 border-yellow-200';
      default: return 'bg-gray-100 border-gray-200';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-800';
      case 'taken': return 'text-blue-800';
      case 'upcoming': return 'text-yellow-800';
      default: return 'text-gray-800';
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

  const handleExamPress = (exam: Exam) => {
    const status = getExamStatus(exam);
    if (status === 'taken') {
      router.push(`/exam/results/${exam.id}`);
    } else if (status === 'available') {
      router.push(`/exam/${exam.id}`);
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
        <Text className="text-3xl font-bold text-slate-900 mb-2">Exams</Text>
        <Text className="text-slate-600 mb-6">
          Take your exams and track your progress
        </Text>

        {/* Quick Stats */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 shadow-sm mb-6">
          <Text className="text-lg font-semibold text-slate-900 mb-4">Your Progress</Text>
          <View className="grid grid-cols-3 gap-4">
            <View className="items-center">
              <Text className="text-2xl font-bold text-slate-900">
                {stats.completed}
              </Text>
              <Text className="text-slate-500 text-xs text-center">Completed</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-slate-900">
                {stats.available}
              </Text>
              <Text className="text-slate-500 text-xs text-center">Available</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-slate-900">
                {stats.upcoming}
              </Text>
              <Text className="text-slate-500 text-xs text-center">Upcoming</Text>
            </View>
          </View>
        </View>

        {exams.length === 0 ? (
          <View className="bg-white dark:bg-gray-800 rounded-xl p-8 items-center border border-slate-200">
            <Ionicons name="document-text-outline" size={64} color="#cbd5e1" />
            <Text className="text-slate-500 text-lg mt-4 font-medium">No exams available</Text>
            <Text className="text-slate-400 text-sm mt-2 text-center">
              {user?.profile?.class 
                ? `No exams found for Class ${user.profile.class}. Check back later.`
                : 'Please check your class assignment.'
              }
            </Text>
          </View>
        ) : (
          <View className="space-y-4">
            {exams.map((exam) => {
              const status = getExamStatus(exam);
              return (
                <TouchableOpacity
                  key={exam.id}
                  className={`bg-white dark:bg-gray-800 rounded-xl p-5 border-2 ${getStatusColor(status)} shadow-sm active:opacity-80`}
                  onPress={() => handleExamPress(exam)}
                >
                  <View className="flex-row justify-between items-start mb-3">
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-slate-900 mb-1">
                        {exam.title}
                      </Text>
                      <Text className="text-slate-600 text-sm">
                        {exam.subject} • Class {exam.class}
                      </Text>
                    </View>
                    <View className={`px-3 py-1 rounded-full ${getStatusColor(status)}`}>
                      <Text className={`text-xs font-medium ${getStatusTextColor(status)}`}>
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
                        {exam.settings?.timed ? `${exam.settings.duration}m` : 'Untimed'}
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
      </View>
    </ScrollView>
  );
}