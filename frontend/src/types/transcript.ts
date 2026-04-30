export interface TranscriptCourse {
  gradeId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  score: number;
  gradeLetter: string | null;
  gradePoints: number | null;
  status: string;
}

export interface TranscriptSemester {
  id: string;
  name: string;
  gpa: number | null;
  totalCreditUnits: number;
  totalGradePoints: number;
  courses: TranscriptCourse[];
}

export interface TranscriptAcademicSession {
  id: string;
  name: string;
  semesters: TranscriptSemester[];
}

export interface TranscriptData {
  student: {
    id: string;
    matriculationNo: string;
    name: string;
    departmentId: string;
    level: number;
  };
  academicSessions: TranscriptAcademicSession[];
  cgpa: number | null;
  totalCreditUnits: number;
  totalGradePoints: number;
}
