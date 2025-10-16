// app/(teacher)/my-classes.tsx - RTL SUPPORT ADDED
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Alert } from '@/utils/UniversalAlert';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import { useTranslation } from "@/hooks/useTranslation";

export default function MyClassesScreen() {
  const { t, isRTL } = useTranslation();
  const { user } = useAuth();
  const [teacherClasses, setTeacherClasses] = useState<any[]>([]);
  const [joinCodes, setJoinCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors } = useThemeContext();

  useEffect(() => {
    loadTeacherClasses();
  }, []);

  const loadTeacherClasses = async () => {
    try {
      const [classesRes, codesRes] = await Promise.all([
        apiService.getTeacherClasses(),
        apiService.getTeacherJoinCodes()
      ]);

      setTeacherClasses(classesRes.data.data || []);
      setJoinCodes(codesRes.data.data || []);
    } catch (error) {
      console.error('Failed to load teacher classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getJoinCodeForClassSubject = (classId: string, subjectId: string) => {
    const foundCode = joinCodes.find((code) => {
      return code.class_id === classId && code.subject_id === subjectId;
    });

    return foundCode;
  };

  const copyJoinCode = async (joinCodeData: any) => {
    try {
      const codeToCopy = joinCodeData.code || joinCodeData.join_code || joinCodeData;

      if (!codeToCopy) {
        Alert.alert(t('common.error'), t('classes.noCode'));
        return;
      }

      await Clipboard.setStringAsync(codeToCopy);
      Alert.alert(
        t('classes.codeCopied'),
        `${t('classes.joinCode')}: ${codeToCopy}`,
        [{ text: t('common.ok') }]
      );
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert(t('common.error'), t('classes.failed'));
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t("common.loading")}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{t("classes.myClasses")}</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t("classes.subtitle")}</Text>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.classesList}>
          {teacherClasses.length === 0 ?
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <Ionicons name="school" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>{t("classes.none")}</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>{t("classes.noneMessage")}</Text>
            </View> :

            teacherClasses.map((classItem) =>
              <View key={classItem.id} style={styles.classSection}>
                <Text style={[styles.className, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                  {classItem.class_name}
                </Text>
                
                {/* Subjects for this class */}
                <View style={[styles.subjectsList, { flexDirection: isRTL ? 'column-reverse' : 'column' }]}>
                  {classItem.subjects.map((subject: any) => {
                    const joinCode = getJoinCodeForClassSubject(classItem.class_id, subject.id);

                    return (
                      <View
                        key={subject.id}
                        style={[styles.subjectCard, {
                          backgroundColor: colors.backgroundElevated,
                          borderColor: colors.border
                        }]}
                      >
                        <View style={[styles.subjectHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={[styles.subjectInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View
                              style={[styles.subjectIcon, { backgroundColor: subject.color || colors.primary }]}
                            >
                              <Ionicons
                                name={subject.icon || 'book'}
                                size={20}
                                color="white"
                              />
                            </View>
                            <View style={[styles.subjectDetails, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                              <Text style={[styles.subjectName, { color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }]}>
                                {subject.name}
                              </Text>
                              <Text style={[styles.subjectClass, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                                {classItem.class_name}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {joinCode ?
                          <TouchableOpacity
                            onPress={() => copyJoinCode(joinCode)}
                            style={[styles.joinCodeContainer, { backgroundColor: `${colors.primary}15`, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                            activeOpacity={0.7}
                          >
                            <View style={[styles.joinCodeInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                              <Text style={[styles.joinCodeLabel, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t("classes.joinCode")}</Text>
                              <Text style={[styles.joinCodeValue, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>
                                {joinCode.code || joinCode.join_code || t('classes.noCodeAvailable')}
                              </Text>
                              <Text style={[styles.joinCodeHint, { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{t("classes.tapToCopy")}</Text>
                            </View>
                            <View style={[styles.copyButton, { backgroundColor: colors.primary }]}>
                              <Ionicons name="copy" size={18} color="white" />
                            </View>
                          </TouchableOpacity> :

                          <View style={[styles.noCodeContainer, { backgroundColor: colors.background }]}>
                            <Text style={[styles.noCodeText, { color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{t("classes.noCode")}</Text>
                            <Text style={[styles.noCodeDetails, { color: colors.textTertiary, textAlign: isRTL ? 'right' : 'left' }]}>
                              {t("classes.classId")}: {classItem.class_id}, {t("classes.subjectId")}: {subject.id}
                            </Text>
                          </View>
                        }
                      </View>
                    );
                  })}
                </View>
              </View>
            )
          }
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1
  } as any,
  loadingText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.xxl,
    textAlign: 'center'
  } as any,
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
    borderBottomWidth: 1
  } as any,
  headerTitle: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xs
  } as any,
  headerSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500'
  } as any,
  content: {
    flex: 1
  } as any,
  classesList: {
    padding: designTokens.spacing.xl
  } as any,
  emptyState: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xxxl
  } as any,
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs
  } as any,
  emptySubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center'
  } as any,
  classSection: {
    marginBottom: designTokens.spacing.xxl
  } as any,
  className: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.lg
  } as any,
  subjectsList: {
    gap: designTokens.spacing.md
  } as any,
  subjectCard: {
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...designTokens.shadows.sm
  } as any,
  subjectHeader: {
    padding: designTokens.spacing.lg
  } as any,
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  } as any,
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: designTokens.spacing.md
  } as any,
  subjectDetails: {
    flex: 1
  } as any,
  subjectName: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs
  } as any,
  subjectClass: {
    fontSize: designTokens.typography.caption1.fontSize
  } as any,
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designTokens.spacing.lg
  } as any,
  joinCodeInfo: {
    flex: 1
  } as any,
  joinCodeLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs
  } as any,
  joinCodeValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: designTokens.spacing.xxs
  } as any,
  joinCodeHint: {
    fontSize: designTokens.typography.caption2.fontSize
  } as any,
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: designTokens.spacing.md
  } as any,
  noCodeContainer: {
    padding: designTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'transparent'
  } as any,
  noCodeText: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xxs
  } as any,
  noCodeDetails: {
    fontSize: designTokens.typography.caption2.fontSize,
    textAlign: 'center'
  } as any
};
