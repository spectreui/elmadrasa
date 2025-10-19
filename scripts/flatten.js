// flattenLocales.js
import fs from "fs";
import path from "path";

// 👇 Paste your en object here
const en = {
  // 🌍 عام
  home: "الرئيسية",
  goodMorning: "صباح الفل",
  goodAfternoon: "مساء الخير",
  goodEvening: "مساء النور",

  // 🧭 شائع
  common: {
    active: "شغال",
    add: "ضيف",
    back: "رجوع",
    cancel: "إلغاء",
    confirm: "تأكيد",
    create: "إنشاء",
    delete: "حذف",
    edit: "تعديل",
    error: "غلط",
    filter: "فلتر",
    goBack: "ارجع ورا",
    loading: "جارى التحميل...",
    loadFailed: "التحميل فشل...",
    next: "التالي",
    noItems: "مفيش عناصر",
    ok: "تمام",
    pending: "معلّق",
    points: "نِقَاط",
    previous: "السابق",
    save: "احفظ",
    search: "دور",
    send: "ابعت",
    sort: "رتّب",
    submit: "قدّم",
    success: "تمام",
    unknown: "مش معروف",
    update: "تحديث",
    view: "شوف",
    viewAll: "شوف الكل",
  },

  // 📅 الشهور
  months: {
    january: "يناير",
    february: "فبراير",
    march: "مارس",
    april: "أبريل",
    may: "مايو",
    june: "يونيو",
    july: "يوليو",
    august: "أغسطس",
    september: "سبتمبر",
    october: "أكتوبر",
    november: "نوفمبر",
    december: "ديسمبر",
    Feb: "فبراير",
    Mar: "مارس",
    Apr: "أبريل",
    May: "مايو",
    Jun: "يونيو",
    Jul: "يوليو",
    Aug: "أغسطس",
    Sep: "سبتمبر",
    Oct: "أكتوبر",
    Nov: "نوفمبر",
    Dec: "ديسمبر",
  },

  // 🏠 لوحة التحكم
  dashboard: {
    loading: "جارى تحميل اللوحة...",
    overview: "نظرة عامة",
    activeExams: "امتحانات شغالة",
    currentlyRunning: "شغال دلوقتي",
    students: "الطلبة",
    totalEnrolled: "إجمالي المسجلين",
    avgScore: "المتوسط",
    classAverage: "متوسط الفصل",
    engagement: "التفاعل",
    studentActivity: "نشاط الطلبة",
    quickActions: "إجراءات سريعة",
    createExam: "اعمل امتحان",
    designAssessment: "صمّم اختبار جديد",
    assignWork: "كلف واجب",
    createHomework: "اعمل واجب",
    myClasses: "فصولي",
    manageStudents: "إدارة الطلبة",
    analytics: "تحليلات",
    viewInsights: "شوف التحليلات",
    recentActivity: "آخر نشاط",
    noRecentActivity: "مفيش نشاط لسه",
    noActivityMessage: "أنشطتك الأخيرة هتظهر هنا",
    performanceInsights: "تحليلات الأداء",
    classes: "الفصول",
    subjects: "المواد",
    avgResponse: "متوسط الرد",
    createdFor: "متعمل لـ",
    noActivity: "مفيش نشاط حديث",
    noActivityDesc: "أنشطتك هتظهر هنا",
    score: "الدرجة",
    assignedTo: "متكلف لـ",
  },

  // 👤 الملف الشخصي
  profile: {
    title: "الملف الشخصي",
    settings: "الإعدادات",
    teacherInfo: "معلومات المُدرس",
    teacherId: "كود المُدرس",
    email: "الإيميل",
    accountCreated: "الحساب اتعمل في",
    teachingOverview: "نظرة عامة على التدريس",
    examsCreated: "عدد الامتحانات",
    toGrade: "لسه يتصحح",
    classPerformance: "أداء الفصول",
    averageClassScore: "متوسط درجات الفصول",
    studentEngagement: "تفاعل الطلبة",
    averageScore: "المتوسط العام",
    notSet: "مش متحدد",
    language: "اللغة",
    logoutError: "فيه مشكلة في تسجيل الخروج",
    na: "—",
    teacher: "مدرس",
  },

  // 🔔 الإشعارات
  notifications: {
    settings: "إعدادات الإشعارات",
    general: "إشعارات عامة",
    generalDesc: "إشعارات وتحديثات التطبيق",
    examAlerts: "تنبيهات الامتحانات",
    examAlertsDesc: "إشعارات انتهاء الامتحانات",
    gradingReminders: "تذكيرات التصحيح",
    gradingRemindersDesc: "تنبيهات بالأوراق اللي لسه متصححتش",
  },

  // 📈 الإحصائيات
  statistics: {
    thisWeek: "الأسبوع ده",
    thisMonth: "الشهر ده",
    thisYear: "السنة دي",
    noClassData: "مفيش بيانات فصول",
    noClassDataDesc: "بيانات الأداء هتظهر هنا",
    noTrendData: "مفيش بيانات اتجاهات",
    noTrendDataDesc: "اتجاهات الأداء هتظهر هنا",
    performanceTrend: "اتجاه الأداء",
    totalExams: "إجمالي الامتحانات",
    avgCompletion: "متوسط الإكمال",
    activeStudents: "الطلبة النشيطة",
    pendingGrading: "لسه متصححتش",
  },

  // ⚙️ النظام
  system: {
    preferences: "إعدادات النظام",
    darkMode: "الوضع الليلي",
    darkModeDesc: "شغل الثيم الغامق",
  },

  // 🧰 الأدوات
  tools: {
    title: "أدوات المدرس",
    exportData: "صدّر بيانات الطلبة",
    classAnalytics: "تحليلات الفصول",
    teachingResources: "مواد تعليمية",
  },

  // 🔐 الدخول والخروج
  auth: {
    logOut: "تسجيل خروج",
    logOutConfirm: "متأكد إنك عايز تخرج؟",
  },

  // 🏫 الفصول
  classes: {
    myClasses: "فصولي",
    subtitle: "الفصول والمواد اللي بتدرّسها",
    none: "مفيش فصول لسه",
    noneMessage: "كلّم المسؤول يضيفك على فصول ومواد.",
    joinCode: "كود الانضمام",
    tapToCopy: "اضغط تنسخ وتشارك الكود مع الطلبة",
    noCode: "مفيش كود متاح",
    codeCopied: "الكود اتنسخ!",
    failed: "فشل النسخ!",
    classId: "رقم الفصل",
    subjectId: "رقم المادة",
    noCodeAvailable: "مفيش كود متاح",
  },

  // 📝 الواجبات
  homework: {
    title: "الواجبات",
    new: "واجب جديد",
    createAssignment: "اعمل واجب بأسئلة",
    assignmentDetails: "تفاصيل الواجب",
    titleRequired: "العنوان *",
    titlePlaceholder: "اكتب عنوان الواجب",
    description: "الوصف",
    descriptionPlaceholder: "اكتب وصف الواجب والتعليمات...",
    classRequired: "الفصل *",
    selectClass: "اختار الفصل",
    subjectRequired: "المادة *",
    selectSubject: "اختار المادة",
    selectClassFirst: "اختار الفصل الأول",
    schedule: "المعاد",
    startDateRequired: "تاريخ البداية *",
    dueDateRequired: "تاريخ التسليم *",
    selectDate: "اختار التاريخ",
    totalPoints: "إجمالي الدرجات",
    includeQuestions: "ضيف أسئلة",
    includeQuestionsDesc: "ضيف أسئلة الطلبة يجاوبوها",
    allowAttachments: "اسمح برفع ملفات",
    allowAttachmentsDesc: "الطلبة يقدروا يرفعوا ملفات مع الحل",
    questions: "الأسئلة",
    questionText: "نص السؤال",
    questionPlaceholder: "اكتب سؤالك...",
    questionType: "نوع السؤال",
    textAnswer: "إجابة نصية",
    multipleChoice: "اختيار من متعدد",
    options: "الاختيارات",
    addOption: "ضيف اختيار",
    points: "درجات",
    assign: "وزّع الواجب",
    missingInfo: "معلومات ناقصة",
    fillRequiredFields: "املأ كل الخانات المطلوبة",
    invalidDate: "تاريخ غلط",
    enterValidDates: "اختار تواريخ صحيحة",
    invalidDateRange: "المدى الزمني غلط",
    startBeforeDue: "تاريخ البداية لازم يكون قبل التسليم",
    invalidPoints: "درجات غلط",
    pointsRange: "الدرجات بين ١ و ١٠٠",
    invalidQuestion: "سؤال غلط",
    questionsNeedText: "كل سؤال لازم يكون فيه نص",
    mcqMinOptions: "سؤال الاختيار لازم يكون فيه اختيارين على الأقل",
    optionsNeedText: "كل اختيار لازم يكون فيه نص",
    noAnswerProvided: "مفيش إجابة",
    questionNumber: "السؤال {n}",
  },

  // 📤 التسليمات
  submissions: {
    title: "التسليمات",
    submitted: "اتسلم",
    graded: "اتصحح",
    avgGrade: "متوسط الدرجات",
    none: "مفيش تسليمات لسه",
    noneMessage: "الطلبة لسه ما سلّموش الواجب",
    grade: "صحّح التسليم",
    editGrade: "عدل الدرجة",
    studentContent: "محتوى تسليم الطالب",
    noContent: "مفيش محتوى",
    questionsAnswers: "الأسئلة وإجابات الطلبة",
    studentAnswer: "إجابة الطالب",
    noAnswer: "مفيش إجابة",
    attachments: "مرفقات",
    overallGrade: "الدرجة الكلية",
    textSubmission: "تسليم نصي",
    questionPoints: "درجات السؤال",
    overallFeedback: "التقييم العام",
    gradedOn: "اتصحح يوم",
    submittedOn: "اتسلم يوم",
    pending: "مستني",
    autoGraded: "اتصحح تلقائي",
    gradingSuccess: "التصحيح تم بنجاح!",
    gradingFailed: "التصحيح فشل، جرّب تاني.",
    addFeedback: "ضيف ملاحظة",
    addOverallFeedback: "ضيف ملاحظة عامة",
    answer: "الإجابة",
    feedback: "الملاحظات",
    questionGrades: "درجات الأسئلة",
    textSubmissionGrade: "درجة التسليم النصي",
  },

  // 🧮 الامتحانات
  exams: {
    create: "اعمل امتحان جديد",
    edit: "عدل الامتحان",
    details: "تفاصيل الامتحان",
    title: "عنوان الامتحان",
    settings: "إعدادات الامتحان",
    timed: "امتحان بوقت",
    timedDesc: "حدد وقت للامتحان",
    duration: "المدة (بالدقايق)",
    allowRetake: "اسمح بإعادة الامتحان",
    allowRetakeDesc: "الطلبة يقدروا يعيدوا الامتحان",
    randomOrder: "ترتيب عشوائي",
    randomOrderDesc: "يبدّل ترتيب الأسئلة",
    advancedOptions: "خيارات متقدمة",
    allowImageSubmissions: "اسمح بتسليم صور",
    allowImageSubmissionsDesc: "الطلبة يقدروا يرفعوا صور إجاباتهم",
    attachment: "مرفق الامتحان (اختياري)",
    addAttachment: "ضيف PDF أو صورة",
    uploading: "بيرفع...",
    availableFrom: "متاح من",
    selectAvailableDate: "اختار تاريخ/وقت الإتاحة",
    dueDate: "ميعاد التسليم",
    selectDueDate: "اختار ميعاد التسليم",
    completeAllQuestions: "كمّل كل الأسئلة",
    dateRangeError: "تاريخ الإتاحة لازم يكون قبل التسليم",
    questions: "الأسئلة",
    question: "سؤال",
    enterQuestion: "اكتب السؤال",
    options: "اختيارات",
    expectedAnswer: "الإجابة المتوقعة",
    fillRequired: "املأ كل الخانات المطلوبة",
    completeQuestions: "كمّل كل الأسئلة",
    dateValidation: "تاريخ الإتاحة لازم يكون قبل التسليم",
    created: "الامتحان اتعمل بنجاح",
    updated: "الامتحان اتحدّث بنجاح",
    createFailed: "فشل إنشاء الامتحان",
    updateFailed: "فشل تحديث الامتحان",
    loadFailed: "فشل تحميل الامتحان",
    loadingExam: "جارى تحميل بيانات الامتحان...",
    loadingClasses: "جارى تحميل الفصول...",
    loadingSubjects: "جارى تحميل المواد...",
    loadClassesFailed: "فشل تحميل الفصول",
    loadSubjectsFailed: "فشل تحميل المواد",
    select: "اختار",
    at: "في",
    selectedDate: "التاريخ المختار",
    selectTime: "اختار الوقت",
    hours: "ساعات",
    minutes: "دقايق",
    option: "اختيار",
    enterExpectedAnswer: "اكتب الإجابة الصحيحة",
    file: "ملف",
    attachmentDesc: "مرفق اختياري للمراجعة",
    imageUploaded: "الصورة اترفعت بنجاح",
    imageUploadFailed: "فشل رفع الصورة",
    documentPickFailed: "فشل اختيار الملف",
    pdfUploadInfo: "رفع PDF قريب إن شاء الله",
    info: "معلومة",
    newExamTitle: "امتحان جديد متاح",
    newExamBody: "تم تعيين امتحان جديد ليك",
    forClass: "للفصل",
    correctAnswer: "الإجابة الصح",
    activatedTitle: "الامتحان اتفتح",
    activatedBody: 'الامتحان "{title}" بقى متاح دلوقتي',
    myExams: "امتحاناتي",
    totalExams: "إجمالي الامتحانات",
    noActiveExams: "مفيش امتحانات شغالة",
    noDraftExams: "مفيش مسودات",
    noArchivedExams: "مفيش امتحانات مؤرشفة",
    allInDraftOrArchived: "كل الامتحانات يا مسودة يا مؤرشفة",
    createFirstExam: "اعمل أول امتحان وابدأ",
    untimed: "من غير وقت",
    showing: "بيعرض",
    exam: "امتحان",
    deleteConfirm: "تحذف الامتحان؟",
    deleteSuccess: "الامتحان اتحذف بنجاح",
    deleteFailed: "فشل حذف الامتحان",
    activatedSuccess: "الامتحان اتفعّل بنجاح",
    deactivatedSuccess: "الامتحان اتقفل بنجاح",
    drafts: "مسودات",
    archived: "أرشيف",
    active: "شغال",
    inactive: "مش شغال",
    loadingResults: "جارى تحميل النتائج...",
    noResultsFound: "مفيش نتائج",
    resultsLoadFailed:
      "ماقدرناش نحمّل النتائج. يمكن الامتحان مش موجود أو ممعكش صلاحية تشوفه.",
    examAnalytics: "تحليلات الامتحان",
    createdBy: "اتعمل بواسطة",
    of: "من",
    students: "طلبة",
    totalSubmissions: "عدد التسليمات",
    highest: "أعلى درجة",
    topScore: "أعلى نتيجة",
    lowest: "أقل درجة",
    lowestScore: "أقل نتيجة",
    scoreDistribution: "توزيع الدرجات",
    topPerformers: "أعلى الطلبة أداءً",
    showingTop: "بيعرض الأعلى",
    performanceAnalysis: "تحليل الأداء",
    performanceRange: "مدى الأداء",
    standardDeviation: "الانحراف المعياري",
    questionAnalysis: "تحليل الأسئلة",
    detailedAnalysisComing:
      "تحليل الأسئلة بالتفصيل قريب جدًا...",
    generateReport: "طلّع تقرير مفصل",
    recommendedActions: "اقتراحات",
    noRecommendations: "مفيش اقتراحات دلوقتي.",
    noSubmissionsYet: "مفيش تسليمات لسه",
    studentsNotSubmitted: "الطلبة لسه ما سلّموش الامتحان",
    submissionDetails: "تفاصيل التسليم",
    points: "نقاط",
    submitted: "اتسلم",
    time: "الوقت",
    overallFeedback: "التقييم العام",
    addOverallFeedback: "ضيف تقييم عام للتسليم...",
    manuallyGraded: "اتصحح يدوي",
    needsGrading: "مستني تصحيح",
    autoGraded: "اتصحح تلقائي",
    studentAnswer: "إجابة الطالب",
    pointsAwarded: "الدرجات اللي اديهاله",
    addFeedback: "ضيف تعليق...",
    downloadPDF: "نزل PDF",
    submitGrading: "قدّم التصحيح",
    sendFeedback: "ابعت الملاحظات",
    sendFeedbackTo: "ابعت ملاحظات لـ",
    writeFeedback: "اكتب ملاحظتك هنا...",
    aiExtraction: "استخراج بالذكاء الصناعي",
    aiExtractionDesc: "خلّي الذكاء الصناعي يستخرج الأسئلة من الملف",
    extractQuestions: "استخرج الأسئلة",
    extractFromPDF: "استخرج من PDF",
    extracting: "بيستخرج...",
    aiExtractionNote:
      "العملية ممكن تاخد شوية وقت. راجع النتائج وعدّل لو حبيت.",
    pdfExtractionComingSoon: "استخراج PDF قريب.",
    textExtractionHelp: "مساعدة في استخراج النص",
    textExtractionFailed: "فشل استخراج النص",
    questionsExtracted: "تم استخراج الأسئلة",
    noQuestionsFound: "مفيش أسئلة",
    alternativesAvailable: "في بدائل متاحة",
    noNewQuestionsFound: "مفيش أسئلة جديدة",
    extractFromText: "استخرج من نص",
    enterValidText: "اكتب نص صالح للاستخراج",
    manualGrading: "تصحيح يدوي",
    gradingSubmitted: "التصحيح اتقدّم بنجاح!",
    gradingFailed: "فشل في التصحيح، جرّب تاني.",
    feedback: "ملاحظات",
    feedbackPlaceholder: "اكتب ملاحظتك هنا...",
    gradeSubmission: "صحّح التسليم",
    loading: "جارى تحميل الامتحانات...",
    updateExam: "حدّث الامتحان",
    updating: "جارى التحديث...",
    assignPoints: "وزّع الدرجات",
    explanation: "توضيح",
    enterExplanation: "اكتب التوضيح",
    enterCorrectAnswer: "اكتب الإجابة الصح",
    allSubmissionsGraded: "كل التسليمات اتصححت",
  },

  // 🧩 متفرقات
  "expo-clipboard": "اتنسخ في الكليب بورد",
  homeworks: "الواجبات",
};

// ✅ Recursive flattening function
function flatten(obj, parentKey = "", result = {}) {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = parentKey ? `${parentKey}.${key}` : key;
    if (typeof value === "object" && value !== null) {
      flatten(value, newKey, result);
    } else {
      result[newKey] = value;
    }
  }
  return result;
}

const flattened = flatten(en);

// ✏️ Output file (you can change this)
const outputPath = path.resolve("./en_flat.json");
fs.writeFileSync(outputPath, JSON.stringify(flattened, null, 2), "utf-8");

console.log(`✅ Flattened locale saved to ${outputPath}`);
