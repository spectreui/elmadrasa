// User Types
export interface User {
  id: string;
  email: string;
  role: 'student' | 'teacher' | 'admin';
  student_id?: string;
  is_approved: boolean;
  profile: UserProfile;
  created_at: string;
  updated_at: string;
}

// Add to existing types
export interface ProfileStats {
  examsTaken: number;
  averageScore: number;
  totalPoints: number;
  rank: number;
  streak: number;
  attendance: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress?: number;
}

export interface ProfileSettings {
  notifications: boolean;
  darkMode: boolean;
  language: string;
  autoSave: boolean;
  dataSaver: boolean;
}

export interface UserProfile {
  name: string;
  class: string;
  subjects: string[];
  avatar?: string;
}

// Auth Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
}

// Exam Types
export interface ExamSettings {
  timed: boolean;
  duration: number;
  allow_retake: boolean;
  random_order: boolean;
  shuffleQuestions: boolean;
  showResults: boolean;
}

export interface Exam {
  id: string;
  title: string;
  description?: string;
  subject: string;
  class: string;
  teacher_id: string;
  settings: ExamSettings;
  is_active: boolean;
  status: 'active' | 'draft' | 'archived'; // Add this
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
  questions?: Question[];
  submissions_count?: number;
  average_score?: number; // Make this optional
  total_points?: number; // Make this optional
}

export interface ExamDetails extends Exam {
  questions: Question[];
  submissions_count: number;
  average_score: number;
  total_points: number;
}

export interface Question {
  id: string;
  exam_id: string;
  question: string;
  type: 'mcq' | 'text' | 'multiple';
  options: string[];
  correct_answer: string;
  points: number;
  explanation?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  profile: {
    name: string;
    subject?: string;
    avatar?: string;
  };
}

export interface StudentStats {
  averageScore: number;
  examsCompleted: number;
  upcomingExams: number;
  totalPoints: number;
  rank?: number;
  improvement?: number;
}

export interface ExamResult {
  id: string;
  exam_id: string;
  examTitle: string;
  subject: string;
  score: number;
  totalPoints: number;
  percentage: number;
  date: string;
  timeSpent: string;
  correctAnswers: number;
  totalQuestions: number;
  grade: string;
  rank?: number;
  answers?: { [questionId: string]: string };
}

export interface SubjectPerformance {
  subject: string;
  averageScore: number;
  examsTaken: number;
  trend: 'up' | 'down' | 'stable';
  improvement: number;
}

// Homework Types
interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  points: number;
  attachments: boolean;
  teacher_id: string; // Make sure this property exists
  created_at: string;
  updated_at: string;
  submitted?: boolean;
  submission_date?: string;
  grade?: number;
  feedback?: string;
  teacher?: {
    id: string;
    profile: {
      name: string;
    };
  };
}

export interface HomeworkSubmission {
  id: string;
  homework_id: string;
  student_id: string;
  content: string;
  attachments: string[];
  submitted_at: string;
  grade?: number;
  feedback?: string;
}

// Add these interfaces to your existing types
export interface PerformanceTrend {
  month: string;
  averageScore: number;
  students: number;
}

export interface ClassStats {
  id: string;
  className: string;
  subject: string;
  studentCount: number;
  averageScore: number;
  upcomingExams: number; // Changed back to upcomingExams for clarity
  completedExams?: number; // Add this for completed exams if needed
  improvement?: number;
}

export interface TeacherDashboardStats {
  activeExams: number;
  totalStudents: number;
  averageScore: number;
  pendingGrading: number;
  classesCount: number;
}

export interface RecentActivity {
  id: string;
  title: string;
  description: string;
  type: 'exam' | 'homework' | 'announcement';
  date: string;
  status: 'completed' | 'pending' | 'grading';
}