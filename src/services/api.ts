import axios, { AxiosInstance, AxiosResponse } from "axios";
import { LoginRequest, AuthResponse, ApiResponse, User, Exam } from "../types";

const API_BASE_URL = "http://192.168.1.69:5001/api";

class ApiService {
  private api: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        "Content-Type": "application/json",
      },
      timeout: 10000,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    this.api.interceptors.request.use(
      (config) => {
        console.log("🚀 Making API Request:");
        console.log("   URL:", (config.baseURL || "") + (config.url || ""));
        console.log("   Method:", config.method);
        console.log("   Headers:", config.headers);
        return config;
      },
      (error) => {
        console.error("❌ Request Error:", error);
        return Promise.reject(error);
      }
    );

    this.api.interceptors.response.use(
      (response) => {
        console.log(
          "✅ Response Success:",
          response.status,
          response.config.url
        );
        return response;
      },
      (error) => {
        console.error("❌ Response Error Details:");
        console.error("   Message:", error.message);
        console.error("   Code:", error.code);
        console.error("   URL:", error.config?.baseURL + error.config?.url);
        console.error("   Full Error:", error);

        if (error.response) {
          console.error("   Response Status:", error.response.status);
          console.error("   Response Data:", error.response.data);
        }

        return Promise.reject(error);
      }
    );
  }

  public async testConnection(): Promise<boolean> {
    try {
      console.log(
        "🔗 Testing connection to:",
        this.api.defaults.baseURL + "/health"
      );
      const response = await this.api.get("/health");
      console.log("✅ Connection test successful:", response.data);
      return true;
    } catch (error: any) {
      console.error("❌ Connection test failed:", error.message);
      throw error;
    }
  }

  // Add these methods to the ApiService class
  public async getExams(): Promise<AxiosResponse<ApiResponse<Exam[]>>> {
    return this.api.get("/exams");
  }

  public async getExamById(
    id: string
  ): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.get(`/exams/${id}`);
  }

  public async createExam(
    examData: any
  ): Promise<AxiosResponse<ApiResponse<Exam>>> {
    return this.api.post("/exams", examData);
  }

  public async submitExam(
    submission: any
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/exams/submit", submission);
  }

  // In your api.ts, update the token methods
  public setToken(token: string): void {
    this.token = token;
    // Set the token in axios headers
    this.api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  }

  public clearToken(): void {
    this.token = null;
    delete this.api.defaults.headers.common["Authorization"];
  }

  public getToken(): string | null {
    return this.token;
  }

  public async getStudentStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/stats");
  }

  public async getStudentResults(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/students/results");
  }

  public async getSubjectPerformance(): Promise<
    AxiosResponse<ApiResponse<any>>
  > {
    return this.api.get("/students/subject-performance");
  }

  public async login(
    credentials: LoginRequest
  ): Promise<AxiosResponse<ApiResponse<AuthResponse>>> {
    return this.api.post("/auth/login", credentials);
  }

  public async getCurrentUser(): Promise<AxiosResponse<ApiResponse<User>>> {
    return this.api.get("/auth/me");
  }
  // Add to your api.ts
  // In your src/services/api.ts - Add these methods
  public async getTeacherStats(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/stats");
  }

  public async getRecentActivity(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/activity");
  }

  public async getTeacherClasses(): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get("/teachers/classes");
  }

  public async createHomework(
    homeworkData: any
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.post("/homework", homeworkData);
  }

  // Add to your api.ts
  public async getExamSubmissions(
    examId: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.get(`/exams/${examId}/submissions`);
  }

  public async deleteExam(
    examId: string
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.delete(`/exams/${examId}`);
  }

  public async updateExam(
    examId: string,
    data: any
  ): Promise<AxiosResponse<ApiResponse<any>>> {
    return this.api.put(`/exams/${examId}`, data);
  }
}

export const apiService = new ApiService();
