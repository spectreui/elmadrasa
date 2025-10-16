// app/(teacher)/profile.tsx - RTL SUPPORT ADDED
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Dimensions,
  I18nManager
} from 'react-native';
import { Alert } from '@/utils/UniversalAlert';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { useLanguage } from '../../src/contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import Animated, { FadeInUp, Layout } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

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
  const { language, setLanguage, isRTL, t } = useLanguage();
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
      t('auth.logOut'),
      t('auth.logOutConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('auth.logOut'),
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              router.push('/(auth)/login');
            } catch (error) {
              console.error('Logout error:', error);
              Alert.alert(t('common.error'), t('profile.logoutError'));
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

  const toggleLanguage = () => {
    const newLanguage = language === 'en' ? 'ar' : 'en';
    setLanguage(newLanguage);
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onToggle,
    icon
  }: {
    title: string;
    description: string;
    value: boolean;
    onToggle: () => void;
    icon?: string;
  }) => (
    <Animated.View
      style={[styles.settingItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
      entering={FadeInUp}
      layout={Layout.springify()}
    >
      {icon && (
        <View style={[
          styles.settingIcon,
          { backgroundColor: colors.primary + '15' }
        ]}>
          <Ionicons name={icon as any} size={20} color={colors.primary} />
        </View>
      )}
      <View style={[
        styles.settingContent,
        { 
          marginHorizontal: icon ? designTokens.spacing.md : 0,
          alignItems: isRTL ? 'flex-end' : 'flex-start'
        }
      ]}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.separator, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.backgroundElevated}
        ios_backgroundColor={colors.separator}
        style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
      />
    </Animated.View>
  );

  const ProfileSection = ({ 
    title, 
    children,
    showDivider = true
  }: { 
    title: string; 
    children: React.ReactNode;
    showDivider?: boolean;
  }) => (
    <Animated.View 
      style={styles.profileSection}
      entering={FadeInUp.duration(400)}
      layout={Layout.springify()}
    >
      <Text
        style={[
          styles.sectionTitle,
          { 
            color: colors.textPrimary,
            textAlign: isRTL ? 'right' : 'left'
          }
        ]}
      >
        {title}
      </Text>
      <View
        style={[
          styles.sectionCard,
          {
            backgroundColor: colors.backgroundElevated,
            ...designTokens.shadows.sm,
          }
        ]}
      >
        {children}
        {showDivider && (
          <View style={[styles.sectionDivider, { backgroundColor: colors.separator }]} />
        )}
      </View>
    </Animated.View>
  );

  const StatCard = ({ 
    title, 
    value, 
    icon, 
    color 
  }: { 
    title: string; 
    value: string | number; 
    icon: string; 
    color: string;
  }) => (
    <View style={[styles.statCard, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
      <View style={[
        styles.statIconContainer,
        { backgroundColor: color + '15' }
      ]}>
        <Ionicons name={icon as any} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
        {title}
      </Text>
    </View>
  );

  const ProgressBar = ({ 
    title, 
    value, 
    color 
  }: { 
    title: string; 
    value: number; 
    color: string;
  }) => (
    <View style={[styles.progressBarContainer, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
      <View style={[styles.progressHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.progressTitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
          {title}
        </Text>
        <Text style={[styles.progressValue, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
          {value}%
        </Text>
      </View>
      <View style={[
        styles.progressBarTrack,
        { backgroundColor: colors.separator }
      ]}>
        <Animated.View 
          style={[
            styles.progressBarFill,
            { 
              backgroundColor: color,
              width: `${value}%`,
              alignSelf: isRTL ? 'flex-end' : 'flex-start'
            }
          ]}
          entering={FadeInUp.delay(300)}
        />
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[
        styles.header,
        { 
          flexDirection: isRTL ? 'row-reverse' : 'row'
        }
      ]}>
        <Text
          style={[
            styles.headerTitle,
            { 
              color: colors.textPrimary,
              textAlign: isRTL ? 'right' : 'left'
            }
          ]}
        >
          {t('profile.title')}
        </Text>

        {/* Action Buttons */}
        <View style={[
          styles.headerActions,
          { 
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }
        ]}>
          <TouchableOpacity
            onPress={toggleLanguage}
            style={[
              styles.actionButton,
              { backgroundColor: colors.backgroundElevated }
            ]}
          >
            <Ionicons
              name={language === 'en' ? 'language' : 'globe'}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
          
          <TouchableOpacity
            onPress={toggleTheme}
            style={[
              styles.actionButton,
              { backgroundColor: colors.backgroundElevated }
            ]}
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={20}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View
        style={[
          styles.tabContainer,
          { 
            backgroundColor: colors.separator,
            flexDirection: isRTL ? 'row-reverse' : 'row'
          }
        ]}
      >
        {([
          { key: 'profile', label: t('profile.title'), icon: 'person' },
          { key: 'settings', label: t('profile.settings'), icon: 'settings' },
        ] as const).map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tab,
              {
                backgroundColor: activeTab === tab.key ? colors.backgroundElevated : 'transparent',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }
            ]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text
              style={[
                styles.tabText,
                {
                  color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                  marginHorizontal: designTokens.spacing.xs
                }
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        entering={FadeInUp.duration(300)}
      >
        <View style={styles.contentPadding}>
          {activeTab === 'profile' ? (
            <>
              {/* Profile Header */}
              <ProfileSection title={t('profile.teacherInfo')} showDivider={false}>
                <View style={[styles.profileHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[
                    styles.avatarContainer,
                    { backgroundColor: colors.primary + '15' }
                  ]}>
                    <Text style={[
                      styles.avatarText,
                      { color: colors.primary }
                    ]}>
                      {user?.profile?.name?.charAt(0) || 'T'}
                    </Text>
                  </View>
                  <View style={[
                    styles.profileInfo,
                    { alignItems: isRTL ? 'flex-end' : 'flex-start' }
                  ]}>
                    <Text
                      style={[
                        styles.profileName,
                        { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }
                      ]}
                    >
                      {user?.profile?.name || t('profile.teacher')}
                    </Text>
                    <View style={[
                      styles.statusBadge,
                      { 
                        backgroundColor: '#34C75915',
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }
                    ]}>
                      <View style={styles.statusIndicator} />
                      <Text style={[styles.statusText, { textAlign: isRTL ? 'right' : 'left' }]}>
                        {t('common.active')}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={[styles.profileDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <View style={[
                    styles.detailRow,
                    { 
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }
                  ]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('profile.teacherId')}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {user?.teacher_id || t('profile.notSet')}
                    </Text>
                  </View>
                  <View style={[
                    styles.detailRow,
                    { 
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                      }
                  ]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('profile.email')}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {user?.email}
                    </Text>
                  </View>
                  <View style={[
                    styles.detailRow,
                    { 
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                      }
                  ]}>
                    <Text style={[styles.detailLabel, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('profile.accountCreated')}
                    </Text>
                    <Text style={[styles.detailValue, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {user?.created_at ? new Date(user.created_at).toLocaleDateString(language === 'ar' ? 'ar-eg' : 'en-US') : t('profile.na')}
                    </Text>
                  </View>
                </View>
              </ProfileSection>

              {/* Teaching Stats */}
              <ProfileSection title={t('profile.teachingOverview')}>
                <View style={[styles.statsContainer, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <StatCard
                    title={t('dashboard.students')}
                    value={teacherStats.totalStudents}
                    icon="people"
                    color="#3B82F6"
                  />
                  <StatCard
                    title={t('profile.examsCreated')}
                    value={teacherStats.examsCreated}
                    icon="document-text"
                    color="#8B5CF6"
                  />
                  <StatCard
                    title={t('profile.toGrade')}
                    value={teacherStats.pendingGrading}
                    icon="clipboard"
                    color="#F59E0B"
                  />
                </View>
              </ProfileSection>

              {/* Class Performance */}
              <ProfileSection title={t('profile.classPerformance')}>
                <View style={styles.performanceContainer}>
                  <ProgressBar
                    title={t('profile.averageScore')}
                    value={teacherStats.averageClassScore}
                    color={colors.primary}
                  />
                  <ProgressBar
                    title={t('profile.studentEngagement')}
                    value={92}
                    color="#10B981"
                  />
                </View>
              </ProfileSection>
            </>
          ) : (
            <>
              <ProfileSection title={t('notifications.settings')}>
                <View style={styles.settingsContainer}>
                  <SettingItem
                    title={t('notifications.general')}
                    description={t('notifications.generalDesc')}
                    value={settings.notifications}
                    onToggle={() => toggleSetting('notifications')}
                    icon="notifications"
                  />
                </View>
              </ProfileSection>

              {/* System Settings */}
              <ProfileSection title={t('system.preferences')}>
                <View style={styles.settingsContainer}>
                  <SettingItem
                    title={t('system.darkMode')}
                    description={t('system.darkModeDesc')}
                    value={isDark}
                    onToggle={toggleTheme}
                    icon={isDark ? "sunny" : "moon"}
                  />
                  <SettingItem
                    title={t('profile.language')}
                    description={language === 'en' ? 'English' : 'العربية'}
                    value={true}
                    onToggle={toggleLanguage}
                    icon="language"
                  />
                </View>
              </ProfileSection>

              {/* Teacher Tools */}
              <ProfileSection title={t('tools.title')}>
                <View>
                  <TouchableOpacity
                    style={[
                      styles.toolItem,
                      { 
                        borderBottomColor: colors.separator,
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }
                    ]}
                  >
                    <Ionicons name="download" size={20} color={colors.primary} />
                    <Text style={[styles.toolText, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('tools.exportData')}
                    </Text>
                    <Ionicons 
                      name={isRTL ? "chevron-back" : "chevron-forward"} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toolItem,
                      { 
                        borderBottomColor: colors.separator,
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }
                    ]}
                  >
                    <Ionicons name="bar-chart" size={20} color={colors.primary} />
                    <Text style={[styles.toolText, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('tools.classAnalytics')}
                    </Text>
                    <Ionicons 
                      name={isRTL ? "chevron-back" : "chevron-forward"} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.toolItem,
                      { 
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }
                    ]}
                  >
                    <Ionicons name="library" size={20} color={colors.primary} />
                    <Text style={[styles.toolText, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {t('tools.teachingResources')}
                    </Text>
                    <Ionicons 
                      name={isRTL ? "chevron-back" : "chevron-forward"} 
                      size={20} 
                      color={colors.primary} 
                    />
                  </TouchableOpacity>
                </View>
              </ProfileSection>
            </>
          )}

          {/* Logout Button */}
          <Animated.View 
            style={styles.logoutContainer}
            entering={FadeInUp.delay(500)}
          >
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loading}
              style={[
                styles.logoutButton,
                { 
                  backgroundColor: colors.error + '10',
                  borderColor: colors.error + '20'
                }
              ]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={[styles.logoutText, { color: colors.error, textAlign: isRTL ? 'right' : 'left' }]}>
                  {t('auth.logOut')}
                </Text>
              )}
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: designTokens.spacing.xxxl,
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: designTokens.typography.largeTitle.fontSize,
    fontWeight: designTokens.typography.largeTitle.fontWeight,
  } as any,
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...designTokens.shadows.sm,
  },
  tabContainer: {
    marginHorizontal: designTokens.spacing.xl,
    borderRadius: designTokens.borderRadius.full,
    padding: 2,
    marginBottom: designTokens.spacing.lg,
  },
  tab: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.full,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: designTokens.spacing.xs,
  },
  tabText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  contentPadding: {
    paddingBottom: designTokens.spacing.xxxl,
  },
  profileSection: {
    marginBottom: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.xl,
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginBottom: designTokens.spacing.md,
  } as any,
  sectionCard: {
    borderRadius: designTokens.borderRadius.xxl,
    overflow: 'hidden',
    borderWidth: 0.5,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  sectionDivider: {
    height: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    padding: designTokens.spacing.lg,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: designTokens.spacing.lg,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginBottom: 2,
  } as any,
  profileClass: {
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: designTokens.spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    marginHorizontal: 4,
  },
  statusText: {
    fontSize: designTokens.typography.caption1.fontSize,
    color: '#34C759',
    fontWeight: '600',
  },
  profileDetails: {
    padding: designTokens.spacing.lg,
    borderTopWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md,
    width: '100%',
  },
  detailLabel: {
    fontSize: designTokens.typography.body.fontSize,
  },
  detailValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: designTokens.spacing.lg,
    gap: designTokens.spacing.sm,
  },
  statCard: {
    flex: 1,
    padding: designTokens.spacing.md,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: designTokens.spacing.sm,
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginBottom: 2,
  } as any,
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
  },
  performanceContainer: {
    padding: designTokens.spacing.lg,
  },
  progressBarContainer: {
    marginBottom: designTokens.spacing.lg,
    width: '100%',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.xs,
    width: '100%',
  },
  progressTitle: {
    fontSize: designTokens.typography.body.fontSize,
  },
  progressValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  progressBarTrack: {
    height: 8,
    borderRadius: designTokens.borderRadius.full,
    overflow: 'hidden',
    width: '100%',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: designTokens.borderRadius.full,
  },
  settingsContainer: {
    paddingHorizontal: designTokens.spacing.lg,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.lg,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: designTokens.spacing.md,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: designTokens.typography.footnote.fontSize,
  },
  toolItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: designTokens.spacing.lg,
    borderBottomWidth: 1,
  },
  toolText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
    flex: 1,
    marginHorizontal: designTokens.spacing.md,
  },
  logoutContainer: {
    paddingHorizontal: designTokens.spacing.xl,
    marginTop: designTokens.spacing.xl,
  },
  logoutButton: {
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
  },
});
