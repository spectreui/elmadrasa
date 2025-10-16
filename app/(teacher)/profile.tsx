// app/(teacher)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Alert } from '@/utils/UniversalAlert';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';

interface TeacherStats {
  totalStudents: number;
  activeExams: number;
  averageClassScore: number;
  examsCreated: number;
  pendingGrading: number;
}

export default function TeacherProfileScreen() {
  const { user, logout, isAuthenticated } = useAuth();
  const { colors, isDark, toggleTheme } = useThemeContext();
  const [activeTab, setActiveTab] = useState<'profile' | 'settings'>('profile');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
    

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user?.role === 'student') {
        console.log('➡️ Redirecting student to tabs');
        router.replace('/(student)/homework');
      }
    }
  }, [isAuthenticated, loading, user, router]);

  const [teacherStats] = useState<TeacherStats>({
    totalStudents: 156,
    activeExams: 8,
    averageClassScore: 78,
    examsCreated: 24,
    pendingGrading: 12,
  });

  const [settings, setSettings] = useState({
    notifications: true,
    examNotifications: true,
    gradingReminders: true,
  });

  const onRefresh = () => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => setRefreshing(false), 1000);
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
          },
        },
      ]
    );
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const SettingItem = ({ title, description, value, onToggle }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
  }) => (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: designTokens.spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: colors.separator,
      }}
    >
      <View style={{ flex: 1, marginRight: designTokens.spacing.md }}>
        <Text
          style={{
            fontSize: designTokens.typography.body.fontSize,
            color: colors.textPrimary,
            fontWeight: '400',
            marginBottom: 2,
          }}
        >
          {title}
        </Text>
        <Text
          style={{
            fontSize: designTokens.typography.footnote.fontSize,
            color: colors.textSecondary,
          }}
        >
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.separator, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.backgroundElevated}
        ios_backgroundColor={colors.separator}
      />
    </View>
  );

  const ProfileSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <View style={{ marginBottom: designTokens.spacing.xl }}>
      <Text
        style={{
          fontSize: designTokens.typography.title3.fontSize,
          fontWeight: designTokens.typography.title3.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.md,
          paddingHorizontal: designTokens.spacing.xl,
        } as any}
      >
        {title}
      </Text>
      <View
        style={{
          backgroundColor: colors.backgroundElevated,
          marginHorizontal: designTokens.spacing.xl,
          borderRadius: designTokens.borderRadius.xl,
          overflow: 'hidden',
          ...designTokens.shadows.sm,
        }}
      >
        {children}
      </View>
    </View>
  );

    const toggleLanguage = () => {
    changeLanguage(currentLocale === 'en' ? 'ar' : 'en');
  };

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
          alignItems: 'center',
        }}
      >
        <Text
          style={{
            fontSize: designTokens.typography.largeTitle.fontSize,
            fontWeight: designTokens.typography.largeTitle.fontWeight,
            color: colors.textPrimary,
          } as any}
        >
          Profile
        </Text>

        {/* Dark Mode Toggle */}
        <TouchableOpacity
          onPress={toggleTheme}
          style={{
            padding: designTokens.spacing.sm,
            borderRadius: designTokens.borderRadius.full,
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
          }}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            color={colors.textPrimary}
          />
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
          marginBottom: designTokens.spacing.xl,
        }}
      >
        {[
          { key: 'profile' as const, label: 'Profile', icon: 'person' },
          { key: 'settings' as const, label: 'Settings', icon: 'settings' },
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={{
              flex: 1,
              paddingVertical: designTokens.spacing.md,
              alignItems: 'center',
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: activeTab === tab.key ? colors.backgroundElevated : 'transparent',
            }}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={{
                fontSize: designTokens.typography.caption1.fontSize,
                color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                fontWeight: '600',
                marginTop: 4,
              }}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <View style={{ paddingBottom: designTokens.spacing.xxxl }}>
          {activeTab === 'profile' ? (
            <>
              {/* Profile Header */}
              <ProfileSection title="Teacher Information">
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
                        marginRight: designTokens.spacing.lg,
                      }}
                    >
                      <Text style={{
                        fontSize: 28,
                        fontWeight: '700',
                        color: colors.primary,
                      }}>
                        {user?.profile?.name?.charAt(0) || 'T'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text
                        style={{
                          fontSize: designTokens.typography.title2.fontSize,
                          fontWeight: designTokens.typography.title2.fontWeight,
                          color: colors.textPrimary,
                          marginBottom: 2,
                        } as any}
                      >
                        {user?.profile?.name || 'Teacher'}
                      </Text>
                      <Text
                        style={{
                          fontSize: designTokens.typography.body.fontSize,
                          color: colors.textSecondary,
                          marginBottom: 2,
                        }}
                      >
                        {user?.profile?.class ? `Class ${user.profile.class}` : 'All Classes'}
                      </Text>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: '#34C75915',
                        alignSelf: 'flex-start',
                        paddingHorizontal: designTokens.spacing.sm,
                        paddingVertical: designTokens.spacing.xs,
                        borderRadius: designTokens.borderRadius.full,
                      }}>
                        <View style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: '#34C759',
                          marginRight: 4,
                        }} />
                        <Text
                          style={{
                            fontSize: designTokens.typography.caption1.fontSize,
                            color: '#34C759',
                            fontWeight: '600',
                          }}
                        >
                          Active
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
                        Teacher ID
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        fontWeight: '500'
                      }}>
                        {user?.teacher_id || 'Not set'}
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
                      }}>
                        Email
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
                      }}>
                        Account Created
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

              {/* Teaching Stats */}
              <ProfileSection title="Teaching Overview">
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
                      paddingRight: designTokens.spacing.lg,
                    }}>
                      <Text
                        style={{
                          fontSize: designTokens.typography.title1.fontSize,
                          fontWeight: designTokens.typography.title1.fontWeight,
                          color: colors.textPrimary,
                          marginBottom: 2,
                        } as any}
                      >
                        {teacherStats.totalStudents}
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.footnote.fontSize,
                        color: colors.textSecondary
                      }}>
                        Students
                      </Text>
                    </View>
                    <View style={{
                      flex: 1,
                      alignItems: 'center',
                      borderRightWidth: 1,
                      borderRightColor: colors.separator,
                      paddingHorizontal: designTokens.spacing.lg,
                    }}>
                      <Text
                        style={{
                          fontSize: designTokens.typography.title1.fontSize,
                          fontWeight: designTokens.typography.title1.fontWeight,
                          color: colors.textPrimary,
                          marginBottom: 2,
                        } as any}
                      >
                        {teacherStats.examsCreated}
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.footnote.fontSize,
                        color: colors.textSecondary
                      }}>
                        Exams Created
                      </Text>
                    </View>
                    <View style={{
                      flex: 1,
                      alignItems: 'center',
                      paddingLeft: designTokens.spacing.lg,
                    }}>
                      <Text
                        style={{
                          fontSize: designTokens.typography.title1.fontSize,
                          fontWeight: designTokens.typography.title1.fontWeight,
                          color: colors.textPrimary,
                          marginBottom: 2,
                        } as any}
                      >
                        {teacherStats.pendingGrading}
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.footnote.fontSize,
                        color: colors.textSecondary
                      }}>
                        To Grade
                      </Text>
                    </View>
                  </View>
                </View>
              </ProfileSection>

              {/* Class Performance */}
              <ProfileSection title="Class Performance">
                <View style={{ padding: designTokens.spacing.lg }}>
                  <View style={{ marginBottom: designTokens.spacing.lg }}>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: designTokens.spacing.sm
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textSecondary
                      }}>
                        Average Class Score
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        fontWeight: '500'
                      }}>
                        {teacherStats.averageClassScore}%
                      </Text>
                    </View>
                    <View style={{
                      height: 8,
                      backgroundColor: colors.separator,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <View
                        style={{
                          height: '100%',
                          width: `${teacherStats.averageClassScore}%`,
                          backgroundColor: colors.primary,
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>

                  <View>
                    <View style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      marginBottom: designTokens.spacing.sm
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textSecondary
                      }}>
                        Student Engagement
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        fontWeight: '500'
                      }}>
                        92%
                      </Text>
                    </View>
                    <View style={{
                      height: 8,
                      backgroundColor: colors.separator,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}>
                      <View
                        style={{
                          height: '100%',
                          width: '92%',
                          backgroundColor: '#34C759',
                          borderRadius: 4,
                        }}
                      />
                    </View>
                  </View>
                </View>
              </ProfileSection>
            </>
          ) : (
            <>
              <ProfileSection title="Notification Settings">
                <View style={{ paddingHorizontal: designTokens.spacing.lg }}>
                  <SettingItem
                    title="General Notifications"
                    description="App notifications and updates"
                    value={settings.notifications}
                    onToggle={() => toggleSetting('notifications')}
                  />
                  <SettingItem
                    title="Exam Alerts"
                    description="Exam completion notifications"
                    value={settings.examNotifications}
                    onToggle={() => toggleSetting('examNotifications')}
                  />
                  <SettingItem
                    title="Grading Reminders"
                    description="Pending grading alerts"
                    value={settings.gradingReminders}
                    onToggle={() => toggleSetting('gradingReminders')}
                  />
                </View>
              </ProfileSection>

              {/* System Settings */}
              <ProfileSection title="System Preferences">
                <View style={{ paddingHorizontal: designTokens.spacing.lg }}>
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingVertical: designTokens.spacing.lg,
                    }}
                  >
                    <View style={{ flex: 1, marginRight: designTokens.spacing.md }}>
                      <Text
                        style={{
                          fontSize: designTokens.typography.body.fontSize,
                          color: colors.textPrimary,
                          fontWeight: '400',
                          marginBottom: 2,
                        }}
                      >
                        Dark Mode
                      </Text>
                      <Text
                        style={{
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: colors.textSecondary,
                        }}
                      >
                        Enable dark theme
                      </Text>
                    </View>
                    <Switch
                      value={isDark}
                      onValueChange={toggleTheme}
                      trackColor={{ false: colors.separator, true: colors.primary + '40' }}
                      thumbColor={isDark ? colors.primary : colors.backgroundElevated}
                      ios_backgroundColor={colors.separator}
                    />
                  </View>
                </View>
              </ProfileSection>

              {/* Teacher Tools */}
              <ProfileSection title="Teacher Tools">
                <View>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: designTokens.spacing.lg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.separator,
                    }}
                  >
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.primary,
                      fontWeight: '500'
                    }}>
                      Export Student Data
                    </Text>
                    <Ionicons name="download" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: designTokens.spacing.lg,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.separator,
                    }}
                  >
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.primary,
                      fontWeight: '500'
                    }}>
                      Class Analytics
                    </Text>
                    <Ionicons name="bar-chart" size={20} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: designTokens.spacing.lg,
                    }}
                  >
                    <Text style={{
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.primary,
                      fontWeight: '500'
                    }}>
                      Teaching Resources
                    </Text>
                    <Ionicons name="library" size={20} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </ProfileSection>
            </>
          )}

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
                borderColor: colors.error + '20',
              }}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text
                  style={{
                    fontSize: designTokens.typography.headline.fontSize,
                    color: colors.error,
                    fontWeight: '600',
                  }}
                >
                  Sign Out
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}
