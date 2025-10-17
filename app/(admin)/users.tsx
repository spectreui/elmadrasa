// app/(admin)/users.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, RefreshControl } from 'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { Theme, cn } from '../../src/utils/themeUtils';
import { useThemeContext } from '@/contexts/ThemeContext';import { useTranslation } from "@/hooks/useTranslation";

interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  is_approved: boolean;
  profile: {
    name: string;
    class?: string;
  };
  created_at: string;
}

export default function UsersManagement() {const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'teacher'>('all');
  const { fontFamily, colors } = useThemeContext();


  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery, roleFilter]);

  const loadUsers = async () => {
    try {
      setLoading(true);

      const [studentsRes, teachersRes] = await Promise.all([
      apiService.getUsersByRole('student'),
      apiService.getUsersByRole('teacher')]
      );

      const allUsers = [
      ...(studentsRes.data.data || []),
      ...(teachersRes.data.data || [])];


      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      Alert.alert('Error', 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    // Filter by role
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((user) =>
      user.email.toLowerCase().includes(query) ||
      user.profile?.name?.toLowerCase().includes(query) ||
      user.profile?.class?.toLowerCase().includes(query)
      );
    }

    setFilteredUsers(filtered);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUsers();
  };

  const handleApproveUser = async (userId: string) => {
    try {
      await apiService.approveUser(userId);
      Alert.alert('Success', 'User approved successfully');
      loadUsers();
    } catch (error) {
      console.error('Failed to approve user:', error);
      Alert.alert('Error', 'Failed to approve user');
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}? This action cannot be undone.`,
      [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await apiService.deleteUser(userId);
            Alert.alert('Success', 'User deleted successfully');
            loadUsers();
          } catch (error) {
            console.error('Failed to delete user:', error);
            Alert.alert('Error', 'Failed to delete user');
          }
        }
      }]

    );
  };

  const UserCard = ({ user }: {user: User;}) =>
  <View className={cn('p-5 rounded-2xl border mb-3', colors.backgroundElevated, colors.border)}>
      <View className="flex-row items-start justify-between mb-3">
        <View className="flex-1">
          <Text className={cn('text-lg font-semibold mb-1', colors.textPrimary)}>
            {user.profile?.name || 'No Name'}
          </Text>
          <Text className={cn('text-sm mb-1', colors.textSecondary)}>
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
            <View className={cn(
            'px-3 py-1 rounded-full',
            user.is_approved ? 'bg-emerald-500/10' : 'bg-amber-500/10'
          )}>
              <Text className={cn(
              'text-xs font-medium',
              user.is_approved ? 'text-emerald-600' : 'text-amber-600'
            )}>
                {user.is_approved ? 'Approved' : t("common.pending")}
              </Text>
            </View>
          </View>
          {user.profile?.class &&
        <Text className={cn('text-sm mt-2', colors.textSecondary)}>
              Class: {user.profile.class}
            </Text>
        }
        </View>
        
        <View className="flex-row space-x-2">
          {!user.is_approved &&
        <TouchableOpacity
          onPress={() => handleApproveUser(user.id)}
          className="w-8 h-8 rounded-full bg-emerald-500 items-center justify-center">

              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            </TouchableOpacity>
        }
          <TouchableOpacity
          onPress={() => handleDeleteUser(user.id, user.profile?.name || user.email)}
          className="w-8 h-8 rounded-full bg-rose-500 items-center justify-center">

            <Ionicons name="trash" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
      
      <Text className={cn('text-xs', colors.textSecondary)}>
        Joined: {new Date(user.created_at).toLocaleDateString()}
      </Text>
    </View>;


  if (loading) {
    return (
      <View className={cn('flex-1 items-center justify-center', colors.background)}>
        <Text className={cn('text-lg', colors.textPrimary)}>Loading users...</Text>
      </View>);

  }

  return (
    <View className={cn('flex-1', colors.background)}>
      {/* Header */}
      <View className={cn('px-6 pt-12 pb-6 border-b', colors.background, colors.border)}>
        <View className="flex-row items-center justify-between mb-4">
          <View>
            <Text className={cn('text-3xl font-bold tracking-tight', colors.textPrimary)}>
              User Management
            </Text>
            <Text className={cn('text-lg opacity-70 mt-1', colors.textSecondary)}>
              Manage students and teachers
            </Text>
          </View>
        </View>

        {/* Search and Filters */}
        <View className="space-y-4">
          <TextInput
            placeholder="Search users by name, email, or class..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className={cn(
              'w-full px-4 py-3 rounded-2xl border text-base',
              colors.border,
              colors.background,
              colors.textPrimary
            )}
            placeholderTextColor="#9CA3AF" />

          
          <View className="flex-row py-2 space-x-2">
            {(['all', 'student', 'teacher'] as const).map((role) =>
            <TouchableOpacity
              key={role}
              onPress={() => setRoleFilter(role)}
              className={cn(
                'px-4 mx-1 py-2 rounded-full border',
                roleFilter === role ?
                'bg-blue-500 border-blue-500' :
                colors.border
              )}>

                <Text className={
              roleFilter === role ?
              'text-white font-medium text-sm' :
              cn('font-medium text-sm', colors.textPrimary)
              }>
                  {role === 'all' ? 'All' : role.charAt(0).toUpperCase() + role.slice(1)}s
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1 p-6"
        refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>

        {filteredUsers.length === 0 ?
        <View className={cn('items-center justify-center py-12', colors.background)}>
            <Ionicons name="people-outline" size={64} className="opacity-30 mb-4" />
            <Text className={cn('text-lg font-medium mb-2', colors.textPrimary)}>
              No users found
            </Text>
            <Text className={cn('text-center opacity-70', colors.textSecondary)}>
              {searchQuery || roleFilter !== 'all' ?
            'Try adjusting your search or filters' :
            'No users registered yet'
            }
            </Text>
          </View> :

        <View>
            <Text className={cn('text-sm font-medium mb-4', colors.textSecondary)}>
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </Text>
            
            {filteredUsers.map((user) =>
          <UserCard key={user.id} user={user} />
          )}
          </View>
        }
      </ScrollView>
    </View>);

}