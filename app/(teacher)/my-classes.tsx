// app/(teacher)/my-classes.tsx - Updated with Full Dark Mode Support
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';

export default function MyClassesScreen() {
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
        apiService.getTeacherJoinCodes(),
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
    const foundCode = joinCodes.find(code => {
      return code.class_id === classId && code.subject_id === subjectId;
    });
    
    return foundCode;
  };

  const copyJoinCode = async (joinCodeData: any) => {
    try {
      const codeToCopy = joinCodeData.code || joinCodeData.join_code || joinCodeData;
      
      if (!codeToCopy) {
        Alert.alert('Error', 'No join code found to copy');
        return;
      }

      await Clipboard.setStringAsync(codeToCopy);
      Alert.alert(
        'Join Code Copied!', 
        `Code: ${codeToCopy}\n\nShare this with your students.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      Alert.alert('Error', 'Failed to copy join code to clipboard');
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading your classes...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
          My Classes
        </Text>
        <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
          Classes and subjects you teach
        </Text>
      </View>

      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.classesList}>
          {teacherClasses.length === 0 ? (
            <View style={[styles.emptyState, { backgroundColor: colors.background }]}>
              <Ionicons name="school" size={64} color={colors.textTertiary} />
              <Text style={[styles.emptyTitle, { color: colors.textSecondary }]}>
                No classes assigned
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
                Contact your administrator to get assigned to classes and subjects.
              </Text>
            </View>
          ) : (
            teacherClasses.map(classItem => (
              <View key={classItem.id} style={styles.classSection}>
                <Text style={[styles.className, { color: colors.textPrimary }]}>
                  {classItem.class_name}
                </Text>
                
                {/* Subjects for this class */}
                <View style={styles.subjectsList}>
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
                        <View style={styles.subjectHeader}>
                          <View style={styles.subjectInfo}>
                            <View 
                              style={[styles.subjectIcon, { backgroundColor: subject.color || colors.primary }]}
                            >
                              <Ionicons 
                                name={subject.icon || 'book'} 
                                size={20} 
                                color="white" 
                              />
                            </View>
                            <View style={styles.subjectDetails}>
                              <Text style={[styles.subjectName, { color: colors.textPrimary }]}>
                                {subject.name}
                              </Text>
                              <Text style={[styles.subjectClass, { color: colors.textSecondary }]}>
                                {classItem.class_name}
                              </Text>
                            </View>
                          </View>
                        </View>

                        {joinCode ? (
                          <TouchableOpacity
                            onPress={() => copyJoinCode(joinCode)}
                            style={[styles.joinCodeContainer, { backgroundColor: `${colors.primary}15` }]}
                            activeOpacity={0.7}
                          >
                            <View style={styles.joinCodeInfo}>
                              <Text style={[styles.joinCodeLabel, { color: colors.primary }]}>
                                Join Code
                              </Text>
                              <Text style={[styles.joinCodeValue, { color: colors.primary }]}>
                                {joinCode.code || joinCode.join_code || 'No code available'}
                              </Text>
                              <Text style={[styles.joinCodeHint, { color: colors.primary }]}>
                                Tap to copy and share with students
                              </Text>
                            </View>
                            <View style={[styles.copyButton, { backgroundColor: colors.primary }]}>
                              <Ionicons name="copy" size={18} color="white" />
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <View style={[styles.noCodeContainer, { backgroundColor: colors.background }]}>
                            <Text style={[styles.noCodeText, { color: colors.textSecondary }]}>
                              No join code available
                            </Text>
                            <Text style={[styles.noCodeDetails, { color: colors.textTertiary }]}>
                              Class ID: {classItem.class_id}, Subject ID: {subject.id}
                            </Text>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  loadingText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.xxl,
    textAlign: 'center',
  },
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xs,
  },
  headerSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  classesList: {
    padding: designTokens.spacing.xl,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xxxl,
  },
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs,
  },
  emptySubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
  },
  classSection: {
    marginBottom: designTokens.spacing.xxl,
  },
  className: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.lg,
  },
  subjectsList: {
    gap: designTokens.spacing.md,
  },
  subjectCard: {
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...designTokens.shadows.sm,
  },
  subjectHeader: {
    padding: designTokens.spacing.lg,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md,
  },
  subjectDetails: {
    flex: 1,
  },
  subjectName: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs,
  },
  subjectClass: {
    fontSize: designTokens.typography.caption1.fontSize,
  },
  joinCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: designTokens.spacing.lg,
  },
  joinCodeInfo: {
    flex: 1,
  },
  joinCodeLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs,
  },
  joinCodeValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    fontFamily: 'monospace',
    marginBottom: designTokens.spacing.xxs,
  },
  joinCodeHint: {
    fontSize: designTokens.typography.caption2.fontSize,
  },
  copyButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: designTokens.spacing.md,
  },
  noCodeContainer: {
    padding: designTokens.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'transparent',
  },
  noCodeText: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.xxs,
  },
  noCodeDetails: {
    fontSize: designTokens.typography.caption2.fontSize,
    textAlign: 'center',
  },
};
