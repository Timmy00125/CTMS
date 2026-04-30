export class GpaResponseDto {
  studentId!: string;
  semesterId?: string;
  gpa!: number | null;
  cgpa!: number | null;
  totalCreditUnits!: number;
  totalGradePoints!: number;
  calculatedAt!: Date;
}

export class SemesterGpaReportDto {
  semesterId!: string;
  students!: Array<{
    studentId: string;
    gpa: number | null;
    totalCreditUnits: number;
    totalGradePoints: number;
  }>;
}

export class StudentGpaResponseDto {
  studentId!: string;
  semesterId!: string;
  gpa!: number | null;
  cgpa!: number | null;
  totalCreditUnits!: number;
  totalGradePoints!: number;
}
