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
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
  questions?: Question[];
  submissions_count?: number;
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
export interface Homework {
  id: string;
  title: string;
  description: string;
  subject: string;
  class: string;
  due_date: string;
  points: number;
  attachments: boolean;
  teacher_id: string;
  created_at: string;
  updated_at: string;
  teacher?: Teacher;
  submissions_count?: number;
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