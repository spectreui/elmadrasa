// app/(admin)/assign-teachers.tsx - Updated with copyable join codes
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, ActivityIndicator, ToastAndroid } from 'react-native';
import { router } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '@/contexts/ThemeContext';
import Toast from 'react-native-toast-message';

export default function AssignTeachersScreen() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedLevel, setSelectedLevel] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedClassSubject, setSelectedClassSubject] = useState<{ classId: string, subjectId: string } | null>(null);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [removingAssignment, setRemovingAssignment] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const { colors, isDark } = useThemeContext();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);

      const [
        levelsRes,
        classesRes,
        subjectsRes,
        teachersRes,
        assignmentsRes
      ] = await Promise.all([
        apiService.getLevels(),
        apiService.getClasses(),
        apiService.getSubjects(),
        apiService.getUsersByRole('teacher'),
        apiService.getTeacherAssignments(),
      ]);

      // Extract data safely - handle different response structures
      const levelsData = Array.isArray(levelsRes.data) ? levelsRes.data :
        (levelsRes.data?.data && Array.isArray(levelsRes.data.data) ? levelsRes.data.data : []);

      const classesData = Array.isArray(classesRes.data) ? classesRes.data :
        (classesRes.data?.data && Array.isArray(classesRes.data.data) ? classesRes.data.data : []);

      const subjectsData = Array.isArray(subjectsRes.data) ? subjectsRes.data :
        (subjectsRes.data?.data && Array.isArray(subjectsRes.data.data) ? subjectsRes.data.data : []);

      const teachersData = Array.isArray(teachersRes.data) ? teachersRes.data :
        (teachersRes.data?.data && Array.isArray(teachersRes.data.data) ? teachersRes.data.data : []);

      const assignmentsData = Array.isArray(assignmentsRes.data) ? assignmentsRes.data :
        (assignmentsRes.data?.data && Array.isArray(assignmentsRes.data.data) ? assignmentsRes.data.data : []);

      setLevels(levelsData);
      setClasses(classesData);
      setSubjects(subjectsData);
      setTeachers(teachersData);
      setAssignments(assignmentsData);

      console.log('📊 Loaded data:', {
        levels: levelsData.length,
        classes: classesData.length,
        subjects: subjectsData.length,
        teachers: teachersData.length,
        assignments: assignmentsData.length
      });

      // Auto-select first level if available
      if (levelsData.length > 0 && !selectedLevel) {
        setSelectedLevel(levelsData[0].id);
      }

    } catch (error) {
      console.error('❌ Failed to load data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const getClassesForLevel = (levelId: string | null) => {
    // Ensure classes is an array
    const safeClasses = Array.isArray(classes) ? classes : [];
    if (!levelId) return safeClasses; // Return all classes if no level selected
    return safeClasses.filter(c => c?.level_id === levelId);
  };

  const getSubjectsForLevel = (levelId: string | null) => {
    // Ensure subjects is an array
    const safeSubjects = Array.isArray(subjects) ? subjects : [];
    if (!levelId) return safeSubjects; // Return all subjects if no level selected
    return safeSubjects.filter(s => s?.level_id === levelId);
  };

  const getAssignmentForClassSubject = (classId: string, subjectId: string) => {
    // Ensure assignments is an array
    const safeAssignments = Array.isArray(assignments) ? assignments : [];
    return safeAssignments.find(a => a?.class_id === classId && a?.subject_id === subjectId);
  };

  const handleAssignTeacher = (classId: string, subjectId: string) => {
    setSelectedClassSubject({ classId, subjectId });
    setShowTeacherModal(true);
  };

  const confirmAssignment = async (teacherId: string) => {
    if (!selectedClassSubject) return;

    try {
      const response = await apiService.assignTeacherToClass({
        teacher_id: teacherId,
        class_id: selectedClassSubject.classId,
        subject_id: selectedClassSubject.subjectId,
      });

      // Handle both response structures
      const success = response.data?.success || response.success;
      if (success) {
        Alert.alert('Success', 'Teacher assigned successfully!');
        setShowTeacherModal(false);
        setSelectedClassSubject(null);
        loadData();
      } else {
        throw new Error(response.data?.error || response.error || 'Failed to assign teacher');
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to assign teacher');
    }
  };

  const handleRemoveAssignment = async (assignmentId: string, teacherName: string, subjectName: string, className: string) => {
    Alert.alert(
      'Remove Assignment',
      `Remove ${teacherName} from ${subjectName} in ${className}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setRemovingAssignment(assignmentId);
              const response = await apiService.removeTeacherAssignment(assignmentId);

              // Handle both response structures
              const success = response.data?.success || response.success;
              if (success) {
                Alert.alert('Success', 'Assignment removed successfully');
                loadData();
              } else {
                throw new Error(response.data?.error || response.error || 'Failed to remove assignment');
              }
            } catch (error: any) {
              console.error('Remove assignment error:', error);
              Alert.alert('Error', error.response?.data?.error || error.message || 'Failed to remove assignment');
            } finally {
              setRemovingAssignment(null);
            }
          }
        }
      ]
    );
  };

  const copyToClipboard = async (code: string) => {
    try {
      await Clipboard.setStringAsync(code);
      setCopiedCode(code);

      Toast.show({
        type: 'success',
        text1: 'Code copied to clipboard!'
      });

      // Reset copied state after 2 seconds
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
      Alert.alert('Error', 'Failed to copy code');
    }
  };

  // Ensure data is always an array for rendering
  const safeClasses = Array.isArray(classes) ? classes : [];
  const safeSubjects = Array.isArray(subjects) ? subjects : [];
  const safeLevels = Array.isArray(levels) ? levels : [];

  const levelClasses = selectedLevel ? getClassesForLevel(selectedLevel) : safeClasses;
  const levelSubjects = selectedLevel ? getSubjectsForLevel(selectedLevel) : safeSubjects;

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
          Loading assignments...
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
          marginBottom: designTokens.spacing.md
        }}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={{
              padding: designTokens.spacing.sm,
              marginRight: designTokens.spacing.md,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: colors.backgroundElevated,
            }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.primary} />
          </TouchableOpacity>
          <View>
            <Text style={{
              fontSize: designTokens.typography.title1.fontSize,
              fontWeight: designTokens.typography.title1.fontWeight,
              color: colors.textPrimary,
            } as any}>
              Assign Teachers
            </Text>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textSecondary,
            }}>
              Link teachers to classes and subjects
            </Text>
          </View>
        </View>

        {/* Level Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginVertical: designTokens.spacing.md }}
          contentContainerStyle={{ alignItems: 'center' }}
        >
          {safeLevels.map(level => (
            <TouchableOpacity
              key={level.id}
              onPress={() => setSelectedLevel(level.id)}
              style={{
                paddingHorizontal: designTokens.spacing.lg,
                paddingVertical: designTokens.spacing.md,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: selectedLevel === level.id
                  ? colors.primary
                  : isDark ? '#374151' : '#e5e7eb',
                marginRight: designTokens.spacing.sm,
                minWidth: 80,
                alignItems: 'center',
              }}
            >
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: selectedLevel === level.id ? '#ffffff' : colors.textPrimary,
              }}>
                {level.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: designTokens.spacing.xl }}
      >
        {levelClasses.map(classItem => (
          <View key={classItem.id} style={{ marginBottom: designTokens.spacing.xxl }}>
            <Text style={{
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.lg,
            } as any}>
              {classItem.name}
            </Text>

            <View style={{ gap: designTokens.spacing.md }}>
              {levelSubjects.map(subject => {
                const assignment = getAssignmentForClassSubject(classItem.id, subject.id);

                return (
                  <View
                    key={subject.id}
                    style={{
                      padding: designTokens.spacing.lg,
                      borderRadius: designTokens.borderRadius.xl,
                      backgroundColor: colors.backgroundElevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                      ...designTokens.shadows.sm,
                    }}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                    }}>
                      <View style={{
                        flexDirection: 'row',
                        alignItems: 'flex-start',
                        flex: 1,
                        minWidth: 0,
                      }}>
                        <View style={{
                          width: 44,
                          height: 44,
                          borderRadius: designTokens.borderRadius.lg,
                          backgroundColor: colors.primary + '15',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginRight: designTokens.spacing.md,
                          flexShrink: 0,
                        }}>
                          <Ionicons name="book" size={20} color={colors.primary} />
                        </View>
                        <View style={{
                          flex: 1,
                          minWidth: 0,
                        }}>
                          <Text
                            style={{
                              fontSize: designTokens.typography.headline.fontSize,
                              fontWeight: designTokens.typography.headline.fontWeight,
                              color: colors.textPrimary,
                              marginBottom: 4,
                            } as any}
                            numberOfLines={1}
                            ellipsizeMode="tail"
                          >
                            {subject.name}
                          </Text>
                          {assignment ? (
                            <>
                              <Text
                                style={{
                                  fontSize: designTokens.typography.footnote.fontSize,
                                  color: colors.textSecondary,
                                  marginBottom: 6,
                                }}
                                numberOfLines={1}
                                ellipsizeMode="tail"
                              >
                                {assignment.teacher?.profile?.name || assignment.teacher?.email}
                              </Text>
                              <TouchableOpacity
                                onPress={() => copyToClipboard(assignment.code)}
                                style={{
                                  backgroundColor: '#10b981' + '15',
                                  paddingHorizontal: designTokens.spacing.sm,
                                  paddingVertical: 4,
                                  borderRadius: designTokens.borderRadius.full,
                                  alignSelf: 'flex-start',
                                  flexDirection: 'row',
                                  alignItems: 'center',
                                }}
                              >
                                <Text
                                  style={{
                                    fontSize: designTokens.typography.caption2.fontSize,
                                    color: '#10b981',
                                    fontWeight: '600',
                                    marginRight: 4,
                                  }}
                                  numberOfLines={1}
                                  ellipsizeMode="tail"
                                >
                                  {assignment.code}
                                </Text>
                                <Ionicons
                                  name={copiedCode === assignment.code ? "checkmark" : "copy"}
                                  size={12}
                                  color="#10b981"
                                />
                              </TouchableOpacity>
                            </>
                          ) : (
                            <Text style={{
                              fontSize: designTokens.typography.footnote.fontSize,
                              color: '#f97316',
                            }}>
                              Not assigned
                            </Text>
                          )}
                        </View>
                      </View>

                      {assignment ? (
                        <TouchableOpacity
                          onPress={() => handleRemoveAssignment(
                            assignment.id,
                            assignment.teacher?.profile?.name || assignment.teacher?.email,
                            subject.name,
                            classItem.name
                          )}
                          disabled={removingAssignment === assignment.id}
                          style={{
                            padding: designTokens.spacing.sm,
                            borderRadius: designTokens.borderRadius.lg,
                            backgroundColor: '#ef4444' + '15',
                            marginLeft: designTokens.spacing.sm,
                            flexShrink: 0,
                          }}
                        >
                          {removingAssignment === assignment.id ? (
                            <ActivityIndicator size="small" color="#ef4444" />
                          ) : (
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          )}
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => handleAssignTeacher(classItem.id, subject.id)}
                          style={{
                            padding: designTokens.spacing.sm,
                            borderRadius: designTokens.borderRadius.lg,
                            backgroundColor: colors.primary + '15',
                            marginLeft: designTokens.spacing.sm,
                            flexShrink: 0,
                          }}
                        >
                          <Ionicons name="add" size={16} color={colors.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Teacher Selection Modal */}
      <Modal visible={showTeacherModal} animationType="slide" presentationStyle="pageSheet">
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            padding: designTokens.spacing.xl,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}>
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <Text style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
              } as any}>
                Select Teacher
              </Text>
              <TouchableOpacity onPress={() => setShowTeacherModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView contentContainerStyle={{ padding: designTokens.spacing.xl, gap: designTokens.spacing.sm }}>
            {Array.isArray(teachers) && teachers.map(teacher => (
              <TouchableOpacity
                key={teacher.id}
                onPress={() => confirmAssignment(teacher.id)}
                style={{
                  padding: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  backgroundColor: colors.backgroundElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                  flexDirection: 'row',
                  alignItems: 'center',
                  ...designTokens.shadows.sm,
                }}
              >
                <View style={{
                  width: 40,
                  height: 40,
                  borderRadius: designTokens.borderRadius.full,
                  backgroundColor: isDark ? '#374151' : '#e5e7eb',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: designTokens.spacing.md,
                  flexShrink: 0,
                }}>
                  <Ionicons name="person" size={20} color={colors.textSecondary} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text
                    style={{
                      fontSize: designTokens.typography.headline.fontSize,
                      fontWeight: designTokens.typography.headline.fontWeight,
                      color: colors.textPrimary,
                      marginBottom: 2,
                    } as any}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {teacher.profile?.name || teacher.email}
                  </Text>
                  <Text
                    style={{
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary,
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {teacher.email}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
