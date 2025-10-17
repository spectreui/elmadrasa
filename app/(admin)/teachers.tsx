// app/(admin)/teachers.tsx - Updated to match student design
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '@/contexts/ThemeContext';

export default function TeachersManagementScreen() {
  const [teachers, setTeachers] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [removingAssignment, setRemovingAssignment] = useState<string | null>(null);
  const { fontFamily, colors, isDark } = useThemeContext();
    

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [teachersRes, classesRes, subjectsRes, assignmentsRes] = await Promise.all([
        apiService.getUsersByRole('teacher'),
        apiService.getClasses(),
        apiService.getSubjects(),
        apiService.getTeacherAssignments(),
      ]);

      if (teachersRes.data.success) {
        setTeachers(teachersRes.data.data || []);
      } else {
        throw new Error(teachersRes.data.error || 'Failed to load teachers');
      }

      if (classesRes.data.success) {
        setClasses(classesRes.data.data || []);
      }

      if (subjectsRes.data.success) {
        setSubjects(subjectsRes.data.data || []);
      }

      if (assignmentsRes.data.success) {
        setTeacherAssignments(assignmentsRes.data.data || []);
      }

    } catch (error: any) {
      console.error('Failed to load data:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to load data'
      );
    } finally {
      setLoading(false);
    }
  };

  const getTeacherAssignments = (teacherId: string) => {
    return teacherAssignments.filter(assignment => assignment.teacher_id === teacherId);
  };

  const openAssignmentModal = (teacher: any) => {
    setSelectedTeacher(teacher);
    setSelectedClass('');
    setSelectedSubject('');
    setShowAssignmentModal(true);
  };

  const handleAssignTeacher = async () => {
    if (!selectedTeacher || !selectedClass || !selectedSubject) {
      Alert.alert('Error', 'Please select both class and subject');
      return;
    }

    setAssigning(true);
    try {
      const classObj = classes.find(c => c.id === selectedClass);
      const subjectObj = subjects.find(s => s.id === selectedSubject);

      if (!classObj || !subjectObj) {
        Alert.alert('Error', 'Invalid class or subject selected');
        return;
      }

      const response = await apiService.assignTeacherToClass({
        teacher_id: selectedTeacher.id,
        class_id: selectedClass,
        subject_id: selectedSubject
      });

      if (response.data.success) {
        Alert.alert('Success', `Assigned ${selectedTeacher.profile?.name} to ${subjectObj.name} in ${classObj.name}`);
        setShowAssignmentModal(false);
        setSelectedTeacher(null);
        setSelectedClass('');
        setSelectedSubject('');
        await loadData();
      } else {
        throw new Error(response.data.error || 'Failed to assign teacher');
      }
    } catch (error: any) {
      console.error('Assign teacher error:', error);
      Alert.alert(
        'Error', 
        error.response?.data?.error || error.message || 'Failed to assign teacher'
      );
    } finally {
      setAssigning(false);
    }
  };

  const handleDeleteTeacher = (teacher: any) => {
    Alert.alert(
      'Delete Teacher',
      `Are you sure you want to delete ${teacher.profile?.name}? This will remove all their assignments.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => deleteTeacher(teacher.id)
        }
      ]
    );
  };

  const deleteTeacher = async (teacherId: string) => {
    try {
      const response = await apiService.deleteUser(teacherId);
      if (response.data.success) {
        Alert.alert('Success', 'Teacher deleted successfully');
        loadData();
      } else {
        throw new Error(response.data.error || 'Failed to delete teacher');
      }
    } catch (error: any) {
      console.error('Delete teacher error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete teacher');
    }
  };

  const removeAssignment = async (assignmentId: string, teacherName: string, className: string, subjectName: string) => {
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
              if (response.data.success) {
                Alert.alert('Success', 'Assignment removed successfully');
                await loadData();
              } else {
                throw new Error(response.data.error || 'Failed to remove assignment');
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

  const approveTeacher = async (teacher: any) => {
    try {
      const response = await apiService.approveUser(teacher.id);
      if (response.data.success) {
        Alert.alert('Success', `Approved ${teacher.profile?.name}`);
        loadData();
      } else {
        throw new Error(response.data.error || 'Failed to approve teacher');
      }
    } catch (error: any) {
      console.error('Approve teacher error:', error);
      Alert.alert('Error', error.response?.data?.error || 'Failed to approve teacher');
    }
  };

  const getFilteredSubjects = () => {
    if (!selectedClass) return subjects;
    
    const selectedClassObj = classes.find(c => c.id === selectedClass);
    if (!selectedClassObj) return subjects;
    
    return subjects.filter(subject => subject.level_id === selectedClassObj.level_id);
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
        <Text style={{ fontFamily, 
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary,
        }}>
          Loading teachers...
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
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
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
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.title1.fontSize,
                fontWeight: designTokens.typography.title1.fontWeight,
                color: colors.textPrimary,
              } as any}>
                Teacher Management
              </Text>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textSecondary,
              }}>
                {teachers.length} teacher(s) found
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            onPress={loadData}
            style={{
              padding: designTokens.spacing.sm,
              borderRadius: designTokens.borderRadius.full,
              backgroundColor: colors.primary + '15',
            }}
          >
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: designTokens.spacing.xl, gap: designTokens.spacing.lg }}
      >
        {teachers.map(teacher => {
          const assignments = getTeacherAssignments(teacher.id);
          
          return (
            <View
              key={teacher.id}
              style={{
                padding: designTokens.spacing.lg,
                borderRadius: designTokens.borderRadius.xl,
                backgroundColor: colors.backgroundElevated,
                borderWidth: 1,
                borderColor: colors.border,
                ...designTokens.shadows.sm,
              }}
            >
              {/* Teacher Info */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                marginBottom: designTokens.spacing.lg,
              }}>
                <View style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  flex: 1,
                }}>
                  <View style={{
                    width: 48,
                    height: 48,
                    borderRadius: designTokens.borderRadius.full,
                    backgroundColor: '#10b981' + '15',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: designTokens.spacing.md,
                  }}>
                    <Ionicons name="person" size={24} color="#10b981" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily, 
                      fontSize: designTokens.typography.title3.fontSize,
                      fontWeight: designTokens.typography.title3.fontWeight,
                      color: colors.textPrimary,
                      marginBottom: 2,
                    } as any}>
                      {teacher.profile?.name || 'No Name'}
                    </Text>
                    <Text style={{ fontFamily, 
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary,
                      marginBottom: designTokens.spacing.xs,
                    }}>
                      {teacher.email}
                    </Text>
                    <Text style={{ fontFamily, 
                      fontSize: designTokens.typography.caption1.fontSize,
                      color: colors.textTertiary,
                    }}>
                      Department: {teacher.profile?.department || 'Not specified'}
                    </Text>
                    
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: designTokens.spacing.xs,
                      marginTop: designTokens.spacing.sm,
                    }}>
                      <View style={{
                        paddingHorizontal: designTokens.spacing.md,
                        paddingVertical: designTokens.spacing.xs,
                        borderRadius: designTokens.borderRadius.full,
                        backgroundColor: teacher.is_approved ? '#10b981' + '15' : '#f97316' + '15',
                      }}>
                        <Text style={{ fontFamily, 
                          fontSize: designTokens.typography.caption2.fontSize,
                          fontWeight: '600',
                          color: teacher.is_approved ? '#10b981' : '#f97316',
                        }}>
                          {teacher.is_approved ? '✓ Approved' : 'Pending Approval'}
                        </Text>
                      </View>
                      
                      {!teacher.is_approved && (
                        <TouchableOpacity 
                          onPress={() => approveTeacher(teacher)}
                          style={{
                            paddingHorizontal: designTokens.spacing.md,
                            paddingVertical: designTokens.spacing.xs,
                            borderRadius: designTokens.borderRadius.full,
                            backgroundColor: colors.primary,
                          }}
                        >
                          <Text style={{ fontFamily, 
                            fontSize: designTokens.typography.caption2.fontSize,
                            fontWeight: '600',
                            color: '#ffffff',
                          }}>
                            Approve
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row',
                  gap: designTokens.spacing.sm,
                }}>
                  <TouchableOpacity
                    onPress={() => openAssignmentModal(teacher)}
                    disabled={!teacher.is_approved}
                    style={{
                      padding: designTokens.spacing.sm,
                      borderRadius: designTokens.borderRadius.lg,
                      backgroundColor: teacher.is_approved ? colors.primary + '15' : isDark ? '#374151' : '#e5e7eb',
                    }}
                  >
                    <Ionicons name="add" size={16} color={teacher.is_approved ? colors.primary : colors.textTertiary} />
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    onPress={() => handleDeleteTeacher(teacher)}
                    style={{
                      padding: designTokens.spacing.sm,
                      borderRadius: designTokens.borderRadius.lg,
                      backgroundColor: '#ef4444' + '15',
                    }}
                  >
                    <Ionicons name="trash" size={16} color="#ef4444" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Current Assignments */}
              {assignments.length > 0 ? (
                <View>
                  <Text style={{ fontFamily, 
                    fontSize: designTokens.typography.headline.fontSize,
                    fontWeight: designTokens.typography.headline.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.md,
                  } as any}>
                    Current Assignments ({assignments.length})
                  </Text>
                  <View style={{ gap: designTokens.spacing.sm }}>
                    {assignments.map(assignment => (
                      <View
                        key={assignment.id}
                        style={{
                          backgroundColor: colors.primary + '15',
                          padding: designTokens.spacing.md,
                          borderRadius: designTokens.borderRadius.lg,
                          flexDirection: 'row',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontFamily, 
                            fontSize: designTokens.typography.footnote.fontSize,
                            fontWeight: '600',
                            color: colors.primary,
                            marginBottom: 2,
                          }}>
                            {assignment.subject?.name}
                          </Text>
                          <Text style={{ fontFamily, 
                            fontSize: designTokens.typography.caption1.fontSize,
                            color: colors.primary + 'cc',
                            marginBottom: 2,
                          }}>
                            Class: {assignment.class?.name}
                          </Text>
                          <Text style={{ fontFamily, 
                            fontSize: designTokens.typography.caption2.fontSize,
                            color: colors.primary + 'aa',
                          }}>
                            Join Code: {assignment.code}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => removeAssignment(
                            assignment.id,
                            teacher.profile?.name,
                            assignment.class?.name,
                            assignment.subject?.name
                          )}
                          disabled={removingAssignment === assignment.id}
                          style={{
                            padding: designTokens.spacing.xs,
                            borderRadius: designTokens.borderRadius.md,
                            backgroundColor: '#ef4444',
                          }}
                        >
                          {removingAssignment === assignment.id ? (
                            <ActivityIndicator size="small" color="#ffffff" />
                          ) : (
                            <Ionicons name="close" size={14} color="#ffffff" />
                          )}
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </View>
              ) : (
                <View style={{
                  backgroundColor: isDark ? '#374151' : '#f3f4f6',
                  padding: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.lg,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontFamily, 
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: colors.textSecondary,
                  }}>
                    No assignments yet
                  </Text>
                </View>
              )}
            </View>
          );
        })}

        {teachers.length === 0 && (
          <View style={{
            alignItems: 'center',
            paddingVertical: designTokens.spacing.xxxl,
            backgroundColor: colors.backgroundElevated,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            ...designTokens.shadows.sm,
          }}>
            <Ionicons name="person" size={64} color={colors.textTertiary} />
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textSecondary,
              marginTop: designTokens.spacing.lg,
              marginBottom: designTokens.spacing.xs,
            } as any}>
              No teachers found
            </Text>
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textTertiary,
              textAlign: 'center',
              marginBottom: designTokens.spacing.lg,
            }}>
              Teachers will appear here once they register.
            </Text>
            <TouchableOpacity 
              onPress={loadData}
              style={{
                paddingHorizontal: designTokens.spacing.xl,
                paddingVertical: designTokens.spacing.md,
                borderRadius: designTokens.borderRadius.full,
                backgroundColor: colors.primary,
              }}
            >
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.footnote.fontSize,
                fontWeight: '600',
                color: '#ffffff',
              }}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Assignment Modal */}
      <Modal visible={showAssignmentModal} animationType="slide" presentationStyle="pageSheet">
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
              marginBottom: designTokens.spacing.xs,
            }}>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
              } as any}>
                Assign Teacher
              </Text>
              <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <Text style={{ fontFamily, 
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
            }}>
              Assign {selectedTeacher?.profile?.name} to a class and subject
            </Text>
          </View>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: designTokens.spacing.xl, gap: designTokens.spacing.xxl }}
          >
            {/* Class Selection */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.headline.fontSize,
                fontWeight: designTokens.typography.headline.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.lg,
              } as any}>
                Select Class
              </Text>
              <View style={{ gap: designTokens.spacing.sm }}>
                {classes.map(classItem => (
                  <TouchableOpacity
                    key={classItem.id}
                    onPress={() => {
                      setSelectedClass(classItem.id);
                      setSelectedSubject(''); // Reset subject when class changes
                    }}
                    style={{
                      padding: designTokens.spacing.lg,
                      borderRadius: designTokens.borderRadius.xl,
                      backgroundColor: selectedClass === classItem.id 
                        ? colors.primary + '15' 
                        : colors.backgroundElevated,
                      borderWidth: 1,
                      borderColor: selectedClass === classItem.id 
                        ? colors.primary 
                        : colors.border,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      ...designTokens.shadows.sm,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <View style={{
                        width: 32,
                        height: 32,
                        borderRadius: designTokens.borderRadius.md,
                        backgroundColor: colors.primary + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: designTokens.spacing.md,
                      }}>
                        <Ionicons name="school" size={16} color={colors.primary} />
                      </View>
                      <View>
                        <Text style={{ fontFamily, 
                          fontSize: designTokens.typography.headline.fontSize,
                          fontWeight: designTokens.typography.headline.fontWeight,
                          color: colors.textPrimary,
                          marginBottom: 2,
                        } as any}>
                          {classItem.name}
                        </Text>
                        <Text style={{ fontFamily, 
                          fontSize: designTokens.typography.caption1.fontSize,
                          color: colors.textSecondary,
                        }}>
                          {classItem.level?.name} • Grade {classItem.grade}
                        </Text>
                      </View>
                    </View>
                    
                    {selectedClass === classItem.id && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject Selection */}
            <View>
              <Text style={{ fontFamily, 
                fontSize: designTokens.typography.headline.fontSize,
                fontWeight: designTokens.typography.headline.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.lg,
              } as any}>
                Select Subject
              </Text>
              {!selectedClass ? (
                <View style={{
                  backgroundColor: '#f59e0b' + '15',
                  padding: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  alignItems: 'center',
                }}>
                  <Text style={{ fontFamily, 
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: '#f59e0b',
                    textAlign: 'center',
                  }}>
                    Please select a class first to see available subjects
                  </Text>
                </View>
              ) : (
                <View style={{ gap: designTokens.spacing.sm }}>
                  {getFilteredSubjects().map(subject => (
                    <TouchableOpacity
                      key={subject.id}
                      onPress={() => setSelectedSubject(subject.id)}
                      style={{
                        padding: designTokens.spacing.lg,
                        borderRadius: designTokens.borderRadius.xl,
                        backgroundColor: selectedSubject === subject.id 
                          ? '#10b981' + '15' 
                          : colors.backgroundElevated,
                        borderWidth: 1,
                        borderColor: selectedSubject === subject.id 
                          ? '#10b981' 
                          : colors.border,
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        ...designTokens.shadows.sm,
                      }}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <View 
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: designTokens.borderRadius.md,
                            backgroundColor: subject.color || '#10b981',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: designTokens.spacing.md,
                          }}
                        >
                          <Ionicons 
                            name={subject.icon as any || 'book'} 
                            size={16} 
                            color="white" 
                          />
                        </View>
                        <View>
                          <Text style={{ fontFamily, 
                            fontSize: designTokens.typography.headline.fontSize,
                            fontWeight: designTokens.typography.headline.fontWeight,
                            color: colors.textPrimary,
                            marginBottom: 2,
                          } as any}>
                            {subject.name}
                          </Text>
                          <Text style={{ fontFamily, 
                            fontSize: designTokens.typography.caption1.fontSize,
                            color: colors.textSecondary,
                          }}>
                            {subject.code}
                          </Text>
                        </View>
                      </View>
                      
                      {selectedSubject === subject.id && (
                        <Ionicons name="checkmark-circle" size={20} color="#10b981" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>

          <View style={{
            padding: designTokens.spacing.xl,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}>
            <TouchableOpacity
              style={{
                backgroundColor: colors.primary,
                borderRadius: designTokens.borderRadius.xl,
                padding: designTokens.spacing.lg,
                alignItems: 'center',
                ...designTokens.shadows.sm,
                opacity: !selectedClass || !selectedSubject || assigning ? 0.5 : 1,
              }}
              onPress={handleAssignTeacher}
              disabled={!selectedClass || !selectedSubject || assigning}
            >
              {assigning ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={{ fontFamily, 
                  fontSize: designTokens.typography.body.fontSize,
                  fontWeight: '600',
                  color: '#ffffff',
                }}>
                  Assign Teacher
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
