// app/(student)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl } from
'react-native';
import { Alert } from '@/utils/UniversalAlert';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import Animated, { FadeIn } from 'react-native-reanimated';import { useTranslation } from "@/hooks/useTranslation";

export default function ProfileScreen() {const { t } = useTranslation();
  const { user, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useThemeContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [profileStats, setProfileStats] = useState<any>(null);
  const [settings, setSettings] = useState({
    notifications: true
  });


  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      // Load real profile stats from API
      const statsResponse = await apiService.getStudentStats();
      if (statsResponse.data.success) {
        setProfileStats(statsResponse.data.data);
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadProfileData();
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await logout();
            router.push('/(auth)/login');
          } catch (error) {
            console.error('Logout error:', error);
          } finally {
            setLoading(false);
          }
        }
      }]

    );
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const SettingItem = ({ title, description, value, onToggle




  }: {title: string;description: string;value: boolean;onToggle: () => void;}) =>
  <View
    style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: designTokens.spacing.lg,
      borderBottomWidth: 1,
      borderBottomColor: colors.separator
    }}>

      <View style={{ flex: 1, marginRight: designTokens.spacing.md }}>
        <Text
        style={{
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textPrimary,
          fontWeight: '400',
          marginBottom: 2
        }}>

          {title}
        </Text>
        <Text
        style={{
          fontSize: designTokens.typography.footnote.fontSize,
          color: colors.textSecondary
        }}>

          {description}
        </Text>
      </View>
      <Switch
      value={value}
      onValueChange={onToggle}
      trackColor={{ false: colors.separator, true: colors.primary + '40' }}
      thumbColor={value ? colors.primary : colors.backgroundElevated}
      ios_backgroundColor={colors.separator} />

    </View>;


  const ProfileSection = ({ title, children }: {title: string;children: React.ReactNode;}) =>
  <View style={{ marginBottom: designTokens.spacing.xl }}>
      <Text
      style={{
        fontSize: designTokens.typography.title3.fontSize,
        fontWeight: designTokens.typography.title3.fontWeight,
        color: colors.textPrimary,
        marginBottom: designTokens.spacing.md,
        paddingHorizontal: designTokens.spacing.xl
      } as any}>

        {title}
      </Text>
      <View
      style={{
        backgroundColor: colors.backgroundElevated,
        marginHorizontal: designTokens.spacing.xl,
        borderRadius: designTokens.borderRadius.xl,
        overflow: 'hidden',
        ...designTokens.shadows.sm
      }}>

        {children}
      </View>
    </View>;


  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          paddingTop: designTokens.spacing.xxxl,
          paddingHorizontal: designTokens.spacing.xl,
          paddingBottom: designTokens.spacing.lg,
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>

        <Text
          style={{
            fontSize: designTokens.typography.largeTitle.fontSize,
            fontWeight: designTokens.typography.largeTitle.fontWeight,
            color: colors.textPrimary
          } as any}>{t("profile.title")}


        </Text>

        {/* Dark Mode Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            padding: designTokens.spacing.sm,
            borderRadius: designTokens.borderRadius.full,
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm
          }}>

          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            color={colors.textPrimary} />

        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: colors.separator,
          marginHorizontal: designTokens.spacing.xl,
          borderRadius: designTokens.borderRadius.full,
          padding: 2,
          marginBottom: designTokens.spacing.xl
        }}>

        {[
        { key: 'profile' as const, label: t("profile.title"), icon: 'person' },
        { key: 'settings' as const, label: t("profile.settings"), icon: 'settings' }].
        map((tab) =>
        <TouchableOpacity
          key={tab.key}
          style={{
            flex: 1,
            paddingVertical: designTokens.spacing.md,
            alignItems: 'center',
            borderRadius: designTokens.borderRadius.full,
            backgroundColor: activeTab === tab.key ? colors.backgroundElevated : 'transparent'
          }}
          onPress={() => setActiveTab(tab.key)}>

            <Ionicons
            name={tab.icon as any}
            size={20}
            color={activeTab === tab.key ? colors.primary : colors.textSecondary} />

            <Text
            style={{
              fontSize: designTokens.typography.caption1.fontSize,
              color: activeTab === tab.key ? colors.primary : colors.textSecondary,
              fontWeight: '600',
              marginTop: 4
            }}>

              {tab.label}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(600)} // Smooth fade-in when screen loads
        refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary} />

        }>

        <View style={{ paddingBottom: designTokens.spacing.xxxl }}>
          {activeTab === 'profile' ?
          <>
              {/* Profile Header */}
              <ProfileSection title="Student Information">
                <View style={{ padding: designTokens.spacing.lg }}>
                  <View style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginBottom: designTokens.spacing.xl
                }}>
                    <View
                    style={{
                      width: 70,
                      height: 70,
                      borderRadius: 35,
                      backgroundColor: colors.primary + '15',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: designTokens.spacing.lg
                    }}>

                      <Text style={{
                      fontSize: 28,
                      fontWeight: '700',
                      color: colors.primary
                    }}>
                        {user?.profile?.name?.charAt(0) || 'S'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                      style={{
                        fontSize: designTokens.typography.title2.fontSize,
                        fontWeight: designTokens.typography.title2.fontWeight,
                        color: colors.textPrimary,
                        marginBottom: 2
                      } as any}>

                        {user?.profile?.name || 'Student'}
                      </Text>
                      <Text
                      style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textSecondary,
                        marginBottom: 2
                      }}>

                        {user?.profile?.class ? `Class ${user.profile.class}` : 'No class assigned'}
                      </Text>
                      <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: '#34C75915',
                      alignSelf: 'flex-start',
                      paddingHorizontal: designTokens.spacing.sm,
                      paddingVertical: designTokens.spacing.xs,
                      borderRadius: designTokens.borderRadius.full
                    }}>
                        <View style={{
                        width: 8,
                        height: 8,
                        borderRadius: 4,
                        backgroundColor: '#34C759',
                        marginRight: 4
                      }} />
                        <Text
                        style={{
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: '#34C759',
                          fontWeight: '600'
                        }}>

                          {user?.is_approved ? t("common.active") : t("common.pending")}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={{
                  borderTopWidth: 1,
                  borderTopColor: colors.separator,
                  paddingTop: designTokens.spacing.lg
                }}>
                    <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: designTokens.spacing.md
                  }}>
                      <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textSecondary
                    }}>
                        Student ID
                      </Text>
                      <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      fontWeight: '500'
                    }}>
                        {user?.student_id || 'Not set'}
                      </Text>
                    </View>
                    <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    marginBottom: designTokens.spacing.md
                  }}>
                      <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textSecondary
                    }}>{t("profile.email")}

                    </Text>
                      <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      fontWeight: '500'
                    }}>
                        {user?.email}
                      </Text>
                    </View>
                    <View style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                  }}>
                      <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textSecondary
                    }}>{t("profile.accountCreated")}

                    </Text>
                      <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      fontWeight: '500'
                    }}>
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </Text>
                    </View>
                  </View>
                </View>
              </ProfileSection>

              {/* Performance Stats */}
              {profileStats &&
            <ProfileSection title="Performance">
                  <View style={{ padding: designTokens.spacing.lg }}>
                    <View style={{
                  flexDirection: 'row',
                  marginBottom: designTokens.spacing.lg
                }}>
                      <View style={{
                    flex: 1,
                    alignItems: 'center',
                    borderRightWidth: 1,
                    borderRightColor: colors.separator,
                    paddingRight: designTokens.spacing.lg
                  }}>
                        <Text
                      style={{
                        fontSize: designTokens.typography.title1.fontSize,
                        fontWeight: designTokens.typography.title1.fontWeight,
                        color: colors.textPrimary,
                        marginBottom: 2
                      } as any}>

                          {profileStats.averageScore || '0'}%
                        </Text>
                        <Text style={{
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary
                    }}>
                          Average
                        </Text>
                      </View>
                      <View style={{
                    flex: 1,
                    alignItems: 'center',
                    borderRightWidth: 1,
                    borderRightColor: colors.separator,
                    paddingHorizontal: designTokens.spacing.lg
                  }}>
                        <Text
                      style={{
                        fontSize: designTokens.typography.title1.fontSize,
                        fontWeight: designTokens.typography.title1.fontWeight,
                        color: colors.textPrimary,
                        marginBottom: 2
                      } as any}>

                          {profileStats.examsCompleted || '0'}
                        </Text>
                        <Text style={{
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary
                    }}>
                          Completed
                        </Text>
                      </View>
                      <View style={{
                    flex: 1,
                    alignItems: 'center',
                    paddingLeft: designTokens.spacing.lg
                  }}>
                        <Text
                      style={{
                        fontSize: designTokens.typography.title1.fontSize,
                        fontWeight: designTokens.typography.title1.fontWeight,
                        color: colors.textPrimary,
                        marginBottom: 2
                      } as any}>

                          #{profileStats.rank || '--'}
                        </Text>
                        <Text style={{
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary
                    }}>
                          Rank
                        </Text>
                      </View>
                    </View>
                  </View>
                </ProfileSection>
            }
            </> :

          <>
              <ProfileSection title="Preferences">
                <View style={{ paddingHorizontal: designTokens.spacing.lg }}>
                  <SettingItem
                  title="Notifications"
                  description="Exam reminders and updates"
                  value={settings.notifications}
                  onToggle={() => toggleSetting('notifications')} />

                </View>
              </ProfileSection>

              {/* Dark Mode Setting */}
              <ProfileSection title="Appearance">
                <View style={{ paddingHorizontal: designTokens.spacing.lg }}>
                  <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingVertical: designTokens.spacing.lg
                  }}>

                    <View style={{ flex: 1, marginRight: designTokens.spacing.md }}>
                      <Text
                      style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        fontWeight: '400',
                        marginBottom: 2
                      }}>{t("system.darkMode")}


                    </Text>
                      <Text
                      style={{
                        fontSize: designTokens.typography.footnote.fontSize,
                        color: colors.textSecondary
                      }}>{t("system.darkModeDesc")}


                    </Text>
                    </View>
                    <Switch
                    value={isDark}
                    onValueChange={toggleTheme}
                    trackColor={{ false: colors.separator, true: colors.primary + '40' }}
                    thumbColor={isDark ? colors.primary : colors.backgroundElevated}
                    ios_backgroundColor={colors.separator} />

                  </View>
                </View>
              </ProfileSection>
            </>
          }

          {/* Logout Button */}
          <View style={{
            paddingHorizontal: designTokens.spacing.xl,
            marginTop: designTokens.spacing.xl
          }}>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loading}
              style={{
                backgroundColor: colors.error + '10',
                padding: designTokens.spacing.lg,
                borderRadius: designTokens.borderRadius.xl,
                alignItems: 'center',
                borderWidth: 1,
                borderColor: colors.error + '20'
              }}>

              {loading ?
              <ActivityIndicator size="small" color={colors.error} /> :

              <Text
                style={{
                  fontSize: designTokens.typography.headline.fontSize,
                  color: colors.error,
                  fontWeight: '600'
                }}>{t("auth.logOut")}


              </Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </View>);

}