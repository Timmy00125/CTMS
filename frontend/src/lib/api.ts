import { TranscriptData } from '@/types/transcript';

export interface Student {
  id: string;
  matriculationNo: string;
  name: string;
  departmentId: string;
  level: number;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  code: string;
  title: string;
  creditUnits: number;
  departmentId: string;
  lecturerId?: string;
  lecturer?: {
    id: string;
    name: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AcademicSession {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  semesters: Semester[];
}

export interface Semester {
  id: string;
  name: string;
  academicSessionId: string;
  isActive: boolean;
  academicSession?: AcademicSession;
}

export interface Grade {
  id: string;
  studentId: string;
  courseId: string;
  semesterId: string;
  score: number;
  gradeLetter: string | null;
  gradePoints: number | null;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
  createdAt: string;
  updatedAt: string;
  student?: Student;
  course?: Course;
  semester?: Semester;
}

export interface User {
  id: string;
  email: string;
  name: string;
  roles: ('Admin' | 'Lecturer' | 'ExamOfficer')[];
  departmentId?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalCourses: number;
  totalGrades: number;
  publishedGrades: number;
  pendingGrades: number;
  draftGrades: number;
}

// ─── API Functions ───

const API_BASE =
  typeof window === 'undefined'
    ? (process.env.API_BASE_URL || 'http://localhost:3001')
    : '';

async function getServerCookies(): Promise<string | undefined> {
  if (typeof window !== 'undefined') return undefined;
  try {
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    return cookieStore.toString();
  } catch {
    return undefined;
  }
}

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const cookieHeader = await getServerCookies();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(cookieHeader ? { Cookie: cookieHeader } : {}),
  };

  if (options?.headers) {
    const opts = options.headers as Record<string, string>;
    Object.entries(opts).forEach(([k, v]) => {
      headers[k] = v;
    });
  }

  const res = await fetch(`${API_BASE}${url}`, {
    credentials: 'include',
    ...options,
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// Auth
export async function loginUser(email: string, password: string) {
  return apiFetch<{ message: string; user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function registerUser(name: string, email: string, password: string) {
  return apiFetch<{ message: string }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password }),
  });
}

export async function logoutUser() {
  return apiFetch<{ message: string }>('/auth/logout', { method: 'POST' });
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    // The backend doesn't have a /auth/me endpoint, but we can infer from context
    // For now, return null and handle auth state client-side
    return null;
  } catch {
    return null;
  }
}

// Students
export async function fetchStudents(): Promise<Student[]> {
  return apiFetch<Student[]>('/students');
}

export async function fetchStudent(id: string): Promise<Student> {
  return apiFetch<Student>(`/students/${id}`);
}

// Courses
export async function fetchCourses(): Promise<Course[]> {
  return apiFetch<Course[]>('/courses');
}

export async function fetchCourse(id: string): Promise<Course> {
  return apiFetch<Course>(`/courses/${id}`);
}

// Academic Sessions
export async function fetchAcademicSessions(): Promise<AcademicSession[]> {
  return apiFetch<AcademicSession[]>('/academic-sessions');
}

// Transcripts
export async function fetchStudentTranscript(studentId: string): Promise<TranscriptData> {
  return apiFetch<TranscriptData>(`/transcript/${studentId}`);
}

// Grades
export async function fetchStudentGrades(studentId: string): Promise<Grade[]> {
  return apiFetch<Grade[]>(`/grades/student/${studentId}`);
}

export async function fetchCourseGrades(courseId: string, semesterId: string): Promise<Grade[]> {
  return apiFetch<Grade[]>(`/grades/course/${courseId}/semester/${semesterId}`);
}

export async function submitGrade(dto: {
  studentId: string;
  courseId: string;
  semesterId: string;
  score: number;
}): Promise<Grade> {
  return apiFetch<Grade>('/grades', {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

export async function publishGrades(courseId: string, semesterId: string): Promise<void> {
  return apiFetch<void>('/grades/publish', {
    method: 'PATCH',
    body: JSON.stringify({ courseId, semesterId }),
  });
}

export async function amendGrade(id: string, dto: { score: number; reason?: string }): Promise<Grade> {
  return apiFetch<Grade>(`/grades/${id}/amend`, {
    method: 'PATCH',
    body: JSON.stringify(dto),
  });
}

// GPA
export async function calculateStudentCgpa(studentId: string) {
  return apiFetch<{ studentId: string; cgpa: number | null; totalCreditUnits: number; totalGradePoints: number }>(
    `/gpa/calculate/student/${studentId}`,
    { method: 'POST' }
  );
}

export async function calculateSemesterGpa(semesterId: string, studentIds?: string[]) {
  return apiFetch<{ semesterId: string; results: Array<{ studentId: string; gpa: number | null; totalCreditUnits: number; totalGradePoints: number }> }>(
    '/gpa/calculate/semester',
    {
      method: 'POST',
      body: JSON.stringify({ semesterId, studentIds }),
    }
  );
}

// Dashboard stats (computed from other endpoints)
export async function fetchDashboardStats(): Promise<DashboardStats> {
  const [students, courses] = await Promise.all([
    fetchStudents().catch(() => [] as Student[]),
    fetchCourses().catch(() => [] as Course[]),
    // We don't have a direct grades endpoint, so we approximate
    Promise.resolve([] as Grade[]),
  ]);

  return {
    totalStudents: students.length,
    totalCourses: courses.length,
    totalGrades: 0,
    publishedGrades: 0,
    pendingGrades: 0,
    draftGrades: 0,
  };
}
