// app/(teacher)/create-exam.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Alert, Switch, Modal, FlatList, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';

export default function CreateExamScreen() {
  const { colors } = useThemeContext();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [timed, setTimed] = useState(false);
  const [duration, setDuration] = useState('60');
  const [allowRetake, setAllowRetake] = useState(false);
  const [randomOrder, setRandomOrder] = useState(false);
  const [questions, setQuestions] = useState<any[]>([
    { 
      question: '', 
      type: 'multiple_choice', 
      options: ['', ''], 
      correct_answer: '', 
      points: '1' 
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);

  // Load teacher's classes
  useEffect(() => {
    const loadTeacherData = async () => {
      try {
        setLoadingData(true);
        const classesResponse = await apiService.getTeacherClasses();
        
        if (classesResponse.data.success) {
          // Transform the complex structure to simple array with name property
          const transformedClasses = (classesResponse.data.data || []).map((cls: any) => ({
            id: cls.class_id,
            name: cls.class_name
          }));
          setClasses(transformedClasses);
        }
      } catch (error) {
        console.error('Failed to load teacher classes:', error);
        Alert.alert('Error', 'Failed to load classes');
      } finally {
        setLoadingData(false);
      }
    };
    
    loadTeacherData();
  }, []);

  // Load subjects when class is selected
  useEffect(() => {
    const loadSubjects = async () => {
      if (!classLevel) {
        setSubjects([]);
        setSubject('');
        return;
      }

      try {
        setLoadingSubjects(true);
        // Find the selected class to get its subjects
        const selectedClass = classes.find(cls => cls.name === classLevel);
        if (selectedClass) {
          const classesResponse = await apiService.getTeacherClasses();
          if (classesResponse.data.success) {
            const classData = classesResponse.data.data || [];
            const currentClass = classData.find((cls: any) => cls.class_name === classLevel);
            if (currentClass) {
              // Transform subjects to have name property
              const transformedSubjects = currentClass.subjects.map((subj: any) => ({
                id: subj.id,
                name: subj.name
              }));
              setSubjects(transformedSubjects);
            }
          }
        }
      } catch (error) {
        console.error('Failed to load subjects:', error);
        Alert.alert('Error', 'Failed to load subjects');
      } finally {
        setLoadingSubjects(false);
      }
    };
    
    loadSubjects();
  }, [classLevel, classes]);

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { 
        question: '', 
        type: 'multiple_choice', 
        options: ['', ''], 
        correct_answer: '', 
        points: '1' 
      }
    ]);
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = { ...updatedQuestions[index], [field]: value };
    setQuestions(updatedQuestions);
  };

  const addOption = (questionIndex: number) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options.push('');
    setQuestions(updatedQuestions);
  };

  const updateOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updatedQuestions = [...questions];
    updatedQuestions[questionIndex].options[optionIndex] = value;
    setQuestions(updatedQuestions);
  };

  const removeQuestion = (index: number) => {
    if (questions.length > 1) {
      const updatedQuestions = questions.filter((_, i) => i !== index);
      setQuestions(updatedQuestions);
    }
  };

  const handleSubmit = async () => {
    if (!title || !subject || !classLevel) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (questions.some(q => !q.question || 
      (q.type === 'multiple_choice' && (!q.options.some((opt: string) => opt) || !q.correct_answer)) || 
      (q.type === 'text' && !q.correct_answer))) {
      Alert.alert('Error', 'Please complete all questions');
      return;
    }

    try {
      setLoading(true);
      
      const examData = {
        title,
        subject,
        class: classLevel,
        due_date: dueDate ? dueDate.toISOString() : null,
        questions: questions.map(q => ({
          ...q,
          points: parseInt(q.points) || 1
        })),
        settings: {
          timed,
          duration: timed ? parseInt(duration) || 60 : 60,
          allow_retake: allowRetake,
          random_order: randomOrder
        }
      };

      const response = await apiService.createExam(examData);
      
      if (response.data.success) {
        Alert.alert('Success', 'Exam created successfully!', [
          { text: 'OK', onPress: () => router.back() }
        ]);
      } else {
        Alert.alert('Error', response.data.error || 'Failed to create exam');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create exam');
    } finally {
      setLoading(false);
    }
  };

  const PickerModal = ({ 
    visible, 
    onClose, 
    data, 
    onSelect, 
    selectedValue,
    title,
    displayKey = 'name',
    loading = false
  }: {
    visible: boolean;
    onClose: () => void;
    data: any[];
    onSelect: (item: any) => void;
    selectedValue: string;
    title: string;
    displayKey?: string;
    loading?: boolean;
  }) => (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={{
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end'
      }}>
        <View style={{
          backgroundColor: colors.backgroundElevated,
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 16,
          maxHeight: '50%'
        }}>
          <View style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <Text style={{
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary
            } as any}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <View style={{ padding: 30, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{
                color: colors.textSecondary,
                marginTop: 10,
                fontSize: designTokens.typography.body.fontSize
              }}>
                Loading...
              </Text>
            </View>
          ) : (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border
                  }}
                >
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: selectedValue === item[displayKey] ? colors.primary : colors.textPrimary
                  }}>
                    {item[displayKey]}
                  </Text>
                  {selectedValue === item[displayKey] && (
                    <Ionicons 
                      name="checkmark" 
                      size={20} 
                      color={colors.primary} 
                      style={{ position: 'absolute', right: 16, top: 16 }}
                    />
                  )}
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{
                    color: colors.textSecondary,
                    fontSize: designTokens.typography.body.fontSize
                  }}>
                    No items available
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );

  if (loadingData) {
    return (
      <View style={{
        flex: 1,
        backgroundColor: colors.background,
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          color: colors.textSecondary,
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize
        }}>
          Loading classes...
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: designTokens.spacing.xl }}>
        <Text style={{
          fontSize: designTokens.typography.title1.fontSize,
          fontWeight: designTokens.typography.title1.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.lg
        } as any}>
          Create New Exam
        </Text>

        {/* Basic Info Card */}
        <View style={{
          backgroundColor: colors.backgroundElevated,
          borderRadius: designTokens.borderRadius.xl,
          padding: designTokens.spacing.lg,
          ...designTokens.shadows.sm,
          marginBottom: designTokens.spacing.lg
        }}>
          <Text style={{
            fontSize: designTokens.typography.title2.fontSize,
            fontWeight: designTokens.typography.title2.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.lg
          } as any}>
            Exam Details
          </Text>

          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500'
            }}>
              Exam Title *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Enter exam title"
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border
              }}
            />
          </View>

          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500'
            }}>
              Class *
            </Text>
            <TouchableOpacity 
              onPress={() => setShowClassPicker(true)}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: classLevel ? colors.textPrimary : colors.textTertiary
              }}>
                {classLevel || 'Select class'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500'
            }}>
              Subject *
            </Text>
            <TouchableOpacity 
              onPress={() => classLevel ? setShowSubjectPicker(true) : null}
              disabled={!classLevel}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: classLevel ? 1 : 0.5
              }}
            >
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: subject && classLevel ? colors.textPrimary : colors.textTertiary
              }}>
                {subject && classLevel ? subject : classLevel ? 'Select subject' : 'Select class first'}
              </Text>
              <Ionicons name="chevron-down" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            {loadingSubjects && (
              <View style={{ marginTop: 8, flexDirection: 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{
                  color: colors.textSecondary,
                  fontSize: designTokens.typography.caption1.fontSize,
                  marginLeft: 8
                }}>
                  Loading subjects...
                </Text>
              </View>
            )}
          </View>

          <View>
            <Text style={{
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500'
            }}>
              Due Date
            </Text>
            <TouchableOpacity 
              onPress={() => setShowDatePicker(true)}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: dueDate ? colors.textPrimary : colors.textTertiary
              }}>
                {dueDate ? dueDate.toLocaleDateString() : 'Select due date'}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
            
            {showDatePicker && (
              <DateTimePicker
                value={dueDate || new Date()}
                mode="date"
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDueDate(selectedDate);
                  }
                }}
              />
            )}
          </View>
        </View>

        {/* Settings Card */}
        <View style={{
          backgroundColor: colors.backgroundElevated,
          borderRadius: designTokens.borderRadius.xl,
          padding: designTokens.spacing.lg,
          ...designTokens.shadows.sm,
          marginBottom: designTokens.spacing.lg
        }}>
          <Text style={{
            fontSize: designTokens.typography.title2.fontSize,
            fontWeight: designTokens.typography.title2.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.lg
          } as any}>
            Exam Settings
          </Text>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <View>
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                fontWeight: '500'
              }}>
                Timed Exam
              </Text>
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginTop: 2
              }}>
                Set time limit for exam
              </Text>
            </View>
            <Switch
              value={timed}
              onValueChange={setTimed}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={timed ? '#fff' : '#f4f3f4'}
            />
          </View>

          {timed && (
            <View style={{ marginBottom: designTokens.spacing.lg }}>
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginBottom: designTokens.spacing.xs,
                fontWeight: '500'
              }}>
                Duration (minutes)
              </Text>
              <TextInput
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={colors.textTertiary}
                style={{
                  backgroundColor: colors.background,
                  borderRadius: designTokens.borderRadius.lg,
                  padding: designTokens.spacing.md,
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textPrimary,
                  borderWidth: 1,
                  borderColor: colors.border
                }}
              />
            </View>
          )}

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <View>
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                fontWeight: '500'
              }}>
                Allow Retake
              </Text>
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginTop: 2
              }}>
                Students can retake exam
              </Text>
            </View>
            <Switch
              value={allowRetake}
              onValueChange={setAllowRetake}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={allowRetake ? '#fff' : '#f4f3f4'}
            />
          </View>

          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center'
          }}>
            <View>
              <Text style={{
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                fontWeight: '500'
              }}>
                Random Order
              </Text>
              <Text style={{
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginTop: 2
              }}>
                Shuffle questions order
              </Text>
            </View>
            <Switch
              value={randomOrder}
              onValueChange={setRandomOrder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={randomOrder ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Questions Card */}
        <View style={{
          backgroundColor: colors.backgroundElevated,
          borderRadius: designTokens.borderRadius.xl,
          padding: designTokens.spacing.lg,
          ...designTokens.shadows.sm,
          marginBottom: designTokens.spacing.lg
        }}>
          <View style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <Text style={{
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary
            } as any}>
              Questions ({questions.length})
            </Text>
            <TouchableOpacity 
              onPress={addQuestion}
              style={{
                backgroundColor: colors.primary,
                borderRadius: designTokens.borderRadius.full,
                width: 36,
                height: 36,
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Ionicons name="add" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {questions.map((question, qIndex) => (
            <View 
              key={qIndex} 
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                marginBottom: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border
              }}
            >
              <View style={{ 
                flexDirection: 'row', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                marginBottom: designTokens.spacing.md
              }}>
                <Text style={{
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textPrimary,
                  fontWeight: '600'
                }}>
                  Question {qIndex + 1}
                </Text>
                {questions.length > 1 && (
                  <TouchableOpacity onPress={() => removeQuestion(qIndex)}>
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Question Type Selector - Modern Pills */}
              <View style={{ 
                flexDirection: 'row', 
                marginBottom: designTokens.spacing.md,
                backgroundColor: colors.backgroundElevated,
                borderRadius: designTokens.borderRadius.lg,
                padding: 4
              }}>
                <TouchableOpacity
                  onPress={() => updateQuestion(qIndex, 'type', 'multiple_choice')}
                  style={{
                    flex: 1,
                    backgroundColor: question.type === 'multiple_choice' ? colors.primary : 'transparent',
                    borderRadius: designTokens.borderRadius.md,
                    paddingVertical: designTokens.spacing.sm,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: question.type === 'multiple_choice' ? '#fff' : colors.textSecondary,
                    fontWeight: question.type === 'multiple_choice' ? '600' : 'normal'
                  }}>
                    Multiple Choice
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => updateQuestion(qIndex, 'type', 'text')}
                  style={{
                    flex: 1,
                    backgroundColor: question.type === 'text' ? colors.primary : 'transparent',
                    borderRadius: designTokens.borderRadius.md,
                    paddingVertical: designTokens.spacing.sm,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: question.type === 'text' ? '#fff' : colors.textSecondary,
                    fontWeight: question.type === 'text' ? '600' : 'normal'
                  }}>
                    Text Answer
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Question Input */}
              <View style={{ marginBottom: designTokens.spacing.md }}>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginBottom: designTokens.spacing.xs,
                  fontWeight: '500'
                }}>
                  Question *
                </Text>
                <TextInput
                  value={question.question}
                  onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
                  placeholder="Enter your question"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  style={{
                    backgroundColor: 'transparent',
                    borderRadius: designTokens.borderRadius.md,
                    padding: designTokens.spacing.sm,
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    borderWidth: 1,
                    borderColor: colors.border,
                    minHeight: 80
                  }}
                />
              </View>

              {/* Options for Multiple Choice */}
              {question.type === 'multiple_choice' && (
                <View style={{ marginBottom: designTokens.spacing.md }}>
                  <View style={{ 
                    flexDirection: 'row', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    marginBottom: designTokens.spacing.xs
                  }}>
                    <Text style={{
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary,
                      fontWeight: '500'
                    }}>
                      Options *
                    </Text>
                    <TouchableOpacity 
                      onPress={() => addOption(qIndex)}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Ionicons name="add-circle" size={16} color={colors.primary} />
                      <Text style={{
                        fontSize: designTokens.typography.caption1.fontSize,
                        color: colors.primary,
                        marginLeft: 4
                      }}>
                        Add
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {question.options.map((option: string, optIndex: number) => (
                    <View key={optIndex} style={{ 
                      flexDirection: 'row', 
                      alignItems: 'center', 
                      marginBottom: 8 
                    }}>
                      <View style={{ 
                        width: 24, 
                        height: 24, 
                        borderRadius: 12, 
                        backgroundColor: colors.backgroundElevated,
                        borderWidth: 2,
                        borderColor: colors.border,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 8
                      }}>
                        <Text style={{
                          fontSize: designTokens.typography.caption2.fontSize,
                          color: colors.textSecondary
                        }}>
                          {String.fromCharCode(65 + optIndex)}
                        </Text>
                      </View>
                      <TextInput
                        value={option}
                        onChangeText={(text) => updateOption(qIndex, optIndex, text)}
                        placeholder={`Option ${String.fromCharCode(65 + optIndex)}`}
                        placeholderTextColor={colors.textTertiary}
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          borderRadius: designTokens.borderRadius.md,
                          padding: designTokens.spacing.sm,
                          fontSize: designTokens.typography.body.fontSize,
                          color: colors.textPrimary,
                          borderWidth: 1,
                          borderColor: colors.border
                        }}
                      />
                      {question.options.length > 2 && (
                        <TouchableOpacity 
                          onPress={() => {
                            const updatedQuestions = [...questions];
                            updatedQuestions[qIndex].options.splice(optIndex, 1);
                            setQuestions(updatedQuestions);
                          }}
                          style={{ marginLeft: 8 }}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              {/* Correct Answer */}
              <View style={{ marginBottom: designTokens.spacing.md }}>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginBottom: designTokens.spacing.xs,
                  fontWeight: '500'
                }}>
                  {question.type === 'multiple_choice' ? 'Correct Answer *' : 'Expected Answer *'}
                </Text>
                
                {question.type === 'multiple_choice' ? (
                  <View style={{ 
                    flexDirection: 'row', 
                    flexWrap: 'wrap', 
                    gap: 8 
                  }}>
                    {question.options.map((option: string, optIndex: number) => (
                      <TouchableOpacity
                        key={optIndex}
                        onPress={() => updateQuestion(qIndex, 'correct_answer', option)}
                        style={{
                          backgroundColor: question.correct_answer === option ? colors.primary : colors.backgroundElevated,
                          borderRadius: designTokens.borderRadius.lg,
                          paddingVertical: designTokens.spacing.xs,
                          paddingHorizontal: designTokens.spacing.md,
                          borderWidth: 1,
                          borderColor: question.correct_answer === option ? colors.primary : colors.border
                        }}
                      >
                        <Text style={{
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: question.correct_answer === option ? '#fff' : colors.textPrimary,
                          fontWeight: question.correct_answer === option ? '600' : 'normal'
                        }}>
                          {String.fromCharCode(65 + optIndex)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                ) : (
                  <TextInput
                    value={question.correct_answer}
                    onChangeText={(text) => updateQuestion(qIndex, 'correct_answer', text)}
                    placeholder="Enter expected answer"
                    placeholderTextColor={colors.textTertiary}
                    multiline
                    style={{
                      backgroundColor: 'transparent',
                      borderRadius: designTokens.borderRadius.md,
                      padding: designTokens.spacing.sm,
                      fontSize: designTokens.typography.body.fontSize,
                      color: colors.textPrimary,
                      borderWidth: 1,
                      borderColor: colors.border,
                      minHeight: 60
                    }}
                  />
                )}
              </View>

              {/* Points */}
              <View>
                <Text style={{
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginBottom: designTokens.spacing.xs,
                  fontWeight: '500'
                }}>
                  Points
                </Text>
                <View style={{ 
                  flexDirection: 'row', 
                  alignItems: 'center' 
                }}>
                  <TouchableOpacity
                    onPress={() => {
                      const currentPoints = parseInt(question.points) || 1;
                      if (currentPoints > 1) {
                        updateQuestion(qIndex, 'points', (currentPoints - 1).toString());
                      }
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.backgroundElevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Ionicons name="remove" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                  
                  <Text style={{
                    fontSize: designTokens.typography.body.fontSize,
                    color: colors.textPrimary,
                    marginHorizontal: 16,
                    minWidth: 20,
                    textAlign: 'center'
                  }}>
                    {question.points}
                  </Text>
                  
                  <TouchableOpacity
                    onPress={() => {
                      const currentPoints = parseInt(question.points) || 1;
                      updateQuestion(qIndex, 'points', (currentPoints + 1).toString());
                    }}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: colors.backgroundElevated,
                      borderWidth: 1,
                      borderColor: colors.border,
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <Ionicons name="add" size={16} color={colors.textPrimary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={{
            backgroundColor: loading ? colors.textTertiary : colors.primary,
            borderRadius: designTokens.borderRadius.full,
            padding: designTokens.spacing.lg,
            alignItems: 'center',
            marginBottom: designTokens.spacing.xl,
            ...designTokens.shadows.md
          }}
        >
          <Text style={{
            fontSize: designTokens.typography.body.fontSize,
            fontWeight: '600',
            color: '#fff'
          }}>
            {loading ? 'Creating...' : 'Create Exam'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Modals */}
      <PickerModal
        visible={showClassPicker}
        onClose={() => setShowClassPicker(false)}
        data={classes}
        onSelect={(item) => {
          setClassLevel(item.name);
          setSubject(''); // Reset subject when class changes
        }}
        selectedValue={classLevel}
        title="Select Class"
        displayKey="name"
      />

      <PickerModal
        visible={showSubjectPicker}
        onClose={() => setShowSubjectPicker(false)}
        data={subjects}
        onSelect={(item) => setSubject(item.name)}
        selectedValue={subject}
        title="Select Subject"
        displayKey="name"
        loading={loadingSubjects}
      />
    </ScrollView>
  );
}
