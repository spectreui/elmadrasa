// app/(admin)/index.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    totalSubjects: 0,
    pendingApprovals: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { fontFamily, colors } = useThemeContext()

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      const [
        studentsRes,
        teachersRes,
        classesRes,
        subjectsRes,
        levelsRes,
        pendingRes
      ] = await Promise.all([
        apiService.getUsersByRole('student'),
        apiService.getUsersByRole('teacher'),
        apiService.getClasses(),
        apiService.getSubjects(),
        apiService.getLevels(),
        apiService.getPendingApprovals?.().catch(() => ({ data: { data: [] } })) // Optional endpoint
      ]);

      // Calculate totals from real data
      const totalStudents = studentsRes.data.data?.length || 0;
      const totalTeachers = teachersRes.data.data?.length || 0;
      const totalClasses = classesRes.data.data?.length || 0;
      const totalSubjects = subjectsRes.data.data?.length || 0;
      const totalLevels = levelsRes.data.data?.length || 0;
      const pendingApprovals = pendingRes.data.data?.length || 0;

      setStats({
        totalStudents,
        totalTeachers,
        totalClasses,
        totalSubjects,
        pendingApprovals,
      });
    } catch (error) {
      console.error('Failed to load admin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const StatCard = ({
    icon,
    title,
    value,
    subtitle,
    onPress,
    color = 'blue',
    trend
  }: any) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <View className={cn(
        'p-6 rounded-3xl border',
        colors.backgroundElevated,
        colors.border,
        'shadow-sm'
      )}>
        <View className="flex-row items-start justify-between mb-4">
          <View className={cn(
            'w-12 h-12 rounded-2xl items-center justify-center',
            color === 'blue' && 'bg-blue-500/10 dark:bg-blue-500/20',
            color === 'green' && 'bg-emerald-500/10 dark:bg-emerald-500/20',
            color === 'purple' && 'bg-violet-500/10 dark:bg-violet-500/20',
            color === 'orange' && 'bg-amber-500/10 dark:bg-amber-500/20',
            color === 'red' && 'bg-rose-500/10 dark:bg-rose-500/20'
          )}>
            <Ionicons
              name={icon}
              size={24}
              color={
                color === 'blue' ? '#3b82f6' :
                  color === 'green' ? '#10b981' :
                    color === 'purple' ? '#8b5cf6' :
                      color === 'orange' ? '#f59e0b' :
                        '#ef4444'
              }
            />
          </View>
          {trend && (
            <View className={cn(
              'px-2 py-1 rounded-full flex-row items-center',
              trend > 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'
            )}>
              <Ionicons
                name={trend > 0 ? 'trending-up' : 'trending-down'}
                size={12}
                color={trend > 0 ? '#10b981' : '#ef4444'}
              />
              <Text className={cn(
                'text-xs font-medium ml-1',
                trend > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              )}>
                {Math.abs(trend)}%
              </Text>
            </View>
          )}
        </View>

        <Text className={cn('text-3xl font-bold mb-1', colors.textPrimary)}>
          {loading ? '...' : value.toLocaleString()}
        </Text>
        <Text className={cn('text-lg font-semibold mb-2', colors.textPrimary)}>
          {title}
        </Text>
        <Text className={cn('text-sm opacity-70', colors.textSecondary)}>
          {subtitle}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const ActionButton = ({
    icon,
    title,
    subtitle,
    onPress,
    color = 'blue'
  }: any) => (
    <TouchableOpacity
      className={cn(
        'p-5 rounded-2xl border flex-row items-center justify-between',
        colors.backgroundElevated,
        colors.border,
        'active:scale-95 transition-transform'
      )}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center space-x-4 flex-1">
        <View className={cn(
          'w-10 h-10 rounded-xl items-center justify-center',
          color === 'blue' && 'bg-blue-500/10 dark:bg-blue-500/20',
          color === 'green' && 'bg-emerald-500/10 dark:bg-emerald-500/20',
          color === 'purple' && 'bg-violet-500/10 dark:bg-violet-500/20'
        )}>
          <Ionicons
            name={icon}
            size={20}
            color={
              color === 'blue' ? '#3b82f6' :
                color === 'green' ? '#10b981' :
                  '#8b5cf6'
            }
          />
        </View>
        <View className="flex-1">
          <Text className={cn('font-semibold text-base mb-1', colors.textPrimary)}>
            {title}
          </Text>
          <Text className={cn('text-sm opacity-70', colors.textSecondary)}>
            {subtitle}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} className="opacity-50" />
    </TouchableOpacity>
  );

  return (
    <View className={cn('flex-1', colors.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-12 pb-6 border-b', colors.background, colors.border)}>
        <View className="flex-row items-center justify-between mb-3">
          <View>
            <Text className={cn('text-3xl font-bold tracking-tight', colors.textPrimary)}>
              Dashboard
            </Text>
            <Text className={cn('text-lg opacity-70 mt-1', colors.textSecondary)}>
              Welcome back, Admin
            </Text>
          </View>
          <TouchableOpacity
            className={cn(
              'w-10 h-10 rounded-full items-center justify-center',
              colors.backgroundElevated,
              colors.border
            )}
            onPress={loadDashboardData}
          >
            <Ionicons name="refresh" size={20} className={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-6 space-y-8">
          {/* Overview Section */}
          <View className="space-y-4">
            <View className="flex-row items-center justify-between">
              <Text className={cn('text-2xl font-bold tracking-tight', colors.textPrimary)}>
                Overview
              </Text>
              <Text className={cn('text-sm opacity-70', colors.textSecondary)}>
                Real-time data
              </Text>
            </View>

            <View className="grid grid-cols-2 gap-4">
              <StatCard
                icon="people-outline"
                title="Students"
                value={stats.totalStudents}
                subtitle="Active students"
                onPress={() => router.push('/(admin)/students')}
                color="blue"
                trend={2.5}
              />
              <StatCard
                icon="person-outline"
                title="Teachers"
                value={stats.totalTeachers}
                subtitle="Teaching staff"
                onPress={() => router.push('/(admin)/teachers')}
                color="green"
                trend={1.2}
              />
              <StatCard
                icon="school-outline"
                title="Classes"
                value={stats.totalClasses}
                subtitle="Active classes"
                onPress={() => router.push('/(admin)/classes')}
                color="purple"
                trend={0.8}
              />
            </View>
          </View>

          {/* Quick Actions */}
          <View className="space-y-4">
            <Text className={cn('text-2xl font-bold tracking-tight', colors.textPrimary)}>
              Quick Actions
            </Text>

            <View className="space-y-3">
              <ActionButton
                icon="person-add-outline"
                title="Manage Users"
                subtitle="Add or remove students and teachers"
                onPress={() => router.push('/(admin)/users')}
                color="blue"
              />

              <ActionButton
                icon="link-outline"
                title="Teacher Assignments"
                subtitle="Assign teachers to classes and subjects"
                onPress={() => router.push('/(admin)/teachers')}
                color="green"
              />

              <ActionButton
                icon="settings-outline"
                title="System Settings"
                subtitle="Configure levels and subjects"
                onPress={() => router.push('/(admin)/settings')}
                color="purple"
              />

              {stats.pendingApprovals > 0 && (
                <ActionButton
                  icon="time-outline"
                  title="Pending Approvals"
                  subtitle={`${stats.pendingApprovals} waiting for review`}
                  onPress={() => router.push('/(admin)/approvals')}
                  color="orange"
                />
              )}
            </View>
          </View>

          {/* Recent Activity Placeholder */}
          <View className="space-y-4">
            <Text className={cn('text-2xl font-bold tracking-tight', colors.textPrimary)}>
              Recent Activity
            </Text>

            <View className={cn(
              'p-6 rounded-2xl border items-center justify-center',
              colors.backgroundElevated,
              colors.border
            )}>
              <Ionicons name="stats-chart-outline" size={48} className="opacity-30 mb-3" />
              <Text className={cn('text-lg font-medium mb-1', colors.textPrimary)}>
                Activity Feed
              </Text>
              <Text className={cn('text-center opacity-70', colors.textSecondary)}>
                Recent system activities and updates will appear here
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View className="h-6" />
      </ScrollView>
    </View>
  );
}