// src/services/api.ts - Fixed 403 handling
import axios, { AxiosInstance, AxiosResponse } from "axios";
import { LoginRequest, AuthResponse, ApiResponse, User, Exam } from "../types";
import { storage } from "../utils/storage";
import { router } from 'expo-router';

const API_BASE_URL = "http://192.168.1.124:5001/api";
// const API_BASE_URL = "https://elmadrasa-server.vercel.app/api";

// --- Shared routing config (used by both api.ts and _layout.tsx) ---
export const SHARED_BASE_ROUTES = ["/exams", "/homework", "/profile"];
export const SAFE_ROUTES = [
  "/unauthorized",
  "/network-error",
  "/not-found",
  "/(auth)/login",
  "/(auth)/register",
  "/(auth)/forgot-password",
];

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;
  private tokenKey = 'authToken';
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (error?: any) => void;
  }> = [];

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 30000,
      timeoutErrorMessage: "Request timeout - server not responding"
    });

    this.initializeToken();
    this.setupInterceptors();
  }

  private async initializeToken(): Promise<void> {
    try {
      this.token = await storage.getItem(this.tokenKey);
      console.log('🔑 Initialized token from storage:', this.token ? `${this.token.substring(0, 15)}...` : 'none');

      if (this.token) {
        // Validate token before using
        const isValid = await this.validateToken();
        if (isValid) {
          this.api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          console.log('✅ Token validated and set in headers');
        } else {
          console.log('❌ Token invalid, cleared from storage');
          this.token = null;
        }
      }
    } catch (error) {
      console.error('❌ Failed to initialize token:', error);
      this.token = null;
    }
  }

  private setupInterceptors(): void {
    // Request interceptor - ensure token is fresh
    this.api.interceptors.request.use(
      async (config) => {
        console.log('🚀 API Request:', {
          method: config.method?.toUpperCase(),
          url: config.url,
          hasToken: !!this.token,
          tokenPreview: this.token ? `${this.token.substring(0, 20)}...` : 'none'
        });

        return config;
      },
      (error) => {
        console.error('❌ Request error:', error);
        return Promise.reject(error);
      }
    );

    // Enhanced response interceptor with proper error handling
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data?.success ? 'success' : 'error'
        });
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        const status = error.response?.status;

        console.error('❌ API Error:', {
          status,
          url: originalRequest?.url,
          message: error.response?.data?.error || error.message,
          code: error.code
        });

        // Avoid running twice
        if (this.isRefreshing && status !== 403) {
          return Promise.reject(error);
        }

        // --- 401 Unauthorized ---
        if (status === 401) {
          console.log('🔐 401 - Unauthorized');

          if (!this.isRefreshing) {
            this.isRefreshing = true;
            try {
              await this.clearToken();
            } catch (clearError) {
              console.error('❌ Error clearing token:', clearError);
            }
          }

          setTimeout(() => {
            try {
              console.log('➡️ Redirecting to login');
              router.replace('/(auth)/login');
            } catch (err) {
              console.error('❌ Login redirect failed:', err);
            } finally {
              this.isRefreshing = false;
            }
          }, 300);

          return Promise.reject(error);
        }

        // --- 403 Forbidden ---
        if (status === 403) {
          console.log('🚫 403 - Forbidden (Insufficient permissions)');

          // Don't set isRefreshing for 403 to avoid blocking other requests
          setTimeout(async () => {
            try {
              // Check if we're already on unauthorized page to prevent loops
              const currentPath = window.location?.pathname || '';
              if (!currentPath.includes('/unauthorized')) {
                console.log('➡️ Redirecting to unauthorized page');
                // router.replace('/unauthorized');
              }
            } catch (err) {
              console.error('❌ 403 redirect failed:', err);
            }
          }, 300);

          return Promise.reject(error);
        }

        // --- 404 Not Found ---
        if (status === 404) {
          console.log('🔍 404 - Not Found');
          setTimeout(() => {
            try {
              // router.replace('/not-found');
            } catch (err) {
              console.error('❌ 404 redirect failed:', err);
            }
          }, 300);
          return Promise.reject(error);
        }

        // --- Network / other errors ---
        if (!error.response) {
          console.log('🌐 Network error');
          setTimeout(() => {
            try {
              // router.replace('/network-error');
            } catch (err) {
              console.error('❌ Failed to route to network-error:', err);
            }
          }, 300);
        }

        return Promise.reject(error);
      }
    );
  }

  // Rest of your methods remain the same...
  private redirectToLogin(): void {
    console.log("➡️ Redirecting to login screen");

    if (this.isRefreshing) return;
    this.isRefreshing = true;

    setTimeout(() => {
      try {
        router.replace("/(auth)/login");
      } catch (error) {
        console.error("❌ Error during redirect:", error);
      } finally {
        this.isRefreshing = false;
      }
    }, 300);
  }

  // Enhanced Token management
  async validateToken(): Promise<boolean> {
    if (!this.token) return false;

    try {
      const tokenParts = this.token.split('.');
      if (tokenParts.length !== 3) {
        console.log('❌ Invalid token structure');
        await this.clearToken();
        return false;
      }

      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        const expiry = payload.exp * 1000;
        if (Date.now() >= expiry) {
          console.log('❌ Token expired');
          await this.clearToken();
          return false;
        }
        console.log('✅ Token valid, expires:', new Date(expiry).toISOString());
        return true;
      } catch (e) {
        console.log('❌ Token payload invalid');
        await this.clearToken();
        return false;
      }
    } catch (error) {
      console.error('❌ Token validation error:', error);
      await this.clearToken();
      return false;
    }
  }

  async setToken(token: string): Promise<void> {
    try {
      this.token = token;
      this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      await storage.setItem(this.tokenKey, token);

      // Verify storage
      const storedToken = await storage.getItem(this.tokenKey);
      console.log('✅ Token set and stored:', {
        set: token.substring(0, 20) + '...',
        stored: storedToken ? storedToken.substring(0, 20) + '...' : 'none',
        match: storedToken === token
      });
    } catch (error) {
      console.error('❌ Failed to set token:', error);
      throw error;
    }
  }

  async clearToken(): Promise<void> {
    try {
      this.token = null;
      delete this.api.defaults.headers.common['Authorization'];
      await storage.removeItem(this.tokenKey);

      // Verify clearance
      const storedToken = await storage.getItem(this.tokenKey);
      console.log('✅ Token cleared verification:', {
        storedToken: storedToken ? 'still exists' : 'cleared'
      });
    } catch (error) {
      console.error('❌ Failed to clear token:', error);
      throw error;
    }
  }

  getToken(): string | null {
    return this.token;
  }

  async isAuthenticated(): Promise<boolean> {
    if (!this.token) return false;
    return await this.validateToken();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.api.get("/health");
      return response.data.success === true;
    } catch (error) {
      console.error('❌ Health check failed:', error);
      return false;
    }
  }

  // Auth methods
  async login(credentials: LoginRequest): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
    // Clear any existing token first
    await this.clearToken();

    const response = await this.api.post("/auth/login", credentials);

    console.log('🔐 Login API Response Structure:', {
      success: response.data.success,
      hasData: !!response.data.data,
      dataKeys: response.data.data ? Object.keys(response.data.data) : 'no data',
      hasUser: !!response.data.data?.user,
      hasToken: !!response.data.data?.token
    });

    if (response.data.success && response.data.data?.token) {
      await this.setToken(response.data.data.token);

      // Verify token was set
      const verifiedToken = await storage.getItem(this.tokenKey);
      console.log('✅ Token verification:', {
        set: !!response.data.data.token,
        stored: !!verifiedToken,
        match: response.data.data.token === verifiedToken
      });
    }

    return response;
  }

  public async getCurrentUser(): Promise<AxiosResponse<ApiResponse<User>>> {
    return this.api.get("/auth/me");
  }

  // Student methods
  async getStudentDashboard(): Promise<AxiosResponse<ApiResponse<any>>> {
    console.log('📊 Fetching dashboard data...');
    return this.api.get("/students/dashboard");
  }

  async getExams() {
    return this.api.get('/students/exams');
  }

  async getUpcomingExams() {
    return this.api.get('/students/upcoming-exams');
  }

  async checkExamTaken(examId: string) {
    try {
      const response = await this.api.get(`/students/exam/${examId}/status`);
      return response.data.data?.taken || false;
    } catch (error) {
      return false;
    }
  }

  // Student methods
  public async getStudentStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/stats");
  }

  public async getStudentResults(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/results");
  }

  public async getSubjectPerformance(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/performance");
  }

  public async getExamById(id: string): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.get(`/exams/${id}`);
  }

  // Teacher methods
  public async getTeacherStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/stats");
  }

  public async getRecentActivity(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/activity");
  }

  public async getExamResults(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/results`);
  }

  public async getExamSubmissions(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/submissions`);
  }

  async getStudentDashboardStats() {
    return this.api.get('/students/dashboard');
  }

  public async getTeacherProfileStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/profile-stats");
  }

  public async updateTeacherProfile(profileData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put("/teachers/profile", profileData);
  }

  public async getTeacherAchievements(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/achievements");
  }

  public async getTeacherDashboardStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/stats");
  }


  public async getTeacherClassesWithStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/classes");
  }

  public async getExamStatistics(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/statistics`);
  }

  // In your apiService.ts - Add this method
  async getTeacherExams(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/exams"); // Or whatever your teacher exams endpoint is
  }

  async getTeacherExamResults(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/teachers/exams/${examId}/results`);
  }

  public async getRecentTeacherActivity(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/activity");
  }

  public async deleteExam(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.delete(`/exams/${examId}`);
  }

  public async updateExam(examId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/exams/${examId}`, data);
  }

  public async updateExamStatus(examId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.patch(`/exams/${examId}/status`, data);
  }

  public async createExam(examData: any): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.post("/exams", examData);
  }

  public async submitExam(submission: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/submissions/submit", submission);
  }


  async submitExamAnswers(examId: string, answers: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post('/submissions/submit', { // ✅ Changed endpoint
      examId: examId,
      answers: answers
    });
  }

  async getSubmissionResults(submissionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/submissions/${submissionId}/results`);
  }

  async getLatestSubmission(examId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/submissions/exam/${examId}/latest`);
  }

  async getStudentSubmissions(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get('/submissions/student/all');
  }

  async assignTeacherToClass(assignmentData: {
    teacher_id: string;
    class_id: string;
    subject_id: string;
  }): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/admin/teacher-assignments", assignmentData);
  }

  async getTeacherClasses(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get("/teachers/classes");
  }

  // Student Management
  async getStudentsByClass(classId: string): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get(`/teachers/classes/${classId}/students`);
  }

  // User management
  async getUsersByRole(role: string): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get(`/admin/users?role=${role}`); // Changed from /users to /admin/users
  }

  async regenerateJoinCode(joinCodeId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/teachers/join-codes/${joinCodeId}/regenerate`);
  }

  // Teacher - Student Management
  async getClassStudentPerformance(classId: string, subjectId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/teachers/classes/${classId}/subjects/${subjectId}/performance`);
  }

  // Student - Progress Tracking
  async getStudyProgress(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/progress");
  }

  async getWeakAreas(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/weak-areas");
  }

  // File Upload (for homework attachments)
  async uploadFile(file: any, type: 'homework' | 'avatar' | 'exam'): Promise<AxiosResponse<ApiResponse<any>>> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    return this.api.post("/upload", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // In api.ts - add this method to your ApiService class
  async uploadFileBase64(fileData: { file: string; fileName: string; fileType: string }): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/upload/file", fileData);
  }


  // Admin methods
  public async getAdminStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/admin/stats");
  }

  public async getPendingApprovals(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/admin/pending-approvals");
  }

  public async approveUser(userId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.patch(`/admin/users/${userId}/approve`);
  }

  public async createLevel(levelData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/admin/levels", levelData);
  }

  public async createClass(classData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/admin/classes", classData);
  }

  public async createSubject(subjectData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/admin/subjects", subjectData);
  }

  // Add to your ApiService class in api.ts

  // Student subject management
  async joinSubjectWithCode(joinCode: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/students/join-subject", { join_code: joinCode });
  }

  async getStudentSubjects(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get("/students/my-subjects");
  }

  // Teacher join code management
  async getTeacherJoinCodes(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get("/teachers/join-codes");
  }

  async createJoinCode(classId: string, subjectId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/teachers/join-codes", { class_id: classId, subject_id: subjectId });
  }

  // Admin student management
  async getClassStudents(classId: string): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get(`/admin/classes/${classId}/students`);
  }

  async assignStudentToClass(studentId: string, classId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/admin/students/${studentId}/class`, { class_id: classId });
  }
  // src/services/api.ts - Add new methods
  // Add to your ApiService class

  // Student management
  async deleteUser(userId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.delete(`/admin/users/${userId}`);
  }

  // src/services/api.ts - Add this method
  async removeTeacherAssignment(assignmentId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.delete(`/admin/teacher-assignments/${assignmentId}`);
  }

  // src/services/api.ts - Update the methods
  // Subjects and classes should use /admin/ prefix
  async getSubjects(levelId?: string): Promise<AxiosResponse<ApiResponse<any[]>>> {
    const url = levelId ? `/admin/subjects?level_id=${levelId}` : "/admin/subjects";
    return this.api.get(url);
  }

  // Make sure your apiService.getClasses() method looks like this:
  getClasses = async () => {
    try {
      const response = await this.api.get('/admin/classes');
      console.log('📡 Raw API response:', response); // Debug log
      return response; // Return the full response object
    } catch (error) {
      throw error;
    }
  };

  async getGradesByLevel(levelId?: string) {
    const params = levelId ? { level_id: levelId } : {};
    const response = await this.api.get('/admin/grades', { params });
    return response.data;
  }

  // In your api service file
  getClassesByGrade = async (grade: string, levelId: string) => {
    try {
      const response = await this.api.get('/admin/classes', {
        params: {
          grade: grade,
          level_id: levelId  // Make sure both parameters are sent
        }
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  };


  async getTeacherAssignments(): Promise<AxiosResponse<ApiResponse<any[]>>> {
    return this.api.get("/admin/teacher-assignments");
  }

  async getLevels() {
    const response = await this.api.get('/admin/levels');
    return response.data;
  }

  // src/services/api.ts - Add this method
  async getTeacherClassesAndSubjects(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/classes-subjects");
  }
  // src/services/api.ts - Update homework methods
  async getHomework(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/homework/student");
  }

  async getHomeworkById(id: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/homework/${id}`);
  }

  async submitHomework(homeworkId: string, content: string, attachments?: any[], answers?: any[]): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/homework/submit", {
      homework_id: homeworkId,
      content,
      attachments,
      answers
    });
  }

  async createHomework(homeworkData: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/homework", homeworkData);
  }

  async getStudents(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get('/admin/students');
  }

  async createStudent(data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post('/admin/students', data);
  }

  async updateStudent(studentId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/admin/students/${studentId}`, data);
  }


  // src/services/api.ts - Add these methods if missing

  // Teacher homework methods
  async getTeacherHomework(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/homework/teacher/all");
  }

  async getHomeworkSubmissions(homeworkId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/homework/${homeworkId}/submissions`);
  }

  async gradeSubmission(submissionId: string, grade: number, feedback?: string, question_grades?: any[]): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post(`/homework/submissions/${submissionId}/grade`, {
      grade,
      feedback,
      question_grades
    });
  }


  // In api.ts - ensure these methods exist
  async updateUserProfile(userId: string, data: any): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/users/${userId}/profile`, data);
  }

  async getUserProfile() {
    return this.api.get('/users/me');
  }

  async updateUser(profileData: {
    language?: 'en' | 'ar';
    name?: string;
    avatar?: string;
    [key: string]: any;
  }) {
    return this.api.patch('/users/me/profile', profileData);
  }

  /**
   * Update only user language
   */
  async updateUserLanguage(language: 'en' | 'ar' | 'ar-eg') {
    return this.api.patch('/users/me/language', { language });
  }

  async updateStudentClass(studentId: string, className: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/admin/students/${studentId}/class`, { class_name: className });
  }

  async savePushToken(token: string | null): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/users/save-push-token", { push_token: token });
  }

  // Add this method to send notifications from mobile (if needed)
  async sendNotificationToUser(userId: string, title: string, body: string, data: any = {}) {
    return this.api.post('/notifications/send-to-user', {
      user_id: userId,
      title,
      body,
      data
    });
  }

  async sendLocalizedNotification(
    userId: string,
    titleKey: string,
    bodyKey: string,
    data?: Record<string, any>,
    extra?: any
  ) {
    return this.api.post('/notifications/send-localized', {
      userId,
      titleKey,
      bodyKey,
      data,
      extra
    });
  }

  /**
   * Send bulk localized notifications
   */
  async sendBulkLocalizedNotifications(
    userIds: string[],
    titleKey: string,
    bodyKey: string,
    data?: Record<string, any>,
    extra?: any
  ) {
    return this.api.post('/notifications/send-bulk-localized', {
      userIds,
      titleKey,
      bodyKey,
      data,
      extra
    });
  }

  async getUserById(userId: string) {
    return this.api.get(`/users/${userId}/profile`);
  }

  // In apiService class:
  async getSubmissionsNeedingGrading(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/submissions/needs-grading");
  }

  async getSubmissionForGrading(submissionId: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/teachers/submissions/${submissionId}/grade`);
  }

  async manuallyGradeSubmission(
    submissionId: string,
    score: number,
    feedback?: string,
    answers?: any[],
    updatedQuestions?: any[] // Add this parameter
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post(`/teachers/submissions/${submissionId}/grade`, {
      score,
      feedback,
      answers,
      updatedQuestions // Include in request body
    });
  }

  async extractQuestionsFromImage(imageUrl: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/ai/extract-from-image", { imageUrl });
  }

  async extractQuestionsFromText(text: string): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/ai/extract-from-text", { text });
  }
}

export const apiService = new ApiService();