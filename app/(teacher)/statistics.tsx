// app/(teacher)/statistics.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { ClassStats, PerformanceTrend } from '../../src/types'; // Fixed import

interface StatisticsData {
  classStats: ClassStats[];
  performanceTrend: PerformanceTrend[];
  totalExams: number;
  avgCompletion: number;
  activeStudents: number;
  pendingGrading: number;
}

export default function StatisticsScreen() {
  const { user } = useAuth();
  const [classStats, setClassStats] = useState<ClassStats[]>([]);
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrend[]>([]);
  const [quickStats, setQuickStats] = useState({
    totalExams: 0,
    avgCompletion: 0,
    activeStudents: 0,
    pendingGrading: 0
  });
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, [selectedPeriod]);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      
      const response = await apiService.getTeacherStatistics();
      
      if (response.data.success) {
        const data: StatisticsData = response.data.data;
        setClassStats(data.classStats || []);
        setPerformanceTrend(data.performanceTrend || []);
        setQuickStats({
          totalExams: data.totalExams || 0,
          avgCompletion: data.avgCompletion || 0,
          activeStudents: data.activeStudents || 0,
          pendingGrading: data.pendingGrading || 0
        });
      } else {
        // Set empty data instead of mock data
        setClassStats([]);
        setPerformanceTrend([]);
        setQuickStats({
          totalExams: 0,
          avgCompletion: 0,
          activeStudents: 0,
          pendingGrading: 0
        });
      }

    } catch (error) {
      console.error('Failed to load statistics:', error);
      // Set empty data on error
      setClassStats([]);
      setPerformanceTrend([]);
      setQuickStats({
        totalExams: 0,
        avgCompletion: 0,
        activeStudents: 0,
        pendingGrading: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const getImprovementColor = (improvement: number | undefined) => {
    if (!improvement) return 'text-slate-600';
    if (improvement > 0) return 'text-green-600';
    if (improvement < 0) return 'text-red-600';
    return 'text-slate-600';
  };

  const getImprovementIcon = (improvement: number | undefined) => {
    if (!improvement) return 'remove';
    if (improvement > 0) return 'trending-up';
    return 'trending-down';
  };

  const getImprovementValue = (improvement: number | undefined) => {
    if (!improvement) return '0%';
    return `${improvement > 0 ? '+' : ''}${improvement}%`;
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
                selectedPeriod === period.key ? 'bg-white dark:bg-gray-800 shadow-sm' : ''
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
            {classStats.length > 0 ? (
              classStats.map((stats, index) => (
                <View key={stats.id || index} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 shadow-sm">
                  <View className="flex-row justify-between items-start mb-3">
                    <Text className="text-lg font-semibold text-slate-900">{stats.className}</Text>
                    <View className="flex-row items-center">
                      <Ionicons 
                        name={getImprovementIcon(stats.improvement) as any} 
                        size={16} 
                        color={stats.improvement && stats.improvement > 0 ? '#10b981' : '#ef4444'} 
                      />
                      <Text className={`text-sm font-medium ml-1 ${getImprovementColor(stats.improvement)}`}>
                        {getImprovementValue(stats.improvement)}
                      </Text>
                    </View>
                  </View>

                  <View className="grid grid-cols-3 gap-4">
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-slate-900">{stats.averageScore}%</Text>
                      <Text className="text-slate-500 text-xs">Avg. Score</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-slate-900">{stats.studentCount}</Text>
                      <Text className="text-slate-500 text-xs">Students</Text>
                    </View>
                    <View className="items-center">
                      <Text className="text-2xl font-bold text-slate-900">{stats.completedExams}</Text>
                      <Text className="text-slate-500 text-xs">Exams</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-slate-200 shadow-sm items-center">
                <Ionicons name="stats-chart" size={48} color="#cbd5e1" />
                <Text className="text-slate-500 text-lg font-medium mt-4">No class data available</Text>
                <Text className="text-slate-400 text-sm text-center mt-2">
                  Class performance data will appear here once available
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Performance Trend */}
        <View className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-slate-200 shadow-sm mb-6">
          <Text className="text-xl font-semibold text-slate-900 mb-4">Performance Trend</Text>
          
          {performanceTrend.length > 0 ? (
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
          ) : (
            <View className="items-center py-8">
              <Ionicons name="trending-up" size={48} color="#cbd5e1" />
              <Text className="text-slate-500 text-base font-medium mt-4">No trend data available</Text>
              <Text className="text-slate-400 text-sm text-center mt-2">
                Performance trends will appear here once available
              </Text>
            </View>
          )}
        </View>

        {/* Quick Stats */}
        <View className="grid grid-cols-2 gap-4">
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Total Exams</Text>
            <Text className="text-2xl font-bold text-slate-900">{quickStats.totalExams}</Text>
          </View>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Avg. Completion</Text>
            <Text className="text-2xl font-bold text-slate-900">{quickStats.avgCompletion}%</Text>
          </View>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Active Students</Text>
            <Text className="text-2xl font-bold text-slate-900">{quickStats.activeStudents}</Text>
          </View>
          <View className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-slate-200 shadow-sm">
            <Text className="text-slate-500 text-sm font-medium mb-1">Pending Grading</Text>
            <Text className="text-2xl font-bold text-slate-900">{quickStats.pendingGrading}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}