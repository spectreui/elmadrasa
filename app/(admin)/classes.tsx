// app/(admin)/classes.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { designTokens } from '../../src/utils/designTokens';
import { useThemeContext } from '../../src/contexts/ThemeContext';

export default function ClassesManagementScreen() {
  const [classes, setClasses] = useState<any[]>([]);
  const [levels, setLevels] = useState<any[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classTeachers, setClassTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    level_id: '',
    grade: '',
    section: '',
    description: ''
  });
  const { colors, isDark } = useThemeContext();

  useEffect(() => {
    loadData();
  }, []);

  // Auto-generate class name when level, grade, or section changes
  useEffect(() => {
    if (formData.level_id && formData.grade && formData.section) {
      const level = levels.find(l => l.id === formData.level_id);
      if (level) {
        let className = '';
        
        // Map grade numbers based on level
        if (level.short_name === 'PREP') {
          // For prepatory, map 1->7, 2->8, 3->9
          const gradeMap = { '1': '7', '2': '8', '3': '9' };
          className = `${gradeMap[formData.grade as keyof typeof gradeMap]}${formData.section}`;
        } else if (level.short_name === 'PRI') {
          className = `Primary ${formData.grade}${formData.section}`;
        } else if (level.short_name === 'SEC') {
          // For secondary, map 1->10, 2->11, 3->12
          const gradeMap = { '1': '10', '2': '11', '3': '12' };
          className = `${gradeMap[formData.grade as keyof typeof gradeMap]}${formData.section}`;
        }
        
        setFormData(prev => ({ ...prev, name: className }));
      }
    }
  }, [formData.level_id, formData.grade, formData.section, levels]);

  const loadData = async () => {
  try {
    console.log('🔄 Loading data...'); // Debug log
    const [classesRes, levelsRes] = await Promise.all([
      apiService.getClasses(), // This should NOT send empty params
      apiService.getLevels(),
    ]);
    
    console.log('📚 Classes response:', classesRes.data); // Debug log
    console.log('📊 Levels response:', levelsRes.data); // Debug log
    
    setClasses(classesRes.data.data || []);
    setLevels(levelsRes.data.data || []);
  } catch (error) {
    console.error('Failed to load data:', error);
    Alert.alert('Error', 'Failed to load classes');
  } finally {
    setLoading(false);
  }
};


  const loadClassDetails = async (classItem: any) => {
    try {
      setDetailsLoading(true);
      setSelectedClass(classItem);
      
      // Load students for this class
      const studentsRes = await apiService.getClassStudents(classItem.id);
      setClassStudents(studentsRes.data.data || []);
      
      // Load teacher assignments for this class
      const assignmentsRes = await apiService.getTeacherAssignments();
      const classTeachers = (assignmentsRes.data.data || [])
        .filter((assignment: any) => assignment.class_id === classItem.id)
        .map((assignment: any) => ({
          teacher: assignment.teacher,
          subject: assignment.subject,
          assignmentId: assignment.id
        }));
      
      setClassTeachers(classTeachers);
      setShowClassDetails(true);
    } catch (error: any) {
      console.error('Failed to load class details:', error);
      Alert.alert('Error', `Failed to load class details: ${error.message}`);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateClass = async () => {
    if (!formData.name || !formData.level_id || !formData.grade || !formData.section) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      setCreating(true);
      
      // Prepare the data with all required fields
      const classData = {
        name: formData.name,
        level_id: formData.level_id,
        grade: formData.grade,
        section: formData.section,
        ...(formData.description && { metadata: { description: formData.description } })
      };

      console.log('Creating class with data:', classData);
      await apiService.createClass(classData);
      
      Alert.alert('Success', 'Class created successfully');
      setShowCreateModal(false);
      setFormData({ name: '', level_id: '', grade: '', section: '', description: '' });
      loadData();
    } catch (error: any) {
      console.error('Create class error:', error);
      if (error.response?.data.error === "duplicate key value violates unique constraint \"classes_name_unique\"") {
        Alert.alert("Error", "Class already exists!");
      } else {
        Alert.alert('Error', error.response?.data?.error || 'Failed to create class');
      }
    } finally {
      setCreating(false);
    }
  };

  const getGradeOptions = (levelId: string) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return [];

    switch (level.short_name) {
      case 'PREP':
        return [
          { label: 'Prep 1', value: '1' },
          { label: 'Prep 2', value: '2' },
          { label: 'Prep 3', value: '3' }
        ];
      case 'PRI':
        return [
          { label: 'Primary 1', value: '1' },
          { label: 'Primary 2', value: '2' },
          { label: 'Primary 3', value: '3' },
          { label: 'Primary 4', value: '4' },
          { label: 'Primary 5', value: '5' },
          { label: 'Primary 6', value: '6' }
        ];
      case 'SEC':
        return [
          { label: 'Secondary 1 (Grade 10)', value: '1' },
          { label: 'Secondary 2 (Grade 11)', value: '2' },
          { label: 'Secondary 3 (Grade 12)', value: '3' }
        ];
      default:
        return [];
    }
  };

  const getSectionOptions = () => {
    return [
      { label: 'Section A', value: 'A' },
      { label: 'Section B', value: 'B' },
      { label: 'Section C', value: 'C' },
      { label: 'Section D', value: 'D' }
    ];
  };

  const mapGradeToEgyptian = (grade: string, levelShortName?: string): string => {
    // For Prep levels, use 1st, 2nd, 3rd
    if (levelShortName === 'PREP') {
      const prepMap: { [key: string]: string } = {
        '1': '1st',
        '2': '2nd',
        '3': '3rd'
      };
      return prepMap[grade] || grade;
    }

    // For Secondary levels, use 1st, 2nd, 3rd
    if (levelShortName === 'SEC') {
      const secMap: { [key: string]: string } = {
        '10': '1st',
        '11': '2nd',
        '12': '3rd'
      };
      return secMap[grade] || grade;
    }

    // For Primary, just show the number
    if (levelShortName === 'PRI') {
      return grade;
    }

    // Default mappings
    const defaultMap: { [key: string]: string } = {
      '1': '1st',
      '2': '2nd',
      '3': '3rd',
      '10': '1st',
      '11': '2nd',
      '12': '3rd'
    };

    return defaultMap[grade] || grade;
  };

  const getDisplayGrade = (classItem: any) => {
  if (!classItem.level) return `Grade ${classItem.grade}`;
  
  const levelShortName = classItem.level.short_name;
  
  switch (levelShortName) {
    case 'PREP':
      return `Prep ${mapGradeToEgyptian(classItem.grade, 'PREP')}`;
    case 'PRI':
      return `Primary ${classItem.grade}`;
    case 'SEC':
      return `Grade ${mapGradeToEgyptian(classItem.grade, 'SEC')}`;
    default:
      return `Grade ${classItem.grade}`;
  }
};


  const getLevelDisplayName = (classItem: any) => {
    if (!classItem.level) return 'Unknown Level';
    
    switch (classItem.level.short_name) {
      case 'PREP':
        return 'Preparatory';
      case 'PRI':
        return 'Primary';
      case 'SEC':
        return 'Secondary';
      default:
        return classItem.level.name;
    }
  };

  const getLevelColor = (levelShortName: string) => {
    switch (levelShortName) {
      case 'PREP':
        return { 
          bg: isDark ? 'rgba(245, 158, 11, 0.15)' : 'rgba(245, 158, 11, 0.1)', 
          text: '#f59e0b', 
          border: isDark ? 'rgba(245, 158, 11, 0.3)' : 'rgba(245, 158, 11, 0.2)' 
        };
      case 'PRI':
        return { 
          bg: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)', 
          text: '#3b82f6', 
          border: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)' 
        };
      case 'SEC':
        return { 
          bg: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)', 
          text: '#8b5cf6', 
          border: isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(139, 92, 246, 0.2)' 
        };
      default:
        return { 
          bg: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.1)', 
          text: '#9ca3af', 
          border: isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(156, 163, 175, 0.2)' 
        };
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ 
          marginTop: designTokens.spacing.lg, 
          fontSize: designTokens.typography.body.fontSize,
          color: colors.textSecondary 
        }}>
          Loading classes...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View style={{ 
        paddingHorizontal: designTokens.spacing.xl, 
        paddingTop: designTokens.spacing.xxxl + 10, 
        paddingBottom: designTokens.spacing.xl,
        backgroundColor: colors.background 
      }}>
        <View style={{ 
          flexDirection: 'row', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: designTokens.spacing.xl 
        }}>
          <View style={{ flex: 1 }}>
            <Text style={{
              fontSize: designTokens.typography.largeTitle.fontSize,
              fontWeight: designTokens.typography.largeTitle.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.xs,
            } as any}>
              Classes
            </Text>
            <Text style={{
              fontSize: designTokens.typography.body.fontSize,
              color: colors.textSecondary,
            }}>
              Manage and organize school classes
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={{
              backgroundColor: colors.primary,
              paddingHorizontal: designTokens.spacing.lg,
              paddingVertical: designTokens.spacing.md,
              borderRadius: designTokens.borderRadius.xl,
              flexDirection: 'row',
              alignItems: 'center',
              gap: designTokens.spacing.sm,
              ...designTokens.shadows.md,
            }}
          >
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={{
              color: '#FFFFFF',
              fontWeight: '600',
              fontSize: designTokens.typography.body.fontSize,
            }}>
              New Class
            </Text>
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={{ 
          flexDirection: 'row', 
          gap: designTokens.spacing.md 
        }}>
          <View style={{ 
            flex: 1, 
            padding: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundElevated,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <View>
                <Text style={{
                  fontSize: designTokens.typography.title1.fontSize,
                  fontWeight: designTokens.typography.title1.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.xs,
                } as any}>
                  {classes.length}
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}>
                  Total Classes
                </Text>
              </View>
              <View style={{ 
                width: 44, 
                height: 44, 
                borderRadius: designTokens.borderRadius.lg,
                backgroundColor: `${colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="school" size={20} color={colors.primary} />
              </View>
            </View>
          </View>

          <View style={{ 
            flex: 1, 
            padding: designTokens.spacing.lg,
            borderRadius: designTokens.borderRadius.xl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundElevated,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between' 
            }}>
              <View>
                <Text style={{
                  fontSize: designTokens.typography.title1.fontSize,
                  fontWeight: designTokens.typography.title1.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.xs,
                } as any}>
                  {levels.length}
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  fontWeight: '600',
                  color: colors.textSecondary,
                }}>
                  Education Levels
                </Text>
              </View>
              <View style={{ 
                width: 44, 
                height: 44, 
                borderRadius: designTokens.borderRadius.lg,
                backgroundColor: `${colors.primary}15`,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                <Ionicons name="layers" size={20} color={colors.primary} />
              </View>
            </View>
          </View>
        </View>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ 
          paddingHorizontal: designTokens.spacing.xl, 
          paddingBottom: designTokens.spacing.xxl 
        }}
      >
        {/* Classes Grid */}
        <View style={{ marginBottom: designTokens.spacing.xl }}>
          <Text style={{
            fontSize: designTokens.typography.title2.fontSize,
            fontWeight: designTokens.typography.title2.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.lg,
          } as any}>
            All Classes
          </Text>
          
          {classes.length === 0 ? (
            <View style={{ 
              alignItems: 'center', 
              paddingVertical: designTokens.spacing.xxxl,
              borderRadius: designTokens.borderRadius.xxl,
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: colors.border,
              backgroundColor: colors.backgroundElevated,
            }}>
              <Ionicons name="school-outline" size={60} color={colors.textTertiary} style={{ marginBottom: designTokens.spacing.lg }} />
              <Text style={{
                fontSize: designTokens.typography.title2.fontSize,
                fontWeight: designTokens.typography.title2.fontWeight,
                color: colors.textPrimary,
                marginBottom: designTokens.spacing.xs,
              } as any}>
                No Classes Yet
              </Text>
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textSecondary,
                textAlign: 'center',
                marginBottom: designTokens.spacing.xl,
              }}>
                Create your first class to get started
              </Text>
              <TouchableOpacity
                onPress={() => setShowCreateModal(true)}
                style={{
                  backgroundColor: colors.primary,
                  paddingHorizontal: designTokens.spacing.xl,
                  paddingVertical: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  ...designTokens.shadows.md,
                }}
              >
                <Text style={{
                  color: '#FFFFFF',
                  fontWeight: '600',
                  fontSize: designTokens.typography.body.fontSize,
                }}>
                  Create First Class
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={{ gap: designTokens.spacing.md }}>
              {classes.map(classItem => {
                const levelColor = getLevelColor(classItem.level?.short_name);
                return (
                  <TouchableOpacity
                    key={classItem.id}
                    style={{
                      padding: designTokens.spacing.lg,
                      borderRadius: designTokens.borderRadius.xxl,
                      borderWidth: 2,
                      borderColor: levelColor.border,
                      backgroundColor: colors.backgroundElevated,
                      ...designTokens.shadows.sm,
                    }}
                    onPress={() => loadClassDetails(classItem)}
                  >
                    <View style={{ 
                      flexDirection: 'row', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between' 
                    }}>
                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'flex-start', 
                        gap: designTokens.spacing.lg,
                        flex: 1 
                      }}>
                        <View style={{ 
                          width: 56, 
                          height: 56, 
                          borderRadius: designTokens.borderRadius.lg,
                          backgroundColor: levelColor.bg,
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          <Ionicons name="school" size={24} color={levelColor.text} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{
                            fontSize: designTokens.typography.title3.fontSize,
                            fontWeight: designTokens.typography.title3.fontWeight,
                            color: colors.textPrimary,
                            marginBottom: designTokens.spacing.md,
                          } as any}>
                            {classItem.name}
                          </Text>
                          <View style={{ 
                            flexDirection: 'row', 
                            flexWrap: 'wrap', 
                            gap: designTokens.spacing.sm 
                          }}>
                            <View style={{ 
                              paddingHorizontal: designTokens.spacing.md,
                              paddingVertical: designTokens.spacing.sm,
                              borderRadius: designTokens.borderRadius.full,
                              backgroundColor: levelColor.bg,
                            }}>
                              <Text style={{
                                fontSize: designTokens.typography.footnote.fontSize,
                                fontWeight: '600',
                                color: levelColor.text,
                              }}>
                                {getDisplayGrade(classItem)}
                              </Text>
                            </View>
                            <View style={{ 
                              paddingHorizontal: designTokens.spacing.md,
                              paddingVertical: designTokens.spacing.sm,
                              borderRadius: designTokens.borderRadius.full,
                              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                            }}>
                              <Text style={{
                                fontSize: designTokens.typography.footnote.fontSize,
                                fontWeight: '600',
                                color: '#10b981',
                              }}>
                                Section {classItem.section}
                              </Text>
                            </View>
                            <View style={{ 
                              paddingHorizontal: designTokens.spacing.md,
                              paddingVertical: designTokens.spacing.sm,
                              borderRadius: designTokens.borderRadius.full,
                              backgroundColor: isDark ? 'rgba(156, 163, 175, 0.15)' : 'rgba(156, 163, 175, 0.1)',
                            }}>
                              <Text style={{
                                fontSize: designTokens.typography.footnote.fontSize,
                                fontWeight: '600',
                                color: colors.textSecondary,
                              }}>
                                {getLevelDisplayName(classItem)}
                              </Text>
                            </View>
                          </View>
                          {classItem.metadata?.description && (
                            <Text style={{
                              fontSize: designTokens.typography.body.fontSize,
                              color: colors.textSecondary,
                              marginTop: designTokens.spacing.md,
                            }}>
                              {classItem.metadata.description}
                            </Text>
                          )}
                        </View>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={{ marginTop: 4 }} />
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Create Class Modal */}
      <Modal 
        visible={showCreateModal} 
        animationType="slide" 
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Modal Header */}
          <View style={{ 
            paddingHorizontal: designTokens.spacing.xl, 
            paddingTop: designTokens.spacing.xxl, 
            paddingBottom: designTokens.spacing.lg,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.background,
          }}>
            <View style={{ 
              flexDirection: 'row', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              marginBottom: designTokens.spacing.sm 
            }}>
              <View>
                <Text style={{
                  fontSize: designTokens.typography.largeTitle.fontSize,
                  fontWeight: designTokens.typography.largeTitle.fontWeight,
                  color: colors.textPrimary,
                } as any}>
                  New Class
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textSecondary,
                  marginTop: designTokens.spacing.xs,
                }}>
                  Create a new class for students
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowCreateModal(false)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: colors.backgroundElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              padding: designTokens.spacing.xl,
              paddingBottom: designTokens.spacing.xxxl 
            }}
          >
            <View style={{ gap: designTokens.spacing.xxl }}>
              {/* Level Selection */}
              <View>
                <Text style={{
                  fontSize: designTokens.typography.title3.fontSize,
                  fontWeight: designTokens.typography.title3.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.lg,
                } as any}>
                  Education Level *
                </Text>
                <View style={{
                  borderRadius: designTokens.borderRadius.xl,
                  borderWidth: 2,
                  borderColor: colors.border,
                  backgroundColor: colors.backgroundElevated,
                  overflow: 'hidden',
                }}>
                  <View style={{ 
                    borderWidth: 0,
                    borderColor: 'transparent',
                    backgroundColor: 'transparent',
                  }}>
                    <View style={{ 
                      height: 50,
                      paddingHorizontal: designTokens.spacing.lg,
                      justifyContent: 'center',
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: formData.level_id ? colors.textPrimary : colors.textTertiary,
                      }}>
                        {formData.level_id 
                          ? `${levels.find(l => l.id === formData.level_id)?.name} (${levels.find(l => l.id === formData.level_id)?.short_name})`
                          : 'Select an education level'
                        }
                      </Text>
                    </View>
                    <View style={{ 
                      maxHeight: 200,
                      backgroundColor: colors.backgroundElevated,
                    }}>
                      <ScrollView>
                        <TouchableOpacity
                          style={{ 
                            padding: designTokens.spacing.lg,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }}
                          onPress={() => setFormData({ ...formData, level_id: '', grade: '', section: '', name: '' })}
                        >
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textTertiary,
                          }}>
                            Select an education level
                          </Text>
                        </TouchableOpacity>
                        {levels.map(level => (
                          <TouchableOpacity
                            key={level.id}
                            style={{ 
                              padding: designTokens.spacing.lg,
                              borderBottomWidth: levels.indexOf(level) < levels.length - 1 ? 1 : 0,
                              borderBottomColor: colors.border,
                            }}
                            onPress={() => setFormData({ ...formData, level_id: level.id, grade: '', section: '', name: '' })}
                          >
                            <Text style={{
                              fontSize: designTokens.typography.body.fontSize,
                              color: colors.textPrimary,
                            }}>
                              {level.name} ({level.short_name})
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              </View>

              {/* Grade Selection */}
              {formData.level_id && (
                <View>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.lg,
                  } as any}>
                    Grade Level *
                  </Text>
                  <View style={{
                    borderRadius: designTokens.borderRadius.xl,
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    overflow: 'hidden',
                  }}>
                    <View style={{ 
                      height: 50,
                      paddingHorizontal: designTokens.spacing.lg,
                      justifyContent: 'center',
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: formData.grade ? colors.textPrimary : colors.textTertiary,
                      }}>
                        {formData.grade 
                          ? getGradeOptions(formData.level_id).find(g => g.value === formData.grade)?.label
                          : `Select ${levels.find(l => l.id === formData.level_id)?.short_name?.toLowerCase()} grade`
                        }
                      </Text>
                    </View>
                    <View style={{ 
                      maxHeight: 200,
                      backgroundColor: colors.backgroundElevated,
                    }}>
                      <ScrollView>
                        <TouchableOpacity
                          style={{ 
                            padding: designTokens.spacing.lg,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }}
                          onPress={() => setFormData({ ...formData, grade: '', section: '', name: '' })}
                        >
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textTertiary,
                          }}>
                            Select grade level
                          </Text>
                        </TouchableOpacity>
                        {getGradeOptions(formData.level_id).map(grade => (
                          <TouchableOpacity
                            key={grade.value}
                            style={{ 
                              padding: designTokens.spacing.lg,
                              borderBottomWidth: getGradeOptions(formData.level_id).indexOf(grade) < getGradeOptions(formData.level_id).length - 1 ? 1 : 0,
                              borderBottomColor: colors.border,
                            }}
                            onPress={() => setFormData({ ...formData, grade: grade.value, section: '', name: '' })}
                          >
                            <Text style={{
                              fontSize: designTokens.typography.body.fontSize,
                              color: colors.textPrimary,
                            }}>
                              {grade.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {/* Section Selection */}
              {formData.grade && (
                <View>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    marginBottom: designTokens.spacing.lg,
                  } as any}>
                    Section *
                  </Text>
                  <View style={{
                    borderRadius: designTokens.borderRadius.xl,
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    overflow: 'hidden',
                  }}>
                    <View style={{ 
                      height: 50,
                      paddingHorizontal: designTokens.spacing.lg,
                      justifyContent: 'center',
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: formData.section ? colors.textPrimary : colors.textTertiary,
                      }}>
                        {formData.section 
                          ? `Section ${formData.section}`
                          : 'Select section'
                        }
                      </Text>
                    </View>
                    <View style={{ 
                      maxHeight: 200,
                      backgroundColor: colors.backgroundElevated,
                    }}>
                      <ScrollView>
                        <TouchableOpacity
                          style={{ 
                            padding: designTokens.spacing.lg,
                            borderBottomWidth: 1,
                            borderBottomColor: colors.border,
                          }}
                          onPress={() => setFormData({ ...formData, section: '' })}
                        >
                          <Text style={{
                            fontSize: designTokens.typography.body.fontSize,
                            color: colors.textTertiary,
                          }}>
                            Select section
                          </Text>
                        </TouchableOpacity>
                        {getSectionOptions().map(section => (
                          <TouchableOpacity
                            key={section.value}
                            style={{ 
                              padding: designTokens.spacing.lg,
                              borderBottomWidth: getSectionOptions().indexOf(section) < getSectionOptions().length - 1 ? 1 : 0,
                              borderBottomColor: colors.border,
                            }}
                            onPress={() => setFormData({ ...formData, section: section.value })}
                          >
                            <Text style={{
                              fontSize: designTokens.typography.body.fontSize,
                              color: colors.textPrimary,
                            }}>
                              {section.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>
                </View>
              )}

              {/* Auto-generated Class Name */}
              {formData.name && (
                <View style={{
                  padding: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  backgroundColor: isDark ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.2)',
                }}>
                  <Text style={{
                    fontSize: designTokens.typography.footnote.fontSize,
                    fontWeight: '600',
                    color: colors.primary,
                    marginBottom: designTokens.spacing.xs,
                  }}>
                    Class Name
                  </Text>
                  <Text style={{
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                  } as any}>
                    {formData.name}
                  </Text>
                </View>
              )}

              {/* Description */}
              <View>
                <Text style={{
                  fontSize: designTokens.typography.title3.fontSize,
                  fontWeight: designTokens.typography.title3.fontWeight,
                  color: colors.textPrimary,
                  marginBottom: designTokens.spacing.lg,
                } as any}>
                  Description (Optional)
                </Text>
                <TextInput
                  value={formData.description}
                  onChangeText={(text) => setFormData({ ...formData, description: text })}
                  placeholder="Add any additional notes about this class..."
                  multiline
                  numberOfLines={4}
                  style={{
                    width: '100%',
                    paddingHorizontal: designTokens.spacing.lg,
                    paddingVertical: designTokens.spacing.md,
                    borderRadius: designTokens.borderRadius.xl,
                    borderWidth: 2,
                    borderColor: colors.border,
                    backgroundColor: colors.backgroundElevated,
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    textAlignVertical: 'top',
                  }}
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Create Button */}
              <TouchableOpacity
                onPress={handleCreateClass}
                disabled={!formData.name || !formData.level_id || !formData.grade || !formData.section || creating}
                style={{
                  width: '100%',
                  paddingVertical: designTokens.spacing.lg,
                  borderRadius: designTokens.borderRadius.xl,
                  backgroundColor: (!formData.name || !formData.level_id || !formData.grade || !formData.section || creating) 
                    ? colors.textTertiary 
                    : colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center',
                  ...designTokens.shadows.md,
                  opacity: (!formData.name || !formData.level_id || !formData.grade || !formData.section || creating) ? 0.7 : 1,
                }}
              >
                {creating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={{
                    color: '#FFFFFF',
                    fontWeight: '600',
                    fontSize: designTokens.typography.body.fontSize,
                  }}>
                    Create Class
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Class Details Modal */}
      <Modal
        visible={showClassDetails}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClassDetails(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Modal Header */}
          <View style={{ 
            paddingHorizontal: designTokens.spacing.xl, 
            paddingTop: designTokens.spacing.xxl, 
            paddingBottom: designTokens.spacing.lg,
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
              <View style={{ flex: 1 }}>
                <Text style={{
                  fontSize: designTokens.typography.largeTitle.fontSize,
                  fontWeight: designTokens.typography.largeTitle.fontWeight,
                  color: colors.textPrimary,
                } as any}>
                  {selectedClass?.name}
                </Text>
                <Text style={{
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textSecondary,
                  marginTop: designTokens.spacing.xs,
                }}>
                  {selectedClass?.level?.name} • Section {selectedClass?.section}
                </Text>
              </View>
              <TouchableOpacity 
                onPress={() => setShowClassDetails(false)}
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: designTokens.borderRadius.lg,
                  backgroundColor: colors.backgroundElevated,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginLeft: designTokens.spacing.lg,
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView 
            style={{ flex: 1 }} 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ 
              padding: designTokens.spacing.xl,
              paddingBottom: designTokens.spacing.xxxl 
            }}
          >
            {detailsLoading ? (
              <View style={{ 
                alignItems: 'center', 
                paddingVertical: designTokens.spacing.xxxl 
              }}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={{
                  marginTop: designTokens.spacing.lg,
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textSecondary,
                }}>
                  Loading class details...
                </Text>
              </View>
            ) : (
              <View style={{ gap: designTokens.spacing.xxxl }}>
                {/* Teachers Section */}
                <View>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: designTokens.spacing.lg 
                  }}>
                    <Text style={{
                      fontSize: designTokens.typography.title2.fontSize,
                      fontWeight: designTokens.typography.title2.fontWeight,
                      color: colors.textPrimary,
                    } as any}>
                      Teachers
                    </Text>
                    <View style={{ 
                      paddingHorizontal: designTokens.spacing.md,
                      paddingVertical: designTokens.spacing.sm,
                      borderRadius: designTokens.borderRadius.full,
                      backgroundColor: `${colors.primary}15`,
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.footnote.fontSize,
                        fontWeight: '600',
                        color: colors.primary,
                      }}>
                        {classTeachers.length} teacher{classTeachers.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {classTeachers.length > 0 ? (
                    <View style={{ gap: designTokens.spacing.md }}>
                      {classTeachers.map((item, index) => (
                        <View
                          key={item.assignmentId}
                          style={{
                            padding: designTokens.spacing.lg,
                            borderRadius: designTokens.borderRadius.xl,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.backgroundElevated,
                          }}
                        >
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: designTokens.spacing.lg 
                          }}>
                            <View style={{ 
                              width: 44, 
                              height: 44, 
                              borderRadius: designTokens.borderRadius.lg,
                              backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Ionicons name="person" size={20} color="#10b981" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontSize: designTokens.typography.body.fontSize,
                                fontWeight: '600',
                                color: colors.textPrimary,
                                marginBottom: designTokens.spacing.xs,
                              }}>
                                {item.teacher?.profile?.name || 'Teacher'}
                              </Text>
                              <Text style={{
                                fontSize: designTokens.typography.footnote.fontSize,
                                color: colors.textSecondary,
                              }}>
                                {item.subject?.name || 'Subject'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ 
                      alignItems: 'center', 
                      paddingVertical: designTokens.spacing.xxl,
                      borderRadius: designTokens.borderRadius.xl,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundElevated,
                    }}>
                      <Ionicons name="person-outline" size={48} color={colors.textTertiary} style={{ marginBottom: designTokens.spacing.lg }} />
                      <Text style={{
                        fontSize: designTokens.typography.title3.fontSize,
                        fontWeight: designTokens.typography.title3.fontWeight,
                        color: colors.textPrimary,
                        marginBottom: designTokens.spacing.xs,
                      } as any}>
                        No Teachers
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textSecondary,
                        textAlign: 'center',
                      }}>
                        Assign teachers to this class from the teacher assignments page
                      </Text>
                    </View>
                  )}
                </View>

                {/* Students Section */}
                <View>
                  <View style={{ 
                    flexDirection: 'row', 
                    alignItems: 'center', 
                    justifyContent: 'space-between', 
                    marginBottom: designTokens.spacing.lg 
                  }}>
                    <Text style={{
                      fontSize: designTokens.typography.title2.fontSize,
                      fontWeight: designTokens.typography.title2.fontWeight,
                      color: colors.textPrimary,
                    } as any}>
                      Students
                    </Text>
                    <View style={{ 
                      paddingHorizontal: designTokens.spacing.md,
                      paddingVertical: designTokens.spacing.sm,
                      borderRadius: designTokens.borderRadius.full,
                      backgroundColor: `${colors.primary}15`,
                    }}>
                      <Text style={{
                        fontSize: designTokens.typography.footnote.fontSize,
                        fontWeight: '600',
                        color: colors.primary,
                      }}>
                        {classStudents.length} student{classStudents.length !== 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>

                  {classStudents.length > 0 ? (
                    <View style={{ gap: designTokens.spacing.md }}>
                      {classStudents.map((student, index) => (
                        <View
                          key={student.id}
                          style={{
                            padding: designTokens.spacing.lg,
                            borderRadius: designTokens.borderRadius.xl,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.backgroundElevated,
                          }}
                        >
                          <View style={{ 
                            flexDirection: 'row', 
                            alignItems: 'center', 
                            gap: designTokens.spacing.lg 
                          }}>
                            <View style={{ 
                              width: 44, 
                              height: 44, 
                              borderRadius: designTokens.borderRadius.lg,
                              backgroundColor: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              <Ionicons name="school" size={20} color="#8b5cf6" />
                            </View>
                            <View style={{ flex: 1 }}>
                              <Text style={{
                                fontSize: designTokens.typography.body.fontSize,
                                fontWeight: '600',
                                color: colors.textPrimary,
                                marginBottom: designTokens.spacing.xs,
                              }}>
                                {student.full_name || student.user?.profile?.name || 'Student'}
                              </Text>
                              <Text style={{
                                fontSize: designTokens.typography.footnote.fontSize,
                                color: colors.textSecondary,
                              }}>
                                {student.user?.email || 'No email'}
                              </Text>
                            </View>
                          </View>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ 
                      alignItems: 'center', 
                      paddingVertical: designTokens.spacing.xxl,
                      borderRadius: designTokens.borderRadius.xl,
                      borderWidth: 2,
                      borderStyle: 'dashed',
                      borderColor: colors.border,
                      backgroundColor: colors.backgroundElevated,
                    }}>
                      <Ionicons name="school-outline" size={48} color={colors.textTertiary} style={{ marginBottom: designTokens.spacing.lg }} />
                      <Text style={{
                        fontSize: designTokens.typography.title3.fontSize,
                        fontWeight: designTokens.typography.title3.fontWeight,
                        color: colors.textPrimary,
                        marginBottom: designTokens.spacing.xs,
                      } as any}>
                        No Students
                      </Text>
                      <Text style={{
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textSecondary,
                        textAlign: 'center',
                      }}>
                        Students will appear here when they are assigned to this class
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}
