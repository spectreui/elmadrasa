// app/(student)/profile.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  I18nManager
} from 'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useTranslation } from "@/hooks/useTranslation";

export default function ProfileScreen() {
  const { t, isRTL } = useTranslation();
  const { user, logout } = useAuth();
  const { fontFamily, colors, isDark, toggleTheme } = useThemeContext();
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
      t("auth.logOut"),
      t("auth.logOutConfirm"),
      [
        { text: t("common.cancel"), style: 'cancel' },
        {
          text: t("auth.logOut"),
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
        }
      ]
    );
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const SettingItem = ({ 
    title, 
    description, 
    value, 
    onToggle 
  }: { 
    title: string; 
    description: string; 
    value: boolean; 
    onToggle: () => void; 
  }) => (
    <View style={[styles.settingItem, { 
      borderBottomColor: colors.separator,
      flexDirection: isRTL ? 'row-reverse' : 'row'
    }]}>
      <View style={{ flex: 1, [isRTL ? 'marginLeft' : 'marginRight']: designTokens.spacing.md }}>
        <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
          {title}
        </Text>
        <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
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
    <View style={styles.profileSection}>
      <Text style={[styles.sectionTitle, { 
        color: colors.textPrimary,
        paddingHorizontal: designTokens.spacing.xl,
        textAlign: isRTL ? 'right' : 'left'
      }]}>
        {title}
      </Text>
      <View style={[styles.sectionContainer, { 
        backgroundColor: colors.backgroundElevated,
        marginHorizontal: designTokens.spacing.xl,
        ...designTokens.shadows.sm
      }]}>
        {children}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={[styles.header, { 
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          {t("profile.title")}
        </Text>
        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.themeToggle, { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm }]}
        >
          <Ionicons
            name={isDark ? "sunny" : "moon"}
            size={24}
            color={colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      {/* Tab Navigation */}
      <View style={[styles.tabContainer, { 
        backgroundColor: colors.separator,
        marginHorizontal: designTokens.spacing.xl,
        flexDirection: isRTL ? 'row-reverse' : 'row'
      }]}>
        {[
          { key: 'profile', label: t("profile.title"), icon: 'person' },
          { key: 'settings', label: t("profile.settings"), icon: 'settings' }
        ].map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabButton,
              {
                backgroundColor: activeTab === tab.key ? colors.backgroundElevated : 'transparent',
                flexDirection: isRTL ? 'row-reverse' : 'row'
              }
            ]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Ionicons
              name={tab.icon as any}
              size={20}
              color={activeTab === tab.key ? colors.primary : colors.textSecondary}
            />
            <Text style={[
              styles.tabText,
              {
                color: activeTab === tab.key ? colors.primary : colors.textSecondary,
                [isRTL ? 'marginRight' : 'marginLeft']: 4
              }
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        entering={FadeIn.duration(600)}
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
              <ProfileSection title={t("profile.title")}>
                <View style={styles.profileContent}>
                  <View style={[styles.profileHeader, { 
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }]}>
                    <View style={[styles.avatarContainer, { 
                      backgroundColor: colors.primary + '15',
                      [isRTL ? 'marginLeft' : 'marginRight']: designTokens.spacing.lg
                    }]}>
                      <Text style={[styles.avatarText, { 
                        fontFamily,
                        color: colors.primary
                      }]}>
                        {user?.profile?.name?.charAt(0) || 'S'}
                      </Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.userName, { color: colors.textPrimary }]}>
                        {user?.profile?.name || t("common.student")}
                      </Text>
                      <Text style={[styles.userClass, { color: colors.textSecondary }]}>
                        {user?.profile?.class ? `${t("classes.class")} ${user.profile.class}` : t("profile.notSet")}
                      </Text>
                      <View style={[styles.statusContainer, { 
                        backgroundColor: '#34C75915',
                        alignSelf: isRTL ? 'flex-end' : 'flex-start',
                        flexDirection: isRTL ? 'row-reverse' : 'row'
                      }]}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>
                          {user?.is_approved ? t("common.active") : t("common.pending")}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={[styles.infoSection, { 
                    borderTopColor: colors.separator,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }]}>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t("profile.studentId")}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                        {user?.student_id || t("profile.notSet")}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t("profile.email")}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                        {user?.email || t("profile.na")}
                      </Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>
                        {t("profile.accountCreated")}
                      </Text>
                      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>
                        {user?.created_at ? new Date(user.created_at).toLocaleDateString() : t("profile.na")}
                      </Text>
                    </View>
                  </View>
                </View>
              </ProfileSection>

              {profileStats && (
                <ProfileSection title={t("profile.performance")}>
                  <View style={styles.statsContainer}>
                    <View style={[styles.statsRow, { 
                      flexDirection: isRTL ? 'row-reverse' : 'row'
                    }]}>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                          {profileStats.averageScore || '0'}%
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {t("profile.average")}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                          {profileStats.examsCompleted || '0'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {t("profile.completed")}
                        </Text>
                      </View>
                      <View style={styles.statItem}>
                        <Text style={[styles.statValue, { color: colors.textPrimary }]}>
                          #{profileStats.rank || '--'}
                        </Text>
                        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                          {t("profile.rank")}
                        </Text>
                      </View>
                    </View>
                  </View>
                </ProfileSection>
              )}
            </>
          ) : (
            <>
              <ProfileSection title={t("profile.preferences")}>
                <View style={styles.settingsContainer}>
                  <SettingItem
                    title={t("notifications.general")}
                    description={t("notifications.generalDesc")}
                    value={settings.notifications}
                    onToggle={() => toggleSetting('notifications')}
                  />
                </View>
              </ProfileSection>

              <ProfileSection title={t("system.preferences")}>
                <View style={styles.settingsContainer}>
                  <View style={[styles.settingItem, { 
                    borderBottomColor: colors.separator,
                    flexDirection: isRTL ? 'row-reverse' : 'row'
                  }]}>
                    <View style={{ flex: 1, [isRTL ? 'marginLeft' : 'marginRight']: designTokens.spacing.md }}>
                      <Text style={[styles.settingTitle, { color: colors.textPrimary }]}>
                        {t("system.darkMode")}
                      </Text>
                      <Text style={[styles.settingDescription, { color: colors.textSecondary }]}>
                        {t("system.darkModeDesc")}
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
            </>
          )}

          <View style={{ 
            paddingHorizontal: designTokens.spacing.xl,
            marginTop: designTokens.spacing.xl
          }}>
            <TouchableOpacity
              onPress={handleLogout}
              disabled={loading}
              style={[styles.logoutButton, { 
                backgroundColor: colors.error + '10',
                borderColor: colors.error + '20'
              }]}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <Text style={[styles.logoutText, { color: colors.error }]}>
                  {t("auth.logOut")}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingTop: designTokens.spacing.xxxl,
    paddingHorizontal: designTokens.spacing.xl,
    paddingBottom: designTokens.spacing.lg,
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: designTokens.typography.largeTitle.fontSize,
    fontWeight: designTokens.typography.largeTitle.fontWeight,
  },
  themeToggle: {
    padding: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.full,
  },
  tabContainer: {
    borderRadius: designTokens.borderRadius.full,
    padding: 2,
    marginBottom: designTokens.spacing.xl
  },
  tabButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    alignItems: 'center',
    borderRadius: designTokens.borderRadius.full,
    flexDirection: 'row'
  },
  tabText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginTop: 4
  },
  profileSection: {
    marginBottom: designTokens.spacing.xl
  },
  sectionTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight,
    marginBottom: designTokens.spacing.md
  },
  sectionContainer: {
    borderRadius: designTokens.borderRadius.xl,
    overflow: 'hidden'
  },
  profileContent: {
    padding: designTokens.spacing.lg
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: designTokens.spacing.xl
  },
  avatarContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: {
    fontSize: 28,
    fontWeight: '700'
  },
  userName: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight,
    marginBottom: 2
  },
  userClass: {
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: 2
  },
  statusContainer: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full,
    flexDirection: 'row',
    alignItems: 'center'
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759',
    [I18nManager.isRTL ? 'marginLeft' : 'marginRight']: 4
  },
  statusText: {
    fontSize: designTokens.typography.caption1.fontSize,
    color: '#34C759',
    fontWeight: '600'
  },
  infoSection: {
    borderTopWidth: 1,
    paddingTop: designTokens.spacing.lg
  },
  infoRow: {
    marginBottom: designTokens.spacing.md
  },
  infoLabel: {
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: 2
  },
  infoValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500'
  },
  statsContainer: {
    padding: designTokens.spacing.lg
  },
  statsRow: {
    marginBottom: designTokens.spacing.lg
  },
  statItem: {
    flex: 1,
    alignItems: 'center'
  },
  statValue: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight,
    marginBottom: 2
  },
  statLabel: {
    fontSize: designTokens.typography.footnote.fontSize
  },
  settingsContainer: {
    paddingHorizontal: designTokens.spacing.lg
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.lg,
    borderBottomWidth: 1
  },
  settingTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '400',
    marginBottom: 2
  },
  settingDescription: {
    fontSize: designTokens.typography.footnote.fontSize
  },
  logoutButton: {
    padding: designTokens.spacing.lg,
    borderRadius: designTokens.borderRadius.xl,
    alignItems: 'center',
    borderWidth: 1
  },
  logoutText: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600'
  }
});
