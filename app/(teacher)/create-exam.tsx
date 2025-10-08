// app/(teacher)/create-exam.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";
import { Question, Exam } from "../../src/types";

interface QuestionForm {
  id: string;
  question: string;
  type: "mcq" | "text" | "multiple";
  options: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
}

interface ExamForm {
  title: string;
  description: string;
  subject: string;
  class: string;
  settings: {
    timed: boolean;
    duration: number;
    allow_retake: boolean;
    random_order: boolean;
    shuffle_questions: boolean;
    show_results: boolean;
  };
  questions: QuestionForm[];
}

export default function CreateExamScreen() {
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [editingQuestionIndex, setEditingQuestionIndex] = useState<number | null>(null);

  const [form, setForm] = useState<ExamForm>({
    title: "",
    description: "",
    subject: "",
    class: user?.profile.class || "",
    settings: {
      timed: false,
      duration: 60,
      allow_retake: false,
      random_order: false,
      shuffle_questions: false,
      show_results: true,
    },
    questions: [],
  });

  useEffect(() => {
    if (id) {
      loadExamForEditing();
    }
  }, [id]);

  const loadExamForEditing = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamById(id as string);

      if (response.data.success && response.data.data) { // Add null check
        const exam: Exam = response.data.data;
        setIsEditing(true);

        setForm({
          title: exam.title,
          description: exam.description || "",
          subject: exam.subject,
          class: exam.class,
          settings: {
            timed: exam.settings.timed,
            duration: exam.settings.duration || 60,
            allow_retake: exam.settings.allow_retake,
            random_order: exam.settings.random_order,
            shuffle_questions: exam.settings.shuffleQuestions || false,
            show_results: exam.settings.showResults || true,
          },
          questions: exam.questions?.map((q: Question) => ({
            id: q.id,
            question: q.question,
            type: q.type,
            options: q.options || [],
            correct_answer: q.correct_answer,
            points: q.points,
            explanation: q.explanation,
          })) || [],
        });
      } else {
        Alert.alert('Error', 'Exam not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load exam for editing:', error);
      Alert.alert('Error', 'Failed to load exam data');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    if (!form.title.trim()) {
      Alert.alert("Validation Error", "Please enter an exam title");
      return false;
    }
    if (!form.subject.trim()) {
      Alert.alert("Validation Error", "Please enter a subject");
      return false;
    }
    if (!form.class.trim()) {
      Alert.alert("Validation Error", "Please enter a class");
      return false;
    }
    if (form.questions.length === 0) {
      Alert.alert("Validation Error", "Please add at least one question");
      return false;
    }

    for (const question of form.questions) {
      if (!question.question.trim()) {
        Alert.alert("Validation Error", "Please fill in all questions");
        return false;
      }
      if (question.type === "mcq" && question.options.some(opt => !opt.trim())) {
        Alert.alert("Validation Error", "Please fill in all options for multiple choice questions");
        return false;
      }
      if (question.type === "mcq" && !question.correct_answer.trim()) {
        Alert.alert("Validation Error", "Please select a correct answer for multiple choice questions");
        return false;
      }
    }

    return true;
  };

  const handleSaveExam = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (isEditing) {
        const response = await apiService.updateExam(id as string, form);
        if (response.data.success) {
          Alert.alert("Success", "Exam updated successfully!");
          router.back();
        }
      } else {
        const response = await apiService.createExam(form);
        if (response.data.success) {
          Alert.alert("Success", "Exam created successfully!");
          router.back();
        }
      }
    } catch (error: any) {
      console.error('Exam save error:', error);
      Alert.alert("Error", error.message || `Failed to ${isEditing ? 'update' : 'create'} exam`);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    setEditingQuestionIndex(null);
    setShowQuestionModal(true);
  };

  const editQuestion = (index: number) => {
    setEditingQuestionIndex(index);
    setShowQuestionModal(true);
  };

  const deleteQuestion = (index: number) => {
    Alert.alert(
      "Delete Question",
      "Are you sure you want to delete this question?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            setForm(prev => ({
              ...prev,
              questions: prev.questions.filter((_, i) => i !== index)
            }));
          }
        }
      ]
    );
  };

  const duplicateQuestion = (index: number) => {
    const questionToDuplicate = form.questions[index];
    setForm(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          ...questionToDuplicate,
          id: Date.now().toString(),
          question: `${questionToDuplicate.question} (Copy)`
        }
      ]
    }));
  };

  const getTotalPoints = () => {
    return form.questions.reduce((sum, question) => sum + question.points, 0);
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#007AFF" />
        <Text className="text-gray-600 mt-4 text-base font-medium">
          {isEditing ? "Loading exam..." : "Preparing..."}
        </Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-50"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-6 border-b border-gray-100">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900 mb-1">
                {isEditing ? "Edit Exam" : "Create New Exam"}
              </Text>
              <Text className="text-gray-500 text-base font-medium">
                {isEditing ? "Update your exam details" : "Design a new assessment for your class"}
              </Text>
            </View>
            <TouchableOpacity
              className="w-10 h-10 bg-gray-100 rounded-full items-center justify-center"
              onPress={() => router.back()}
            >
              <Ionicons name="close" size={20} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <View className="p-6">
          <View className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm space-y-6">
            {/* Basic Info */}
            <View className="space-y-4">
              <Text className="text-xl font-semibold text-gray-900">Exam Details</Text>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Title *</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                  placeholder="Enter exam title"
                  placeholderTextColor="#8E8E93"
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                />
              </View>

              <View>
                <Text className="text-sm font-semibold text-gray-700 mb-2">Description</Text>
                <TextInput
                  className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base h-24"
                  placeholder="Enter exam description and instructions..."
                  placeholderTextColor="#8E8E93"
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  multiline
                  textAlignVertical="top"
                />
              </View>

              <View className="grid grid-cols-2 gap-4">
                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Subject *</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                    placeholder="e.g., Mathematics"
                    placeholderTextColor="#8E8E93"
                    value={form.subject}
                    onChangeText={(text) => setForm({ ...form, subject: text })}
                  />
                </View>

                <View>
                  <Text className="text-sm font-semibold text-gray-700 mb-2">Class *</Text>
                  <TextInput
                    className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                    placeholder="e.g., 10A"
                    placeholderTextColor="#8E8E93"
                    value={form.class}
                    onChangeText={(text) => setForm({ ...form, class: text })}
                  />
                </View>
              </View>
            </View>

            {/* Settings */}
            <View className="border-t border-gray-100 pt-6">
              <Text className="text-xl font-semibold text-gray-900 mb-4">Exam Settings</Text>

              <View className="space-y-4">
                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold">Timed Exam</Text>
                    <Text className="text-gray-500 text-sm">Set time limit for the exam</Text>
                  </View>
                  <Switch
                    value={form.settings.timed}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, timed: value },
                      })
                    }
                    trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {form.settings.timed && (
                  <View>
                    <Text className="text-sm font-semibold text-gray-700 mb-2">Duration (minutes)</Text>
                    <TextInput
                      className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                      placeholder="60"
                      keyboardType="numeric"
                      value={form.settings.duration.toString()}
                      onChangeText={(text) =>
                        setForm({
                          ...form,
                          settings: {
                            ...form.settings,
                            duration: parseInt(text) || 60,
                          },
                        })
                      }
                    />
                  </View>
                )}

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold">Allow Retake</Text>
                    <Text className="text-gray-500 text-sm">Students can retake the exam</Text>
                  </View>
                  <Switch
                    value={form.settings.allow_retake}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, allow_retake: value },
                      })
                    }
                    trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold">Random Question Order</Text>
                    <Text className="text-gray-500 text-sm">Shuffle questions for each student</Text>
                  </View>
                  <Switch
                    value={form.settings.random_order}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, random_order: value },
                      })
                    }
                    trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                    thumbColor="#ffffff"
                  />
                </View>

                <View className="flex-row justify-between items-center">
                  <View className="flex-1">
                    <Text className="text-gray-700 font-semibold">Show Results</Text>
                    <Text className="text-gray-500 text-sm">Show scores to students after completion</Text>
                  </View>
                  <Switch
                    value={form.settings.show_results}
                    onValueChange={(value) =>
                      setForm({
                        ...form,
                        settings: { ...form.settings, show_results: value },
                      })
                    }
                    trackColor={{ false: '#f0f0f0', true: '#007AFF' }}
                    thumbColor="#ffffff"
                  />
                </View>
              </View>
            </View>

            {/* Questions Section */}
            <View className="border-t border-gray-100 pt-6">
              <View className="flex-row justify-between items-center mb-4">
                <View>
                  <Text className="text-xl font-semibold text-gray-900">Questions</Text>
                  <Text className="text-gray-500 text-sm mt-1">
                    {form.questions.length} questions • {getTotalPoints()} total points
                  </Text>
                </View>
                <TouchableOpacity
                  className="bg-blue-500 px-4 py-3 rounded-xl flex-row items-center shadow-sm"
                  onPress={addQuestion}
                >
                  <Ionicons name="add" size={20} color="white" />
                  <Text className="text-white font-semibold text-base ml-2">Add Question</Text>
                </TouchableOpacity>
              </View>

              {form.questions.length === 0 ? (
                <View className="bg-gray-50 rounded-2xl p-8 items-center border border-gray-200 border-dashed">
                  <Ionicons name="help-circle" size={48} color="#9CA3AF" />
                  <Text className="text-gray-500 text-lg font-medium mt-4">No questions yet</Text>
                  <Text className="text-gray-400 text-sm text-center mt-2">
                    Add your first question to get started
                  </Text>
                </View>
              ) : (
                <View className="space-y-3">
                  {form.questions.map((question, index) => (
                    <View
                      key={question.id}
                      className="border border-gray-200 rounded-xl p-4 bg-white"
                    >
                      <View className="flex-row justify-between items-start mb-3">
                        <View className="flex-1">
                          <Text className="text-gray-900 font-semibold text-base mb-1">
                            Q{index + 1}. {question.question}
                          </Text>
                          <View className="flex-row items-center space-x-3">
                            <View className="bg-blue-100 px-2 py-1 rounded-full">
                              <Text className="text-blue-600 text-xs font-semibold capitalize">
                                {question.type}
                              </Text>
                            </View>
                            <View className="bg-green-100 px-2 py-1 rounded-full">
                              <Text className="text-green-600 text-xs font-semibold">
                                {question.points} pt{question.points !== 1 ? 's' : ''}
                              </Text>
                            </View>
                          </View>
                        </View>
                        <View className="flex-row space-x-1">
                          <TouchableOpacity
                            className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
                            onPress={() => editQuestion(index)}
                          >
                            <Ionicons name="create" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="w-8 h-8 bg-gray-100 rounded-lg items-center justify-center"
                            onPress={() => duplicateQuestion(index)}
                          >
                            <Ionicons name="copy" size={16} color="#6B7280" />
                          </TouchableOpacity>
                          <TouchableOpacity
                            className="w-8 h-8 bg-red-50 rounded-lg items-center justify-center"
                            onPress={() => deleteQuestion(index)}
                          >
                            <Ionicons name="trash" size={16} color="#EF4444" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {question.type === "mcq" && (
                        <View className="mt-2">
                          <Text className="text-gray-600 text-sm font-medium mb-2">Options:</Text>
                          {question.options.map((option, optIndex) => (
                            <View key={optIndex} className="flex-row items-center space-x-2 mb-1">
                              <View className={`w-4 h-4 rounded-full border-2 ${option === question.correct_answer
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300'
                                }`} />
                              <Text className="text-gray-700 text-sm flex-1">
                                {option}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-4 flex-row justify-center items-center mt-6 shadow-sm"
              onPress={handleSaveExam}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="white" />
                  <Text className="text-white font-semibold text-lg ml-2">
                    {isEditing ? "Update Exam" : "Create Exam"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Question Modal */}
      <QuestionModal
        visible={showQuestionModal}
        question={editingQuestionIndex !== null ? form.questions[editingQuestionIndex] : null}
        onSave={(questionData) => {
          if (editingQuestionIndex !== null) {
            // Update existing question
            setForm(prev => ({
              ...prev,
              questions: prev.questions.map((q, i) =>
                i === editingQuestionIndex ? questionData : q
              )
            }));
          } else {
            // Add new question
            setForm(prev => ({
              ...prev,
              questions: [...prev.questions, questionData]
            }));
          }
          setShowQuestionModal(false);
          setEditingQuestionIndex(null);
        }}
        onClose={() => {
          setShowQuestionModal(false);
          setEditingQuestionIndex(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

// Question Modal Component
interface QuestionModalProps {
  visible: boolean;
  question: QuestionForm | null;
  onSave: (question: QuestionForm) => void;
  onClose: () => void;
}

function QuestionModal({ visible, question, onSave, onClose }: QuestionModalProps) {
  const [form, setForm] = useState<QuestionForm>({
    id: Date.now().toString(),
    question: "",
    type: "mcq",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1,
    explanation: "",
  });

  useEffect(() => {
    if (question) {
      setForm(question);
    } else {
      setForm({
        id: Date.now().toString(),
        question: "",
        type: "mcq",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 1,
        explanation: "",
      });
    }
  }, [question, visible]);

  const handleSave = () => {
    if (!form.question.trim()) {
      Alert.alert("Error", "Please enter a question");
      return;
    }

    if (form.type === "mcq" && form.options.some(opt => !opt.trim())) {
      Alert.alert("Error", "Please fill in all options");
      return;
    }

    if (form.type === "mcq" && !form.correct_answer.trim()) {
      Alert.alert("Error", "Please select a correct answer");
      return;
    }

    onSave(form);
  };

  const updateOption = (index: number, value: string) => {
    const newOptions = [...form.options];
    newOptions[index] = value;
    setForm(prev => ({ ...prev, options: newOptions }));
  };

  const addOption = () => {
    setForm(prev => ({ ...prev, options: [...prev.options, ""] }));
  };

  const removeOption = (index: number) => {
    if (form.options.length <= 2) {
      Alert.alert("Error", "Multiple choice questions must have at least 2 options");
      return;
    }
    const newOptions = form.options.filter((_, i) => i !== index);
    setForm(prev => ({
      ...prev,
      options: newOptions,
      correct_answer: prev.correct_answer === prev.options[index] ? "" : prev.correct_answer
    }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="bg-white px-6 pt-16 pb-4 border-b border-gray-100">
          <View className="flex-row justify-between items-center">
            <Text className="text-xl font-bold text-gray-900">
              {question ? "Edit Question" : "Add Question"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#8E8E93" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView className="flex-1 p-6" showsVerticalScrollIndicator={false}>
          <View className="space-y-6">
            {/* Question Text */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Question *</Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base h-32"
                placeholder="Enter your question..."
                placeholderTextColor="#8E8E93"
                value={form.question}
                onChangeText={(text) => setForm(prev => ({ ...prev, question: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Question Type */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Question Type</Text>
              <View className="flex-row space-x-2">
                {[
                  { key: "mcq" as const, label: "Multiple Choice", icon: "radio-button-on" },
                  { key: "text" as const, label: "Text Answer", icon: "document-text" },
                ].map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    className={`flex-1 py-3 rounded-xl border-2 flex-row justify-center items-center ${form.type === type.key
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 bg-white"
                      }`}
                    onPress={() => setForm(prev => ({ ...prev, type: type.key }))}
                  >
                    <Ionicons
                      name={type.icon as any}
                      size={16}
                      color={form.type === type.key ? "#007AFF" : "#6B7280"}
                    />
                    <Text
                      className={`ml-2 text-sm font-semibold ${form.type === type.key ? "text-blue-600" : "text-gray-600"
                        }`}
                    >
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Points */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Points</Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base"
                placeholder="1"
                keyboardType="numeric"
                value={form.points.toString()}
                onChangeText={(text) => setForm(prev => ({ ...prev, points: parseInt(text) || 1 }))}
              />
            </View>

            {/* MCQ Options */}
            {form.type === "mcq" && (
              <View>
                <View className="flex-row justify-between items-center mb-3">
                  <Text className="text-sm font-semibold text-gray-700">Options *</Text>
                  <TouchableOpacity
                    className="bg-green-500 px-3 py-2 rounded-lg flex-row items-center"
                    onPress={addOption}
                  >
                    <Ionicons name="add" size={16} color="white" />
                    <Text className="text-white font-semibold text-sm ml-1">Add Option</Text>
                  </TouchableOpacity>
                </View>

                <View className="space-y-3">
                  {form.options.map((option, index) => (
                    <View key={index} className="flex-row items-center space-x-3">
                      <TouchableOpacity
                        className={`w-6 h-6 rounded-full border-2 items-center justify-center ${form.correct_answer === option
                            ? "bg-green-500 border-green-500"
                            : "border-gray-300"
                          }`}
                        onPress={() => setForm(prev => ({ ...prev, correct_answer: option }))}
                      >
                        {form.correct_answer === option && (
                          <Ionicons name="checkmark" size={14} color="white" />
                        )}
                      </TouchableOpacity>

                      <TextInput
                        className="flex-1 border border-gray-200 rounded-xl p-3 bg-white text-gray-900 text-base"
                        placeholder={`Option ${index + 1}`}
                        placeholderTextColor="#8E8E93"
                        value={option}
                        onChangeText={(text) => updateOption(index, text)}
                      />

                      {form.options.length > 2 && (
                        <TouchableOpacity
                          className="w-10 h-10 bg-red-50 rounded-lg items-center justify-center"
                          onPress={() => removeOption(index)}
                        >
                          <Ionicons name="trash" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            )}

            {/* Explanation */}
            <View>
              <Text className="text-sm font-semibold text-gray-700 mb-2">Explanation (Optional)</Text>
              <TextInput
                className="border border-gray-200 rounded-xl p-4 bg-white text-gray-900 text-base h-24"
                placeholder="Add explanation for the correct answer..."
                placeholderTextColor="#8E8E93"
                value={form.explanation}
                onChangeText={(text) => setForm(prev => ({ ...prev, explanation: text }))}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              className="bg-blue-500 rounded-xl p-4 flex-row justify-center items-center mt-4"
              onPress={handleSave}
            >
              <Ionicons name="checkmark" size={20} color="white" />
              <Text className="text-white font-semibold text-lg ml-2">
                {question ? "Update Question" : "Add Question"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}