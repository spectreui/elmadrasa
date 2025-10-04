// app/(teacher)/create-exam.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Ionicons } from "@expo/vector-icons";

// app/(teacher)/create-exam.tsx - Fix the interfaces
interface QuestionForm {
  id?: string; // Make ID optional
  question: string;
  type: "mcq" | "text";
  options: string[];
  correct_answer: string;
  points: number;
}

interface ExamForm {
  title: string;
  subject: string;
  class: string;
  settings: {
    timed: boolean;
    duration: number;
    allow_retake: boolean;
    random_order: boolean;
  };
  questions: QuestionForm[];
}

export default function CreateExamScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  // Update the initial state to include IDs
  const [form, setForm] = useState<ExamForm>({
    title: "",
    subject: "",
    class: user?.profile.class || "",
    settings: {
      timed: false,
      duration: 60,
      allow_retake: false,
      random_order: false,
    },
    questions: [
      {
        id: "1", // Add ID here
        question: "",
        type: "mcq",
        options: ["", "", "", ""],
        correct_answer: "",
        points: 1,
      },
    ],
  });

  const handleCreateExam = async () => {
    if (!form.title || !form.subject || !form.class) {
      Alert.alert("Error", "Please fill in all required fields");
      return;
    }

    // Validate questions
    for (const question of form.questions) {
      if (!question.question.trim()) {
        Alert.alert("Error", "Please fill in all questions");
        return;
      }
      if (
        question.type === "mcq" &&
        question.options.some((opt) => !opt.trim())
      ) {
        Alert.alert(
          "Error",
          "Please fill in all options for multiple choice questions"
        );
        return;
      }
    }

    setLoading(true);
    try {
      const response = await apiService.createExam(form);
      if (response.data.success) {
        Alert.alert("Success", "Exam created successfully!");
        router.back();
      }
    } catch (error) {
      Alert.alert("Error", "Failed to create exam"); 
    } finally {
      setLoading(false);
    }
  };

  // Update addQuestion to generate IDs
  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: Date.now().toString(), // Generate unique ID
          question: "",
          type: "mcq",
          options: ["", "", "", ""],
          correct_answer: "",
          points: 1,
        },
      ],
    }));
  };

  const updateQuestion = (index: number, field: string, value: any) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const updateOption = (
    questionIndex: number,
    optionIndex: number,
    value: string
  ) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, j) =>
                j === optionIndex ? value : opt
              ),
              correct_answer: q.correct_answer,
            }
          : q
      ),
    }));
  };

  return (
    <ScrollView
      className="flex-1 bg-slate-50"
      showsVerticalScrollIndicator={false}
    >
      <View className="p-6">
        <Text className="text-3xl font-bold text-slate-900 mb-6">
          Create New Exam
        </Text>

        <View className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          {/* Basic Info */}
          <View className="space-y-4">
            <Text className="text-lg font-semibold text-slate-900">
              Exam Details
            </Text>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Exam Title *
              </Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                placeholder="Enter exam title"
                placeholderTextColor="#94a3b8"
                value={form.title}
                onChangeText={(text) => setForm({ ...form, title: text })}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Subject *
              </Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                placeholder="e.g., Mathematics, Science"
                placeholderTextColor="#94a3b8"
                value={form.subject}
                onChangeText={(text) => setForm({ ...form, subject: text })}
              />
            </View>

            <View>
              <Text className="text-sm font-medium text-slate-700 mb-2">
                Class *
              </Text>
              <TextInput
                className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
                placeholder="e.g., 10A, 11B"
                placeholderTextColor="#94a3b8"
                value={form.class}
                onChangeText={(text) => setForm({ ...form, class: text })}
              />
            </View>
          </View>

          {/* Settings */}
          <View className="border-t border-slate-200 pt-6">
            <Text className="text-lg font-semibold text-slate-900 mb-4">
              Exam Settings
            </Text>

            <View className="space-y-4">
              <View className="flex-row justify-between items-center">
                <Text className="text-slate-700">Timed Exam</Text>
                <Switch
                  value={form.settings.timed}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      settings: { ...form.settings, timed: value },
                    })
                  }
                />
              </View>

              {form.settings.timed && (
                <View>
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Duration (minutes)
                  </Text>
                  <TextInput
                    className="border border-slate-300 rounded-lg p-4 bg-white text-slate-900"
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
                <Text className="text-slate-700">Allow Retake</Text>
                <Switch
                  value={form.settings.allow_retake}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      settings: { ...form.settings, allow_retake: value },
                    })
                  }
                />
              </View>

              <View className="flex-row justify-between items-center">
                <Text className="text-slate-700">Random Question Order</Text>
                <Switch
                  value={form.settings.random_order}
                  onValueChange={(value) =>
                    setForm({
                      ...form,
                      settings: { ...form.settings, random_order: value },
                    })
                  }
                />
              </View>
            </View>
          </View>

          {/* Questions */}
          <View className="border-t border-slate-200 pt-6">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-lg font-semibold text-slate-900">
                Questions
              </Text>
              <TouchableOpacity
                className="bg-slate-900 px-4 py-2 rounded-lg flex-row items-center"
                onPress={addQuestion}
              >
                <Ionicons name="add" size={16} color="white" />
                <Text className="text-white font-medium ml-2">
                  Add Question
                </Text>
              </TouchableOpacity>
            </View>

            <View className="space-y-6">
              {form.questions.map((question, index) => (
                <View
                  key={question.id}
                  className="border border-slate-200 rounded-lg p-4"
                >
                  <Text className="text-sm font-medium text-slate-700 mb-2">
                    Question {index + 1}
                  </Text>

                  <TextInput
                    className="border border-slate-300 rounded-lg p-3 bg-white text-slate-900 mb-3"
                    placeholder="Enter your question"
                    placeholderTextColor="#94a3b8"
                    value={question.question}
                    onChangeText={(text) =>
                      updateQuestion(index, "question", text)
                    }
                    multiline
                  />

                  <View className="flex-row items-center space-x-4 mb-3">
                    <Text className="text-slate-700 text-sm">Type:</Text>
                    <TouchableOpacity
                      className={`px-3 py-1 rounded-full ${
                        question.type === "mcq" ? "bg-blue-600" : "bg-slate-200"
                      }`}
                      onPress={() => updateQuestion(index, "type", "mcq")}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          question.type === "mcq"
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        Multiple Choice
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className={`px-3 py-1 rounded-full ${
                        question.type === "text"
                          ? "bg-blue-600"
                          : "bg-slate-200"
                      }`}
                      onPress={() => updateQuestion(index, "type", "text")}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          question.type === "text"
                            ? "text-white"
                            : "text-slate-700"
                        }`}
                      >
                        Text Answer
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {question.type === "mcq" && (
                    <View className="space-y-2">
                      <Text className="text-sm font-medium text-slate-700">
                        Options:
                      </Text>
                      {question.options.map((option, optIndex) => (
                        <View
                          key={optIndex}
                          className="flex-row items-center space-x-2"
                        >
                          <TouchableOpacity
                            className={`w-5 h-5 rounded-full border-2 ${
                              question.correct_answer === option
                                ? "bg-blue-600 border-blue-600"
                                : "border-slate-300"
                            }`}
                            onPress={() =>
                              updateQuestion(index, "correct_answer", option)
                            }
                          />
                          <TextInput
                            className="flex-1 border border-slate-300 rounded-lg p-3 bg-white text-slate-900"
                            placeholder={`Option ${optIndex + 1}`}
                            placeholderTextColor="#94a3b8"
                            value={option}
                            onChangeText={(text) =>
                              updateOption(index, optIndex, text)
                            }
                          />
                        </View>
                      ))}
                    </View>
                  )}

                  <View className="mt-3">
                    <Text className="text-sm font-medium text-slate-700 mb-2">
                      Points
                    </Text>
                    <TextInput
                      className="border border-slate-300 rounded-lg p-3 bg-white text-slate-900"
                      placeholder="1"
                      keyboardType="numeric"
                      value={question.points.toString()}
                      onChangeText={(text) =>
                        updateQuestion(index, "points", parseInt(text) || 1)
                      }
                    />
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Create Button */}
          <TouchableOpacity
            className="bg-slate-900 rounded-lg p-4 flex-row justify-center items-center mt-6"
            onPress={handleCreateExam}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <Text className="text-white font-semibold text-lg ml-2">
                  Create Exam
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
