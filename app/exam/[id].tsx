// app/exam/[id].tsx
import { useLocalSearchParams, router } from "expo-router";
import { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../../src/contexts/AuthContext";
import { apiService } from "../../src/services/api";
import { Exam } from "../../src/types";
import { Ionicons } from "@expo/vector-icons";

interface AnswerState {
  [key: string]: string;
}

export default function ExamDetailScreen() {
  const { id } = useLocalSearchParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<AnswerState>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { user } = useAuth();

  useEffect(() => {
    loadExam();
  }, [loadExam]);

  // Use useCallback for handleAutoSubmit
  const handleAutoSubmit = useCallback(async () => {
    Alert.alert("Time Up!", "Your exam has been automatically submitted.");
    await submitExam();
  }, [submitExam]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (timeLeft !== null && timeLeft > 0) {
      timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
    } else if (timeLeft === 0) {
      handleAutoSubmit();
    }
    return () => clearTimeout(timer);
  }, [timeLeft, handleAutoSubmit]);

  const loadExam = async () => {
    try {
      setLoading(true);
      const response = await apiService.getExamById(id as string);

      if (response.data.success) {
        const examData = response.data.data;
        setExam(examData);

        // Start timer if exam is timed
        if (examData?.settings.timed) {
          setTimeLeft(examData.settings.duration * 60); // Convert to seconds
        }
      } else {
        Alert.alert("Error", "Failed to load exam");
        router.back();
      }
    } catch (error) {
      console.error("Failed to load exam:", error);
      Alert.alert("Error", "Failed to load exam details");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
  };

  const submitExam = async () => {
    setSubmitting(true);
    try {
      const submission = {
        examId: id,
        answers: answers,
        timeSpent: "45m", // Calculate actual time spent
      };

      const response = await apiService.submitExam(submission);
      if (response.data.success) {
        Alert.alert("Success", "Exam submitted successfully!", [
          {
            text: "View Results",
            onPress: () => router.replace("/(tabs)/results"),
          },
        ]);
      } else {
        Alert.alert("Error", "Failed to submit exam");
      }
    } catch (error) {
      console.error("Submit error:", error);
      Alert.alert("Error", "Failed to submit exam");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const unanswered = exam?.questions?.filter((q) => !answers[q.id]) || [];

    if (unanswered.length > 0) {
      Alert.alert(
        "Unanswered Questions",
        `You have ${unanswered.length} unanswered questions. Are you sure you want to submit?`,
        [
          { text: "Continue Review", style: "cancel" },
          { text: "Submit Anyway", onPress: submitExam },
        ]
      );
    } else {
      await submitExam();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">Loading exam...</Text>
      </View>
    );
  }

  if (!exam) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <Ionicons name="alert-circle" size={64} color="#ef4444" />
        <Text className="text-red-500 text-lg mt-4">Exam not found</Text>
        <TouchableOpacity
          className="bg-blue-600 px-4 py-2 rounded-lg mt-4"
          onPress={() => router.back()}
        >
          <Text className="text-white font-medium">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentQ = exam?.questions?.[currentQuestion];

  if (!currentQ) {
    return (
      <View className="flex-1 justify-center items-center bg-slate-50">
        <ActivityIndicator size="large" color="#0f172a" />
        <Text className="text-slate-600 mt-4 text-base">
          Loading question...
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-50">
      {/* Header with Timer */}
      <View className="bg-white border-b border-slate-200 px-6 py-4">
        <View className="flex-row justify-between items-center">
          <View className="flex-1">
            <Text className="text-lg font-semibold text-slate-900">
              {exam.title}
            </Text>
            <Text className="text-slate-600 text-sm">
              Question {currentQuestion + 1} of {exam.questions?.length}
            </Text>
          </View>
          {timeLeft !== null && (
            <View
              className={`px-3 py-1 rounded-full ${
                timeLeft < 300 ? "bg-red-100" : "bg-blue-100"
              }`}
            >
              <Text
                className={`text-sm font-medium ${
                  timeLeft < 300 ? "text-red-800" : "text-blue-800"
                }`}
              >
                {formatTime(timeLeft)}
              </Text>
            </View>
          )}
        </View>

        {/* Progress Bar */}
        <View className="w-full bg-slate-200 rounded-full h-2 mt-3">
          <View
            className="h-2 rounded-full bg-blue-500"
            style={{
              width: `${
                ((currentQuestion + 1) / exam.questions.length) * 100
              }%`,
            }}
          />
        </View>
      </View>

      <ScrollView className="flex-1 p-6">
        <View className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
          {/* Question */}
          <View className="mb-6">
            <Text className="text-lg font-semibold text-slate-900 mb-4">
              {currentQ.question}
            </Text>

            {/* Answer Options */}
            <View className="space-y-3">
              {currentQ.options.map((option, index) => (
                <TouchableOpacity
                  key={index}
                  className={`p-4 border-2 rounded-lg ${
                    answers[currentQ.id] === option
                      ? "bg-blue-50 border-blue-500"
                      : "border-slate-300 bg-white"
                  }`}
                  onPress={() => handleAnswer(currentQ.id, option)}
                >
                  <Text
                    className={`font-medium ${
                      answers[currentQ.id] === option
                        ? "text-blue-700"
                        : "text-slate-700"
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Question Navigation Dots */}
          <View className="flex-row flex-wrap justify-center gap-2 mb-6">
            {exam?.questions?.map((q: any, index: number) => (
              <TouchableOpacity
                key={index}
                className={`w-3 h-3 rounded-full ${
                  index === currentQuestion
                    ? "bg-blue-500"
                    : answers[exam.questions[index].id]
                    ? "bg-green-500"
                    : "bg-slate-300"
                }`}
                onPress={() => setCurrentQuestion(index)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Navigation Buttons */}
      <View className="bg-white border-t border-slate-200 px-6 py-4">
        <View className="flex-row justify-between">
          <TouchableOpacity
            className="bg-slate-500 px-6 py-3 rounded-lg flex-row items-center"
            disabled={currentQuestion === 0}
            onPress={() => setCurrentQuestion((prev) => prev - 1)}
          >
            <Ionicons name="arrow-back" size={16} color="white" />
            <Text className="text-white font-medium ml-2">Previous</Text>
          </TouchableOpacity>

          {currentQuestion < exam.questions.length - 1 ? (
            <TouchableOpacity
              className="bg-blue-600 px-6 py-3 rounded-lg flex-row items-center"
              onPress={() => setCurrentQuestion((prev) => prev + 1)}
            >
              <Text className="text-white font-medium mr-2">Next</Text>
              <Ionicons name="arrow-forward" size={16} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="bg-green-600 px-6 py-3 rounded-lg flex-row items-center"
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <>
                  <Text className="text-white font-medium mr-2">
                    Submit Exam
                  </Text>
                  <Ionicons name="checkmark" size={16} color="white" />
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View> 
  );
}
