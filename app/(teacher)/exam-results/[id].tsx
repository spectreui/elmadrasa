// app/(teacher)/exam-results/[id].tsx - Updated with Grading Features
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Platform
} from 'react-native';
import Alert from '@/components/Alert';
import { router, useLocalSearchParams } from 'expo-router';
import { apiService } from '../../../src/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/contexts/ThemeContext';
import { designTokens } from '../../../src/utils/designTokens';
import { useTranslation } from "@/hooks/useTranslation";
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as XLSX from 'xlsx';
import { File, Paths } from 'expo-file-system';

interface Student {
  id: string;
  name: string;
  studentId: string;
  class: string;
  email?: string;
}

interface Answer {
  question_id: string;
  answer: string;
  is_correct: boolean;
  points: number;
  needs_grading: boolean;
  is_manually_graded?: boolean;
  feedback?: string;
  is_section?: boolean;
}

interface Submission {
  id: string;
  student: Student;
  score: number;
  total_points: number;
  percentage: number;
  submitted_at: string;
  answers: Answer[];
  time_spent?: string;
  needs_manual_grading: boolean;
  is_manually_graded: boolean;
  feedback?: string;
}

interface ExamResults {
  exam: {
    id: string;
    title: string;
    subject: string;
    class: string;
    created_at: string;
    settings: any;
    teacher?: {
      id: string;
      profile: {
        name: string;
      };
    };
  };
  statistics: {
    totalSubmissions: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    completionRate: number;
    totalStudents?: number;
  };
  scoreDistribution: {
    range: string;
    count: number;
  }[];
  submissions: Submission[];
}

export default function TeacherExamResultsScreen() {
  const { t, isRTL } = useTranslation();
  const { id } = useLocalSearchParams();
  const [results, setResults] = useState<ExamResults | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'submissions' | 'analytics'>('overview');
  const [feedback, setFeedback] = useState('');
  const [sendingFeedback, setSendingFeedback] = useState(false);
  const [gradingAnswers, setGradingAnswers] = useState<Record<string, { points: number; feedback: string }>>({});
  const [overallFeedback, setOverallFeedback] = useState('');
  const [isGrading, setIsGrading] = useState(false);
  const { fontFamily, colors, isDark } = useThemeContext();

  useEffect(() => {
    loadExamResults();
  }, [id]);

  const loadExamResults = async () => {
    try {
      setLoading(true);
      const response = await apiService.getTeacherExamResults(id as string);

      if (response.data.success) {
        const data = response.data.data;

        const transformedResults: ExamResults = {
          exam: {
            id: data.exam.id,
            title: data.exam.title,
            subject: data.exam.subject,
            class: data.exam.class,
            created_at: data.exam.created_at,
            settings: data.exam.settings,
            teacher: data.exam.teacher
          },
          statistics: data.statistics || {
            totalSubmissions: data.submissions?.length || 0,
            averageScore: 0,
            highestScore: 0,
            lowestScore: 0,
            completionRate: 0
          },
          scoreDistribution: data.scoreDistribution || [],
          submissions: (data.submissions || []).map((sub: any) => ({
            id: sub.id,
            student: {
              id: sub.student?.id || 'unknown',
              name: sub.student?.name || 'Unknown Student',
              studentId: sub.student?.student_id || 'N/A',
              class: sub.student?.class || 'Unknown Class',
              email: sub.student?.email
            },
            score: sub.score,
            total_points: sub.totalPoints || sub.total_points,
            percentage: sub.percentage || Math.round(sub.score / (sub.totalPoints || sub.total_points || 1) * 100),
            submitted_at: sub.submittedAt || sub.submitted_at,
            answers: sub.answers || [],
            time_spent: sub.time_spent,
            needs_manual_grading: sub.needs_manual_grading,
            is_manually_graded: sub.is_manually_graded,
            feedback: sub.feedback
          }))
        };

        if (!data.statistics && transformedResults.submissions.length > 0) {
          const stats = calculateStatistics(transformedResults.submissions);
          transformedResults.statistics = { ...transformedResults.statistics, ...stats };
        }

        if (!data.scoreDistribution && transformedResults.submissions.length > 0) {
          transformedResults.scoreDistribution = calculateScoreDistribution(transformedResults.submissions);
        }

        setResults(transformedResults);
      } else {
        throw new Error(response.data.error);
      }
    } catch (error: any) {
      console.error('Failed to load exam results:', error);
      Alert.alert('Error', 'Failed to load exam results. Please try again.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const calculateScoreDistribution = (submissions: Submission[]) => {
    const distribution = [
      { range: '90-100', count: 0 },
      { range: '80-89', count: 0 },
      { range: '70-79', count: 0 },
      { range: '60-69', count: 0 },
      { range: '0-59', count: 0 }
    ];

    submissions.forEach((submission) => {
      const percentage = submission.percentage;
      if (percentage >= 90) distribution[0].count++;
      else if (percentage >= 80) distribution[1].count++;
      else if (percentage >= 70) distribution[2].count++;
      else if (percentage >= 60) distribution[3].count++;
      else distribution[4].count++;
    });

    return distribution;
  };

  const calculateStatistics = (submissions: Submission[]) => {
    const percentages = submissions.map((sub) => sub.percentage);
    const averageScore = Math.round(percentages.reduce((a, b) => a + b, 0) / percentages.length);
    const highestScore = Math.max(...percentages);
    const lowestScore = Math.min(...percentages);

    return {
      averageScore,
      highestScore,
      lowestScore,
      totalSubmissions: submissions.length
    };
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExamResults();
  };

  const getGradeColor = (percentage: number) => {
    if (percentage >= 90) return colors.success;
    if (percentage >= 80) return colors.primary;
    if (percentage >= 70) return colors.warning;
    if (percentage >= 60) return colors.error;
    return colors.error;
  };

  const getGradingStatus = (submission: Submission) => {
    if (submission.needs_manual_grading) {
      return { text: t("submissions.pending"), color: colors.warning };
    } else if (submission.is_manually_graded) {
      return { text: t("submissions.graded"), color: colors.success };
    } else {
      return { text: t("submissions.autoGraded"), color: colors.primary };
    }
  }

  const handleSendFeedback = () => {
    setFeedbackModalVisible(true);
  };

  const sendFeedback = async () => {
    if (!feedback.trim() || !selectedSubmission) return;

    try {
      setSendingFeedback(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      Alert.alert('Success', 'Feedback sent to student successfully!');
      setFeedbackModalVisible(false);
      setFeedback('');
    } catch (error) {
      Alert.alert('Error', 'Failed to send feedback. Please try again.');
    } finally {
      setSendingFeedback(false);
    }
  };

  const handleGradeAnswer = (questionId: string, points: number, feedback: string) => {
    setGradingAnswers(prev => ({
      ...prev,
      [questionId]: { points, feedback }
    }));
  };

  const submitGrading = async () => {
    if (!selectedSubmission) return;

    try {
      setIsGrading(true);

      // Calculate new total score
      let newScore = 0;
      const updatedAnswers = selectedSubmission.answers.map(answer => {
        if (answer.is_section) {
          return answer; // Skip sections
        }

        if (answer.needs_grading && gradingAnswers[answer.question_id]) {
          const gradedAnswer = gradingAnswers[answer.question_id];
          newScore += gradedAnswer.points;
          return {
            ...answer,
            points: gradedAnswer.points,
            feedback: gradedAnswer.feedback,
            is_manually_graded: true
          };
        }
        newScore += answer.points;
        return answer;
      });

      // Update submission
      const response = await apiService.gradeSubmission(
        selectedSubmission.id,
        newScore,
        overallFeedback,
        updatedAnswers,
      );

      if (response.data.success) {
        // Update local state
        setResults(prev => {
          if (!prev) return null;
          return {
            ...prev,
            submissions: prev.submissions.map(sub =>
              sub.id === selectedSubmission.id
                ? {
                  ...sub,
                  score: newScore,
                  percentage: Math.round((newScore / sub.total_points) * 100),
                  answers: updatedAnswers,
                  is_manually_graded: true,
                  feedback: overallFeedback
                }
                : sub
            )
          };
        });

        setSelectedSubmission({
          ...selectedSubmission,
          score: newScore,
          percentage: Math.round((newScore / selectedSubmission.total_points) * 100),
          answers: updatedAnswers,
          is_manually_graded: true,
          feedback: overallFeedback
        });

        Alert.alert(t("common.success"), t("submissions.gradingSuccess"));
      } else {
        throw new Error(response.data.error);
      }
    } catch (error) {
      Alert.alert(t("common.error"), t("submissions.gradingFailed"));
    } finally {
      setIsGrading(false);
    }
  };

  const exportResults = async (format: 'pdf' | 'excel' | 'csv') => {
    if (!results) return;

    try {
      if (format === 'pdf') {
        await exportToPDF();
      } else {
        await exportToExcel(format);
      }
    } catch (error) {
      console.error('Export failed:', error);
      Alert.alert('Error', 'Failed to export results. Please try again.');
    }
  };

  const exportToExcel = async (format: 'excel' | 'csv') => {
    if (!results) return;

    try {
      // Create workbook (this part remains the same)
      const wb = XLSX.utils.book_new();
      wb.Props = {
        Title: `${results.exam.title} Results`,
        Subject: "Exam Results",
        Author: "Elmadrasa App",
        CreatedDate: new Date()
      };

      // Create summary sheet (this part remains the same)
      const summaryData = [
        ["Exam Title", results.exam.title],
        ["Subject", results.exam.subject],
        ["Class", results.exam.class],
        ["Created", new Date(results.exam.created_at).toLocaleDateString()],
        [],
        ["Statistics"],
        ["Total Submissions", results.statistics.totalSubmissions],
        ["Average Score (%)", results.statistics.averageScore],
        ["Highest Score (%)", results.statistics.highestScore],
        ["Lowest Score (%)", results.statistics.lowestScore],
        [],
        ["Score Distribution"],
        ...results.scoreDistribution.map(item => [item.range, item.count])
      ];
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

      // Create submissions sheet (this part remains the same)
      const submissionsData = [
        ["Student Name", "Student ID", "Class", "Score", "Percentage", "Submitted At", "Time Spent", "Status"]
      ];

      results.submissions.forEach(sub => {
        submissionsData.push([
          sub.student.name,
          sub.student.studentId,
          sub.student.class,
          sub.score,
          `${sub.percentage}%`,
          new Date(sub.submitted_at).toLocaleDateString(),
          sub.time_spent || "N/A",
          sub.needs_manual_grading ? "Pending Grading" :
            sub.is_manually_graded ? "Manually Graded" : "Auto Graded"
        ]);
      });

      const submissionsSheet = XLSX.utils.aoa_to_sheet(submissionsData);
      XLSX.utils.book_append_sheet(wb, submissionsSheet, "Submissions");

      // Generate file - UPDATED PART
      const fileType = format === 'excel' ? 'xlsx' : 'csv';
      const fileName = `${results.exam.title.replace(/\s+/g, '_')}_results.${fileType}`;

      // Create file using new File API
      const file = new File(Paths.cache, fileName);

      // Generate workbook output
      const wbout = XLSX.write(wb, { type: 'base64', bookType: fileType });

      // Convert base64 to Uint8Array and write to file
      const binaryString = atob(wbout);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Write file using new API
      file.write(bytes);

      // Share file - using the file's URI property
      await Sharing.shareAsync(file.uri, {
        mimeType: format === 'excel' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv',
        dialogTitle: 'Share Exam Results'
      });

    } catch (error) {
      console.error('Excel export failed:', error);
      Alert.alert('Error', `Failed to generate ${format.toUpperCase()}. Please try again.`);
    }
  };

  const exportToPDF = async () => {
    if (!results) return;

    try {
      const htmlContent = generatePDFContent();

      if (Platform.OS === 'web') {
        // For web, create a new window with the HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(htmlContent);
          printWindow.document.close();

          // Wait for content to load before printing
          printWindow.onload = () => {
            printWindow.print();
            // Optional: close window after print dialog closes
            // printWindow.onafterprint = () => printWindow.close();
          };
        }
      } else {
        // For mobile, use expo-print as before
        const { uri } = await Print.printToFileAsync({ html: htmlContent });

        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Exam Results PDF'
          });
        }
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      Alert.alert('Error', 'Failed to generate PDF. Please try again.');
    }
  };

  const generatePDFContent = () => {
    if (!results) return '';

    const { exam, statistics, scoreDistribution, submissions } = results;

    // Helper function to get grade color
    const getGradeColor = (percentage: number) => {
      if (percentage >= 90) return '#10B981';
      if (percentage >= 80) return '#3B82F6';
      if (percentage >= 70) return '#F59E0B';
      if (percentage >= 60) return '#EF4444';
      return '#DC2626';
    };

    // Helper function to get letter grade
    const getLetterGrade = (percentage: number) => {
      if (percentage >= 97) return 'A+';
      if (percentage >= 93) return 'A';
      if (percentage >= 90) return 'A-';
      if (percentage >= 87) return 'B+';
      if (percentage >= 83) return 'B';
      if (percentage >= 80) return 'B-';
      if (percentage >= 77) return 'C+';
      if (percentage >= 73) return 'C';
      if (percentage >= 70) return 'C-';
      if (percentage >= 67) return 'D+';
      if (percentage >= 65) return 'D';
      return 'F';
    };

    // Calculate additional statistics
    const passingRate = Math.round((submissions.filter(s => s.percentage >= 60).length / submissions.length) * 100) || 0;
    const medianScore = submissions.length > 0 ?
      submissions.sort((a, b) => a.percentage - b.percentage)[Math.floor(submissions.length / 2)].percentage : 0;

    // Find most common score range
    const mostCommonRange = scoreDistribution.reduce((prev, current) =>
      (prev.count > current.count) ? prev : current
    );

    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${exam.title} - ${t('pdf.report')}</title>
        <style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    padding: 24px;
    color: #000000;
    line-height: 1.5;
    background-color: #FFFFFF;
    font-size: 14px;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  .header {
    text-align: center;
    padding-bottom: 24px;
    margin-bottom: 32px;
    border-bottom: 2px solid #F2F2F7;
  }
  
  .title {
    font-size: 28px;
    font-weight: 700;
    color: #000000;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }
  
  .subtitle {
    font-size: 17px;
    color: #8E8E93;
    margin: 0 0 12px 0;
    font-weight: 500;
  }
  
  .exam-meta {
    font-size: 15px;
    color: #8E8E93;
    margin: 8px 0;
  }
  
  .teacher-info {
    font-size: 15px;
    color: #8E8E93;
    margin: 4px 0;
  }
  
  .section {
    margin-bottom: 32px;
    page-break-inside: avoid;
  }
  
  .section-title {
    font-size: 20px;
    font-weight: 700;
    color: #000000;
    margin-bottom: 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #F2F2F7;
    position: relative;
  }
  
  .section-title:after {
    content: '';
    position: absolute;
    bottom: -1px;
    left: 0;
    width: 40px;
    height: 2px;
    background-color: #007AFF;
  }
  
  .section-subtitle {
    font-size: 16px;
    color: #8E8E93;
    margin-bottom: 16px;
    font-weight: 500;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }
  
  .stat-card {
    background: #FFFFFF;
    border: 1px solid #E5E5EA;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }
  
  .stat-value {
    font-size: 32px;
    font-weight: 700;
    margin: 12px 0;
    color: #000000;
  }
  
  .stat-label {
    font-size: 15px;
    color: #8E8E93;
    font-weight: 500;
    margin-bottom: 6px;
  }
  
  .stat-description {
    font-size: 13px;
    color: #8E8E93;
    margin-top: 4px;
  }
  
  .insight-box {
    background: #F2F2F7;
    border: 1px solid #E5E5EA;
    border-radius: 12px;
    padding: 20px;
    margin: 20px 0;
  }
  
  .insight-title {
    font-size: 16px;
    font-weight: 600;
    color: #000000;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
  }
  
  .insight-title:before {
    content: "💡";
    margin-right: 12px;
    font-size: 18px;
  }
  
  .insight-content {
    font-size: 15px;
    color: #000000;
    line-height: 1.5;
  }
  
  .distribution-container {
    margin: 20px 0;
  }
  
  .distribution-item {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    background: #FFFFFF;
    padding: 16px;
    border-radius: 10px;
    border: 1px solid #E5E5EA;
  }
  
  .distribution-range {
    width: 70px;
    font-weight: 600;
    color: #000000;
    font-size: 15px;
  }
  
  .distribution-bar-container {
    flex: 1;
    margin: 0 16px;
  }
  
  .distribution-bar {
    height: 16px;
    background: #F2F2F7;
    border-radius: 8px;
    overflow: hidden;
    position: relative;
  }
  
  .distribution-fill {
    height: 100%;
    border-radius: 8px;
    background: #8E8E93 !important;
    position: relative;
  }
  
  .distribution-fill:after {
    content: attr(data-percentage);
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    color: #FFFFFF;
    font-size: 10px;
    font-weight: 600;
  }
  
  .distribution-count {
    width: 50px;
    text-align: right;
    font-weight: 600;
    color: #000000;
    font-size: 15px;
  }
  
  .performers-list {
    margin-top: 20px;
  }
  
  .performer-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-bottom: 1px solid #F2F2F7;
  }
  
  .performer-item:last-child {
    border-bottom: none;
  }
  
  .performer-info {
    display: flex;
    align-items: center;
  }
  
  .rank-badge {
    width: 36px;
    height: 36px;
    border-radius: 18px;
    background: #F2F2F7;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 16px;
    font-weight: 600;
    color: #000000;
    font-size: 15px;
    border: 1px solid #E5E5EA;
  }
  
  .rank-1 { 
    background: #FFFFFF; 
    border: 2px solid #000000;
    font-weight: 700;
  }
  .rank-2 { 
    background: #F8F8F8; 
    border: 1.5px solid #666666;
  }
  .rank-3 { 
    background: #F2F2F7; 
    border: 1px solid #8E8E93;
  }
  
  .performer-details {
    flex: 1;
  }
  
  .performer-name {
    font-weight: 600;
    margin-bottom: 4px;
    color: #000000;
    font-size: 16px;
  }
  
  .performer-meta {
    font-size: 14px;
    color: #8E8E93;
  }
  
  .performer-score {
    text-align: right;
  }
  
  .score-value {
    font-size: 20px;
    font-weight: 700;
    margin-bottom: 4px;
    color: #000000;
  }
  
  .score-grade {
    font-size: 14px;
    font-weight: 500;
    color: #8E8E93;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 16px;
    background-color: #FFFFFF;
    border-radius: 12px;
    overflow: hidden;
    border: 1px solid #E5E5EA;
  }
  
  th {
    background: #F2F2F7;
    padding: 16px 12px;
    text-align: left;
    font-weight: 600;
    color: #000000;
    font-size: 14px;
    border-bottom: 1px solid #E5E5EA;
  }
  
  td {
    padding: 14px 12px;
    border-bottom: 1px solid #F2F2F7;
    color: #000000;
    font-size: 14px;
  }
  
  tr:last-child td {
    border-bottom: none;
  }
  
  tr:nth-child(even) {
    background: #FAFAFA;
  }
  
  .grade-badge {
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    display: inline-block;
    background: #F2F2F7;
    color: #000000;
    border: 1px solid #E5E5EA;
  }
  
  .status-badge {
    padding: 6px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    text-align: center;
    display: inline-block;
    background: #F2F2F7;
    color: #000000;
    border: 1px solid #E5E5EA;
  }
  
  .footer {
    margin-top: 40px;
    text-align: center;
    font-size: 13px;
    color: #8E8E93;
    border-top: 1px solid #F2F2F7;
    padding-top: 20px;
  }
  
  .page-break {
    page-break-before: always;
  }
  
  .print-only {
    display: none;
  }
  
  @media print {
    body {
      padding: 16px;
      font-size: 12px;
    }
    
    .section {
      page-break-inside: avoid;
      margin-bottom: 24px;
    }
    
    .section-title {
      font-size: 18px;
    }
    
    .stat-value {
      font-size: 24px;
    }
    
    .stat-card {
      box-shadow: none;
      border: 1px solid #D1D1D6;
    }
    
    .insight-box {
      background: #F8F8F8;
      border: 1px solid #D1D1D6;
    }
    
    table {
      border: 1px solid #D1D1D6;
    }
    
    th {
      background: #F8F8F8;
    }
    
    .distribution-fill {
      background: #666666 !important;
    }
    
    .print-only {
      display: block;
    }
    
    .no-print {
      display: none;
    }
  }
  
  /* iOS-like subtle animations for digital viewing */
  @media screen {
    .stat-card {
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }
    
    .stat-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    
    .performer-item {
      transition: background-color 0.2s ease;
    }
    
    .performer-item:hover {
      background-color: #F8F8F8;
    }
  }
</style>
      </head>
      <body>
        <!-- Header Section -->
        <div class="header">
          <h1 class="title">${exam.title}</h1>
          <p class="subtitle">${t('pdf.examResultsReport')}</p>
          <div class="exam-meta">
            ${exam.subject} • ${exam.class} • ${new Date(exam.created_at).toLocaleDateString()}
          </div>
          ${exam.teacher ? `
            <div class="teacher-info">
              ${t('pdf.preparedBy')}: ${exam.teacher.profile.name}
            </div>
          ` : ''}
        </div>

        <!-- Executive Summary -->
        <div class="section">
          <h2 class="section-title">${t('pdf.executiveSummary')}</h2>
          <div class="insight-box">
            <div class="insight-title">${t('pdf.quickOverview')}</div>
            <div class="insight-content">
              ${t('pdf.classPerformanceSummary')
        .replace('{{average}}', statistics.averageScore.toString())
        .replace('{{submissions}}', statistics.totalSubmissions.toString())
        .replace('{{total}}', (statistics.totalStudents || statistics.totalSubmissions).toString())
        .replace('{{passing}}', passingRate.toString())}
            </div>
          </div>

          <!-- Key Statistics -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-label">${t('pdf.totalSubmissions')}</div>
              <div class="stat-value">${statistics.totalSubmissions}</div>
              <div class="stat-description">${t('pdf.ofTotalStudents').replace('{{total}}', (statistics.totalStudents || statistics.totalSubmissions).toString())}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t('dashboard.avgScore')}</div>
              <div class="stat-value" style="color: ${getGradeColor(statistics.averageScore)}">${statistics.averageScore}%</div>
              <div class="stat-description">${t('pdf.classAverage')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t('pdf.passingRate')}</div>
              <div class="stat-value" style="color: ${passingRate >= 70 ? '#10B981' : passingRate >= 50 ? '#F59E0B' : '#EF4444'}">${passingRate}%</div>
              <div class="stat-description">${t('pdf.studentsPassing')}</div>
            </div>
            <div class="stat-card">
              <div class="stat-label">${t('pdf.performanceGap')}</div>
              <div class="stat-value" style="color: ${(statistics.highestScore - statistics.lowestScore) < 30 ? '#10B981' : '#EF4444'}">${statistics.highestScore - statistics.lowestScore}%</div>
              <div class="stat-description">${t('pdf.highLowDifference')}</div>
            </div>
          </div>
        </div>

        <!-- Performance Insights -->
        <div class="section">
          <h2 class="section-title">${t('pdf.performanceInsights')}</h2>
          
          <!-- Score Distribution -->
          <h3 class="section-subtitle">${t('exams.scoreDistribution')}</h3>
          <div class="distribution-container">
            ${scoreDistribution.map(item => {
          const percentage = (item.count / Math.max(...scoreDistribution.map(s => s.count), 1)) * 100;
          const rangeStart = parseInt(item.range.split('-')[0]);
          return `
                <div class="distribution-item" style="border-left-color: ${getGradeColor(rangeStart)}">
                  <div class="distribution-range">${item.range}%</div>
                  <div class="distribution-bar-container">
                    <div class="distribution-bar">
                      <div 
                        class="distribution-fill" 
                        style="width: ${percentage}%; background-color: ${getGradeColor(rangeStart)}"
                        data-percentage="${Math.round(percentage)}%"
                      ></div>
                    </div>
                  </div>
                  <div class="distribution-count">
                    ${item.count} ${t('pdf.students')}
                  </div>
                </div>
              `;
        }).join('')}
          </div>

          <!-- Distribution Insights -->
          <div class="insight-box">
            <div class="insight-title">${t('pdf.distributionAnalysis')}</div>
            <div class="insight-content">
              ${mostCommonRange.count === submissions.length ?
        t('pdf.allSameScore') :
        mostCommonRange.range === '90-100' ?
          t('pdf.mostStudentsExcellent') :
          mostCommonRange.range === '0-59' ?
            t('pdf.manyStudentsStruggling').replace('{{count}}', mostCommonRange.count.toString()) :
            t('pdf.mostStudentsInRange')
              .replace('{{range}}', mostCommonRange.range)
              .replace('{{count}}', mostCommonRange.count.toString())
      }
            </div>
          </div>
        </div>

        <!-- Top Performers -->
        <div class="section">
          <h2 class="section-title">${t('exams.topPerformers')}</h2>
          <p class="section-subtitle">${t('pdf.recognizingExcellence')}</p>
          
          <div class="performers-list">
            ${submissions
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, 5)
        .map((submission, index) => `
                <div class="performer-item">
                  <div class="performer-info">
                    <div class="rank-badge ${index < 3 ? `rank-${index + 1}` : ''}">${index + 1}</div>
                    <div class="performer-details">
                      <div class="performer-name">${submission.student.name}</div>
                      <div class="performer-meta">
                        ${submission.student.studentId} • ${submission.student.class} • 
                        ${getLetterGrade(submission.percentage)}
                      </div>
                    </div>
                  </div>
                  <div class="performer-score">
                    <div class="score-value" style="color: ${getGradeColor(submission.percentage)}">
                      ${submission.percentage}%
                    </div>
                    <div class="score-grade">
                      ${submission.score}/${submission.total_points} ${t('exams.points')}
                    </div>
                  </div>
                </div>
              `).join('')}
          </div>
        </div>

        <!-- Detailed Results -->
        <div class="section page-break">
          <h2 class="section-title">${t('pdf.detailedResults')}</h2>
          <p class="section-subtitle">${t('pdf.completeSubmissionList')}</p>

          <table>
            <thead>
              <tr>
                <th>${t('pdf.studentName')}</th>
                <th>${t('pdf.studentId')}</th>
                <th>${t('pdf.class')}</th>
                <th>${t('pdf.score')}</th>
                <th>${t('pdf.percentage')}</th>
                <th>${t('pdf.grade')}</th>
                <th>${t('pdf.status')}</th>
              </tr>
            </thead>
            <tbody>
              ${submissions
        .sort((a, b) => b.percentage - a.percentage)
        .map(submission => `
                  <tr>
                    <td style="font-weight: 500;">${submission.student.name}</td>
                    <td>${submission.student.studentId}</td>
                    <td>${submission.student.class}</td>
                    <td><strong>${submission.score}/${submission.total_points}</strong></td>
                    <td style="font-weight: 700; color: ${getGradeColor(submission.percentage)}">${submission.percentage}%</td>
                    <td>
                      <div class="grade-badge" style="background-color: ${getGradeColor(submission.percentage)}20; color: ${getGradeColor(submission.percentage)}">
                        ${getLetterGrade(submission.percentage)}
                      </div>
                    </td>
                    <td>
                      ${submission.needs_manual_grading ?
            `<span style="background-color: #FEF3C7; color: #92400E; padding: 4px 8px; border-radius: 9999px; font-size: 11px;">${t('submissions.pending')}</span>` :
            submission.is_manually_graded ?
              `<span style="background-color: #D1FAE5; color: #065F46; padding: 4px 8px; border-radius: 9999px; font-size: 11px;">${t('submissions.graded')}</span>` :
              `<span style="background-color: #DBEAFE; color: #1E40AF; padding: 4px 8px; border-radius: 9999px; font-size: 11px;">${t('submissions.autoGraded')}</span>`
          }
                    </td>
                  </tr>
                `).join('')}
            </tbody>
          </table>
        </div>

        <!-- Teacher Recommendations -->
        <div class="section">
          <h2 class="section-title">${t('pdf.recommendations')}</h2>
          
          <div class="insight-box">
            <div class="insight-title">${t('pdf.nextSteps')}</div>
            <div class="insight-content">
              <ul style="margin-left: 20px; margin-top: 10px;">
                ${statistics.averageScore < 70 ?
        `<li>${t('pdf.considerReviewSession')}</li>` :
        `<li>${t('pdf.studentsPerformingWell')}</li>`
      }
                ${passingRate < 80 ?
        `<li>${t('pdf.implementationSupport')}</li>` :
        `<li>${t('pdf.continueCurrentMethods')}</li>`
      }
                ${mostCommonRange.range === '0-59' ?
        `<li>${t('pdf.reteachingNeeded')}</li>` : ''
      }
                <li>${t('pdf.shareResultsWithStudents')}</li>
                <li>${t('pdf.scheduleFollowUp')}</li>
              </ul>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="footer">
          <p>${t('pdf.generatedBy').replace('{{date}}', new Date().toLocaleDateString()).replace('{{time}}', new Date().toLocaleTimeString())}</p>
          <p style="margin-top: 8px; font-size: 11px; color: #D1D5DB;">
            ${t('pdf.confidentialReport')}
          </p>
        </div>
      </body>
    </html>
  `;
  };

  // Fixed export function - no alert inside export process
  const handleExport = () => {
    Alert.alert(t('pdf.exportResults'), t('pdf.chooseFormat'), [
      { text: t('pdf.pdfReport'), onPress: () => setTimeout(() => exportResults('pdf'), 500) },
      { text: t('pdf.excelSheet'), onPress: () => setTimeout(() => exportResults('excel'), 500) },
      // { text: t('pdf.csvData'), onPress: () => setTimeout(() => exportResults('csv'), 500) },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  };

  const shareResults = () => {
    Alert.alert('Share Results', 'Share exam results with:', [
      { text: 'All Students', onPress: () => console.log('Sharing with all students...') },
      { text: 'Selected Students', onPress: () => console.log('Sharing with selected students...') },
      { text: 'Other Teachers', onPress: () => console.log('Sharing with teachers...') },
      { text: 'Cancel', style: 'cancel' }]
    );
  };

  const getPerformanceInsights = () => {
    if (!results || results.submissions.length === 0) return [];

    const insights = [];
    const avgScore = results.statistics.averageScore;

    if (avgScore < 60) {
      insights.push('Class average is below passing. Consider reviewing the material.');
    } else if (avgScore > 85) {
      insights.push('Excellent class performance! Students mastered this material.');
    }

    if (results.statistics.highestScore - results.statistics.lowestScore > 40) {
      insights.push('Large performance gap between students. Consider differentiated instruction.');
    }

    const lowPerformers = results.submissions.filter((sub) => sub.percentage < 60).length;
    if (lowPerformers > results.submissions.length * 0.3) {
      insights.push(`${lowPerformers} students scored below 60%. May need remediation.`);
    }

    return insights;
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText as any, { fontFamily, color: colors.textSecondary }]}>
          {t("exams.loadingResults")}
        </Text>
      </View>
    );
  }

  if (!results) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="alert-circle" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle as any, { fontFamily, color: colors.textPrimary }]}>
          {t("exams.noResultsFound")}
        </Text>
        <Text style={[styles.emptySubtitle as any, { fontFamily, color: colors.textSecondary }]}>
          {t("exams.resultsLoadFailed")}
        </Text>
        <TouchableOpacity
          style={[styles.backButton as any, { backgroundColor: colors.primary }]}
          onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={20} color="white" />
          <Text style={styles.backButtonText as any}>{t("common.back")}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const performanceInsights = getPerformanceInsights();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
        <View style={[styles.headerContent] as any}>
          <TouchableOpacity
            style={[styles.headerButton as any, { backgroundColor: colors.background }]}
            onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={20} color={colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { fontFamily, color: colors.textPrimary }]}>
            {t("exams.examAnalytics")}
          </Text>
          <View style={styles.headerActions as any}>
            <TouchableOpacity
              style={[styles.headerButton as any, { backgroundColor: colors.background }]}
              onPress={shareResults}>
              <Ionicons name="share" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.headerButton as any, { backgroundColor: colors.background }]}
              onPress={handleExport}>
              <Ionicons name="download" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.examInfo}>
          <Text style={[styles.examTitle, { fontFamily, color: colors.textPrimary }]}>
            {results.exam.title}
          </Text>
          <Text style={[styles.examSubtitle as any, { fontFamily, color: colors.textSecondary }]}>
            {results.exam.subject} • {results.exam.class}
          </Text>
          {results.exam.teacher &&
            <Text style={[styles.examCreator, { fontFamily, color: colors.textTertiary }]}>
              {t("exams.createdBy")}: {results.exam.teacher.profile.name}
            </Text>
          }
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer as any, { backgroundColor: colors.background }]}>
          {[
            { key: 'overview', label: t("dashboard.overview"), icon: 'stats-chart' },
            { key: 'submissions', label: t("submissions.title"), icon: 'document-text' },
            { key: 'analytics', label: t("dashboard.analytics"), icon: 'analytics' }
          ].map((tab) =>
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tab as any,
                activeTab === tab.key ?
                  { backgroundColor: colors.backgroundElevated, ...designTokens.shadows.sm } :
                  {}
              ]}
              onPress={() => setActiveTab(tab.key as any)}>
              <Ionicons
                name={tab.icon as any}
                size={16}
                color={activeTab === tab.key ? colors.primary : colors.textTertiary} />
              <Text
                style={[
                  styles.tabText as any,
                  activeTab === tab.key ?
                    { fontFamily, color: colors.primary } :
                    { fontFamily, color: colors.textSecondary }
                ]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary} />
        }>

        {activeTab === 'overview' ?
          <View style={styles.tabContent}>
            {/* Performance Insights */}
            {performanceInsights.length > 0 &&
              <View style={[styles.insightsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.warning }]}>
                <View style={styles.insightsHeader as any}>
                  <Ionicons name="bulb" size={20} color={colors.warning} style={styles.insightsIcon} />
                  <View style={styles.insightsText}>
                    <Text style={[styles.insightsTitle as any, { fontFamily, color: colors.textPrimary }]}>
                      {t("dashboard.performanceInsights")}
                    </Text>
                    {performanceInsights.map((insight, index) =>
                      <Text key={index} style={[styles.insightItem, { fontFamily, color: colors.textSecondary }]}>
                        • {insight}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            }

            {/* Statistics Cards */}
            <View style={styles.statsGrid as any}>
              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("submissions.title")}
                  </Text>
                  <Ionicons name="people" size={20} color={colors.primary} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.totalSubmissions}
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {results.statistics.totalStudents ?
                    `${t("exams.of")} ${results.statistics.totalStudents} ${t("exams.students")}` :
                    t("exams.totalSubmissions")}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("dashboard.avgScore")}
                  </Text>
                  <Ionicons name="trophy" size={20} color={colors.success} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.averageScore}%
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("dashboard.classAverage")}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("exams.highest")}
                  </Text>
                  <Ionicons name="trending-up" size={20} color={colors.warning} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.highestScore}%
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("exams.topScore")}
                </Text>
              </View>

              <View style={[styles.statCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.statHeader as any}>
                  <Text style={[styles.statLabel as any, { fontFamily, color: colors.textSecondary }]}>
                    {t("exams.lowest")}
                  </Text>
                  <Ionicons name="trending-down" size={20} color={colors.error} />
                </View>
                <Text style={[styles.statValue, { fontFamily, color: colors.textPrimary }]}>
                  {results.statistics.lowestScore}%
                </Text>
                <Text style={[styles.statSubtitle, { fontFamily, color: colors.textTertiary }]}>
                  {t("exams.lowestScore")}
                </Text>
              </View>
            </View>

            {/* Score Distribution */}
            <View style={[styles.scoreDistributionCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                {t("exams.scoreDistribution")}
              </Text>
              <View style={styles.distributionList}>
                {results.scoreDistribution.map((item, index) =>
                  <View key={index} style={styles.distributionItem as any}>
                    <Text style={[styles.distributionRange as any, { fontFamily, color: colors.textPrimary }]}>
                      {item.range}
                    </Text>
                    <View style={[styles.distributionBar as any, { backgroundColor: colors.background }]}>
                      <View
                        style={[
                          styles.distributionFill as any,
                          {
                            backgroundColor: getGradeColor(parseInt(item.range.split('-')[0])),
                            width: `${item.count / Math.max(...results.scoreDistribution.map((s) => s.count), 1) * 100}%`
                          }]
                        } />
                    </View>
                    <Text style={[styles.distributionCount as any, { fontFamily, color: colors.textSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
                      {item.count}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Top Performers */}
            <View style={[styles.topPerformersCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
              <View style={styles.cardHeader as any}>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t("exams.topPerformers")}
                </Text>
                <Text style={[styles.cardSubtitle, { fontFamily, color: colors.textSecondary }]}>
                  {t("exams.showingTop")} 3 {t("exams.of")} {results.submissions.length}
                </Text>
              </View>
              {results.submissions
                .sort((a, b) => b.percentage - a.percentage)
                .slice(0, 3)
                .map((submission, index) =>
                  <View
                    key={submission.id}
                    style={[
                      styles.performerItem as any,
                      {
                        borderBottomColor: colors.border,
                        borderBottomWidth: index < 2 ? 1 : 0
                      }]
                    }>
                    <View style={styles.performerInfo as any}>
                      <View style={[styles.rankBadge as any, { backgroundColor: `${colors.primary}20` }]}>
                        <Text style={[styles.rankText as any, { fontFamily, color: colors.primary }]}>
                          {index + 1}
                        </Text>
                      </View>
                      <View style={styles.performerDetails}>
                        <Text style={[styles.performerName as any, { fontFamily, color: colors.textPrimary }]}>
                          {submission.student.name}
                        </Text>
                        <Text style={[styles.performerId, { fontFamily, color: colors.textSecondary }]}>
                          {submission.student.studentId}
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.performerScore as any, { fontFamily, color: getGradeColor(submission.percentage) }]}>
                      {submission.percentage}%
                    </Text>
                  </View>
                )}
            </View>
          </View> :
          activeTab === 'submissions' ?
            <View style={styles.tabContent}>
              {/* Submissions List */}
              <View style={[styles.submissionsCard as any, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                {results.submissions.length > 0 ?
                  results.submissions
                    .sort((a, b) => b.percentage - a.percentage)
                    .map((submission, index) =>
                      <TouchableOpacity
                        key={submission.id}
                        style={[
                          styles.submissionItem as any,
                          {
                            borderBottomColor: colors.border,
                            borderBottomWidth: index !== results.submissions.length - 1 ? 1 : 0
                          }]
                        }
                        onPress={() => router.push(`/(teacher)/exams/grading/${submission.id}`)}
                        activeOpacity={0.7}>
                        <View style={styles.submissionInfo}>
                          <Text style={[styles.submissionName as any, { fontFamily, color: colors.textPrimary }]}>
                            {submission.student.name}
                          </Text>
                          <Text style={[styles.submissionDetails, { fontFamily, color: colors.textSecondary }]}>
                            {submission.student.studentId} • {submission.student.class}
                          </Text>
                        </View>
                        <View style={styles.submissionMeta as any}>
                          <Text style={[styles.submissionScore as any, { fontFamily, color: getGradeColor(submission.percentage) }]}>
                            {submission.percentage}%
                          </Text>
                          <View style={[styles.gradingStatus, { backgroundColor: getGradingStatus(submission).color + '20' }]}>
                            <Text style={[styles.gradingStatusText as any, { color: getGradingStatus(submission).color, fontFamily }]}>
                              {getGradingStatus(submission).text}
                            </Text>
                          </View>
                          <Text style={[styles.submissionDate, { fontFamily, color: colors.textTertiary }]}>
                            {new Date(submission.submitted_at).toLocaleDateString()}
                          </Text>
                        </View>
                        <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} style={styles.chevronIcon} />
                      </TouchableOpacity>
                    ) :
                  <View style={styles.emptyState as any}>
                    <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
                    <Text style={[styles.emptyTitle as any, { fontFamily, color: colors.textSecondary }]}>
                      {t("exams.noSubmissionsYet")}
                    </Text>
                    <Text style={[styles.emptySubtitle as any, { fontFamily, color: colors.textTertiary }]}>
                      {t("exams.studentsNotSubmitted")}
                    </Text>
                  </View>
                }
              </View>
            </View> :
            <View style={styles.tabContent}>
              {/* Analytics Tab */}
              <View style={styles.analyticsSection}>
                {/* Performance Trends */}
                <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.performanceAnalysis")}
                  </Text>
                  <View style={styles.trendList}>
                    <View style={[styles.trendItem as any, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.trendLabel as any, { fontFamily, color: colors.textSecondary }]}>
                        {t("dashboard.classAverage")}
                      </Text>
                      <Text style={[styles.trendValue as any, { fontFamily, color: colors.textPrimary }]}>
                        {results.statistics.averageScore}%
                      </Text>
                    </View>
                    <View style={[styles.trendItem as any, { borderBottomColor: colors.border }]}>
                      <Text style={[styles.trendLabel as any, { fontFamily, color: colors.textSecondary }]}>
                        {t("exams.performanceRange")}
                      </Text>
                      <Text style={[styles.trendValue as any, { fontFamily, color: colors.textPrimary }]}>
                        {results.statistics.lowestScore}% - {results.statistics.highestScore}%
                      </Text>
                    </View>
                    <View style={styles.trendItem as any}>
                      <Text style={[styles.trendLabel as any, { fontFamily, color: colors.textSecondary }]}>
                        {t("exams.standardDeviation")}
                      </Text>
                      <Text style={[styles.trendValue as any, { fontFamily, color: colors.textPrimary }]}>
                        {Math.round(Math.sqrt(
                          results.submissions.reduce((acc, sub) =>
                            acc + Math.pow(sub.percentage - results.statistics.averageScore, 2), 0
                          ) / results.submissions.length
                        ))}%
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Question Analysis */}
                <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.questionAnalysis")}
                  </Text>
                  <Text style={[styles.cardSubtitle, { fontFamily, color: colors.textSecondary }]}>
                    {t("exams.detailedAnalysisComing")}
                  </Text>
                  <TouchableOpacity style={[styles.actionButton as any, { backgroundColor: `${colors.primary}15` }]}>
                    <Text style={[styles.actionButtonText as any, { fontFamily, color: colors.primary }]}>
                      {t("exams.generateReport")}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Action Recommendations */}
                <View style={[styles.analyticsCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                  <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.recommendedActions")}
                  </Text>
                  <View style={styles.recommendationsList}>
                    {performanceInsights.map((insight, index) =>
                      <View key={index} style={styles.recommendationItem as any}>
                        <Ionicons name="checkmark-circle" size={16} color={colors.success} style={styles.recommendationIcon} />
                        <Text style={[styles.recommendationText, { fontFamily, color: colors.textSecondary }]}>
                          {insight}
                        </Text>
                      </View>
                    )}
                    {performanceInsights.length === 0 &&
                      <Text style={[styles.noRecommendations as any, { fontFamily, color: colors.textTertiary }]}>
                        {t("exams.noRecommendations")}
                      </Text>
                    }
                  </View>
                </View>
              </View>
            </View>
        }
      </ScrollView>

      {/* Submission Detail Modal */}
      <Modal
        visible={detailModalVisible}
        animationType="slide"
        presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: colors.backgroundElevated, borderBottomColor: colors.border }]}>
            <View style={styles.modalHeaderContent as any}>
              <TouchableOpacity
                style={[styles.modalButton as any, { backgroundColor: colors.background }]}
                onPress={() => setDetailModalVisible(false)}>
                <Ionicons name="close" size={20} color={colors.primary} />
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { fontFamily, color: colors.textPrimary }]}>
                {t("exams.submissionDetails")}
              </Text>
              <TouchableOpacity
                style={[styles.modalButton as any, { backgroundColor: `${colors.primary}15` }]}
                onPress={handleSendFeedback}>
                <Ionicons name="chatbubble" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {selectedSubmission &&
            <ScrollView style={styles.modalContent}>
              <View style={[styles.studentCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <View style={styles.studentHeader as any}>
                  <View style={styles.studentInfo}>
                    <Text style={[styles.studentName as any, { fontFamily, color: colors.textPrimary }]}>
                      {selectedSubmission.student.name}
                    </Text>
                    <Text style={[styles.studentDetails, { fontFamily, color: colors.textSecondary }]}>
                      {selectedSubmission.student.studentId} • {selectedSubmission.student.class}
                    </Text>
                    {selectedSubmission.student.email &&
                      <Text style={[styles.studentEmail, { fontFamily, color: colors.textTertiary }]}>
                        {selectedSubmission.student.email}
                      </Text>
                    }
                  </View>
                  <View style={styles.studentScore as any}>
                    <Text style={[styles.scoreValue, { fontFamily, color: getGradeColor(selectedSubmission.percentage) }]}>
                      {selectedSubmission.percentage}%
                    </Text>
                    <Text style={[styles.scoreDetails, { fontFamily, color: colors.textSecondary }]}>
                      {selectedSubmission.score}/{selectedSubmission.total_points} {t("exams.points")}
                    </Text>
                    <View style={[styles.gradingStatusBadge as any, { backgroundColor: getGradingStatus(selectedSubmission).color + '20' }]}>
                      <Text style={[styles.gradingStatusBadgeText as any, { color: getGradingStatus(selectedSubmission).color, fontFamily }]}>
                        {getGradingStatus(selectedSubmission).text}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.submissionMetaRow as any}>
                  <Text style={[styles.submissionMetaText, { fontFamily, color: colors.textTertiary }]}>
                    {t("exams.submitted")}: {new Date(selectedSubmission.submitted_at).toLocaleString()}
                  </Text>
                  {selectedSubmission.time_spent &&
                    <Text style={[styles.submissionMetaText, { fontFamily, color: colors.textTertiary }]}>
                      {t("exams.time")}: {selectedSubmission.time_spent}
                    </Text>
                  }
                </View>
              </View>

              {/* Overall Feedback Section */}
              <View style={[styles.feedbackCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t("exams.overallFeedback")}
                </Text>
                <TextInput
                  style={[styles.feedbackInput, {
                    borderColor: colors.border,
                    backgroundColor: colors.background,
                    color: colors.textPrimary
                  }]}
                  placeholder={t("exams.addOverallFeedback")}
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  value={overallFeedback}
                  onChangeText={setOverallFeedback}
                />
              </View>

              {/* Answers Section */}
              <View style={[styles.answersCard, { backgroundColor: colors.backgroundElevated, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { fontFamily, color: colors.textPrimary }]}>
                  {t("exams.questionAnalysis")}
                </Text>
                <View style={styles.answersList}>
                  {selectedSubmission.answers
                    .filter(answer => !answer.is_section) // Filter out sections
                    .map((answer: Answer, index: number) =>
                      <View
                        key={index}
                        style={[styles.answerItem, { borderColor: colors.border }]}>
                        <View style={styles.answerHeader as any}>
                          <Text style={[styles.questionNumber as any, { fontFamily, color: colors.textPrimary }]}>
                            {t("exams.question")} {index + 1}
                          </Text>
                          <View style={[styles.answerStatus, {
                            backgroundColor: answer.needs_grading ?
                              (answer.is_manually_graded ? `${colors.success}20` : `${colors.warning}20`) :
                              `${colors.primary}20`
                          }]}>
                            <Text style={[styles.statusText as any, {
                              fontFamily,
                              color: answer.needs_grading ?
                                (answer.is_manually_graded ? colors.success : colors.warning) :
                                colors.primary
                            }]}>
                              {answer.needs_grading ?
                                (answer.is_manually_graded ? t("exams.manuallyGraded") : t("exams.needsGrading")) :
                                t("exams.autoGraded")}
                            </Text>
                          </View>
                        </View>

                        <Text style={[styles.answerPoints, { fontFamily, color: colors.textSecondary }]}>
                          {t("exams.points")}: {answer.points}
                        </Text>

                        {answer.answer && (
                          <View style={styles.answerContainer}>
                            <Text style={[styles.answerLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.studentAnswer")}:
                            </Text>
                            <Text style={[styles.answerText, { fontFamily, color: colors.textPrimary }]}>
                              {answer.answer}
                            </Text>
                          </View>
                        )}

                        {answer.needs_grading && (
                          <View style={[styles.gradingSection, { borderTopColor: isDark ? designTokens.colors.dark.border : designTokens.colors.light.border }]}>
                            <Text style={[styles.gradingLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.pointsAwarded")}:
                            </Text>
                            <View style={styles.pointsInputContainer as any}>
                              <TextInput
                                style={[styles.pointsInput, {
                                  borderColor: colors.border,
                                  backgroundColor: colors.background,
                                  color: colors.textPrimary
                                }]}
                                value={gradingAnswers[answer.question_id]?.points.toString() || answer.points.toString()}
                                onChangeText={(text) => handleGradeAnswer(
                                  answer.question_id,
                                  parseInt(text) || 0,
                                  gradingAnswers[answer.question_id]?.feedback || ''
                                )}
                                keyboardType="numeric"
                              />
                              <Text style={[styles.pointsMax, { fontFamily, color: colors.textSecondary }]}>
                                / {answer.points}
                              </Text>
                            </View>

                            <Text style={[styles.gradingLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.feedback")}:
                            </Text>
                            <TextInput
                              style={[styles.feedbackInputSmall, {
                                borderColor: colors.border,
                                backgroundColor: colors.background,
                                color: colors.textPrimary
                              }]}
                              placeholder={t("exams.addFeedback")}
                              placeholderTextColor={colors.textTertiary}
                              multiline
                              value={gradingAnswers[answer.question_id]?.feedback || ''}
                              onChangeText={(text) => handleGradeAnswer(
                                answer.question_id,
                                gradingAnswers[answer.question_id]?.points || answer.points,
                                text
                              )}
                            />
                          </View>
                        )}

                        {answer.feedback && !answer.needs_grading && (
                          <View style={styles.feedbackSection}>
                            <Text style={[styles.feedbackLabel as any, { fontFamily, color: colors.textSecondary }]}>
                              {t("exams.feedback")}:
                            </Text>
                            <Text style={[styles.feedbackText, { fontFamily, color: colors.textPrimary }]}>
                              {answer.feedback}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.modalActions as any}>
                <TouchableOpacity
                  style={[styles.modalActionButton as any, { backgroundColor: colors.background }]}
                  onPress={handleExport}>
                  <Text style={[styles.modalActionText as any, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.downloadPDF")}
                  </Text>
                </TouchableOpacity>

                {selectedSubmission.needs_manual_grading && !selectedSubmission.is_manually_graded && (
                  <TouchableOpacity
                    style={[styles.modalActionButton as any, { backgroundColor: colors.primary }]}
                    onPress={submitGrading}
                    disabled={isGrading}>
                    {isGrading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.modalActionText as any}>
                        {t("exams.submitGrading")}
                      </Text>
                    )}
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.modalActionButton as any, { backgroundColor: colors.background }]}
                  onPress={handleSendFeedback}>
                  <Text style={[styles.modalActionText as any, { fontFamily, color: colors.textPrimary }]}>
                    {t("exams.sendFeedback")}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          }
        </View>
      </Modal>

      {/* Feedback Modal */}
      <Modal
        visible={feedbackModalVisible}
        animationType="slide"
        transparent={true}>
        <View style={[styles.feedbackOverlay as any, { backgroundColor: `${colors.textPrimary}80` }]}>
          <View style={[styles.feedbackModal as any, { backgroundColor: colors.backgroundElevated }]}>
            <Text style={[styles.feedbackTitle, { fontFamily, color: colors.textPrimary }]}>
              {t("exams.sendFeedback")}
            </Text>
            <Text style={[styles.feedbackSubtitle, { fontFamily, color: colors.textSecondary }]}>
              {t("exams.sendFeedbackTo")} {selectedSubmission?.student.name}
            </Text>

            <TextInput
              style={[styles.feedbackInput, {
                borderColor: colors.border,
                backgroundColor: colors.background,
                color: colors.textPrimary
              }]}
              placeholder={t("exams.writeFeedback")}
              placeholderTextColor={colors.textTertiary}
              multiline
              value={feedback}
              onChangeText={setFeedback}
            />

            <View style={styles.feedbackActions as any}>
              <TouchableOpacity
                style={[styles.feedbackButton as any, { backgroundColor: colors.background }]}
                onPress={() => setFeedbackModalVisible(false)}>
                <Text style={[styles.feedbackButtonText as any, { fontFamily, color: colors.textPrimary }]}>
                  {t("common.cancel")}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.feedbackButton as any, { backgroundColor: colors.primary }]}
                onPress={sendFeedback}
                disabled={!feedback.trim() || sendingFeedback}>
                {sendingFeedback ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.feedbackButtonText as any}>
                    {t("common.send")}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const originalStyles = {
  container: {
    flex: 1,
    paddingBottom: 80
  },
  loadingText: {
    marginTop: designTokens.spacing.md,
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500'
  },
  emptyTitle: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '500',
    marginTop: designTokens.spacing.lg,
    marginBottom: designTokens.spacing.xs
  },
  emptySubtitle: {
    fontSize: designTokens.typography.footnote.fontSize,
    textAlign: 'center',
    marginBottom: designTokens.spacing.lg,
    paddingHorizontal: designTokens.spacing.xl
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    ...designTokens.shadows.sm
  },
  backButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize,
    marginLeft: designTokens.spacing.xs
  },
  header: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.lg,
    borderBottomWidth: 1
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  headerTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any
  },
  headerActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.sm
  },
  examInfo: {
    marginBottom: designTokens.spacing.lg
  },
  examTitle: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xs
  },
  examSubtitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xs
  },
  examCreator: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.xs
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.md
  },
  tabText: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.footnote.fontSize,
    fontWeight: '600'
  },
  content: {
    flex: 1
  },
  tabContent: {
    padding: designTokens.spacing.xl
  },
  insightsCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg
  },
  insightsHeader: {
    flexDirection: 'row'
  },
  insightsIcon: {
    marginTop: designTokens.spacing.xxs,
    marginRight: designTokens.spacing.md
  },
  insightsText: {
    flex: 1
  },
  insightsTitle: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs
  },
  insightItem: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xxs
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg
  },
  statCard: {
    flex: 1,
    minWidth: '48%',
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  statLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500'
  },
  statValue: {
    fontSize: designTokens.typography.title2.fontSize,
    fontWeight: designTokens.typography.title2.fontWeight as any,
    marginBottom: designTokens.spacing.xxs
  },
  statSubtitle: {
    fontSize: designTokens.typography.caption2.fontSize
  },
  scoreDistributionCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.sm
  },
  cardTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.md
  },
  distributionList: {
    gap: designTokens.spacing.md
  },
  distributionItem: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  distributionRange: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    width: 40
  },
  distributionBar: {
    flex: 1,
    height: 12,
    borderRadius: designTokens.borderRadius.full,
    marginHorizontal: designTokens.spacing.md,
    overflow: 'hidden'
  },
  distributionFill: {
    height: '100%',
    borderRadius: designTokens.borderRadius.full
  },
  distributionCount: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    width: 30
  },
  topPerformersCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  cardSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  performerItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.md
  },
  performerInfo: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: designTokens.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: designTokens.spacing.md
  },
  rankText: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '600'
  },
  performerDetails: {
    flex: 1
  },
  performerName: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs
  },
  performerId: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  performerScore: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: '700'
  },
  submissionsCard: {
    borderRadius: designTokens.borderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...designTokens.shadows.sm
  },
  submissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: designTokens.spacing.lg
  },
  submissionInfo: {
    flex: 1,
    marginRight: designTokens.spacing.md
  },
  submissionName: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xxs
  },
  submissionDetails: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  submissionMeta: {
    alignItems: 'flex-end',
    marginRight: designTokens.spacing.md
  },
  submissionScore: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: '700',
    marginBottom: designTokens.spacing.xxs
  },
  submissionDate: {
    fontSize: designTokens.typography.caption2.fontSize
  },
  chevronIcon: {
    marginLeft: designTokens.spacing.xs
  },
  emptyState: {
    padding: designTokens.spacing.xxl,
    alignItems: 'center'
  },
  analyticsSection: {
    gap: designTokens.spacing.lg
  },
  analyticsCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  trendList: {
    gap: designTokens.spacing.md
  },
  trendItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: designTokens.spacing.xs,
    borderBottomWidth: 1
  },
  trendLabel: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '500'
  },
  trendValue: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600'
  },
  actionButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: designTokens.spacing.lg,
    paddingVertical: designTokens.spacing.sm,
    borderRadius: designTokens.borderRadius.lg,
    marginTop: designTokens.spacing.md
  },
  actionButtonText: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600'
  },
  recommendationsList: {
    gap: designTokens.spacing.md,
    marginTop: designTokens.spacing.md
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  recommendationIcon: {
    marginTop: designTokens.spacing.xxs,
    marginRight: designTokens.spacing.md
  },
  recommendationText: {
    flex: 1,
    fontSize: designTokens.typography.caption1.fontSize
  },
  noRecommendations: {
    fontSize: designTokens.typography.caption1.fontSize,
    textAlign: 'center',
    marginTop: designTokens.spacing.md
  },
  modalContainer: {
    flex: 1
  },
  modalHeader: {
    paddingHorizontal: designTokens.spacing.xl,
    paddingTop: designTokens.spacing.xxxl,
    paddingBottom: designTokens.spacing.md,
    borderBottomWidth: 1
  },
  modalHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: designTokens.spacing.md
  },
  modalButton: {
    width: 40,
    height: 40,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any
  },
  modalContent: {
    flex: 1,
    padding: designTokens.spacing.xl
  },
  studentCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.sm
  },
  studentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.md
  },
  studentInfo: {
    flex: 1,
    marginRight: designTokens.spacing.md
  },
  studentName: {
    fontSize: designTokens.typography.headline.fontSize,
    fontWeight: '600',
    marginBottom: designTokens.spacing.xs
  },
  studentDetails: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.xs
  },
  studentEmail: {
    fontSize: designTokens.typography.caption2.fontSize
  },
  studentScore: {
    alignItems: 'flex-end'
  },
  scoreValue: {
    fontSize: designTokens.typography.title1.fontSize,
    fontWeight: designTokens.typography.title1.fontWeight as any,
    marginBottom: designTokens.spacing.xxs
  },
  scoreDetails: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  submissionMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  submissionMetaText: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  answersCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    ...designTokens.shadows.sm
  },
  answersList: {
    gap: designTokens.spacing.md
  },
  answerItem: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.lg
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: designTokens.spacing.sm
  },
  questionNumber: {
    fontSize: designTokens.typography.body.fontSize,
    fontWeight: '600',
    flex: 1
  },
  answerStatus: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xs,
    borderRadius: designTokens.borderRadius.full
  },
  statusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  answerPoints: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.sm
  },
  answerText: {
    fontSize: designTokens.typography.caption1.fontSize
  },
  modalActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.md,
    marginBottom: designTokens.spacing.lg,
    marginTop: designTokens.spacing.lg
  },
  modalActionButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center'
  },
  modalActionText: {
    color: 'white',
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize
  },
  feedbackOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: designTokens.spacing.xl
  },
  feedbackModal: {
    width: '100%',
    maxWidth: 400,
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    ...designTokens.shadows.lg
  },
  feedbackTitle: {
    fontSize: designTokens.typography.title3.fontSize,
    fontWeight: designTokens.typography.title3.fontWeight as any,
    marginBottom: designTokens.spacing.xs
  },
  feedbackSubtitle: {
    fontSize: designTokens.typography.caption1.fontSize,
    marginBottom: designTokens.spacing.lg
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    height: 120,
    fontSize: designTokens.typography.body.fontSize,
    marginBottom: designTokens.spacing.lg
  },
  feedbackActions: {
    flexDirection: 'row',
    gap: designTokens.spacing.md
  },
  feedbackButton: {
    flex: 1,
    paddingVertical: designTokens.spacing.md,
    borderRadius: designTokens.borderRadius.lg,
    alignItems: 'center'
  },
  feedbackButtonText: {
    fontWeight: '600',
    fontSize: designTokens.typography.body.fontSize
  }
};

const additionalStyles = {
  gradingStatus: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    borderRadius: designTokens.borderRadius.full,
    marginBottom: designTokens.spacing.xxs
  },
  gradingStatusText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  gradingStatusBadge: {
    paddingHorizontal: designTokens.spacing.sm,
    paddingVertical: designTokens.spacing.xxs,
    borderRadius: designTokens.borderRadius.full,
    alignSelf: 'flex-end',
    marginTop: designTokens.spacing.xs
  },
  gradingStatusBadgeText: {
    fontSize: designTokens.typography.caption2.fontSize,
    fontWeight: '600'
  },
  feedbackCard: {
    borderRadius: designTokens.borderRadius.xl,
    padding: designTokens.spacing.lg,
    borderWidth: 1,
    marginBottom: designTokens.spacing.lg,
    ...designTokens.shadows.sm
  },
  feedbackInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.md,
    height: 100,
    fontSize: designTokens.typography.body.fontSize,
    marginTop: designTokens.spacing.sm
  },
  answerContainer: {
    marginTop: designTokens.spacing.sm
  },
  answerLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs
  },
  answerText: {
    fontSize: designTokens.typography.caption1.fontSize,
    lineHeight: designTokens.typography.caption1.fontSize * 1.4
  },
  gradingSection: {
    marginTop: designTokens.spacing.md,
    paddingTop: designTokens.spacing.md,
    borderTopWidth: 1,
  },
  gradingLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs
  },
  pointsInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: designTokens.spacing.md
  },
  pointsInput: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.sm,
    width: 80,
    fontSize: designTokens.typography.body.fontSize
  },
  pointsMax: {
    marginLeft: designTokens.spacing.xs,
    fontSize: designTokens.typography.caption1.fontSize
  },
  feedbackInputSmall: {
    borderWidth: 1,
    borderRadius: designTokens.borderRadius.lg,
    padding: designTokens.spacing.sm,
    height: 80,
    fontSize: designTokens.typography.caption1.fontSize
  },
  feedbackSection: {
    marginTop: designTokens.spacing.md
  },
  feedbackLabel: {
    fontSize: designTokens.typography.caption1.fontSize,
    fontWeight: '500',
    marginBottom: designTokens.spacing.xxs
  },
  feedbackText: {
    fontSize: designTokens.typography.caption1.fontSize,
    lineHeight: designTokens.typography.caption1.fontSize * 1.4
  }
};

// Merge additional styles with existing styles object
const styles = {
  ...originalStyles,
  ...additionalStyles
};
