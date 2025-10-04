// app/(teacher)/index.tsx
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
    pendingGrading: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load teacher stats
      const statsResponse = await apiService.getTeacherStats();
      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      // Load recent activity
      const activityResponse = await apiService.getRecentActivity();
      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'grading': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
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

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">Loading your dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        {/* Header */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-slate-900">
            Teacher Dashboard
          </Text>
          <Text className="text-slate-600 mt-2 text-base">
            Welcome back, {user?.profile.name}
          </Text>
        </View>

        {/* Stats Grid */}
        <View className="grid grid-cols-2 gap-4 mb-8">
          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">Active Exams</Text>
              <Ionicons name="document-text" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.activeExams}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Currently running</Text>
          </View>

          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">Students</Text>
              <Ionicons name="people" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.totalStudents}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Total enrolled</Text>
          </View>

          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">Avg. Score</Text>
              <Ionicons name="trending-up" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.averageScore}%
            </Text>
            <Text className="text-slate-400 text-xs mt-1">Class average</Text>
          </View>

          <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-slate-500 text-sm font-medium">Pending</Text>
              <Ionicons name="time" size={16} color="#64748b" />
            </View>
            <Text className="text-2xl font-bold text-slate-900">
              {stats.pendingGrading}
            </Text>
            <Text className="text-slate-400 text-xs mt-1">To be graded</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-slate-900 mb-4">Quick Actions</Text>
          <View className="grid grid-cols-2 gap-3">
            <TouchableOpacity 
              className="bg-slate-900 rounded-xl p-4 flex-row items-center shadow-sm"
              onPress={() => router.push('/(teacher)/create-exam')}
            >
              <Ionicons name="add-circle" size={24} color="white" />
              <Text className="text-white font-semibold ml-3 text-base">Create Exam</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center border border-slate-200 shadow-sm"
              onPress={() => router.push('/(teacher)/classes')}
            >
              <Ionicons name="people" size={24} color="#0f172a" />
              <Text className="text-slate-900 font-semibold ml-3 text-base">My Classes</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center border border-slate-200 shadow-sm"
              onPress={() => router.push('/(teacher)/statistics')}
            >
              <Ionicons name="bar-chart" size={24} color="#0f172a" />
              <Text className="text-slate-900 font-semibold ml-3 text-base">Analytics</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-xl p-4 flex-row items-center border border-slate-200 shadow-sm"
              onPress={() => router.push('/(teacher)/create-homework')}
            >
              <Ionicons name="book" size={24} color="#0f172a" />
              <Text className="text-slate-900 font-semibold ml-3 text-base">Assign Homework</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="mb-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-semibold text-slate-900">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-slate-600 text-sm font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="space-y-3">
            {recentActivity.map((activity) => (
              <View 
                key={activity.id}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm"
              >
                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-row items-start flex-1">
                    <View className="bg-slate-100 p-2 rounded-lg mr-3">
                      <Ionicons 
                        name={getTypeIcon(activity.type) as any} 
                        size={16} 
                        color="#64748b" 
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-lg font-semibold text-slate-900 mb-1">
                        {activity.title}
                      </Text>
                      <Text className="text-slate-600 text-sm">
                        {activity.description}
                      </Text>
                    </View>
                  </View>
                  <View className={`px-2 py-1 rounded-full ${getStatusColor(activity.status)}`}>
                    <Text className="text-xs font-medium capitalize">
                      {activity.status}
                    </Text>
                  </View>
                </View>
                <Text className="text-slate-400 text-xs">
                  {new Date(activity.date).toLocaleDateString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}