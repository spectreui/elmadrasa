import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

interface TeacherStats {
  activeExams: number;
  totalStudents: number;
  averageScore: number;
  pendingGrading: number;
  classesCount: number;
  totalSubmissions: number;
}

interface RecentActivity {
  id: string;
  title: string;
  description: string;
  type: 'exam' | 'homework' | 'announcement';
  date: string;
  status: 'completed' | 'pending' | 'grading';
}

export default function TeacherDashboard() {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState<TeacherStats>({
    activeExams: 0,
    totalStudents: 0,
    averageScore: 0,
    pendingGrading: 0,
    classesCount: 0,
    totalSubmissions: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Mock data for demo
      setStats({
        activeExams: 12,
        totalStudents: 156,
        averageScore: 78,
        pendingGrading: 8,
        classesCount: 4,
        totalSubmissions: 245
      });

      setRecentActivity([
        {
          id: '1',
          title: 'Midterm Mathematics',
          description: '32 students completed',
          type: 'exam',
          date: '2024-01-15',
          status: 'grading'
        },
        {
          id: '2',
          title: 'Science Homework',
          description: 'Assignment graded',
          type: 'homework',
          date: '2024-01-14',
          status: 'completed'
        },
        {
          id: '3',
          title: 'Class Announcement',
          description: 'New schedule posted',
          type: 'announcement',
          date: '2024-01-13',
          status: 'completed'
        }
      ]);

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'pending': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'grading': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return 'document-text';
      case 'homework': return 'book';
      case 'announcement': return 'megaphone';
      default: return 'document';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'exam': return 'text-purple-600 bg-purple-100';
      case 'homework': return 'text-blue-600 bg-blue-100';
      case 'announcement': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-gray-600 mt-4 text-base">Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-gray-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900">
            Teacher Dashboard
          </Text>
          <Text className="text-gray-600 mt-2 text-base">
            Welcome back, {user?.profile.name}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="grid grid-cols-2 gap-4 mb-8">
          <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">Active Exams</Text>
              <Ionicons name="document-text" size={20} color="#3b82f6" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.activeExams}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">Currently running</Text>
          </View>

          <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">Students</Text>
              <Ionicons name="people" size={20} color="#10b981" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.totalStudents}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">Total enrolled</Text>
          </View>

          <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">Avg. Score</Text>
              <Ionicons name="trending-up" size={20} color="#f59e0b" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.averageScore}%
            </Text>
            <Text className="text-gray-400 text-xs mt-1">Class average</Text>
          </View>

          <View className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-500 text-sm font-medium">Pending</Text>
              <Ionicons name="time" size={20} color="#ef4444" />
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.pendingGrading}
            </Text>
            <Text className="text-gray-400 text-xs mt-1">To be graded</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</Text>
          <View className="grid grid-cols-2 gap-3">
            <TouchableOpacity 
              className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push('/(teacher)/create-exam')}
            >
              <View className="w-10 h-10 bg-blue-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name="add-circle" size={24} color="#3b82f6" />
              </View>
              <Text className="text-gray-900 font-semibold text-base">Create Exam</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push('/(teacher)/classes')}
            >
              <View className="w-10 h-10 bg-green-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name="people" size={24} color="#10b981" />
              </View>
              <Text className="text-gray-900 font-semibold text-base">My Classes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push('/(teacher)/statistics')}
            >
              <View className="w-10 h-10 bg-purple-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name="bar-chart" size={24} color="#8b5cf6" />
              </View>
              <Text className="text-gray-900 font-semibold text-base">Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-2xl p-4 flex-row items-center border border-gray-200 shadow-sm active:bg-gray-50"
              onPress={() => router.push('/(teacher)/create-homework')}
            >
              <View className="w-10 h-10 bg-orange-100 rounded-lg items-center justify-center mr-3">
                <Ionicons name="book" size={24} color="#f59e0b" />
              </View>
              <Text className="text-gray-900 font-semibold text-base">Assign Homework</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-gray-900">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 text-sm font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {recentActivity.map((activity) => (
              <View 
                key={activity.id}
                className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm"
              >
                <View className="flex-row items-start">
                  <View className={`w-10 h-10 rounded-lg items-center justify-center mr-3 ${getTypeColor(activity.type)}`}>
                    <Ionicons 
                      name={getTypeIcon(activity.type) as any} 
                      size={20} 
                    />
                  </View>
                  <View className="flex-1">
                    <View className="flex-row justify-between items-start mb-1">
                      <Text className="text-lg font-semibold text-gray-900 flex-1">
                        {activity.title}
                      </Text>
                      <View className={`px-2 py-1 rounded-full border ${getStatusColor(activity.status)}`}>
                        <Text className="text-xs font-medium capitalize">
                          {activity.status}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-600 text-sm mb-2">
                      {activity.description}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}