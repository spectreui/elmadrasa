// app/(teacher)/statistics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';

interface ClassStats {
  className: string;
  averageScore: number;
  totalStudents: number;
  examsCompleted: number;
  improvement: number;
}

interface PerformanceTrend {
  month: string;
  averageScore: number;
  students: number;
}

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      // Mock data for demo
      setClassStats([
        {
          className: '10A Mathematics',
          averageScore: 78,
          totalStudents: 32,
          examsCompleted: 45,
          improvement: 5
        },
        {
          className: '10B Science',
          averageScore: 82,
          totalStudents: 28,
          examsCompleted: 38,
          improvement: 8
        },
        {
          className: '11A Advanced Math',
          averageScore: 85,
          totalStudents: 24,
          examsCompleted: 52,
          improvement: 12
        }
      ]);

      setPerformanceTrend([
        { month: 'Jan', averageScore: 75, students: 28 },
        { month: 'Feb', averageScore: 78, students: 30 },
        { month: 'Mar', averageScore: 82, students: 32 },
        { month: 'Apr', averageScore: 80, students: 31 },
        { month: 'May', averageScore: 85, students: 33 }
      ]);

    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getImprovementColor = (improvement: number) => {
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">Loading analytics...</Text>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-slate-50" showsVerticalScrollIndicator={false}>
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-900 mb-6">Analytics</Text>

        {/* Period Selector */}
        <View className="flex-row bg-slate-100 rounded-lg p-1 mb-6">
          {[
            { key: 'week', label: 'This Week' },
            { key: 'month', label: 'This Month' },
            { key: 'year', label: 'This Year' }
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              className={`flex-1 py-2 rounded-md ${
                selectedPeriod === period.key ? 'bg-white shadow-sm' : ''
              }`}
              onPress={() => setSelectedPeriod(period.key as any)}
            >
              <Text 
                className={`text-center text-sm font-medium ${
                  selectedPeriod === period.key ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Class Performance */}
        <View className="mb-8">
          <Text className="text-xl font-semibold text-slate-900 mb-4">Class Performance</Text>
          <View className="space-y-4">
            {classStats.map((stats, index) => (
              <View key={index} className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
                <View className="flex-row justify-between items-start mb-3">
                  <Text className="text-lg font-semibold text-slate-900">{stats.className}</Text>
                  <View className="flex-row items-center">
                    <Ionicons 
                      name={stats.improvement > 0 ? 'trending-up' : 'trending-down'} 
                      size={16} 
                      color={stats.improvement > 0 ? '#10b981' : '#ef4444'} 
                    />
                    <Text className={`text-sm font-medium ml-1 ${getImprovementColor(stats.improvement)}`}>
                      {stats.improvement > 0 ? '+' : ''}{stats.improvement}%
                    </Text>
                  </View>
                </View>

                <View className="grid grid-cols-3 gap-4">
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-slate-900">{stats.averageScore}%</Text>
                    <Text className="text-slate-500 text-xs">Avg. Score</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-slate-900">{stats.totalStudents}</Text>
                    <Text className="text-slate-500 text-xs">Students</Text>
                  </View>
                  <View className="items-center">
                    <Text className="text-2xl font-bold text-slate-900">{stats.examsCompleted}</Text>
                    <Text className="text-slate-500 text-xs">Exams</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Performance Trend */}
        <View className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
          <Text className="text-xl font-semibold text-slate-900 mb-4">Performance Trend</Text>
          
          <View className="space-y-3">
            {performanceTrend.map((trend, index) => (
              <View key={index} className="flex-row items-center justify-between">
                <Text className="text-slate-700 font-medium w-12">{trend.month}</Text>
                
                <View className="flex-1 mx-4">
                  <View className="w-full bg-slate-100 rounded-full h-2">
                    <View 
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${(trend.averageScore / 100) * 100}%` }}
                    />
                  </View>
                </View>
                
                <View className="flex-row items-center w-20 justify-end">
                  <Text className="text-slate-900 font-semibold">{trend.averageScore}%</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Stats */}
        <View className="grid grid-cols-2 gap-4 mt-6">
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Total Exams</Text>
            <Text className="text-2xl font-bold text-slate-900">24</Text>
          </View>
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Avg. Completion</Text>
            <Text className="text-2xl font-bold text-slate-900">92%</Text>
          </View>
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Active Students</Text>
            <Text className="text-2xl font-bold text-slate-900">84</Text>
          </View>
          <View className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Pending Grading</Text>
            <Text className="text-2xl font-bold text-slate-900">8</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}