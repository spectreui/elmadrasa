import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLocales } from 'expo-localization';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Translations
const translations = {
  en: {
    "common": {
      "loading": "Loading...",
      "error": "Error",
      "success": "Success",
      "cancel": "Cancel",
      "save": "Save",
      "delete": "Delete",
      "edit": "Edit",
      "create": "Create",
      "update": "Update",
      "submit": "Submit",
      "confirm": "Confirm",
      "back": "Back",
      "next": "Next",
      "previous": "Previous",
      "viewAll": "View All",
      "search": "Search",
      "filter": "Filter",
      "sort": "Sort"
    },
    "auth": {
      "signOut": "Sign Out",
      "signOutConfirm": "Are you sure you want to sign out?",
      "profile": "Profile"
    },
    "dashboard": {
      "title": "Dashboard",
      "overview": "Overview",
      "recentActivity": "Recent Activity",
      "quickActions": "Quick Actions",
      "performanceInsights": "Performance Insights",
      "goodMorning": "Good Morning",
      "goodAfternoon": "Good Afternoon",
      "goodEvening": "Good Evening"
    },
    "profile": {
      "title": "Profile",
      "settings": "Settings",
      "teacherInformation": "Teacher Information",
      "teachingOverview": "Teaching Overview",
      "classPerformance": "Class Performance",
      "active": "Active",
      "teacherId": "Teacher ID",
      "email": "Email",
      "accountCreated": "Account Created",
      "students": "Students",
      "examsCreated": "Exams Created",
      "toGrade": "To Grade",
      "averageClassScore": "Average Class Score",
      "studentEngagement": "Student Engagement"
    },
    "classes": {
      "myClasses": "My Classes",
      "classesAndSubjects": "Classes and subjects you teach",
      "noClasses": "No classes assigned",
      "noClassesMessage": "Contact your administrator to get assigned to classes and subjects.",
      "joinCode": "Join Code",
      "tapToCopy": "Tap to copy and share with students",
      "noCodeAvailable": "No join code available",
      "class": "Class",
      "subject": "Subject"
    },
    "homework": {
      "create": "Create Homework",
      "newHomework": "New Homework",
      "createAssignment": "Create assignment with questions",
      "assignmentDetails": "Assignment Details",
      "title": "Title",
      "description": "Description",
      "schedule": "Schedule",
      "startDate": "Start Date",
      "dueDate": "Due Date",
      "settings": "Settings",
      "totalPoints": "Total Points",
      "includeQuestions": "Include Questions",
      "addQuestions": "Add questions for students to answer",
      "allowAttachments": "Allow Attachments",
      "allowAttachmentsDesc": "Students can upload files with their submission",
      "questions": "Questions",
      "addQuestion": "Add Question",
      "questionText": "Question Text",
      "questionType": "Question Type",
      "textAnswer": "Text Answer",
      "multipleChoice": "Multiple Choice",
      "options": "Options",
      "addOption": "Add Option",
      "points": "Points",
      "assignHomework": "Assign Homework",
      "selectClass": "Select Class",
      "selectSubject": "Select Subject",
      "selectDate": "Select date",
      "missingInfo": "Missing Information",
      "fillAllFields": "Please fill in all required fields",
      "invalidDate": "Invalid Date",
      "invalidDateRange": "Start date must be before due date",
      "invalidPoints": "Invalid Points",
      "pointsRange": "Points must be between 1 and 100",
      "invalidQuestion": "Invalid Question",
      "questionTextRequired": "All questions must have text",
      "mcqOptionsRequired": "Multiple choice questions must have at least 2 options",
      "optionsTextRequired": "All options must have text"
    },
    "exams": {
      "createExam": "Create New Exam",
      "editExam": "Edit Exam",
      "examDetails": "Exam Details",
      "examTitle": "Exam Title",
      "examSettings": "Exam Settings",
      "timedExam": "Timed Exam",
      "setTimeLimit": "Set time limit for exam",
      "duration": "Duration (minutes)",
      "allowRetake": "Allow Retake",
      "allowRetakeDesc": "Students can retake exam",
      "randomOrder": "Random Order",
      "randomOrderDesc": "Shuffle questions order",
      "advancedOptions": "Advanced Options",
      "allowImageSubmissions": "Allow Image Submissions",
      "allowImageSubmissionsDesc": "Students can submit photos of paper answers",
      "examAttachment": "Exam Attachment (Optional)",
      "addAttachment": "Add PDF/Image Attachment",
      "uploading": "Uploading...",
      "availableFrom": "Available From",
      "selectAvailableDate": "Select available date/time",
      "selectDueDate": "Select due date",
      "completeAllQuestions": "Please complete all questions",
      "dateRangeError": "Available date must be before due date"
    },
    "submissions": {
      "submissions": "Submissions",
      "gradeSubmission": "Grade Submission",
      "editGrade": "Edit Grade",
      "studentSubmission": "Student's Submission",
      "submittedOn": "Submitted on",
      "gradedOn": "Graded on",
      "overallGrade": "Overall Grade",
      "overallFeedback": "Overall Feedback",
      "textSubmission": "Text Submission",
      "questionPoints": "Question Points",
      "questionsAnswers": "Questions & Answers",
      "studentsAnswer": "Student's Answer",
      "attachments": "Attachments",
      "noSubmissions": "No Submissions Yet",
      "noSubmissionsMessage": "Students haven't submitted this homework yet",
      "submitted": "Submitted",
      "graded": "Graded",
      "pending": "Pending",
      "avgGrade": "Avg Grade",
      "saveGrade": "Save Grade"
    },
    "notifications": {
      "notificationSettings": "Notification Settings",
      "generalNotifications": "General Notifications",
      "generalNotificationsDesc": "App notifications and updates",
      "examAlerts": "Exam Alerts",
      "examAlertsDesc": "Exam completion notifications",
      "gradingReminders": "Grading Reminders",
      "gradingRemindersDesc": "Pending grading alerts"
    },
    "system": {
      "systemPreferences": "System Preferences",
      "darkMode": "Dark Mode",
      "enableDarkTheme": "Enable dark theme",
      "language": "Language",
      "english": "English",
      "arabic": "Arabic"
    },
    "teacherTools": {
      "teacherTools": "Teacher Tools",
      "exportStudentData": "Export Student Data",
      "classAnalytics": "Class Analytics",
      "teachingResources": "Teaching Resources"
    },
    "status": {
      "completed": "Completed",
      "pending": "Pending",
      "grading": "Grading",
      "active": "Active",
      "inactive": "Inactive"
    },
    "time": {
      "today": "Today",
      "yesterday": "Yesterday",
      "thisWeek": "This Week",
      "thisMonth": "This Month",
      "minutes": "minutes",
      "hours": "hours",
      "days": "days"
    }
  },
  ar: {
    "common": {
      "loading": "جاري التحميل...",
      "error": "خطأ",
      "success": "تم بنجاح",
      "cancel": "إلغاء",
      "save": "حفظ",
      "delete": "حذف",
      "edit": "تعديل",
      "create": "إنشاء",
      "update": "تحديث",
      "submit": "إرسال",
      "confirm": "تأكيد",
      "back": "رجوع",
      "next": "التالي",
      "previous": "السابق",
      "viewAll": "عرض الكل",
      "search": "بحث",
      "filter": "تصفية",
      "sort": "ترتيب"
    },
    "auth": {
      "signOut": "تسجيل الخروج",
      "signOutConfirm": "هل أنت متأكد أنك تريد تسجيل الخروج؟",
      "profile": "الملف الشخصي"
    },
    "dashboard": {
      "title": "لوحة التحكم",
      "overview": "نظرة عامة",
      "recentActivity": "النشاط الأخير",
      "quickActions": "إجراءات سريعة",
      "performanceInsights": "مؤشرات الأداء",
      "goodMorning": "صباح الخير",
      "goodAfternoon": "مساء الخير",
      "goodEvening": "مساء الخير"
    },
    "profile": {
      "title": "الملف الشخصي",
      "settings": "الإعدادات",
      "teacherInformation": "معلومات المعلم",
      "teachingOverview": "نظرة عامة على التدريس",
      "classPerformance": "أداء الفصل",
      "active": "نشط",
      "teacherId": "رقم المعلم",
      "email": "البريد الإلكتروني",
      "accountCreated": "تم إنشاء الحساب",
      "students": "الطلاب",
      "examsCreated": "الاختبارات المنشأة",
      "toGrade": "في انتظار التصحيح",
      "averageClassScore": "متوسط درجة الفصل",
      "studentEngagement": "مشاركة الطلاب"
    },
    "classes": {
      "myClasses": "فصولي",
      "classesAndSubjects": "الفصول والمواد التي تدرسها",
      "noClasses": "لا توجد فصول مخصصة",
      "noClassesMessage": "اتصل بمسؤولك للحصول على فصول ومواد دراسية.",
      "joinCode": "رمز الانضمام",
      "tapToCopy": "انقر للنسخ ومشاركته مع الطلاب",
      "noCodeAvailable": "لا يوجد رمز انضمام متاح",
      "class": "الفصل",
      "subject": "المادة"
    },
    "homework": {
      "create": "إنشاء واجب",
      "newHomework": "واجب جديد",
      "createAssignment": "إنشاء مهمة مع أسئلة",
      "assignmentDetails": "تفاصيل المهمة",
      "title": "العنوان",
      "description": "الوصف",
      "schedule": "الجدول الزمني",
      "startDate": "تاريخ البدء",
      "dueDate": "تاريخ الاستحقاق",
      "settings": "الإعدادات",
      "totalPoints": "إجمالي النقاط",
      "includeQuestions": "تضمين الأسئلة",
      "addQuestions": "أضف أسئلة للإجابة عليها من قبل الطلاب",
      "allowAttachments": "السماح بالمرفقات",
      "allowAttachmentsDesc": "يمكن للطلاب رفع الملفات مع تسليمهم",
      "questions": "الأسئلة",
      "addQuestion": "إضافة سؤال",
      "questionText": "نص السؤال",
      "questionType": "نوع السؤال",
      "textAnswer": "إجابة نصية",
      "multipleChoice": "اختيار من متعدد",
      "options": "خيارات",
      "addOption": "إضافة خيار",
      "points": "النقاط",
      "assignHomework": "تعيين الواجب",
      "selectClass": "اختر الفصل",
      "selectSubject": "اختر المادة",
      "selectDate": "اختر التاريخ",
      "missingInfo": "معلومات ناقصة",
      "fillAllFields": "يرجى ملء جميع الحقول المطلوبة",
      "invalidDate": "تاريخ غير صالح",
      "invalidDateRange": "يجب أن يكون تاريخ البدء قبل تاريخ الاستحقاق",
      "invalidPoints": "نقاط غير صالحة",
      "pointsRange": "يجب أن تكون النقاط بين 1 و 100",
      "invalidQuestion": "سؤال غير صالح",
      "questionTextRequired": "جميع الأسئلة يجب أن تحتوي على نص",
      "mcqOptionsRequired": "أسئلة الاختيار من متعدد يجب أن تحتوي على خيارين على الأقل",
      "optionsTextRequired": "جميع الخيارات يجب أن تحتوي على نص"
    },
    "exams": {
      "createExam": "إنشاء اختبار جديد",
      "editExam": "تعديل الاختبار",
      "examDetails": "تفاصيل الاختبار",
      "examTitle": "عنوان الاختبار",
      "examSettings": "إعدادات الاختبار",
      "timedExam": "اختبار مؤقت",
      "setTimeLimit": "تعيين حد زمني للاختبار",
      "duration": "المدة (دقائق)",
      "allowRetake": "السماح بإعادة الاختبار",
      "allowRetakeDesc": "يمكن للطلاب إعادة الاختبار",
      "randomOrder": "ترتيب عشوائي",
      "randomOrderDesc": "خلط ترتيب الأسئلة",
      "advancedOptions": "خيارات متقدمة",
      "allowImageSubmissions": "السماح برفع الصور",
      "allowImageSubmissionsDesc": "يمكن للطلاب رفع صور للإجابات الورقية",
      "examAttachment": "مرفق الاختبار (اختياري)",
      "addAttachment": "إضافة مرفق PDF/صورة",
      "uploading": "جاري الرفع...",
      "availableFrom": "متاح من",
      "selectAvailableDate": "اختر تاريخ/وقت التوفر",
      "selectDueDate": "اختر تاريخ الاستحقاق",
      "completeAllQuestions": "يرجى إكمال جميع الأسئلة",
      "dateRangeError": "يجب أن يكون تاريخ التوفر قبل تاريخ الاستحقاق"
    },
    "submissions": {
      "submissions": "التسليمات",
      "gradeSubmission": "تصحيح التسليم",
      "editGrade": "تعديل التصحيح",
      "studentSubmission": "تسليم الطالب",
      "submittedOn": "تم التسليم في",
      "gradedOn": "تم التصحيح في",
      "overallGrade": "الدرجة الإجمالية",
      "overallFeedback": "ملاحظات عامة",
      "textSubmission": "التسليم النصي",
      "questionPoints": "نقاط الأسئلة",
      "questionsAnswers": "الأسئلة والإجابات",
      "studentsAnswer": "إجابة الطالب",
      "attachments": "المرفقات",
      "noSubmissions": "لا توجد تسليمات بعد",
      "noSubmissionsMessage": "الطلاب لم يسلموا هذا الواجب بعد",
      "submitted": "تم التسليم",
      "graded": "تم التصحيح",
      "pending": "في الانتظار",
      "avgGrade": "متوسط الدرجة",
      "saveGrade": "حفظ التصحيح"
    },
    "notifications": {
      "notificationSettings": "إعدادات الإشعارات",
      "generalNotifications": "الإشعارات العامة",
      "generalNotificationsDesc": "إشعارات وتحديثات التطبيق",
      "examAlerts": "تنبيهات الاختبارات",
      "examAlertsDesc": "إشعارات إكمال الاختبار",
      "gradingReminders": "تذكير التصحيح",
      "gradingRemindersDesc": "تنبيهات التصحيح المعلقة"
    },
    "system": {
      "systemPreferences": "تفضيلات النظام",
      "darkMode": "الوضع الداكن",
      "enableDarkTheme": "تفعيل السمة الداكنة",
      "language": "اللغة",
      "english": "الإنجليزية",
      "arabic": "العربية"
    },
    "teacherTools": {
      "teacherTools": "أدوات المعلم",
      "exportStudentData": "تصدير بيانات الطلاب",
      "classAnalytics": "تحليلات الفصل",
      "teachingResources": "موارد التدريس"
    },
    "status": {
      "completed": "مكتمل",
      "pending": "في الانتظار",
      "grading": "جاري التصحيح",
      "active": "نشط",
      "inactive": "غير نشط"
    },
    "time": {
      "today": "اليوم",
      "yesterday": "أمس",
      "thisWeek": "هذا الأسبوع",
      "thisMonth": "هذا الشهر",
      "minutes": "دقائق",
      "hours": "ساعات",
      "days": "أيام"
    }
  }
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const locales = useLocales();

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('app-language');

        // Use device locale if no saved preference
        let systemLanguage: Language = 'en';
        if (locales && locales.length > 0) {
          const locale = locales[0];
          systemLanguage = locale.languageCode === 'ar' ? 'ar' : 'en';
        }

        const finalLanguage = (savedLanguage as Language) || systemLanguage;
        setLanguage(finalLanguage);
        setIsRTL(finalLanguage === 'ar');
      } catch (error) {
        console.error('Error loading language:', error);
        setLanguage('en');
        setIsRTL(false);
      }
    };

    loadLanguage();
  }, [locales]);

  useEffect(() => {
    const saveLanguage = async () => {
      try {
        await AsyncStorage.setItem('app-language', language);
        setIsRTL(language === 'ar');
      } catch (error) {
        console.error('Error saving language:', error);
      }
    };

    saveLanguage();
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
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
