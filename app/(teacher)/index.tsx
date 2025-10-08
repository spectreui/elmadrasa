import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { TeacherDashboardStats, RecentActivity } from '../../src/types';

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<TeacherDashboardStats>({
    activeExams: 0,
    totalStudents: 0,
    averageScore: 0,
    pendingGrading: 0,
    classesCount: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      const [statsResponse, activityResponse] = await Promise.all([
        apiService.getTeacherDashboardStats(),
        apiService.getRecentTeacherActivity()
      ]);

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (activityResponse.data.success) {
        setRecentActivity(activityResponse.data.data || []);
      }

    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Don't set mock data - handle empty state properly
      setStats({
        activeExams: 0,
        totalStudents: 0,
        averageScore: 0,
        pendingGrading: 0,
        classesCount: 0
      });
      setRecentActivity([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  // ... rest of the component remains the same, but remove mock data usage

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return '#34C759';
      case 'pending': return '#FF9500';
      case 'grading': return '#007AFF';
      default: return '#8E8E93';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-50';
      case 'pending': return 'bg-orange-50';
      case 'grading': return 'bg-blue-50';
      default: return 'bg-gray-50';
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
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-gray-600 mt-4 text-base font-medium">Loading your dashboard...</Text>
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
      <View className="flex-1">
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100">
          <View className="flex-row justify-between items-start">
            <View>
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                Good morning,
              </Text>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                {user?.profile?.name || 'Teacher'}
              </Text>
              <Text className="text-gray-500 text-base font-medium">
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </Text>
            </View>
            <TouchableOpacity 
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => router.push('/(teacher)/profile')}
            >
              <Ionicons name="person" size={20} color="#007AFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="px-6 pt-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Overview</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            <View className="flex-row space-x-4 pb-2">
              {/* Active Exams Card */}
              <View className="bg-white rounded-2xl p-5 w-48 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center">
                    <Ionicons name="document-text" size={20} color="#007AFF" />
                  </View>
                  <Text className="text-blue-600 text-sm font-semibold">+12%</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.activeExams}
                </Text>
                <Text className="text-gray-500 text-sm font-medium">Active Exams</Text>
              </View>

              {/* Students Card */}
              <View className="bg-white rounded-2xl p-5 w-48 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center">
                    <Ionicons name="people" size={20} color="#34C759" />
                  </View>
                  <Text className="text-green-600 text-sm font-semibold">+8%</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.totalStudents}
                </Text>
                <Text className="text-gray-500 text-sm font-medium">Students</Text>
              </View>

              {/* Average Score Card */}
              <View className="bg-white rounded-2xl p-5 w-48 shadow-sm border border-gray-100">
                <View className="flex-row items-center justify-between mb-3">
                  <View className="w-10 h-10 bg-orange-100 rounded-xl items-center justify-center">
                    <Ionicons name="trending-up" size={20} color="#FF9500" />
                  </View>
                  <Text className="text-orange-600 text-sm font-semibold">+5%</Text>
                </View>
                <Text className="text-2xl font-bold text-gray-900 mb-1">
                  {stats.averageScore}%
                </Text>
                <Text className="text-gray-500 text-sm font-medium">Avg. Score</Text>
              </View>
            </View>
          </ScrollView>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mb-6">
          <Text className="text-xl font-bold text-gray-900 mb-4">Quick Actions</Text>
          <View className="grid grid-cols-2 gap-3">
            <TouchableOpacity 
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm active:opacity-80"
              onPress={() => router.push('/(teacher)/create-exam')}
            >
              <View className="w-12 h-12 bg-blue-500 rounded-xl items-center justify-center mb-3">
                <Ionicons name="document-text" size={24} color="white" />
              </View>
              <Text className="text-gray-900 font-semibold text-base mb-1">Create Exam</Text>
              <Text className="text-gray-500 text-sm">Design new assessment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm active:opacity-80"
              onPress={() => router.push('/(teacher)/create-homework')}
            >
              <View className="w-12 h-12 bg-green-500 rounded-xl items-center justify-center mb-3">
                <Ionicons name="book" size={24} color="white" />
              </View>
              <Text className="text-gray-900 font-semibold text-base mb-1">Assign Work</Text>
              <Text className="text-gray-500 text-sm">Create homework</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm active:opacity-80"
              onPress={() => router.push('/(teacher)/classes')}
            >
              <View className="w-12 h-12 bg-purple-500 rounded-xl items-center justify-center mb-3">
                <Ionicons name="people" size={24} color="white" />
              </View>
              <Text className="text-gray-900 font-semibold text-base mb-1">My Classes</Text>
              <Text className="text-gray-500 text-sm">Manage students</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm active:opacity-80"
              onPress={() => router.push('/(teacher)/statistics')}
            >
              <View className="w-12 h-12 bg-orange-500 rounded-xl items-center justify-center mb-3">
                <Ionicons name="bar-chart" size={24} color="white" />
              </View>
              <Text className="text-gray-900 font-semibold text-base mb-1">Analytics</Text>
              <Text className="text-gray-500 text-sm">View insights</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="px-6 mb-8">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Recent Activity</Text>
            <TouchableOpacity>
              <Text className="text-blue-600 text-base font-medium">View All</Text>
            </TouchableOpacity>
          </View>

          <View className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, index) => (
                <TouchableOpacity 
                  key={activity.id}
                  className={`flex-row items-center p-4 ${index !== recentActivity.length - 1 ? 'border-b border-gray-100' : ''} active:bg-gray-50`}
                >
                  <View className={`w-10 h-10 rounded-xl items-center justify-center mr-3 ${getStatusBgColor(activity.status)}`}>
                    <Ionicons 
                      name={getTypeIcon(activity.type) as any} 
                      size={20} 
                      color={getStatusColor(activity.status)}
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-900 font-semibold text-base mb-1">
                      {activity.title}
                    </Text>
                    <Text className="text-gray-500 text-sm mb-1">
                      {activity.description}
                    </Text>
                    <Text className="text-gray-400 text-xs">
                      {new Date(activity.date).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </Text>
                  </View>
                  <View className={`px-3 py-1 rounded-full ${getStatusBgColor(activity.status)}`}>
                    <Text 
                      className="text-xs font-semibold capitalize"
                      style={{ color: getStatusColor(activity.status) }}
                    >
                      {activity.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            ) : (
              <View className="p-8 items-center">
                <Ionicons name="time" size={48} color="#D1D5DB" />
                <Text className="text-gray-500 text-base font-medium mt-3">No recent activity</Text>
                <Text className="text-gray-400 text-sm text-center mt-1">
                  Your recent activities will appear here
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}