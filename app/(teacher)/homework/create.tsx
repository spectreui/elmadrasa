// app/(teacher)/homework/create.tsx - Localized version
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal
} from 'react-native';
import Alert from '@/components/Alert';
import { router } from 'expo-router';
import { useAuth } from '../../../src/contexts/AuthContext';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../../src/contexts/ThemeContext';
import { useTranslation } from '@/hooks/useTranslation';

interface ClassItem {
  id: string;
  name: string;
  class_id: string;
  class_name: string;
  level: any;
  subjects: SubjectItem[];
}

interface SubjectItem {
  id: string;
  name: string;
  code: string;
  join_code?: string;
}

interface Question {
  id: string;
  text: string;
  type: 'text' | 'mcq';
  options?: string[];
  correct_answer?: string;
  points: number;
}

export default function CreateHomeworkScreen() {
  const { user } = useAuth();
  const { fontFamily, colors } = useThemeContext();
  const { t, isRTL } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [teacherClasses, setTeacherClasses] = useState<ClassItem[]>([]);
  const [showClassModal, setShowClassModal] = useState(false);
  const [showSubjectModal, setShowSubjectModal] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState<'start' | 'due' | null>(null);
  const [selectedStartDate, setSelectedStartDate] = useState<Date>(new Date());
  const [selectedDueDate, setSelectedDueDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // 7 days from now

  const [form, setForm] = useState({
    title: '',
    description: '',
    subject_id: '',
    subject_name: '',
    class_id: '',
    class_name: '',
    start_date: '',
    due_date: '',
    points: '10',
    attachments: false,
    allow_questions: false
  });

  const [questions, setQuestions] = useState<Question[]>([
    { id: '1', text: '', type: 'text', points: 1 }
  ]);

  useEffect(() => {
    loadTeacherData();
  }, []);

  const loadTeacherData = async () => {
    try {
      setFetchingData(true);

      const response = await apiService.getTeacherClassesAndSubjects();

      if (response.data.success) {
        const classes = response.data.data?.classes || [];
        setTeacherClasses(classes);

        // Auto-select first class and subject if available
        if (classes.length > 0) {
          const firstClass = classes[0];
          setForm(prev => ({
            ...prev,
            class_id: firstClass.id,
            class_name: firstClass.name
          }));

          if (firstClass.subjects && firstClass.subjects.length > 0) {
            const firstSubject = firstClass.subjects[0];
            setForm(prev => ({
              ...prev,
              subject_id: firstSubject.id,
              subject_name: firstSubject.name
            }));
          }
        }
      }
    } catch (error: any) {
      console.error('Failed to load teacher data:', error);
      Alert.alert(t("common.error"), t("homework.loadDataFailed"));
    } finally {
      setFetchingData(false);
    }
  };

  const handleCreateHomework = async () => {
    if (!form.title || !form.subject_id || !form.class_id || !form.start_date || !form.due_date) {
      Alert.alert(t("homework.missingInfo"), t("homework.fillRequiredFields"));
      return;
    }

    // Validate dates
    const startDate = new Date(form.start_date);
    const dueDate = new Date(form.due_date);

    if (isNaN(startDate.getTime()) || isNaN(dueDate.getTime())) {
      Alert.alert(t("homework.invalidDate"), t("homework.enterValidDates"));
      return;
    }

    if (startDate >= dueDate) {
      Alert.alert(t("homework.invalidDateRange"), t("homework.startBeforeDue"));
      return;
    }

    // Validate points
    const points = parseInt(form.points);
    if (isNaN(points) || points <= 0 || points > 100) {
      Alert.alert(t("homework.invalidPoints"), t("homework.pointsRange"));
      return;
    }

    // Validate questions if enabled
    if (form.allow_questions) {
      for (const question of questions) {
        if (!question.text.trim()) {
          Alert.alert(t("homework.invalidQuestion"), t("homework.questionsNeedText"));
          return;
        }

        if (question.type === 'mcq') {
          if (!question.options || question.options.length < 2) {
            Alert.alert(t("homework.invalidQuestion"), t("homework.mcqMinOptions"));
            return;
          }
          if (!question.options.some(opt => opt.trim())) {
            Alert.alert(t("homework.invalidQuestion"), t("homework.optionsNeedText"));
            return;
          }
        }
      }
    }

    setLoading(true);
    try {
      const homeworkData = {
        title: form.title,
        description: form.description,
        subject: form.subject_name,
        class: form.class_name,
        start_date: form.start_date,
        due_date: form.due_date,
        points: points,
        attachments: form.attachments,
        allow_questions: form.allow_questions,
        questions: form.allow_questions ? questions : [],
        teacher_id: user?.id
      };

      const response = await apiService.createHomework(homeworkData);

      try {
        // Get students in the class to notify them
        const studentsResponse = await apiService.getStudentsByClass(form.class_id);
        if (studentsResponse.data.success) {
          const students = studentsResponse.data.data || [];
          const studentIds = students.map(student => student.user_id);

          // Send localized notification to all students
          await apiService.sendBulkLocalizedNotifications(
            studentIds,
            'homework.newAssignment',
            'homework.newAssignmentBody',
            {
              title: form.title,
              subject: form.subject_name
            },
            {
              screen: 'homework',
              homeworkId: response.data.data.id,
              type: 'homework_assigned'
            }
          );
        }
      } catch (error) {
        console.log('Failed to send bulk notifications:', error);
        // Don't fail the whole operation if notifications fail
      }

      if (response.data.success) {
        Alert.alert(t("common.success"), t("homework.assignedSuccess"), [
          { text: t("common.ok"), onPress: () => router.replace('/(teacher)/homework') }
        ]);
      } else {
        throw new Error(response.data.error || t("homework.createFailed"));
      }
    } catch (error: any) {
      console.error('Homework creation error:', error);
      Alert.alert(t("common.error"), error.response?.data?.error || error.message || t("homework.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Custom Date Picker Component
  const DatePickerModal = () => {
    const [tempDate, setTempDate] = useState<Date>(showDatePicker === 'start' ? selectedStartDate : selectedDueDate);
    const [selectedMonth, setSelectedMonth] = useState(tempDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(tempDate.getFullYear());

    useEffect(() => {
      if (showDatePicker) {
        const date = showDatePicker === 'start' ? selectedStartDate : selectedDueDate;
        setTempDate(date);
        setSelectedMonth(date.getMonth());
        setSelectedYear(date.getFullYear());
      }
    }, [showDatePicker]);

    const handleConfirm = () => {
      if (showDatePicker === 'start') {
        setSelectedStartDate(tempDate);
        setForm({ ...form, start_date: tempDate.toISOString().split('T')[0] });
      } else {
        setSelectedDueDate(tempDate);
        setForm({ ...form, due_date: tempDate.toISOString().split('T')[0] });
      }
      setShowDatePicker(null);
    };

    const handleCancel = () => {
      setShowDatePicker(null);
    };

    const months = [
      t("months.Jan"), t("months.Feb"), t("months.Mar"), t("months.Apr"), t("months.May"), t("months.Jun"),
      t("months.Jul"), t("months.Aug"), t("months.Sep"), t("months.Oct"), t("months.Nov"), t("months.Dec")
    ];

    const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() + i);

    // Generate days for current month
    const getDaysInMonth = (year: number, month: number) => {
      return new Date(year, month + 1, 0).getDate();
    };

    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();

    // Generate calendar grid
    const calendarDays = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      calendarDays.push(null);
    }
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      calendarDays.push(day);
    }

    return (
      <Modal
        visible={!!showDatePicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundElevated
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily, fontSize: 22, fontWeight: 'bold', color: colors.textPrimary }}>
                {showDatePicker === 'start' ? t("homework.selectStartDate") : t("homework.selectDueDate")}
              </Text>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.background
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            {/* Month/Year Selector */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', marginBottom: 16 }}>
                <TouchableOpacity
                  onPress={() => {
                    if (selectedMonth > 0) {
                      setSelectedMonth(selectedMonth - 1);
                    } else {
                      setSelectedMonth(11);
                      setSelectedYear(selectedYear - 1);
                    }
                    setTempDate(new Date(selectedYear, selectedMonth - 1, tempDate.getDate()));
                  }}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="chevron-back" size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={{ fontFamily, fontSize: 18, fontWeight: '600', color: colors.textPrimary }}>
                  {months[selectedMonth]} {selectedYear}
                </Text>

                <TouchableOpacity
                  onPress={() => {
                    if (selectedMonth < 11) {
                      setSelectedMonth(selectedMonth + 1);
                    } else {
                      setSelectedMonth(0);
                      setSelectedYear(selectedYear + 1);
                    }
                    setTempDate(new Date(selectedYear, selectedMonth + 1, tempDate.getDate()));
                  }}
                  style={{ padding: 8 }}
                >
                  <Ionicons name="chevron-forward" size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Year Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                  {years.map((year) => (
                    <TouchableOpacity
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
                        setTempDate(new Date(year, selectedMonth, tempDate.getDate()));
                      }}
                      style={{
                        paddingHorizontal: 16,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor: selectedYear === year ? colors.primary : colors.backgroundElevated,
                        borderWidth: 1,
                        borderColor: selectedYear === year ? colors.primary : colors.border
                      }}
                    >
                      <Text style={{
                        fontFamily,
                        color: selectedYear === year ? '#fff' : colors.textPrimary,
                        fontWeight: selectedYear === year ? '600' : 'normal'
                      }}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            {/* Calendar */}
            <View style={{ marginBottom: 24 }}>
              {/* Weekday Headers */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 8 }}>
                {[t("calendar.sun"), t("calendar.mon"), t("calendar.tue"), t("calendar.wed"), t("calendar.thu"), t("calendar.fri"), t("calendar.sat")].map((day, index) => (
                  <View key={index} style={{ flex: 1, alignItems: 'center' }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 14,
                      fontWeight: '600',
                      color: colors.textSecondary,
                      textAlign: 'center',
                      width: 36
                    }}>
                      {day}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Calendar Grid */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                {calendarDays.map((day, index) => (
                  <TouchableOpacity
                    key={index}
                    onPress={() => {
                      if (day !== null) {
                        setTempDate(new Date(selectedYear, selectedMonth, day));
                      }
                    }}
                    style={{
                      width: '14.28%',
                      height: 40,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 20,
                      backgroundColor: day !== null &&
                        tempDate.getDate() === day &&
                        tempDate.getMonth() === selectedMonth &&
                        tempDate.getFullYear() === selectedYear
                        ? colors.primary
                        : 'transparent'
                    }}
                    disabled={day === null}
                  >
                    {day !== null ? (
                      <Text style={{
                        fontFamily,
                        fontSize: 16,
                        color: tempDate.getDate() === day &&
                          tempDate.getMonth() === selectedMonth &&
                          tempDate.getFullYear() === selectedYear
                          ? '#fff'
                          : new Date(selectedYear, selectedMonth, day) < new Date(new Date().setHours(0, 0, 0, 0))
                            ? colors.textTertiary
                            : colors.textPrimary,
                        fontWeight: tempDate.getDate() === day &&
                          tempDate.getMonth() === selectedMonth &&
                          tempDate.getFullYear() === selectedYear
                          ? '600'
                          : 'normal'
                      }}>
                        {day}
                      </Text>
                    ) : null}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Selected Date Preview */}
            <View style={{
              padding: 16,
              borderRadius: 16,
              backgroundColor: colors.backgroundElevated,
              borderWidth: 1,
              borderColor: colors.border,
              marginBottom: 24
            }}>
              <Text style={{
                fontFamily,
                fontSize: 14,
                color: colors.textSecondary,
                marginBottom: 4
              }}>
                {showDatePicker === 'start' ? t("homework.selectedStartDate") : t("homework.selectedDueDate")}
              </Text>
              <Text style={{
                fontFamily,
                fontSize: 18,
                fontWeight: '600',
                color: colors.textPrimary
              }}>
                {tempDate.toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={handleCancel}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: colors.backgroundElevated,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontFamily,
                  fontSize: 16,
                  fontWeight: '600',
                  color: colors.textPrimary
                }}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirm}
                style={{
                  flex: 1,
                  paddingVertical: 16,
                  borderRadius: 12,
                  backgroundColor: colors.primary,
                  alignItems: 'center'
                }}
              >
                <Text style={{
                  fontFamily,
                  fontSize: 16,
                  fontWeight: '600',
                  color: '#fff'
                }}>
                  {t("common.confirm")}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    );
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return t("homework.selectDate");
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get available subjects for selected class
  const getAvailableSubjects = () => {
    if (!form.class_id) return [];

    const selectedClass = teacherClasses.find(c => c.id === form.class_id);
    return selectedClass?.subjects || [];
  };

  // Question management functions
  const addQuestion = () => {
    const newId = (questions.length + 1).toString();
    setQuestions([
      ...questions,
      { id: newId, text: '', type: 'text', points: 1 }
    ]);
  };

  const updateQuestion = (id: string, field: string, value: any) => {
    setQuestions(questions.map(q =>
      q.id === id ? { ...q, [field]: value } : q
    ));
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const addOption = (questionId: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === 'mcq') {
        const options = q.options || [];
        return { ...q, options: [...options, ''] };
      }
      return q;
    }));
  };

  const updateOption = (questionId: string, optionIndex: number, value: string) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === 'mcq' && q.options) {
        const newOptions = [...q.options];
        newOptions[optionIndex] = value;
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  const removeOption = (questionId: string, optionIndex: number) => {
    setQuestions(questions.map(q => {
      if (q.id === questionId && q.type === 'mcq' && q.options) {
        const newOptions = [...q.options];
        newOptions.splice(optionIndex, 1);
        return { ...q, options: newOptions };
      }
      return q;
    }));
  };

  if (fetchingData) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ fontFamily, marginTop: 16, fontSize: 16, color: colors.textSecondary }}>
          {t("homework.loadingClasses")}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <ScrollView
        style={{ flex: 1, paddingBottom: 0 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* Header */}
        <View style={{
          paddingHorizontal: 20,
          paddingTop: 60,
          paddingBottom: 24,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.backgroundElevated
        }}>
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily, fontSize: 28, fontWeight: '800', marginBottom: 4, color: colors.textPrimary }}>
                {t("homework.new")}
              </Text>
              <Text style={{ fontFamily, fontSize: 16, color: colors.textSecondary }}>
                {t("homework.createAssignment")}
              </Text>
            </View>
            <TouchableOpacity
              style={{
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.background
              }}
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ flex: 1, padding: 20, marginBottom: 80 }}>
          <View style={{
            borderRadius: 20,
            padding: 20,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.backgroundElevated
          }}>
            {/* Basic Info */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ fontFamily, fontSize: 20, fontWeight: '700', marginBottom: 20, color: colors.textPrimary }}>
                {t("homework.assignmentDetails")}
              </Text>

              <View style={{ gap: 20 }}>
                {/* Title */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.titleRequired")}
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      fontSize: 16,
                      color: colors.textPrimary
                    }}
                    placeholder={t("homework.titlePlaceholder")}
                    placeholderTextColor={colors.textTertiary}
                    value={form.title}
                    onChangeText={(text) => setForm({ ...form, title: text })}
                  />
                </View>

                {/* Description */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.description")}
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      fontSize: 16,
                      color: colors.textPrimary,
                      height: 120,
                      textAlignVertical: isRTL ? 'top' : 'bottom'
                    }}
                    placeholder={t("homework.descriptionPlaceholder")}
                    placeholderTextColor={colors.textTertiary}
                    value={form.description}
                    onChangeText={(text) => setForm({ ...form, description: text })}
                    multiline
                  />
                </View>

                {/* Class Selection */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.classRequired")}
                  </Text>
                  <TouchableOpacity
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowClassModal(true)}
                  >
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      color: form.class_name ? colors.textPrimary : colors.textTertiary
                    }}>
                      {form.class_name || t("homework.selectClass")}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Subject Selection */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.subjectRequired")}
                  </Text>
                  <TouchableOpacity
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => form.class_id ? setShowSubjectModal(true) : null}
                    disabled={!form.class_id}
                  >
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      color: form.subject_name && form.class_id ? colors.textPrimary : colors.textTertiary
                    }}>
                      {form.subject_name && form.class_id
                        ? form.subject_name
                        : form.class_id
                          ? t("homework.selectSubject")
                          : t("homework.selectClassFirst")}
                    </Text>
                    <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Date Settings */}
            <View style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 24,
              marginBottom: 24
            }}>
              <Text style={{ fontFamily, fontSize: 20, fontWeight: '700', marginBottom: 20, color: colors.textPrimary }}>
                {t("homework.schedule")}
              </Text>

              <View style={{ gap: 20 }}>
                {/* Start Date */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.startDateRequired")}
                  </Text>
                  <TouchableOpacity
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowDatePicker('start')}
                  >
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      color: form.start_date ? colors.textPrimary : colors.textTertiary
                    }}>
                      {formatDisplayDate(form.start_date)}
                    </Text>
                    <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                {/* Due Date */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.dueDateRequired")}
                  </Text>
                  <TouchableOpacity
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                    onPress={() => setShowDatePicker('due')}
                  >
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      color: form.due_date ? colors.textPrimary : colors.textTertiary
                    }}>
                      {formatDisplayDate(form.due_date)}
                    </Text>
                    <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Settings */}
            <View style={{
              borderTopWidth: 1,
              borderTopColor: colors.border,
              paddingTop: 24,
              marginBottom: 24
            }}>
              <Text style={{ fontFamily, fontSize: 20, fontWeight: '700', marginBottom: 20, color: colors.textPrimary }}>
                {t("homework.settings")}
              </Text>

              <View style={{ gap: 20 }}>
                {/* Points */}
                <View>
                  <Text style={{ fontFamily, fontSize: 16, fontWeight: '600', marginBottom: 12, color: colors.textPrimary }}>
                    {t("homework.totalPoints")}
                  </Text>
                  <TextInput
                    style={{
                      borderRadius: 16,
                      padding: 16,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.background,
                      fontSize: 16,
                      color: colors.textPrimary
                    }}
                    placeholder="10"
                    keyboardType="numeric"
                    value={form.points}
                    onChangeText={(text) => {
                      // Only allow numbers
                      const numericValue = text.replace(/[^0-9]/g, '');
                      if (numericValue === '' || parseInt(numericValue) <= 100) {
                        setForm({ ...form, points: numericValue });
                      }
                    }}
                  />
                </View>

                {/* Allow Questions */}
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.textPrimary
                    }}>
                      {t("homework.includeQuestions")}
                    </Text>
                    <Text style={{
                      fontFamily,
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 4
                    }}>
                      {t("homework.includeQuestionsDesc")}
                    </Text>
                  </View>
                  <Switch
                    value={form.allow_questions}
                    onValueChange={(value) => setForm({ ...form, allow_questions: value })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Attachments */}
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  paddingVertical: 8
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.textPrimary
                    }}>
                      {t("homework.allowAttachments")}
                    </Text>
                    <Text style={{
                      fontFamily,
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 4
                    }}>
                      {t("homework.allowAttachmentsDesc")}
                    </Text>
                  </View>
                  <Switch
                    value={form.attachments}
                    onValueChange={(value) => setForm({ ...form, attachments: value })}
                    trackColor={{ false: colors.border, true: colors.primary }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </View>

            {/* Questions Section */}
            {form.allow_questions && (
              <View style={{
                borderTopWidth: 1,
                borderTopColor: colors.border,
                paddingTop: 24,
                marginBottom: 24
              }}>
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 20
                }}>
                  <Text style={{ fontFamily, fontSize: 20, fontWeight: '700', color: colors.textPrimary }}>
                    {t("homework.questions")}
                  </Text>
                  <TouchableOpacity
                    onPress={addQuestion}
                    style={{
                      paddingHorizontal: 16,
                      paddingVertical: 8,
                      borderRadius: 12,
                      backgroundColor: colors.primary,
                      flexDirection: isRTL ? 'row-reverse' : 'row',
                      alignItems: 'center'
                    }}
                  >
                    <Ionicons name="add" size={16} color="#fff" />
                    <Text style={{
                      fontFamily,
                      color: '#fff',
                      fontWeight: '600',
                      marginLeft: 6
                    }}>
                      {t("common.add")}
                    </Text>
                  </TouchableOpacity>
                </View>

                <View style={{ gap: 16 }}>
                  {questions.map((question, index) => (
                    <View
                      key={question.id}
                      style={{
                        borderRadius: 16,
                        borderWidth: 1,
                        borderColor: colors.border,
                        backgroundColor: colors.background,
                        padding: 16
                      }}
                    >
                      <View style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 16
                      }}>
                        <Text style={{
                          fontFamily,
                          fontSize: 16,
                          fontWeight: '600',
                          color: colors.textPrimary
                        }}>
                          {t("homework.questionNumber")} {index + 1}
                        </Text>
                        {questions.length > 1 && (
                          <TouchableOpacity
                            onPress={() => removeQuestion(question.id)}
                            style={{
                              padding: 6,
                              borderRadius: 12,
                              backgroundColor: '#fee2e2'
                            }}
                          >
                            <Ionicons name="trash" size={16} color="#ef4444" />
                          </TouchableOpacity>
                        )}
                      </View>

                      {/* Question Text */}
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{
                          fontFamily,
                          fontSize: 14,
                          fontWeight: '600',
                          marginBottom: 8,
                          color: colors.textPrimary
                        }}>
                          {t("homework.questionText")}
                        </Text>
                        <TextInput
                          style={{
                            borderRadius: 12,
                            padding: 12,
                            borderWidth: 1,
                            borderColor: colors.border,
                            backgroundColor: colors.backgroundElevated,
                            fontSize: 14,
                            color: colors.textPrimary,
                            minHeight: 60,
                            textAlignVertical: 'top'
                          }}
                          placeholder={t("homework.questionPlaceholder")}
                          placeholderTextColor={colors.textTertiary}
                          value={question.text}
                          onChangeText={(text) => updateQuestion(question.id, 'text', text)}
                          multiline
                        />
                      </View>

                      {/* Question Type */}
                      <View style={{ marginBottom: 16 }}>
                        <Text style={{
                          fontFamily,
                          fontSize: 14,
                          fontWeight: '600',
                          marginBottom: 8,
                          color: colors.textPrimary
                        }}>
                          {t("homework.questionType")}
                        </Text>
                        <View style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          gap: 8
                        }}>
                          <TouchableOpacity
                            onPress={() => updateQuestion(question.id, 'type', 'text')}
                            style={{
                              flex: 1,
                              padding: 12,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: question.type === 'text' ? colors.primary : colors.border,
                              backgroundColor: question.type === 'text' ? `${colors.primary}15` : colors.backgroundElevated
                            }}
                          >
                            <Text style={{
                              fontFamily,
                              textAlign: 'center',
                              color: question.type === 'text' ? colors.primary : colors.textPrimary,
                              fontWeight: question.type === 'text' ? '600' : 'normal'
                            }}>
                              {t("homework.textAnswer")}
                            </Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => {
                              updateQuestion(question.id, 'type', 'mcq');
                              if (!question.options || question.options.length === 0) {
                                updateQuestion(question.id, 'options', ['', '']);
                              }
                            }}
                            style={{
                              flex: 1,
                              padding: 12,
                              borderRadius: 12,
                              borderWidth: 1,
                              borderColor: question.type === 'mcq' ? colors.primary : colors.border,
                              backgroundColor: question.type === 'mcq' ? `${colors.primary}15` : colors.backgroundElevated
                            }}
                          >
                            <Text style={{
                              fontFamily,
                              textAlign: 'center',
                              color: question.type === 'mcq' ? colors.primary : colors.textPrimary,
                              fontWeight: question.type === 'mcq' ? '600' : 'normal'
                            }}>
                              {t("homework.multipleChoice")}
                            </Text>
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Options for Multiple Choice */}
                      {question.type === 'mcq' && (
                        <View style={{ marginBottom: 16 }}>
                          <View style={{
                            flexDirection: isRTL ? 'row-reverse' : 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 8
                          }}>
                            <Text style={{
                              fontFamily,
                              fontSize: 14,
                              fontWeight: '600',
                              color: colors.textPrimary
                            }}>
                              {t("homework.options")}
                            </Text>
                            <TouchableOpacity
                              onPress={() => addOption(question.id)}
                              style={{
                                paddingHorizontal: 12,
                                paddingVertical: 6,
                                borderRadius: 8,
                                backgroundColor: colors.primary
                              }}
                            >
                              <Text style={{
                                fontFamily,
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: '600'
                              }}>
                                {t("homework.addOption")}
                              </Text>
                            </TouchableOpacity>
                          </View>

                          {question.options?.map((option, optionIndex) => (
                            <View
                              key={optionIndex}
                              style={{
                                flexDirection: isRTL ? 'row-reverse' : 'row',
                                alignItems: 'center',
                                marginBottom: 8
                              }}
                            >
                              <View style={{
                                width: 24,
                                height: 24,
                                borderRadius: 12,
                                backgroundColor: colors.backgroundElevated,
                                borderWidth: 1,
                                borderColor: colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                                marginRight: !isRTL ? 12 : 0,
                                marginLeft: isRTL ? 12 : 0
                              }}>
                                <Text style={{
                                  fontFamily,
                                  fontSize: 12,
                                  color: colors.textSecondary
                                }}>
                                  {String.fromCharCode(65 + optionIndex)}
                                </Text>
                              </View>
                              <TextInput
                                style={{
                                  flex: 1,
                                  borderRadius: 12,
                                  padding: 12,
                                  borderWidth: 1,
                                  borderColor: colors.border,
                                  backgroundColor: colors.backgroundElevated,
                                  fontSize: 14,
                                  color: colors.textPrimary
                                }}
                                placeholder={`${t("homework.option")} ${String.fromCharCode(65 + optionIndex)}`}
                                placeholderTextColor={colors.textTertiary}
                                value={option}
                                onChangeText={(text) => updateOption(question.id, optionIndex, text)}
                              />
                              {question.options.length > 2 && (
                                <TouchableOpacity
                                  onPress={() => removeOption(question.id, optionIndex)}
                                  style={{
                                    padding: 8,
                                    marginLeft: !isRTL ? 8 : 0,
                                    marginRight: isRTL ? 8 : 0
                                  }}
                                >
                                  <Ionicons name="close-circle" size={20} color="#ef4444" />
                                </TouchableOpacity>
                              )}
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Points */}
                      <View>
                        <Text style={{
                          fontFamily,
                          fontSize: 14,
                          fontWeight: '600',
                          marginBottom: 8,
                          color: colors.textPrimary
                        }}>
                          {t("common.points")}
                        </Text>
                        <View style={{
                          flexDirection: isRTL ? 'row-reverse' : 'row',
                          alignItems: 'center'
                        }}>
                          <TouchableOpacity
                            onPress={() => {
                              const currentPoints = question.points > 1 ? question.points - 1 : 1;
                              updateQuestion(question.id, 'points', currentPoints);
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
                            fontFamily,
                            fontSize: 16,
                            color: colors.textPrimary,
                            marginHorizontal: 16,
                            minWidth: 20,
                            textAlign: 'center'
                          }}>
                            {question.points}
                          </Text>

                          <TouchableOpacity
                            onPress={() => {
                              const currentPoints = question.points < 10 ? question.points + 1 : 10;
                              updateQuestion(question.id, 'points', currentPoints);
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
              </View>
            )}

            {/* Create Button */}
            <TouchableOpacity
              style={{
                paddingVertical: 18,
                borderRadius: 16,
                backgroundColor: loading || !form.title || !form.subject_id || !form.class_id || !form.start_date || !form.due_date
                  ? colors.textTertiary
                  : colors.primary,
                alignItems: 'center',
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'center',
                marginTop: 8
              }}
              onPress={handleCreateHomework}
              disabled={loading || !form.title || !form.subject_id || !form.class_id || !form.start_date || !form.due_date}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Ionicons name="book" size={20} color="#ffffff" />
                  <Text style={{
                    fontFamily,
                    color: '#ffffff',
                    fontSize: 18,
                    fontWeight: '700',
                    marginLeft: !isRTL ? 10 : 0,
                    marginRight: isRTL ? 10 : 0,
                  }}>
                    {t("homework.assign")}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundElevated
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily, fontSize: 22, fontWeight: 'bold', color: colors.textPrimary }}>
                {t("homework.selectClass")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowClassModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.background
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{ padding: 20, gap: 12 }}>
              {teacherClasses.map((classItem) => (
                <TouchableOpacity
                  key={classItem.id}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: form.class_id === classItem.id ? colors.primary : colors.border,
                    backgroundColor: form.class_id === classItem.id ? `${colors.primary}10` : colors.backgroundElevated,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onPress={() => {
                    setForm({
                      ...form,
                      class_id: classItem.id,
                      class_name: classItem.name,
                      subject_id: '', // Reset subject when class changes
                      subject_name: ''
                    });
                    setShowClassModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.textPrimary
                    }}>
                      {classItem.name}
                    </Text>
                    <Text style={{
                      fontFamily,
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 4
                    }}>
                      {classItem.level?.name || t("homework.levelNotSpecified")} • {classItem.subjects?.length || 0} {classItem.subjects?.length !== 1 ? t("homework.subjects") : t("homework.subject")}
                    </Text>
                  </View>
                  {form.class_id === classItem.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {teacherClasses.length === 0 && (
                <View style={{
                  padding: 32,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
                  <Text style={{
                    fontFamily,
                    fontSize: 16,
                    color: colors.textSecondary,
                    marginTop: 16,
                    textAlign: 'center'
                  }}>
                    {t("homework.noClassesFound")}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Subject Selection Modal */}
      <Modal
        visible={showSubjectModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowSubjectModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundElevated
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily, fontSize: 22, fontWeight: 'bold', color: colors.textPrimary }}>
                {t("homework.selectSubject")}
              </Text>
              <TouchableOpacity
                onPress={() => setShowSubjectModal(false)}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.background
                }}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={{ flex: 1 }}>
            <View style={{ padding: 20, gap: 12 }}>
              {getAvailableSubjects().map((subject) => (
                <TouchableOpacity
                  key={subject.id}
                  style={{
                    padding: 16,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: form.subject_id === subject.id ? colors.primary : colors.border,
                    backgroundColor: form.subject_id === subject.id ? `${colors.primary}10` : colors.backgroundElevated,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onPress={() => {
                    setForm({
                      ...form,
                      subject_id: subject.id,
                      subject_name: subject.name
                    });
                    setShowSubjectModal(false);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={{
                      fontFamily,
                      fontSize: 16,
                      fontWeight: '600',
                      color: colors.textPrimary
                    }}>
                      {subject.name}
                    </Text>
                    <Text style={{
                      fontFamily,
                      fontSize: 14,
                      color: colors.textSecondary,
                      marginTop: 4
                    }}>
                      {t("homework.code")}: {subject.code}
                    </Text>
                  </View>
                  {form.subject_id === subject.id && (
                    <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}

              {getAvailableSubjects().length === 0 && (
                <View style={{
                  padding: 32,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Ionicons name="book-outline" size={48} color={colors.textTertiary} />
                  <Text style={{
                    fontFamily,
                    fontSize: 16,
                    color: colors.textSecondary,
                    marginTop: 16,
                    textAlign: 'center'
                  }}>
                    {t("homework.noSubjectsFound")}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Custom Date Picker Modal */}
      <DatePickerModal />
    </KeyboardAvoidingView>
  );
}