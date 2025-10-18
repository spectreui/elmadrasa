import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';
import { useAuth } from './AuthContext';
import { apiService } from '@/services/api';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
  isLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  en: {
    // General use
    'home': 'Home',
    'goodMorning': 'Good Morning',
    'goodEvening': 'Good Evening',
    'goodAfternoon': 'Good Afternoon',

    // Dashboard
    'dashboard.loading': 'Loading your dashboard...',
    'dashboard.overview': 'Overview',
    'dashboard.activeExams': 'Active Exams',
    'dashboard.currentlyRunning': 'Currently running',
    'dashboard.students': 'Students',
    'dashboard.totalEnrolled': 'Total enrolled',
    'dashboard.avgScore': 'Avg. Score',
    'dashboard.classAverage': 'Class average',
    'dashboard.engagement': 'Engagement',
    'dashboard.studentActivity': 'Student activity',
    'dashboard.quickActions': 'Quick Actions',
    'dashboard.createExam': 'Create Exam',
    'dashboard.designAssessment': 'Design new assessment',
    'dashboard.assignWork': 'Assign Work',
    'dashboard.createHomework': 'Create homework',
    'dashboard.myClasses': 'My Classes',
    'dashboard.manageStudents': 'Manage students',
    'dashboard.analytics': 'Analytics',
    'dashboard.viewInsights': 'View insights',
    'dashboard.recentActivity': 'Recent Activity',
    'dashboard.noRecentActivity': 'No recent activity',
    'dashboard.noActivityMessage': 'Your recent activities will appear here',
    'dashboard.performanceInsights': 'Performance Insights',
    'dashboard.classes': 'Classes',
    'dashboard.subjects': 'Subjects',
    'dashboard.avgResponse': 'Avg. Response',
    'dashboard.createdFor': 'Created for',
    'dashboard.noActivity': 'No recent activity',
    'dashboard.noActivityDesc': 'Your activities will appear here',
    'dashboard.score': 'Score',
    'dashboard.assignedTo': 'Assigned For',

    // Common
    'common.viewAll': 'View All',
    'common.active': 'Active',
    'common.loading': 'Loading...',
    'common.loadFailed': 'Failed to Load...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.back': 'Back',
    'common.add': 'Add',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.pending': 'Pending',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.create': 'Create',
    'common.update': 'Update',
    'common.submit': 'Submit',
    'common.confirm': 'Confirm',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.sort': 'Sort',
    'common.noItems': 'No items available',
    'common.ok': 'OK',

    // Calender
    'months.january': 'January',
    'months.february': 'February',
    'months.march': 'March',
    'months.april': 'April',
    'months.may': 'May',
    'months.june': 'June',
    'months.july': 'July',
    'months.august': 'August',
    'months.september': 'September',
    'months.october': 'October',
    'months.november': 'November',
    'months.december': 'December',

    'months.Feb': 'February',
    'months.Mar': 'March',
    'months.Apr': 'April',
    'months.May': 'May',
    'months.Jun': 'June',
    'months.Jul': 'July',
    'months.Aug': 'August',
    'months.Sep': 'September',
    'months.Oct': 'October',
    'months.Nov': 'November',
    'months.Dec': 'December',

    // Profile
    'profile.title': 'Profile',
    'profile.settings': 'Settings',
    'profile.teacherInfo': 'Teacher Information',
    'profile.teacherId': 'Teacher ID',
    'profile.email': 'Email',
    'profile.accountCreated': 'Account Created',
    'profile.teachingOverview': 'Teaching Overview',
    'profile.examsCreated': 'Exams Created',
    'profile.toGrade': 'To Grade',
    'profile.classPerformance': 'Class Performance',
    'profile.averageClassScore': 'Average Class Score',
    'profile.studentEngagement': 'Student Engagement',
    'profile.averageScore': 'Average Score',
    'profile.notSet': 'Not Set',
    'profile.language': 'Language',

    // Notifications
    'notifications.settings': 'Notification Settings',
    'notifications.general': 'General Notifications',
    'notifications.generalDesc': 'App notifications and updates',
    'notifications.examAlerts': 'Exam Alerts',
    'notifications.examAlertsDesc': 'Exam completion notifications',
    'notifications.gradingReminders': 'Grading Reminders',
    'notifications.gradingRemindersDesc': 'Pending grading alerts',

    // Statistics
    'statistics.thisWeek': 'This Week',
    'statistics.thisMonth': 'This Month',
    'statistics.thisYear': 'This Year',
    'statistics.noClassData': 'No class data available',
    'statistics.noClassDataDesc': 'Performance data will appear here',
    'statistics.noTrendData': 'No trend data available',
    'statistics.noTrendDataDesc': 'Performance trends will appear here',
    'statistics.performanceTrend': 'Performance Trend',
    'statistics.totalExams': 'Total Exams',
    'statistics.avgCompletion': 'Avg Completion',
    'statistics.activeStudents': 'Active Students',
    'statistics.pendingGrading': 'Pending Grading',

    // System
    'system.preferences': 'System Preferences',
    'system.darkMode': 'Dark Mode',
    'system.darkModeDesc': 'Enable dark theme',

    // Tools
    'tools.title': 'Teacher Tools',
    'tools.exportData': 'Export Student Data',
    'tools.classAnalytics': 'Class Analytics',
    'tools.teachingResources': 'Teaching Resources',

    // Auth
    'auth.logOut': 'Sign Out',
    'auth.logOutConfirm': 'Are you sure you want to sign out?',

    // Homework
    'homework.title': 'Homework',
    'homework.new': 'New Homework',
    'homework.createAssignment': 'Create assignment with questions',
    'homework.assignmentDetails': 'Assignment Details',
    'homework.titleRequired': 'Title *',
    'homework.titlePlaceholder': 'Enter homework title',
    'homework.description': 'Description',
    'homework.descriptionPlaceholder': 'Enter homework description and instructions...',
    'homework.classRequired': 'Class *',
    'homework.selectClass': 'Select class',
    'homework.subjectRequired': 'Subject *',
    'homework.selectSubject': 'Select subject',
    'homework.selectClassFirst': 'Select class first',
    'homework.schedule': 'Schedule',
    'homework.startDateRequired': 'Start Date *',
    'homework.dueDateRequired': 'Due Date *',
    'homework.selectDate': 'Select date',
    'homework.totalPoints': 'Total Points',
    'homework.includeQuestions': 'Include Questions',
    'homework.includeQuestionsDesc': 'Add questions for students to answer',
    'homework.allowAttachments': 'Allow Attachments',
    'homework.allowAttachmentsDesc': 'Students can upload files with their submission',
    'homework.questions': 'Questions',
    'homework.questionText': 'Question Text',
    'homework.questionPlaceholder': 'Enter your question...',
    'homework.questionType': 'Question Type',
    'homework.textAnswer': 'Text Answer',
    'homework.multipleChoice': 'Multiple Choice',
    'homework.options': 'Options',
    'homework.addOption': 'Add Option',
    'homework.points': 'Points',
    'homework.assign': 'Assign Homework',
    'homework.missingInfo': 'Missing Information',
    'homework.fillRequiredFields': 'Please fill in all required fields',
    'homework.invalidDate': 'Invalid Date',
    'homework.enterValidDates': 'Please enter valid start and due dates',
    'homework.invalidDateRange': 'Invalid Date Range',
    'homework.startBeforeDue': 'Start date must be before due date',
    'homework.invalidPoints': 'Invalid Points',
    'homework.pointsRange': 'Points must be between 1 and 100',
    'homework.invalidQuestion': 'Invalid Question',
    'homework.questionsNeedText': 'All questions must have text',
    'homework.mcqMinOptions': 'Multiple choice questions must have at least 2 options',
    'homework.optionsNeedText': 'All options must have text',
    'homework.noAnswerProvided': 'No answer provided',
    'homework.questionNumber': 'Question {n}',

    // Submissions
    'submissions.title': 'Submissions',
    'submissions.submitted': 'Submitted',
    'submissions.graded': 'Graded',
    'submissions.avgGrade': 'Avg Grade',
    'submissions.none': 'No Submissions Yet',
    'submissions.noneMessage': 'Students haven\'t submitted this homework yet',
    'submissions.grade': 'Grade Submission',
    'submissions.editGrade': 'Edit Grade',
    'submissions.studentContent': 'Student\'s Submission Content',
    'submissions.noContent': 'No content provided',
    'submissions.questionsAnswers': 'Questions & Student Answers',
    'submissions.studentAnswer': 'Student\'s Answer',
    'submissions.noAnswer': 'No answer provided',
    'submissions.attachments': 'Attachments',
    'submissions.overallGrade': 'Overall Grade',
    'submissions.textSubmission': 'Text Submission',
    'submissions.questionPoints': 'Question Points',
    'submissions.overallFeedback': 'Overall Feedback',
    'submissions.gradedOn': 'Graded on',
    'submissions.submittedOn': 'Submitted on',

    // Classes
    'classes.myClasses': 'My Classes',
    'classes.subtitle': 'Classes and subjects you teach',
    'classes.none': 'No classes assigned',
    'classes.noneMessage': 'Contact your administrator to get assigned to classes and subjects.',
    'classes.joinCode': 'Join Code',
    'classes.tapToCopy': 'Tap to copy and share with students',
    'classes.noCode': 'No join code available',
    'classes.codeCopied': 'Code Copied To Clipboard!',
    'classes.failed': 'Failed to Copy!',
    'classes.classId': 'Class ID',
    'classes.subjectId': 'Subject ID',
    'classes.noCodeAvailable': 'No code available',

    // Exams
    'exams.create': 'Create New Exam',
    'exams.edit': 'Edit Exam',
    'exams.details': 'Exam Details',
    'exams.title': 'Exam Title',
    'exams.settings': 'Exam Settings',
    'exams.timed': 'Timed Exam',
    'exams.timedDesc': 'Set time limit for exam',
    'exams.duration': 'Duration (minutes)',
    'exams.allowRetake': 'Allow Retake',
    'exams.allowRetakeDesc': 'Students can retake exam',
    'exams.randomOrder': 'Random Order',
    'exams.randomOrderDesc': 'Shuffle questions order',
    'exams.advancedOptions': 'Advanced Options',
    'exams.allowImageSubmissions': 'Allow Image Submissions',
    'exams.allowImageSubmissionsDesc': 'Students can submit photos of paper answers',
    'exams.attachment': 'Exam Attachment (Optional)',
    'exams.addAttachment': 'Add PDF/Image Attachment',
    'exams.uploading': 'Uploading...',
    'exams.availableFrom': 'Available From',
    'exams.selectAvailableDate': 'Select available date/time',
    'exams.dueDate': 'Due Date',
    'exams.selectDueDate': 'Select due date',
    'exams.completeAllQuestions': 'Please complete all questions',
    'exams.dateRangeError': 'Available date must be before due date',
    'exams.questions': 'Questions',
    'exams.question': 'Question',
    'exams.enterQuestion': 'Enter the Question',
    'exams.options': 'Options',
    'exams.expectedAnswer': 'Expected Answer',
    'exams.loadFailed': 'Failed to load exam',
    'exams.loadClassesFailed': 'Failed to load classes',
    'exams.loadSubjectsFailed': 'Failed to load subjects',
    'exams.fillRequired': 'Please fill all required fields',
    'exams.completeQuestions': 'Please complete all questions',
    'exams.dateValidation': 'Available date must be before due date',
    'exams.created': 'Exam created successfully',
    'exams.updated': 'Exam updated successfully',
    'exams.createFailed': 'Failed to create exam',
    'exams.updateFailed': 'Failed to update exam',
    'exams.loadingExam': 'Loading exam data...',
    'exams.loadingClasses': 'Loading classes...',
    'exams.loadingSubjects': 'Loading subjects...',
    'exams.select': 'Select',
    'exams.at': 'at',
    'exams.selectedDate': 'Selected Date',
    'exams.selectTime': 'Select Time',
    'exams.hours': 'Hours',
    'exams.minutes': 'Minutes',
    'exams.option': 'Option',
    'exams.enterExpectedAnswer': 'Enter expected answer',
    'exams.file': 'file',
    'exams.attachmentDesc': 'Optional attachment for reference',
    'exams.imageUploaded': 'Image uploaded successfully',
    'exams.imageUploadFailed': 'Failed to upload image',
    'exams.documentPickFailed': 'Failed to pick document',
    'exams.pdfUploadInfo': 'PDF upload functionality coming soon',
    'exams.info': 'Information',
    'exams.newExamTitle': 'New Exam Available',
    'exams.newExamBody': 'A new exam has been assigned',
    'exams.forClass': 'for class',
    'exams.correctAnswer': 'Correct Answer',
    'exams.activatedTitle': 'Exam Activated',
    'exams.activatedBody': 'The exam "{title}" is now available for you to take',
    'exams.myExams': 'My Exams',
    'exams.totalExams': 'total exams',
    'exams.noActiveExams': 'No active exams',
    'exams.noDraftExams': 'No draft exams',
    'exams.noArchivedExams': 'No archived exams',
    'exams.allInDraftOrArchived': 'All exams are in draft or archived status',
    'exams.createFirstExam': 'Create your first exam to get started',
    'exams.untimed': 'Untimed',
    'exams.showing': 'Showing',
    'exams.exam': 'Exam',
    'exams.deleteConfirm': 'Delete Exam',
    'exams.deleteSuccess': 'Exam deleted successfully',
    'exams.deleteFailed': 'Failed to delete exam',
    'exams.activatedSuccess': 'Exam activated successfully',
    'exams.deactivatedSuccess': 'Exam deactivated successfully',
    'exams.drafts': 'Drafts',
    'exams.archived': 'Archived',
    'exams.active': 'Active',
    'exams.inactive': 'Inactive',
    'exams.loadingResults': 'Loading exam results...',
    'exams.noResultsFound': 'No results found',
    'exams.resultsLoadFailed': 'Unable to load exam results. The exam may not exist or you may not have permission to view it.',
    'exams.examAnalytics': 'Exam Analytics',
    'exams.createdBy': 'Created by',
    'exams.of': 'of',
    'exams.students': 'students',
    'exams.totalSubmissions': 'Total submissions',
    'exams.highest': 'Highest',
    'exams.topScore': 'Top score',
    'exams.lowest': 'Lowest',
    'exams.lowestScore': 'Lowest score',
    'exams.scoreDistribution': 'Score Distribution',
    'exams.topPerformers': 'Top Performers',
    'exams.showingTop': 'Showing top',
    'exams.performanceAnalysis': 'Performance Analysis',
    'exams.performanceRange': 'Performance Range',
    'exams.standardDeviation': 'Standard Deviation',
    'exams.questionAnalysis': 'Question Analysis',
    'exams.detailedAnalysisComing': 'Detailed question-by-question analysis coming soon...',
    'exams.generateReport': 'Generate Detailed Report',
    'exams.recommendedActions': 'Recommended Actions',
    'exams.noRecommendations': 'No specific recommendations at this time.',
    'exams.noSubmissionsYet': 'No submissions yet',
    'exams.studentsNotSubmitted': 'Students haven\'t submitted this exam yet',
    'exams.submissionDetails': 'Submission Details',
    'exams.points': 'points',
    'exams.submitted': 'Submitted',
    'exams.time': 'Time',
    'exams.overallFeedback': 'Overall Feedback',
    'exams.addOverallFeedback': 'Add overall feedback for this submission...',
    'exams.manuallyGraded': 'Manually Graded',
    'exams.needsGrading': 'Needs Grading',
    'exams.autoGraded': 'Auto Graded',
    'exams.studentAnswer': 'Student Answer',
    'exams.pointsAwarded': 'Points Awarded',
    'exams.addFeedback': 'Add feedback...',
    'exams.downloadPDF': 'Download PDF',
    'exams.submitGrading': 'Submit Grading',
    'exams.sendFeedback': 'Send Feedback',
    'exams.sendFeedbackTo': 'Send personalized feedback to',
    'exams.writeFeedback': 'Write your feedback here...',
    'submissions.pending': 'Pending',
    'submissions.autoGraded': 'Auto Graded',
    'submissions.gradingSuccess': 'Submission graded successfully!',
    'submissions.gradingFailed': 'Failed to grade submission. Please try again.'

  },
  ar: {
    // General use
    'home': 'الصفحة الرئيسية',
    'goodMorning': 'صباح الخير',
    'goodEvening': 'مساء الخير',
    'goodAfternoon': 'مساء الخير',

    // Dashboard
    'dashboard.loading': 'جاري تحميل لوحة التحكم...',
    'dashboard.overview': 'نظرة عامة',
    'dashboard.activeExams': 'الاختبارات النشطة',
    'dashboard.currentlyRunning': 'جارية حالياً',
    'dashboard.students': 'الطلاب',
    'dashboard.totalEnrolled': 'إجمالي المسجلين',
    'dashboard.avgScore': 'متوسط الدرجة',
    'dashboard.classAverage': 'متوسط الفصل',
    'dashboard.engagement': 'المشاركة',
    'dashboard.studentActivity': 'نشاط الطالب',
    'dashboard.quickActions': 'إجراءات سريعة',
    'dashboard.createExam': 'إنشاء اختبار',
    'dashboard.designAssessment': 'تصميم تقييم جديد',
    'dashboard.assignWork': 'تعيين عمل',
    'dashboard.createHomework': 'إنشاء واجب',
    'dashboard.myClasses': 'فصولي',
    'dashboard.manageStudents': 'إدارة الطلاب',
    'dashboard.analytics': 'النتائج',
    'dashboard.viewInsights': 'عرض الرؤى',
    'dashboard.recentActivity': 'النشاط الأخير',
    'dashboard.noRecentActivity': 'لا يوجد نشاط حديث',
    'dashboard.noActivityMessage': 'ستظهر أنشطتك الحديثة هنا',
    'dashboard.performanceInsights': 'مؤشرات الأداء',
    'dashboard.classes': 'الفصول',
    'dashboard.subjects': 'المواد',
    'dashboard.avgResponse': 'متوسط الاستجابة',
    'dashboard.createdFor': 'تم انشائه ل',
    'dashboard.noActivity': 'لا يوجد نشاط حديث',
    'dashboard.noActivityDesc': 'ستظهر أنشطتك هنا',
    'dashboard.score': 'النتيجة',
    'dashboard.assignedTo': 'تم تعيينه ل',

    'completed': 'اكتمل',
    'pending': 'في انتظار المراجعة',
    'grading': 'في انتظار التصحيح',

    // Subjects
    'Physics': 'فيزياء',
    'Mathematics': 'ماث',
    'Chemistry': 'كمياء',
    'Biolgy': 'احياء',
    'Arabic': 'عربي',
    'English': 'اللغة الانجليزية',
    'Deutch': 'اللغة الألمانية',
    'French': 'اللغة الفرنسية',
    'Programming': 'برمجة',
    'Islam': 'الدين الاسلامي',
    'Christianity': 'الدين المسيحي',
    'Science': 'علوم',
    'Integrated Science': 'علوم متكاملة',

    // Common
    'common.viewAll': 'عرض الكل',
    'common.active': 'نشط',
    'common.loading': 'جاري التحميل...',
    'common.loadFailed': 'فشل التحميل...',
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.send': 'إرسل',
    'common.back': 'رجوع',
    'common.add': 'إضافة',
    'common.error': 'خطأ',
    'common.success': 'تم بنجاح',
    'common.pending': 'في الانتظار',
    'common.edit': 'تعديل',
    'common.delete': 'حذف',
    'common.create': 'إنشاء',
    'common.update': 'تحديث',
    'common.submit': 'إرسال',
    'common.confirm': 'تأكيد',
    'common.next': 'التالي',
    'common.previous': 'السابق',
    'common.search': 'بحث',
    'common.filter': 'تصفية',
    'common.sort': 'ترتيب',

    // Calender
    'months.january': 'يناير',
    'months.february': 'فبراير',
    'months.march': 'مارس',
    'months.april': 'أبريل',
    'months.may': 'مايو',
    'months.june': 'يونيو',
    'months.july': 'يوليو',
    'months.august': 'أغسطس',
    'months.september': 'سبتمبر',
    'months.october': 'أكتوبر',
    'months.november': 'نوفمبر',
    'months.december': 'ديسمبر',

    'months.Feb': 'فبراير',
    'months.Mar': 'مارس',
    'months.Apr': 'أبريل',
    'months.May': 'مايو',
    'months.Jun': 'يونيو',
    'months.Jul': 'يوليو',
    'months.Aug': 'أغسطس',
    'months.Sep': 'سبتمبر',
    'months.Oct': 'أكتوبر',
    'months.Nov': 'نوفمبر',
    'months.Dec': 'ديسمبر',

    // Statistics
    'statistics.thisWeek': 'هذا الأسبوع',
    'statistics.thisMonth': 'هذا الشهر',
    'statistics.thisYear': 'هذه السنة',
    'statistics.noClassData': 'لا توجد بيانات للفصول',
    'statistics.noClassDataDesc': 'ستظهر بيانات الأداء هنا',
    'statistics.noTrendData': 'لا توجد بيانات اتجاه',
    'statistics.noTrendDataDesc': 'ستظهر اتجاهات الأداء هنا',
    'statistics.performanceTrend': 'اتجاه الأداء',
    'statistics.totalExams': 'إجمالي الاختبارات',
    'statistics.avgCompletion': 'متوسط الإكمال',
    'statistics.activeStudents': 'الطلاب النشطين',
    'statistics.pendingGrading': 'في انتظار التصحيح',

    // Profile
    'profile.title': 'الملف الشخصي',
    'profile.settings': 'الإعدادات',
    'profile.teacherInformation': 'معلومات المعلم',
    'profile.teacherId': 'رقم المعلم',
    'profile.email': 'البريد الإلكتروني',
    'profile.accountCreated': 'تم إنشاء الحساب',
    'profile.teachingOverview': 'نظرة عامة على التدريس',
    'profile.examsCreated': 'الاختبارات المنشأة',
    'profile.toGrade': 'في انتظار التصحيح',
    'profile.classPerformance': 'أداء الفصل',
    'profile.averageClassScore': 'متوسط درجة الفصل',
    'profile.studentEngagement': 'مشاركة الطلاب',
    'profile.notSet': 'غير محدد',
    'profile.averageScore': 'متوسط الدرجة',
    'profile.language': 'اللغة',
    'profile.teacher': 'Teacher',
    'profile.na': 'N/A',
    'profile.logoutError': 'Failed to logout',

    // Notifications
    'notifications.settings': 'إعدادات الإشعارات',
    'notifications.general': 'الإشعارات العامة',
    'notifications.generalDesc': 'إشعارات وتحديثات التطبيق',
    'notifications.examAlerts': 'تنبيهات الاختبارات',
    'notifications.examAlertsDesc': 'إشعارات إكمال الاختبار',
    'notifications.gradingReminders': 'تذكير التصحيح',
    'notifications.gradingRemindersDesc': 'تنبيهات التصحيح المعلقة',

    // System
    'system.preferences': 'تفضيلات النظام',
    'system.darkMode': 'الوضع الداكن',
    'system.darkModeDesc': 'تفعيل السمة الداكنة',

    // Tools
    'tools.title': 'أدوات المعلم',
    'tools.exportData': 'تصدير بيانات الطلاب',
    'tools.classAnalytics': 'نتائج الفصل',
    'tools.teachingResources': 'موارد التدريس',

    // Auth
    'auth.logOut': 'تسجيل الخروج',
    'auth.logOutConfirm': 'هل أنت متأكد أنك تريد تسجيل الخروج؟',

    // Homework
    'homework.title': 'واجب',
    'homework.new': 'واجب جديد',
    'homework.createAssignment': 'إنشاء مهمة مع أسئلة',
    'homework.assignmentDetails': 'تفاصيل المهمة',
    'homework.titleRequired': 'العنوان *',
    'homework.titlePlaceholder': 'أدخل عنوان الواجب',
    'homework.description': 'الوصف',
    'homework.descriptionPlaceholder': 'أدخل وصف الواجب والتعليمات...',
    'homework.classRequired': 'الفصل *',
    'homework.selectClass': 'اختر الفصل',
    'homework.subjectRequired': 'المادة *',
    'homework.selectSubject': 'اختر المادة',
    'homework.selectClassFirst': 'اختر الفصل أولاً',
    'homework.schedule': 'الجدول الزمني',
    'homework.startDateRequired': 'تاريخ البدء *',
    'homework.dueDateRequired': 'تاريخ الاستحقاق *',
    'homework.selectDate': 'اختر التاريخ',
    'homework.totalPoints': 'إجمالي النقاط',
    'homework.includeQuestions': 'تضمين الأسئلة',
    'homework.includeQuestionsDesc': 'أضف أسئلة للإجابة عليها من قبل الطلاب',
    'homework.allowAttachments': 'السماح بالمرفقات',
    'homework.allowAttachmentsDesc': 'يمكن للطلاب رفع الملفات مع تسليمهم',
    'homework.questions': 'الأسئلة',
    'homework.questionText': 'نص السؤال',
    'homework.questionPlaceholder': 'أدخل سؤالك...',
    'homework.questionType': 'نوع السؤال',
    'homework.textAnswer': 'إجابة نصية',
    'homework.multipleChoice': 'اختيار من متعدد',
    'homework.options': 'خيارات',
    'homework.addOption': 'إضافة خيار',
    'homework.points': 'النقاط',
    'homework.assign': 'تعيين الواجب',
    'homeworks': 'الواجيات',
    'homework.missingInfo': 'معلومات ناقصة',
    'homework.fillRequiredFields': 'يرجى ملء جميع الحقول المطلوبة',
    'homework.invalidDate': 'تاريخ غير صالح',
    'homework.enterValidDates': 'يرجى إدخال تواريخ بدء واستحقاق صالحة',
    'homework.invalidDateRange': 'نطاق تاريخ غير صالح',
    'homework.startBeforeDue': 'يجب أن يكون تاريخ البدء قبل تاريخ الاستحقاق',
    'homework.invalidPoints': 'نقاط غير صالحة',
    'homework.pointsRange': 'يجب أن تكون النقاط بين 1 و 100',
    'homework.invalidQuestion': 'سؤال غير صالح',
    'homework.questionsNeedText': 'جميع الأسئلة يجب أن تحتوي على نص',
    'homework.mcqMinOptions': 'أسئلة الاختيار من متعدد يجب أن تحتوي على خيارين على الأقل',
    'homework.optionsNeedText': 'جميع الخيارات يجب أن تحتوي على نص',
    'homework.noAnswerProvided': 'لم يتم تقديم إجابة',
    'homework.questionNumber': 'سؤال {n}',

    // Submissions
    'submissions.title': 'التسليمات',
    'submissions.submitted': 'تم التسليم',
    'submissions.graded': 'تم التصحيح',
    'submissions.avgGrade': 'متوسط الدرجة',
    'submissions.none': 'لا توجد تسليمات بعد',
    'submissions.noneMessage': 'الطلاب لم يسلموا هذا الواجب بعد',
    'submissions.grade': 'تصحيح التسليم',
    'submissions.editGrade': 'تعديل التصحيح',
    'submissions.studentContent': 'محتوى تسليم الطالب',
    'submissions.noContent': 'لا يوجد محتوى مقدم',
    'submissions.questionsAnswers': 'الأسئلة والإجابات',
    'submissions.studentAnswer': 'إجابة الطالب',
    'submissions.noAnswer': 'لم يتم تقديم إجابة',
    'submissions.attachments': 'المرفقات',
    'submissions.overallGrade': 'الدرجة الإجمالية',
    'submissions.textSubmission': 'التسليم النصي',
    'submissions.questionPoints': 'نقاط الأسئلة',
    'submissions.overallFeedback': 'ملاحظات عامة',
    'submissions.gradedOn': 'تم التصحيح في',
    'submissions.submittedOn': 'تم التسليم في',

    // Classes
    'classes.myClasses': 'فصولي',
    'classes.subtitle': 'الفصول والمواد التي تدرسها',
    'classes.none': 'لا توجد فصول مخصصة',
    'classes.noneMessage': 'اتصل بمسؤولك للحصول على فصول ومواد دراسية.',
    'classes.joinCode': 'رمز الانضمام',
    'classes.tapToCopy': 'انقر للنسخ ومشاركته مع الطلاب',
    'classes.noCode': 'لا يوجد رمز انضمام متاح',
    'classes.codeCopied': 'تم النسخ!',
    'classes.failed': 'فشل النسخ!',
    'classes.classId': 'معرف الفصل',
    'classes.subjectId': 'معرف المادة',
    'classes.noCodeAvailable': 'لا يوجد رمز متاح',

    // Exams
    "exams": "الاختبارات",
    'exams.create': 'إنشاء اختبار جديد',
    'exams.edit': 'تعديل الاختبار',
    'exams.details': 'تفاصيل الاختبار',
    'exams.title': 'عنوان الاختبار',
    'exams.settings': 'إعدادات الاختبار',
    'exams.timed': 'اختبار مؤقت',
    'exams.timedDesc': 'تعيين حد زمني للاختبار',
    'exams.duration': 'المدة (دقائق)',
    'exams.allowRetake': 'السماح بإعادة الاختبار',
    'exams.allowRetakeDesc': 'يمكن للطلاب إعادة الاختبار',
    'exams.randomOrder': 'ترتيب عشوائي',
    'exams.randomOrderDesc': 'خلط ترتيب الأسئلة',
    'exams.advancedOptions': 'خيارات متقدمة',
    'exams.allowImageSubmissions': 'السماح برفع الصور',
    'exams.allowImageSubmissionsDesc': 'يمكن للطلاب رفع صور للإجابات الورقية',
    'exams.attachment': 'مرفق الاختبار (اختياري)',
    'exams.addAttachment': 'إضافة مرفق PDF/صورة',
    'exams.uploading': 'جاري الرفع...',
    'exams.availableFrom': 'متاح من',
    'exams.selectAvailableDate': 'اختر تاريخ/وقت التوفر',
    'exams.dueDate': 'Due Date',
    'exams.selectDueDate': 'اختر تاريخ الاستحقاق',
    'exams.completeAllQuestions': 'يرجى إكمال جميع الأسئلة',
    'exams.dateRangeError': 'يجب أن يكون تاريخ التوفر قبل تاريخ الاستحقاق',
    'exams.questions': 'الأسئلة',
    'exams.question': 'سؤال',
    'exams.enterQuestion': 'أدخل السؤال',
    'exams.loadFailed': 'فشل تحميل الاختبار',
    'exams.loadClassesFailed': 'فشل تحميل الفصول',
    'exams.loadSubjectsFailed': 'فشل تحميل المواد',
    'exams.fillRequired': 'يرجى ملء جميع الحقول المطلوبة',
    'exams.completeQuestions': 'يرجى إكمال جميع الأسئلة',
    'exams.dateValidation': 'يجب أن يكون تاريخ التوفر قبل تاريخ الاستحقاق',
    'exams.created': 'تم إنشاء الاختبار بنجاح',
    'exams.updated': 'تم تحديث الاختبار بنجاح',
    'exams.createFailed': 'فشل إنشاء الاختبار',
    'exams.updateFailed': 'فشل تحديث الاختبار',
    'exams.loadingExam': 'جاري تحميل بيانات الاختبار...',
    'exams.loadingClasses': 'جاري تحميل الفصول...',
    'exams.loadingSubjects': 'جاري تحميل المواد...',
    'exams.select': 'اختر',
    'exams.at': 'في',
    'exams.selectedDate': 'التاريخ المحدد',
    'exams.selectTime': 'اختر الوقت',
    'exams.hours': 'ساعات',
    'exams.minutes': 'دقائق',
    'exams.option': 'خيار',
    'exams.enterExpectedAnswer': 'أدخل الإجابة المتوقعة',
    'exams.file': 'ملف',
    'exams.attachmentDesc': 'مرفق اختياري للرجوع إليه',
    'exams.imageUploaded': 'تم رفع الصورة بنجاح',
    'exams.imageUploadFailed': 'فشل رفع الصورة',
    'exams.documentPickFailed': 'فشل اختيار المستند',
    'exams.pdfUploadInfo': 'ميزة رفع PDF قريباً',
    'exams.info': 'معلومات',
    'exams.newExamTitle': 'اختبار جديد متاح',
    'exams.newExamBody': 'تم تعيين اختبار جديد',
    'exams.forClass': 'لفصل',
    'exams.forSubject': 'لمادة',
    'exams.correctAnswer': 'الاجابة الصحيحة',
    'exams.activatedTitle': 'تم تفعيل الاختبار',
    'exams.activatedBody': 'الاختبار "{title}" متاح الآن لتقديمه',
    'exams.myExams': 'اختباراتي',
    'exams.totalExams': 'إجمالي الاختبارات',
    'exams.noActiveExams': 'لا توجد اختبارات نشطة',
    'exams.noDraftExams': 'لا توجد مسودات',
    'exams.noArchivedExams': 'لا توجد اختبارات مؤرشفة',
    'exams.allInDraftOrArchived': 'جميع الاختبارات في حالة مسودة أو مؤرشفة',
    'exams.createFirstExam': 'أنشئ اختبارك الأول للبدء',
    'exams.untimed': 'غير محدد بالوقت',
    'exams.showing': 'عرض',
    'exams.exam': 'اختبار',
    'exams.deleteConfirm': 'حذف الاختبار',
    'exams.deleteSuccess': 'تم حذف الاختبار بنجاح',
    'exams.deleteFailed': 'فشل حذف الاختبار',
    'exams.activatedSuccess': 'تم تفعيل الاختبار بنجاح',
    'exams.deactivatedSuccess': 'تم إلغاء تفعيل الاختبار بنجاح',
    'exams.drafts': 'المسودات',
    'exams.archived': 'مؤرشف',
    'exams.active': 'نشط',
    'exams.inactive': 'غير نشط',
    'exams.loadingResults': 'جاري تحميل نتائج الاختبار...',
    'exams.noResultsFound': 'لا توجد نتائج',
    'exams.resultsLoadFailed': 'غير قادر على تحميل نتائج الاختبار. قد لا يوجد الاختبار أو ليس لديك صلاحية لعرضه.',
    'exams.examAnalytics': 'تحليلات الاختبار',
    'exams.createdBy': 'تم إنشاؤه بواسطة',
    'exams.of': 'من',
    'exams.students': 'طلاب',
    'exams.totalSubmissions': 'إجمالي التسليمات',
    'exams.highest': 'الأعلى',
    'exams.topScore': 'أعلى درجة',
    'exams.lowest': 'الأدنى',
    'exams.lowestScore': 'أدنى درجة',
    'exams.scoreDistribution': 'توزيع الدرجات',
    'exams.topPerformers': 'أفضل الأداء',
    'exams.showingTop': 'عرض الأفضل',
    'exams.performanceAnalysis': 'تحليل الأداء',
    'exams.performanceRange': 'نطاق الأداء',
    'exams.standardDeviation': 'الانحراف المعياري',
    'exams.questionAnalysis': 'تحليل الأسئلة',
    'exams.detailedAnalysisComing': 'تحليل مفصل للأسئلة قريباً...',
    'exams.generateReport': 'إنشاء تقرير مفصل',
    'exams.recommendedActions': 'الإجراءات الموصى بها',
    'exams.noRecommendations': 'لا توجد توصيات محددة في هذا الوقت.',
    'exams.noSubmissionsYet': 'لا توجد تسليمات بعد',
    'exams.studentsNotSubmitted': 'الطلاب لم يسلموا هذا الاختبار بعد',
    'exams.submissionDetails': 'تفاصيل التسليم',
    'exams.points': 'نقاط',
    'exams.submitted': 'تم التسليم',
    'exams.time': 'الوقت',
    'exams.overallFeedback': 'ملاحظات عامة',
    'exams.addOverallFeedback': 'أضف ملاحظات عامة لهذا التسليم...',
    'exams.manuallyGraded': 'تم التصحيح يدوياً',
    'exams.needsGrading': 'يحتاج للتصحيح',
    'exams.autoGraded': 'تم التصحيح تلقائياً',
    'exams.studentAnswer': 'إجابة الطالب',
    'exams.pointsAwarded': 'النقاط الممنوحة',
    'exams.addFeedback': 'أضف ملاحظات...',
    'exams.downloadPDF': 'تحميل PDF',
    'exams.submitGrading': 'إرسال التصحيح',
    'exams.sendFeedback': 'إرسال الملاحظات',
    'exams.sendFeedbackTo': 'إرسال ملاحظات شخصية إلى',
    'exams.writeFeedback': 'اكتب ملاحظاتك هنا...',
    'submissions.pending': 'قيد الانتظار',
    'submissions.autoGraded': 'تم التصحيح تلقائياً',
    'submissions.gradingSuccess': 'تم تصحيح التسليم بنجاح!',
    'submissions.gradingFailed': 'فشل في تصحيح التسليم. يرجى المحاولة مرة أخرى.'
  }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isAuthenticated } = useAuth();
  const locales = useLocales();

  // Load language on app start
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        setIsLoading(true);

        let finalLanguage: Language = 'en';

        // Priority: 1. Local storage,  2. User preference from server, 3. Device locale
        if (finalLanguage === 'en') {
          const savedLanguage = await AsyncStorage.getItem('app-language');
          if (savedLanguage) {
            finalLanguage = savedLanguage as Language;
            console.log('📱 Loaded language from local storage:', finalLanguage);
          }
        }

        // If no local preference, check server
        if (isAuthenticated && user) {
          try {
            // Try to get user's language from server
            const userProfile = await apiService.getUserProfile();
            if (userProfile.data?.language) {
              finalLanguage = userProfile.data.language as Language;
              console.log('📱 Loaded language from server:', finalLanguage);
            }
          } catch (error) {
            console.log('Could not fetch language from server, using local storage');
          }
        }

        // If still no preference, use device locale
        if (finalLanguage === 'en' && locales && locales.length > 0) {
          const locale = locales[0];
          finalLanguage = locale.languageCode === 'ar' ? 'ar' : 'en';
          console.log('📱 Loaded language from device:', finalLanguage);
        }

        setLanguageState(finalLanguage);
        setIsRTL(finalLanguage === 'ar');

      } catch (error) {
        console.error('Error loading language:', error);
        setLanguageState('en');
        setIsRTL(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadLanguage();
  }, [isAuthenticated, user, locales]);

  // Sync language to server and local storage
  const setLanguage = async (newLanguage: Language) => {
    try {
      setIsLoading(true);

      // Update local state immediately for responsive UI
      setLanguageState(newLanguage);
      setIsRTL(newLanguage === 'ar');

      // Save to local storage
      await AsyncStorage.setItem('app-language', newLanguage);
      console.log('💾 Saved language to local storage:', newLanguage);

      // Sync to server if user is authenticated
      if (isAuthenticated && user) {
        try {
          await apiService.updateUserLanguage(newLanguage);
          console.log('🌐 Synced language to server:', newLanguage);
        } catch (serverError) {
          console.error('Failed to sync language to server:', serverError);
          // Don't throw error - local change should still work
        }
      }

    } catch (error) {
      console.error('Error setting language:', error);
      // Revert on error
      setLanguageState(language);
      setIsRTL(language === 'ar');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const t = (key: string): string => {
    return translations[language][key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      isRTL,
      isLoading
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}