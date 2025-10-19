// app/(teacher)/create-exam.tsx - RTL SUPPORT ADDED
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, Switch, Modal, FlatList, ActivityIndicator, Image, Platform, I18nManager } from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../src/contexts/AuthContext';
import { apiService } from '../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '../../src/contexts/ThemeContext';
import { designTokens } from '../../src/utils/designTokens';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from "@/hooks/useTranslation";

export default function CreateExamScreen() {
  const { language, isRTL, t } = useTranslation();
  const { fontFamily, colors } = useThemeContext();
  const { user } = useAuth();
  const { edit } = useLocalSearchParams(); // Get edit parameter
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [classLevel, setClassLevel] = useState('');
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [availableFrom, setAvailableFrom] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState<'dueDate' | 'availableFrom' | null>(null);
  const [showAvailableDatePicker, setShowAvailableDatePicker] = useState(false);

  const [timed, setTimed] = useState(false);
  const [duration, setDuration] = useState('60');
  const [allowRetake, setAllowRetake] = useState(false);
  const [randomOrder, setRandomOrder] = useState(false);
  const [allowImageSubmissions, setAllowImageSubmissions] = useState(false);
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentType, setAttachmentType] = useState<'pdf' | 'image' | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [extractingQuestions, setExtractingQuestions] = useState(false);
  const [showAIOptions, setShowAIOptions] = useState(false);
  const [attachmentBase64, setAttachmentBase64] = useState<string | null>(null);
  const [attachmentMimeType, setAttachmentMimeType] = useState<string | null>(null);

  const [questions, setQuestions] = useState<any[]>([
    {
      question: '',
      type: 'mcq',
      options: ['', ''],
      correct_answer: '',
      points: '1'
    }]
  );
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Load exam data for editing
  useEffect(() => {
    if (edit) {
      setIsEditing(true);
      loadExamForEditing(edit as string);
    } else {
      loadTeacherData();
    }
  }, [edit]);

  const loadExamForEditing = async (examId: string) => {
    try {
      setLoadingData(true);

      // Load exam data
      const examResponse = await apiService.getExamById(examId);
      if (examResponse.data.success && examResponse.data.data) {
        const exam = examResponse.data.data;

        // Populate form with exam data
        setTitle(exam.title);
        setSubject(exam.subject);
        setClassLevel(exam.class);
        setDueDate(exam.due_date ? new Date(exam.due_date) : null);
        setAvailableFrom(exam.available_from ? new Date(exam.available_from) : null);
        setAttachmentUrl(exam.attachment_url || null);
        setAttachmentType(exam.attachment_type === "pdf" || exam.attachment_type === "image" ? exam.attachment_type : null);
        setAttachmentName(exam.attachment_name || null);
        setAllowImageSubmissions(exam.allow_image_submissions || false);


        // Settings
        if (exam.settings) {
          setTimed(exam.settings.timed || false);
          setDuration(exam.settings.duration?.toString() || '60');
          setAllowRetake(exam.settings.allow_retake || false);
          setRandomOrder(exam.settings.random_order || false);
        }

        // Questions
        if (exam.questions && exam.questions.length > 0) {
          setQuestions(exam.questions.map((q: any) => ({
            ...q,
            points: q.points?.toString() || '1'
          })));
        }
      }

      // Load teacher classes for dropdowns
      await loadTeacherData();
    } catch (error) {
      console.error('Failed to load exam for editing:', error);
      Alert.alert(t('common.error'), t('exams.loadFailed'));
      router.back();
    } finally {
      setLoadingData(false);
    }
  };

  // Load teacher's classes
  const loadTeacherData = async () => {
    try {
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
      Alert.alert(t('common.error'), t('exams.loadClassesFailed'));
    } finally {
      if (!edit) {
        setLoadingData(false);
      }
    }
  };

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
        const selectedClass = classes.find((cls) => cls.name === classLevel);
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
        Alert.alert(t('common.error'), t('exams.loadSubjectsFailed'));
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
        type: 'mcq',
        options: ['', ''],
        correct_answer: '',
        points: '1'
      }]
    );
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

  const pickAndUploadAttachment = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.assets || result.assets.length === 0) return;
      const asset = result.assets[0];

      setUploadingAttachment(true);

      const mimeType = asset.mimeType || "application/octet-stream";
      const fileName = asset.name || `file-${Date.now()}`;

      const response = await fetch(asset.uri);
      const blob = await response.blob();
      const base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // FIX: Extract ONLY the base64 part without the prefix
          if (result.includes("base64,")) {
            resolve(result.split("base64,")[1]);
          } else {
            // If no prefix, use the whole result
            resolve(result);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      const uploadResponse = await apiService.api.post("/upload/file", {
        file: `data:${mimeType};base64,${base64Data}`,
        fileName,
        fileType: mimeType,
      });

      if (uploadResponse.data.success && uploadResponse.data.data?.url) {
        const uploadedUrl = uploadResponse.data.data.url;
        const type = mimeType.startsWith("image/")
          ? "image"
          : mimeType === "application/pdf"
            ? "pdf"
            : "other";

        setAttachmentUrl(uploadedUrl);
        setAttachmentType(type);
        setAttachmentName(fileName);
        setAttachmentBase64(base64Data); // This now has JUST the base64 string
        setAttachmentMimeType(mimeType);

        setShowAIOptions(true);
        Alert.alert(t("common.success"), t("exams.fileUploaded"));

        if (mimeType.startsWith("image/") || mimeType === "application/pdf") {
          setShowAIOptions(true);
          setTimeout(() => {
            handleAIExtraction("file", uploadedUrl, fileName, base64Data, mimeType);
          }, 600);
        }

      } else {
        throw new Error(uploadResponse.data.error || "Upload failed");
      }
    } catch (error: any) {
      console.error("Upload error:", error);
      Alert.alert(t("common.error"), error.message || t("exams.fileUploadFailed"));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const handleAIExtraction = async (
    source: "file" | "text",
    content: string,
    fileName?: string,
    base64Data?: string,
    mimeType?: string
  ) => {
    try {
      setExtractingQuestions(true);

      let response;
      if (source === "file") {
        // FIX: Send the data in the correct format that the backend expects
        console.log("Sending extraction request with:", {
          hasBase64Data: !!base64Data,
          fileName,
          mimeType,
          contentLength: content?.length
        });

        response = await apiService.api.post("/ai/extract-from-image", {
          base64Data,      // This should be the base64 string without data URL prefix
          fileName,
          mimeType,
          imageUrl: content // Also send the uploaded URL as imageUrl
        });
      } else if (source === "text") {
        response = await apiService.api.post("/ai/extract-from-text", { text: content });
      }

      const result = response?.data;
      if (!result?.success || !result.data) {
        throw new Error(result?.error || t("exams.extractionFailed"));
      }

      const data = result.data;
      const newQuestions = Array.isArray(data.questions)
        ? data.questions.filter((q) => q.question && q.question.trim().length > 5)
        : [];

      if (newQuestions.length === 0) {
        Alert.alert(t("common.info"), t("exams.noQuestionsFound"));
        return;
      }

      // Merge unique questions
      const merged = [
        ...new Map(
          [...questions, ...newQuestions].map((q) => [q.question.trim(), q])
        ).values(),
      ];

      setQuestions(merged);
      Alert.alert(
        t("common.success"),
        `${merged.length - questions.length} ${t("exams.questionsExtracted")}`
      );
    } catch (error: any) {
      console.error("AI extraction error:", error);
      Alert.alert(t("common.error"), error.message || t("exams.extractionFailed"));
    } finally {
      setExtractingQuestions(false);
    }
  };

  const handleSubmit = async () => {
    if (!title || !subject || !classLevel) {
      Alert.alert(t('common.error'), t('exams.fillRequired'));
      return;
    }

    if (questions.some((q) => !q.question ||
      q.type === 'mcq' && (!q.options.some((opt: string) => opt) || !q.correct_answer))) {
      Alert.alert(t('common.error'), t('exams.completeQuestions'));
      return;
    }

    // Validate date range
    if (availableFrom && dueDate && availableFrom >= dueDate) {
      Alert.alert(t('common.error'), t('exams.dateValidation'));
      return;
    }

    try {
      setLoading(true);

      const examData = {
        title,
        subject,
        class: classLevel,
        available_from: availableFrom ? availableFrom.toISOString() : null,
        due_date: dueDate ? dueDate.toISOString() : null,
        allow_image_submissions: allowImageSubmissions,
        attachment_url: attachmentUrl,
        attachment_type: attachmentType,
        questions: questions.map((q) => ({
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

      let response;
      if (isEditing) {
        // Update existing exam
        response = await apiService.updateExam(edit as string, examData);
      } else {
        // Create new exam
        response = await apiService.createExam(examData);
      }

      if (response.data.success) {
        // ✅ Send push notifications when exam is created/updated
        try {
          // Only send notifications for new exams or when exam becomes active
          if (!isEditing) {
            // Get students in the class to notify them
            const studentsResponse = await apiService.getStudentsByClass(
              classes.find((c) => c.name === classLevel)?.id || ''
            );

            if (studentsResponse.data.success) {
              const students = studentsResponse.data.data || [];
              const studentIds = students.map(student => student.user_id);

              // Send localized bulk notification to all students
              try {
                await apiService.sendBulkLocalizedNotifications(
                  studentIds,
                  'exams.newExamTitle',
                  'exams.newExamBody',
                  {
                    title: title,
                    subject: subject
                  },
                  {
                    screen: 'exam',
                    examId: response.data.data.id,
                    type: 'exam_created'
                  }
                );
                console.log(`✅ Sent localized exam notifications to ${studentIds.length} students`);
              } catch (notificationError) {
                console.log('Failed to send bulk notifications:', notificationError);
                // Fallback: try individual notifications
                for (const student of students) {
                  try {
                    await apiService.sendLocalizedNotification(
                      student.user_id,
                      'exams.newExamTitle',
                      'exams.newExamBody',
                      {
                        title: title,
                        subject: subject
                      },
                      {
                        screen: 'exam',
                        examId: response.data.data.id,
                        type: 'exam_created'
                      }
                    );
                  } catch (individualError) {
                    console.log(`Failed to notify student ${student.id}:`, individualError);
                  }
                }
              }
            }
          }
        } catch (notificationError) {
          console.log('Failed to send notifications:', notificationError);
        }

        Alert.alert(t('common.success'), `${isEditing ? t('exams.updated') : t('exams.created')}!`, [
          { text: t('common.ok'), onPress: () => router.back() }]
        );
      } else {
        Alert.alert(t('common.error'), response.data.error || `${isEditing ? t('exams.updateFailed') : t('exams.createFailed')}`);
      }
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || `${isEditing ? t('exams.updateFailed') : t('exams.createFailed')}`);
    } finally {
      setLoading(false);
    }
  };

  const DatePickerModal = ({
    visible,
    onClose,
    onConfirm,
    initialDate,
    title,
    mode = 'date' // 'date' | 'datetime'
  }: { visible: boolean; onClose: () => void; onConfirm: (date: Date) => void; initialDate: Date; title: string; mode?: 'date' | 'datetime'; }) => {
    const { t, isRTL } = useTranslation();
    const { fontFamily, colors } = useThemeContext();
    const [tempDate, setTempDate] = useState<Date>(initialDate);
    const [selectedMonth, setSelectedMonth] = useState(initialDate.getMonth());
    const [selectedYear, setSelectedYear] = useState(initialDate.getFullYear());
    const [selectedTime, setSelectedTime] = useState({
      hours: initialDate.getHours(),
      minutes: initialDate.getMinutes()
    });

    useEffect(() => {
      if (visible) {
        setTempDate(initialDate);
        setSelectedMonth(initialDate.getMonth());
        setSelectedYear(initialDate.getFullYear());
        setSelectedTime({
          hours: initialDate.getHours(),
          minutes: initialDate.getMinutes()
        });
      }
    }, [visible, initialDate]);

    const handleConfirm = () => {
      const finalDate = new Date(selectedYear, selectedMonth, tempDate.getDate());
      if (mode === 'datetime') {
        finalDate.setHours(selectedTime.hours, selectedTime.minutes);
      }
      onConfirm(finalDate);
      onClose();
    };

    const handleCancel = () => {
      onClose();
    };

    const months = [
      t('months.january'), t('months.february'), t('months.march'), t('months.april'),
      t('months.may'), t('months.june'), t('months.july'), t('months.august'),
      t('months.september'), t('months.october'), t('months.november'), t('months.december')
    ];

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 2);

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

    // Time picker component
    const TimePicker = () =>
      <View style={{
        padding: 16,
        borderRadius: 12,
        backgroundColor: colors.backgroundElevated,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16
      }}>
        <Text style={{
          fontFamily,
          fontSize: 16,
          fontWeight: '600',
          color: colors.textPrimary,
          marginBottom: 12,
          textAlign: isRTL ? 'right' : 'left'
        }}>
          {t('exams.selectTime')}
        </Text>

        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
          {/* Hours */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily, fontSize: 14, color: colors.textSecondary, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{t('exams.hours')}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSelectedTime((prev) => ({
                  ...prev,
                  hours: prev.hours === 0 ? 23 : prev.hours - 1
                }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>

              <Text style={{
                fontFamily,
                fontSize: 20,
                fontWeight: '600',
                color: colors.textPrimary,
                minWidth: 40,
                textAlign: 'center'
              }}>
                {selectedTime.hours.toString().padStart(2, '0')}
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedTime((prev) => ({
                  ...prev,
                  hours: prev.hours === 23 ? 0 : prev.hours + 1
                }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Minutes */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily, fontSize: 14, color: colors.textSecondary, marginBottom: 8, textAlign: isRTL ? 'right' : 'left' }}>{t('exams.minutes')}</Text>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: 8 }}>
              <TouchableOpacity
                onPress={() => setSelectedTime((prev) => ({
                  ...prev,
                  minutes: prev.minutes === 0 ? 55 : prev.minutes - 5
                }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="remove" size={16} color="#fff" />
              </TouchableOpacity>

              <Text style={{
                fontFamily,
                fontSize: 20,
                fontWeight: '600',
                color: colors.textPrimary,
                minWidth: 40,
                textAlign: 'center'
              }}>
                {selectedTime.minutes.toString().padStart(2, '0')}
              </Text>

              <TouchableOpacity
                onPress={() => setSelectedTime((prev) => ({
                  ...prev,
                  minutes: prev.minutes === 55 ? 0 : prev.minutes + 5
                }))}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: colors.primary,
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Ionicons name="add" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>

          {/* AM/PM */}
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontFamily, fontSize: 14, color: colors.textSecondary, marginBottom: 8 }}>&nbsp;</Text>
            <Text style={{
              fontFamily,
              fontSize: 16,
              fontWeight: '600',
              color: colors.textPrimary,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: colors.background,
              borderRadius: 8
            }}>
              {selectedTime.hours >= 12 ? 'PM' : 'AM'}
            </Text>
          </View>
        </View>
      </View>;

    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={handleCancel}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
          {/* Header */}
          <View style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            backgroundColor: colors.backgroundElevated
          }}>
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={{ fontFamily, fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, textAlign: isRTL ? 'right' : 'left' }}>
                {title}
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
                  }}
                  style={{ padding: 8 }}
                >
                  <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={20} color={colors.textPrimary} />
                </TouchableOpacity>

                <Text style={{ fontFamily, fontSize: 18, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' }}>
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
                  }}
                  style={{ padding: 8 }}
                >
                  <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {/* Year Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 8 }}>
                  {years.map((year) =>
                    <TouchableOpacity
                      key={year}
                      onPress={() => {
                        setSelectedYear(year);
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
                        fontWeight: selectedYear === year ? '600' : 'normal',
                        textAlign: 'center'
                      }}>
                        {year}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </ScrollView>
            </View>

            {/* Calendar */}
            <View style={{ marginBottom: 24 }}>
              {/* Weekday Headers */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', marginBottom: 8 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) =>
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
                )}
              </View>

              {/* Calendar Grid */}
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', flexWrap: 'wrap' }}>
                {calendarDays.map((day, index) => {
                  const isSelected = day !== null &&
                    tempDate.getDate() === day &&
                    tempDate.getMonth() === selectedMonth &&
                    tempDate.getFullYear() === selectedYear;

                  const isToday = day !== null &&
                    new Date().getDate() === day &&
                    new Date().getMonth() === selectedMonth &&
                    new Date().getFullYear() === selectedYear;

                  const isPast = day !== null &&
                    new Date(selectedYear, selectedMonth, day) < new Date(new Date().setHours(0, 0, 0, 0));

                  return (
                    <TouchableOpacity
                      key={index}
                      onPress={() => {
                        if (day !== null && !isPast) {
                          const newDate = new Date(selectedYear, selectedMonth, day);
                          setTempDate(newDate);
                        }
                      }}
                      style={{
                        width: '14.28%',
                        height: 40,
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 20,
                        backgroundColor: isSelected ? colors.primary :
                          isToday ? `${colors.primary}20` : 'transparent',
                        borderWidth: isToday && !isSelected ? 1 : 0,
                        borderColor: colors.primary,
                        opacity: day === null || isPast ? 0.5 : 1
                      }}
                      disabled={day === null || isPast}
                    >
                      {day !== null ?
                        <Text style={{
                          fontFamily,
                          fontSize: 16,
                          color: isSelected ? '#fff' :
                            isToday ? colors.primary :
                              colors.textPrimary,
                          fontWeight: isSelected || isToday ? '600' : 'normal',
                          textAlign: 'center'
                        }}>
                          {day}
                        </Text> :
                        null}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Time Picker for datetime mode */}
            {mode === 'datetime' && <TimePicker />}

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
                marginBottom: 4,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t('exams.selectedDate')}
              </Text>
              <Text style={{
                fontFamily,
                fontSize: 18,
                fontWeight: '600',
                color: colors.textPrimary,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {tempDate.toLocaleDateString(language === 'ar' ? 'ar-eg' : 'en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
                {mode === 'datetime' && ` ${t('exams.at')} ${selectedTime.hours.toString().padStart(2, '0')}:${selectedTime.minutes.toString().padStart(2, '0')}`}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', gap: 12, marginBottom: 20 }}>
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
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingHorizontal: 20,
            paddingBottom: 16,
            borderBottomWidth: 1,
            borderBottomColor: colors.border
          }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              textAlign: isRTL ? 'right' : 'left'
            } as any}>
              {title}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {loading ?
            <View style={{ padding: 30, alignItems: 'center' }}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={{
                fontFamily,
                color: colors.textSecondary,
                marginTop: 10,
                fontSize: designTokens.typography.body.fontSize,
                textAlign: 'center'
              }}>
                {t("common.loading")}
              </Text>
            </View> :

            <FlatList
              data={data}
              keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
              renderItem={({ item }) =>
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    onClose();
                  }}
                  style={{
                    padding: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'space-between'
                  }}
                >
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.body.fontSize,
                    color: selectedValue === item[displayKey] ? colors.primary : colors.textPrimary,
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    {item[displayKey]}
                  </Text>
                  {selectedValue === item[displayKey] &&
                    <Ionicons
                      name="checkmark"
                      size={20}
                      color={colors.primary}
                    />
                  }
                </TouchableOpacity>
              }
              ListEmptyComponent={
                <View style={{ padding: 30, alignItems: 'center' }}>
                  <Text style={{
                    fontFamily,
                    color: colors.textSecondary,
                    fontSize: designTokens.typography.body.fontSize,
                    textAlign: 'center'
                  }}>
                    {t("common.noItems")}
                  </Text>
                </View>
              }
            />
          }
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
        alignItems: 'center',
      }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{
          fontFamily,
          color: colors.textSecondary,
          marginTop: designTokens.spacing.md,
          fontSize: designTokens.typography.body.fontSize,
          textAlign: 'center'
        }}>
          {isEditing ? t("exams.loadingExam") : t("exams.loadingClasses")}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, paddingBottom: 70 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={{ padding: designTokens.spacing.xl, paddingBottom: 80 }}>
        <Text style={{
          fontFamily,
          fontSize: designTokens.typography.title1.fontSize,
          fontWeight: designTokens.typography.title1.fontWeight,
          color: colors.textPrimary,
          marginBottom: designTokens.spacing.lg,
          textAlign: isRTL ? 'right' : 'left'
        } as any}>
          {isEditing ? t("exams.edit") : t("exams.create")}
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
            fontFamily,
            fontSize: designTokens.typography.title2.fontSize,
            fontWeight: designTokens.typography.title2.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.lg,
            textAlign: isRTL ? 'right' : 'left'
          } as any}>
            {t("exams.details")}
          </Text>

          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500',
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("exams.title")} *
            </Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder={t("exams.title")}
              placeholderTextColor={colors.textTertiary}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                borderWidth: 1,
                borderColor: colors.border,
                textAlign: isRTL ? 'right' : 'left'
              }}
            />
          </View>

          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500',
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("homework.classRequired")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowClassPicker(true)}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: classLevel ? colors.textPrimary : colors.textTertiary,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {classLevel || t("homework.selectClass")}
              </Text>
              <Ionicons name={isRTL ? "chevron-forward" : "chevron-down"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500',
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("homework.subjectRequired")}
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
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                opacity: classLevel ? 1 : 0.5
              }}
            >
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: subject && classLevel ? colors.textPrimary : colors.textTertiary,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {subject && classLevel ? subject : classLevel ? t("homework.selectSubject") : t("homework.selectClassFirst")}
              </Text>
              <Ionicons name={isRTL ? "chevron-forward" : "chevron-down"} size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            {loadingSubjects &&
              <View style={{ marginTop: 8, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
                <ActivityIndicator size="small" color={colors.primary} />
                <Text style={{
                  fontFamily,
                  color: colors.textSecondary,
                  fontSize: designTokens.typography.caption1.fontSize,
                  marginHorizontal: 8,
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t("exams.loadingSubjects")}
                </Text>
              </View>
            }
          </View>

          {/* Available From */}
          <View style={{ marginBottom: designTokens.spacing.lg }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500',
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("exams.availableFrom")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker('availableFrom')}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: availableFrom ? colors.textPrimary : colors.textTertiary,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {availableFrom ? availableFrom.toLocaleString(language === 'ar' ? 'ar-eg' : 'en-US') : t("exams.selectAvailableDate")}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Due Date */}
          <View>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.footnote.fontSize,
              color: colors.textSecondary,
              marginBottom: designTokens.spacing.xs,
              fontWeight: '500',
              textAlign: isRTL ? 'right' : 'left'
            }}>
              {t("exams.dueDate")}
            </Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker('dueDate')}
              style={{
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                padding: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border,
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: dueDate ? colors.textPrimary : colors.textTertiary,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {dueDate ? dueDate.toLocaleDateString(language === 'ar' ? 'ar-eg' : 'en-US') : t("exams.selectDueDate")}
              </Text>
              <Ionicons name="calendar" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
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
            fontFamily,
            fontSize: designTokens.typography.title2.fontSize,
            fontWeight: designTokens.typography.title2.fontWeight,
            color: colors.textPrimary,
            marginBottom: designTokens.spacing.lg,
            textAlign: isRTL ? 'right' : 'left'
          } as any}>
            {t("exams.settings")}
          </Text>

          <View style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                fontWeight: '500',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.timed")}
              </Text>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginTop: 2,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.timedDesc")}
              </Text>
            </View>
            <Switch
              value={timed}
              onValueChange={setTimed}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={timed ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </View>

          {timed &&
            <View style={{ marginBottom: designTokens.spacing.lg }}>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginBottom: designTokens.spacing.xs,
                fontWeight: '500',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.duration")} (minutes)
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
                  borderColor: colors.border,
                  textAlign: isRTL ? 'right' : 'left'
                }}
              />
            </View>
          }

          <View style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                fontWeight: '500',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.allowRetake")}
              </Text>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginTop: 2,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.allowRetakeDesc")}
              </Text>
            </View>
            <Switch
              value={allowRetake}
              onValueChange={setAllowRetake}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={allowRetake ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </View>

          <View style={{
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.body.fontSize,
                color: colors.textPrimary,
                fontWeight: '500',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.randomOrder")}
              </Text>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginTop: 2,
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.randomOrderDesc")}
              </Text>
            </View>
            <Switch
              value={randomOrder}
              onValueChange={setRandomOrder}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={randomOrder ? '#fff' : '#f4f3f4'}
              style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
            />
          </View>

          {/* Advanced Options Section */}
          <View style={{
            padding: designTokens.spacing.lg,
            backgroundColor: colors.background,
            borderRadius: designTokens.borderRadius.lg,
            marginTop: designTokens.spacing.md
          }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.title3.fontSize,
              fontWeight: designTokens.typography.title3.fontWeight,
              color: colors.textPrimary,
              marginBottom: designTokens.spacing.md,
              textAlign: isRTL ? 'right' : 'left'
            } as any}>
              {t("exams.advancedOptions")}
            </Text>

            <View style={{
              flexDirection: isRTL ? 'row-reverse' : 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: designTokens.spacing.lg
            }}>
              <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                <Text style={{
                  fontFamily,
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textPrimary,
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t("exams.allowImageSubmissions")}
                </Text>
                <Text style={{
                  fontFamily,
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginTop: 2,
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t("exams.allowImageSubmissionsDesc")}
                </Text>
              </View>
              <Switch
                value={allowImageSubmissions}
                onValueChange={setAllowImageSubmissions}
                trackColor={{ false: colors.border, true: colors.primary }}
                thumbColor={allowImageSubmissions ? '#fff' : '#f4f3f4'}
                style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }}
              />
            </View>

            <View>
              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.footnote.fontSize,
                color: colors.textSecondary,
                marginBottom: designTokens.spacing.xs,
                fontWeight: '500',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.attachment")}
              </Text>

              {!attachmentUrl ?
                <TouchableOpacity
                  onPress={pickAndUploadAttachment}
                  disabled={uploadingAttachment}
                  style={{
                    backgroundColor: colors.background,
                    borderRadius: designTokens.borderRadius.lg,
                    padding: designTokens.spacing.md,
                    borderWidth: 1,
                    borderColor: colors.border,
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}
                >
                  {uploadingAttachment ?
                    <>
                      <ActivityIndicator size="small" color={colors.primary} />
                      <Text style={{
                        fontFamily,
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        marginHorizontal: 8,
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {t("exams.uploading")}
                      </Text>
                    </> :

                    <>
                      <Ionicons name="attach" size={20} color={colors.textTertiary} />
                      <Text style={{
                        fontFamily,
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        marginHorizontal: 8,
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {t("exams.addAttachment")}
                      </Text>
                    </>
                  }
                </TouchableOpacity> :

                <View style={{
                  backgroundColor: colors.background,
                  borderRadius: designTokens.borderRadius.lg,
                  padding: designTokens.spacing.md,
                  borderWidth: 1,
                  borderColor: colors.border
                }}>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flex: 1, alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <Text style={{
                        fontFamily,
                        fontSize: designTokens.typography.body.fontSize,
                        color: colors.textPrimary,
                        marginBottom: 4,
                        textAlign: isRTL ? 'right' : 'left'
                      }} numberOfLines={1}>
                        {attachmentName || t("exams.attachment")}
                      </Text>
                      <Text style={{
                        fontFamily,
                        fontSize: designTokens.typography.caption1.fontSize,
                        color: colors.textSecondary,
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {attachmentType?.toUpperCase()} {t("exams.file")}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => {
                        setAttachmentUrl(null);
                        setAttachmentType(null);
                        setAttachmentName(null);
                      }}
                      style={{
                        padding: 8
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  </View>

                  {attachmentType === 'image' &&
                    <Image
                      source={{ uri: attachmentUrl }}
                      style={{
                        width: '100%',
                        height: 100,
                        borderRadius: 8,
                        marginTop: 8
                      }}
                      resizeMode="cover"
                    />
                  }
                </View>
              }

              <Text style={{
                fontFamily,
                fontSize: designTokens.typography.caption1.fontSize,
                color: colors.textTertiary,
                marginTop: 8,
                fontStyle: 'italic',
                textAlign: isRTL ? 'right' : 'left'
              }}>
                {t("exams.attachmentDesc")}
              </Text>
            </View>
            {attachmentUrl && (
              <View style={{
                padding: designTokens.spacing.lg,
                backgroundColor: colors.background,
                borderRadius: designTokens.borderRadius.lg,
                marginTop: designTokens.spacing.md,
                borderWidth: 1,
                borderColor: colors.border
              }}>
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: designTokens.spacing.md
                }}>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.title3.fontSize,
                    fontWeight: designTokens.typography.title3.fontWeight,
                    color: colors.textPrimary,
                    textAlign: isRTL ? 'right' : 'left'
                  } as any}>
                    {t("exams.aiExtraction")}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setShowAIOptions(!showAIOptions)}
                    style={{
                      padding: 8
                    }}
                  >
                    <Ionicons
                      name={showAIOptions ? "chevron-up" : isRTL ? "chevron-forward" : "chevron-down"}
                      size={20}
                      color={colors.textSecondary}
                    />
                  </TouchableOpacity>
                </View>

                {showAIOptions && (
                  <View>
                    <Text
                      style={{
                        fontFamily,
                        fontSize: designTokens.typography.footnote.fontSize,
                        color: colors.textSecondary,
                        marginBottom: designTokens.spacing.md,
                        textAlign: isRTL ? "right" : "left",
                      }}
                    >
                      {t("exams.aiExtractionDesc")}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        handleAIExtraction(
                          "file",
                          attachmentUrl!,
                          attachmentName!,
                          attachmentBase64!,
                          attachmentMimeType!
                        )
                      }
                      disabled={extractingQuestions}
                      style={{
                        backgroundColor: extractingQuestions ? colors.textTertiary : colors.primary,
                        borderRadius: designTokens.borderRadius.lg,
                        padding: designTokens.spacing.md,
                        alignItems: "center",
                        marginBottom: designTokens.spacing.sm,
                      }}
                    >

                      {extractingQuestions ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text
                          style={{
                            fontFamily,
                            fontSize: designTokens.typography.body.fontSize,
                            fontWeight: "600",
                            color: "#fff",
                            textAlign: "center",
                          }}
                        >
                          {attachmentType === "pdf"
                            ? t("exams.extractFromPDF")
                            : t("exams.extractQuestions")}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <Text
                      style={{
                        fontFamily,
                        fontSize: designTokens.typography.caption1.fontSize,
                        color: colors.textTertiary,
                        fontStyle: "italic",
                        textAlign: isRTL ? "right" : "left",
                      }}
                    >
                      {t("exams.aiExtractionNote")}
                    </Text>
                  </View>
                )}
              </View>
            )}
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
            flexDirection: isRTL ? 'row-reverse' : 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: designTokens.spacing.lg
          }}>
            <Text style={{
              fontFamily,
              fontSize: designTokens.typography.title2.fontSize,
              fontWeight: designTokens.typography.title2.fontWeight,
              color: colors.textPrimary,
              textAlign: isRTL ? 'right' : 'left'
            } as any}>
              {t("exams.questions")} ({questions.length})
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

          {questions.map((question, qIndex) =>
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
                flexDirection: isRTL ? 'row-reverse' : 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: designTokens.spacing.md
              }}>
                <Text style={{
                  fontFamily,
                  fontSize: designTokens.typography.body.fontSize,
                  color: colors.textPrimary,
                  fontWeight: '600',
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t("exams.question")} {qIndex + 1}
                </Text>
                {questions.length > 1 &&
                  <TouchableOpacity onPress={() => removeQuestion(qIndex)}>
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </TouchableOpacity>
                }
              </View>

              {/* Question Type Selector - Modern Pills */}
              <View style={{
                flexDirection: isRTL ? 'row-reverse' : 'row',
                marginBottom: designTokens.spacing.md,
                backgroundColor: colors.backgroundElevated,
                borderRadius: designTokens.borderRadius.lg,
                padding: 4
              }}>
                <TouchableOpacity
                  onPress={() => updateQuestion(qIndex, 'type', 'mcq')}
                  style={{
                    flex: 1,
                    backgroundColor: question.type === 'mcq' ? colors.primary : 'transparent',
                    borderRadius: designTokens.borderRadius.md,
                    paddingVertical: designTokens.spacing.sm,
                    alignItems: 'center'
                  }}
                >
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: question.type === 'mcq' ? '#fff' : colors.textSecondary,
                    fontWeight: question.type === 'mcq' ? '600' : 'normal',
                    textAlign: 'center'
                  }}>
                    {t("homework.multipleChoice")}
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
                    fontFamily,
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: question.type === 'text' ? '#fff' : colors.textSecondary,
                    fontWeight: question.type === 'text' ? '600' : 'normal',
                    textAlign: 'center'
                  }}>
                    {t("homework.textAnswer")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Question Input */}
              <View style={{ marginBottom: designTokens.spacing.md }}>
                <Text style={{
                  fontFamily,
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginBottom: designTokens.spacing.xs,
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t("exams.question")} *
                </Text>
                <TextInput
                  value={question.question}
                  onChangeText={(text) => updateQuestion(qIndex, 'question', text)}
                  placeholder={t("exams.enterQuestion")}
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
                    minHeight: 80,
                    textAlign: isRTL ? 'right' : 'left'
                  }}
                />
              </View>

              {/* Options for Multiple Choice */}
              {question.type === 'mcq' &&
                <View style={{ marginBottom: designTokens.spacing.md }}>
                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: designTokens.spacing.xs
                  }}>
                    <Text style={{
                      fontFamily,
                      fontSize: designTokens.typography.footnote.fontSize,
                      color: colors.textSecondary,
                      fontWeight: '500',
                      textAlign: isRTL ? 'right' : 'left'
                    }}>
                      {t("exams.options")} *
                    </Text>
                    <TouchableOpacity
                      onPress={() => addOption(qIndex)}
                      style={{
                        flexDirection: isRTL ? 'row-reverse' : 'row',
                        alignItems: 'center'
                      }}
                    >
                      <Ionicons name="add-circle" size={16} color={colors.primary} />
                      <Text style={{
                        fontFamily,
                        fontSize: designTokens.typography.caption1.fontSize,
                        color: colors.primary,
                        marginHorizontal: 4,
                        textAlign: isRTL ? 'right' : 'left'
                      }}>
                        {t("common.add")}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {question.options.map((option: string, optIndex: number) =>
                    <View key={optIndex} style={{
                      flexDirection: isRTL ? 'row-reverse' : 'row',
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
                        marginHorizontal: 8
                      }}>
                        <Text style={{
                          fontFamily,
                          fontSize: designTokens.typography.caption2.fontSize,
                          color: colors.textSecondary,
                          textAlign: 'center'
                        }}>
                          {String.fromCharCode(65 + optIndex)}
                        </Text>
                      </View>
                      <TextInput
                        value={option}
                        onChangeText={(text) => updateOption(qIndex, optIndex, text)}
                        placeholder={`${t("exams.option")} ${String.fromCharCode(65 + optIndex)}`}
                        placeholderTextColor={colors.textTertiary}
                        style={{
                          flex: 1,
                          backgroundColor: 'transparent',
                          borderRadius: designTokens.borderRadius.md,
                          padding: designTokens.spacing.sm,
                          fontSize: designTokens.typography.body.fontSize,
                          color: colors.textPrimary,
                          borderWidth: 1,
                          borderColor: colors.border,
                          textAlign: isRTL ? 'right' : 'left'
                        }}
                      />

                      {question.options.length > 2 &&
                        <TouchableOpacity
                          onPress={() => {
                            const updatedQuestions = [...questions];
                            updatedQuestions[qIndex].options.splice(optIndex, 1);
                            setQuestions(updatedQuestions);
                          }}
                          style={{ marginHorizontal: 8 }}
                        >
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      }
                    </View>
                  )}
                </View>
              }

              {/* Correct Answer */}
              {question.type === 'mcq' ? (
                <View style={{ marginBottom: designTokens.spacing.md }}>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.footnote.fontSize,
                    color: colors.textSecondary,
                    marginBottom: designTokens.spacing.xs,
                    fontWeight: '500',
                    textAlign: isRTL ? 'right' : 'left'
                  }}>
                    {t("exams.correctAnswer")} *
                  </Text>

                  <View style={{
                    flexDirection: isRTL ? 'row-reverse' : 'row',
                    flexWrap: 'wrap',
                    gap: 8
                  }}>
                    {question.options.map((option: string, optIndex: number) =>
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
                          fontFamily,
                          fontSize: designTokens.typography.footnote.fontSize,
                          color: question.correct_answer === option ? '#fff' : colors.textPrimary,
                          fontWeight: question.correct_answer === option ? '600' : 'normal',
                          textAlign: 'center'
                        }}>
                          {String.fromCharCode(65 + optIndex)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ) : (
                <View style={{ marginBottom: designTokens.spacing.md }}>
                  <Text style={{
                    fontFamily,
                    fontSize: designTokens.typography.caption1.fontSize,
                    color: colors.textSecondary
                  }}>
                    {t("exams.textAnswerNote")}
                  </Text>
                </View>
              )}

              {/* Points */}
              <View>
                <Text style={{
                  fontFamily,
                  fontSize: designTokens.typography.footnote.fontSize,
                  color: colors.textSecondary,
                  marginBottom: designTokens.spacing.xs,
                  fontWeight: '500',
                  textAlign: isRTL ? 'right' : 'left'
                }}>
                  {t("homework.points")}
                </Text>
                <View style={{
                  flexDirection: isRTL ? 'row-reverse' : 'row',
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
                    fontFamily,
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
          )}
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
            fontFamily,
            fontSize: designTokens.typography.body.fontSize,
            fontWeight: '600',
            color: '#fff',
            textAlign: 'center'
          }}>
            {loading ?
              (isEditing ? t("exams.updating") : t("exams.creating")) :
              (isEditing ? t("exams.updateExam") : t("dashboard.createExam"))
            }
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
        title={t("exams.selectClass")}
        displayKey="name"
      />

      <PickerModal
        visible={showSubjectPicker}
        onClose={() => setShowSubjectPicker(false)}
        data={subjects}
        onSelect={(item) => setSubject(item.name)}
        selectedValue={subject}
        title={t("exams.selectSubject")}
        displayKey="name"
        loading={loadingSubjects}
      />

      <DatePickerModal
        visible={showDatePicker !== null}
        onClose={() => setShowDatePicker(null)}
        onConfirm={(date) => {
          if (showDatePicker === 'dueDate') {
            setDueDate(date);
          } else if (showDatePicker === 'availableFrom') {
            setAvailableFrom(date);
          }
        }}
        initialDate={
          showDatePicker === 'dueDate' ?
            dueDate || new Date() :
            availableFrom || new Date()
        }
        title={`${t("exams.select")} ${showDatePicker === 'dueDate' ? t("exams.dueDate") : t("exams.availableFrom")}`}
        mode={showDatePicker === 'availableFrom' ? 'datetime' : 'date'}
      />
    </ScrollView>
  );
}
