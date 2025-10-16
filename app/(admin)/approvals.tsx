// app/(admin)/approvals.tsx - Using built-in React Native Alert
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '@/contexts/ThemeContext';
import Alert from '@/components/Alert';

interface PendingUser {
  id: string;
  email: string;
  role: 'student' | 'teacher' | string;
  profile?: {
    name?: string;
    class?: string;
    department?: string;
  };
  created_at: string;
}

export default function ApprovalsPage() {
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDark } = useThemeContext();
  
  useEffect(() => {
    loadPendingApprovals();
  }, []);

  const loadPendingApprovals = async () => {
    try {
      setLoading(true);
      const response = await apiService.getPendingApprovals();
      const users = Array.isArray(response.data.data) ? response.data.data : [];
      setPendingUsers(users);
    } catch (error: any) {
      console.error('Failed to load pending approvals:', error);
      Alert.alert('Error', error.message || 'Failed to load pending approvals');
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
      const response = await apiService.approveUser(userId);
      if (response.data.success) {
        Alert.alert('Success', `${userName} has been approved`, [
          { text: 'OK', onPress: () => loadPendingApprovals() }
        ]);
      } else {
        throw new Error(response.data.error || 'Failed to approve user');
      }
    } catch (error: any) {
      console.error('Failed to approve user:', error);
      Alert.alert('Error', error.message || 'Failed to approve user');
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
              const response = await apiService.deleteUser(userId);
              if (response.data.success) {
                Alert.alert('Success', 'User rejected successfully', [
                  { text: 'OK', onPress: () => loadPendingApprovals() }
                ]);
              } else {
                throw new Error(response.data.error || 'Failed to reject user');
              }
            } catch (error: any) {
              console.error('Failed to reject user:', error);
              Alert.alert('Error', error.message || 'Failed to reject user');
            }
          }
        }
      ]
    );
  };

  const getUserName = (user: PendingUser): string => {
    return user.profile?.name || user.email || 'Unknown User';
  };

  const PendingUserCard = ({ user }: { user: PendingUser }) => {
    const userName = getUserName(user);

    return (
      <View style={{
        padding: designTokens.spacing.lg,
        borderRadius: designTokens.borderRadius.xl,
        backgroundColor: colors.backgroundElevated,
        borderWidth: 1,
        borderColor: colors.border,
        ...designTokens.shadows.sm,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: designTokens.spacing.md,
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.xs,
            } as any}>
              {userName}
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
            }}>
              {user.email}
            </Text>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.spacing.sm,
              marginTop: designTokens.spacing.sm,
            }}>
              <View style={{
                paddingHorizontal: designTokens.spacing.md,
                paddingVertical: designTokens.spacing.xs,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: user.role === 'student' ? colors.primary + '15' : '#10b981' + '15',
              }}>
                <Text style={{
                  fontSize: designTokens.typography.caption2.fontSize,
                  fontWeight: '600',
                  color: user.role === 'student' ? colors.primary : '#10b981',
                }}>
                  {user.role?.charAt(0).toUpperCase() + user.role?.slice(1) || 'User'}
                </Text>
              </View>
              <View style={{
                paddingHorizontal: designTokens.spacing.md,
                paddingVertical: designTokens.spacing.xs,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: '#f59e0b' + '15',
              }}>
                <Text style={{
                  fontSize: designTokens.typography.caption2.fontSize,
                  fontWeight: '600',
                  color: '#f59e0b',
                }}>
                  Pending Approval
                </Text>
              </View>
            </View>

            {user.profile?.class && (
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
                marginTop: designTokens.spacing.sm,
              }}>
                Class: {user.profile.class}
              </Text>
            )}

            {user.profile?.department && (
              <Text style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textSecondary,
                marginTop: designTokens.spacing.xs,
              }}>
                Department: {user.profile.department}
              </Text>
            )}
          </View>
        </View>

        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: designTokens.spacing.md,
        }}>
          <Text style={{
            fontSize: designTokens.typography.caption2.fontSize,
            color: colors.textTertiary,
          }}>
            Requested: {new Date(user.created_at).toLocaleDateString()}
          </Text>

          <View style={{
            flexDirection: 'row',
            gap: designTokens.spacing.sm,
          }}>
            <TouchableOpacity
              onPress={() => handleReject(user.id, userName)}
              style={{
                paddingHorizontal: designTokens.spacing.lg,
                paddingVertical: designTokens.spacing.sm,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: isDark ? '#374151' : '#e5e7eb',
                flexDirection: 'row',
                alignItems: 'center',
                gap: designTokens.spacing.xs,
              }}
            >
              <Ionicons name="close" size={16} color={colors.textSecondary} />
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: colors.textSecondary,
              }}>
                Reject
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => handleApprove(user.id, userName)}
              style={{
                paddingHorizontal: designTokens.spacing.lg,
                paddingVertical: designTokens.spacing.sm,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: '#10b981',
                flexDirection: 'row',
                alignItems: 'center',
                gap: designTokens.spacing.xs,
              }}
            >
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: '#FFFFFF',
              }}>
                Approve
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
        }}>
          Loading approvals...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{
        padding: designTokens.spacing.xl,
        paddingTop: designTokens.spacing.xxxl,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.background,
      }}>
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: designTokens.spacing.md,
        }}>
          <View>
            <Text style={{
              fontSize: designTokens.typography.title1.fontSize,
              fontWeight: designTokens.typography.title1.fontWeight,
              color: colors.textPrimary,
            } as any}>
              Pending Approvals
            </Text>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textSecondary,
              marginTop: designTokens.spacing.xs,
            }}>
              Review and approve user registrations
            </Text>
          </View>

          {pendingUsers.length > 0 && (
            <View style={{
              paddingHorizontal: designTokens.spacing.md,
              paddingVertical: designTokens.spacing.xs,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: '#f59e0b' + '15',
            }}>
              <Text style={{
                fontSize: designTokens.typography.caption2.fontSize,
                fontWeight: '600',
                color: '#f59e0b',
              }}>
                {pendingUsers.length} pending
              </Text>
            </View>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{
          padding: designTokens.spacing.xl,
          gap: designTokens.spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {pendingUsers.length === 0 ? (
          <View style={{
            alignItems: 'center',
            paddingVertical: designTokens.spacing.xxxl,
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            ...designTokens.shadows.sm,
          }}>
            <Ionicons name="checkmark-circle-outline" size={64} color={colors.textTertiary} />
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginTop: designTokens.spacing.lg,
              marginBottom: designTokens.spacing.xs,
            } as any}>
              All caught up!
            </Text>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              textAlign: 'center',
            }}>
              No pending approvals at the moment
            </Text>
          </View>
        ) : (
          <View>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              fontWeight: '600',
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.lg,
            }}>
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
