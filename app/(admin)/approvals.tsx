// app/(admin)/approvals.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';

interface PendingUser {
  id: string;
  email: string;
  role: 'student' | 'teacher';
  profile: {
    name: string;
    class?: string;
    department?: string;
  };
  created_at: string;
}

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingApprovals();
      setPendingUsers(response.data.data || []);
    } catch (error) {
      console.error('Failed to load pending approvals:', error);
      Alert.alert('Error', 'Failed to load pending approvals');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadPendingApprovals();
  };

  const handleApprove = async (userId: string, userName: string) => {
    try {
      await apiService.approveUser(userId);
      Alert.alert('Success', `${userName} has been approved`);
      loadPendingApprovals();
    } catch (error) {
      console.error('Failed to approve user:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const handleReject = async (userId: string, userName: string) => {
    Alert.alert(
      'Reject User',
      `Are you sure you want to reject ${userName}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteUser(userId);
              Alert.alert('Success', 'User rejected successfully');
              loadPendingApprovals();
            } catch (error) {
              console.error('Failed to reject user:', error);
              Alert.alert('Error', 'Failed to reject user');
            }
          }
        }
      ]
    );
  };

  const PendingUserCard = ({ user }: { user: PendingUser }) => (
    <View className={cn('p-5 rounded-2xl border mb-4', Theme.elevated, Theme.border)}>
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className={cn('text-lg font-semibold mb-1', Theme.text.primary)}>
            {user.profile?.name || 'No Name'}
          </Text>
          <Text className={cn('text-sm mb-1', Theme.text.secondary)}>
            {user.email}
          </Text>
          <View className="flex-row items-center space-x-3 mt-2">
            <View className={cn(
              'px-3 py-1 rounded-full',
              user.role === 'student' ? 'bg-blue-500/10' : 'bg-green-500/10'
            )}>
              <Text className={cn(
                'text-xs font-medium',
                user.role === 'student' ? 'text-blue-600' : 'text-green-600'
              )}>
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Text>
            </View>
            <View className="px-3 py-1 rounded-full bg-amber-500/10">
              <Text className="text-xs font-medium text-amber-600">
                Pending Approval
              </Text>
            </View>
          </View>
          
          {user.profile?.class && (
            <Text className={cn('text-sm mt-2', Theme.text.secondary)}>
              Class: {user.profile.class}
            </Text>
          )}
          
          {user.profile?.department && (
            <Text className={cn('text-sm mt-1', Theme.text.secondary)}>
              Department: {user.profile.department}
            </Text>
          )}
        </View>
      </View>
      
      <View className="flex-row justify-between items-center mt-4">
        <Text className={cn('text-xs', Theme.text.secondary)}>
          Requested: {new Date(user.created_at).toLocaleDateString()}
        </Text>
        
        <View className="flex-row space-x-2">
          <TouchableOpacity
            onPress={() => handleReject(user.id, user.profile?.name || user.email)}
            className="px-4 py-2 rounded-full bg-gray-200 dark:bg-gray-700 flex-row items-center space-x-2"
          >
            <Ionicons name="close" size={16} className="text-gray-600 dark:text-gray-400" />
            <Text className="text-gray-600 dark:text-gray-400 font-medium text-sm">
              Reject
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={() => handleApprove(user.id, user.profile?.name || user.email)}
            className="px-4 py-2 rounded-full bg-emerald-500 flex-row items-center space-x-2"
          >
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            <Text className="text-white font-medium text-sm">
              Approve
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className={cn('flex-1 items-center justify-center', Theme.background)}>
        <Text className={cn('text-lg', Theme.text.primary)}>Loading approvals...</Text>
      </View>
    );
  }

  return (
    <View className={cn('flex-1', Theme.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-12 pb-6 border-b', Theme.background, Theme.border)}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={cn('text-3xl font-bold tracking-tight', Theme.text.primary)}>
              Pending Approvals
            </Text>
            <Text className={cn('text-lg opacity-70 mt-1', Theme.text.secondary)}>
              Review and approve user registrations
            </Text>
          </View>
          
          {pendingUsers.length > 0 && (
            <View className="px-3 py-1 rounded-full bg-amber-500/10">
              <Text className="text-amber-600 font-medium text-sm">
                {pendingUsers.length} pending
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView 
        className="flex-1 p-6"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {pendingUsers.length === 0 ? (
          <View className={cn('items-center justify-center py-12', Theme.background)}>
            <Ionicons name="checkmark-circle-outline" size={64} className="opacity-30 mb-4" />
            <Text className={cn('text-lg font-medium mb-2', Theme.text.primary)}>
              All caught up!
            </Text>
            <Text className={cn('text-center opacity-70', Theme.text.secondary)}>
              No pending approvals at the moment
            </Text>
          </View>
        ) : (
          <View>
            <Text className={cn('text-sm font-medium mb-4', Theme.text.secondary)}>
              {pendingUsers.length} user{pendingUsers.length !== 1 ? 's' : ''} waiting for approval
            </Text>
            
            {pendingUsers.map((user) => (
              <PendingUserCard key={user.id} user={user} />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}