import { Test, TestingModule } from '@nestjs/testing';
import { GpaService } from './gpa.service';
import { PrismaService } from '../prisma/prisma.service';
import { GradeStatus } from '@prisma/client';

const mockPrismaService = {
  grade: {
    findMany: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
  },
  semester: {
    findUnique: jest.fn(),
  },
  academicSession: {
    findUnique: jest.fn(),
  },
  systemAuditLog: {
    create: jest.fn(),
  },
};

describe('GpaService', () => {
  let service: GpaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GpaService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GpaService>(GpaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateSemesterGpa', () => {
    const mockStudentId = 'student-1';
    const mockSemesterId = 'semester-1';

    it('should calculate GPA correctly for single course', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: mockStudentId,
          semesterId: mockSemesterId,
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC101', title: 'Intro to CS' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.calculateSemesterGpa(
        mockStudentId,
        mockSemesterId,
      );

      expect(result).toEqual({
        gpa: 5.0,
        totalCreditUnits: 3,
        totalGradePoints: 15.0,
      });
    });

    it('should calculate GPA correctly for multiple courses with different credit units', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: mockStudentId,
          semesterId: mockSemesterId,
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC101', title: 'Intro to CS' },
        },
        {
          id: 'grade-2',
          studentId: mockStudentId,
          semesterId: mockSemesterId,
          score: 65,
          gradeLetter: 'B',
          gradePoints: 4.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 2, code: 'MTH101', title: 'Calculus I' },
        },
        {
          id: 'grade-3',
          studentId: mockStudentId,
          semesterId: mockSemesterId,
          score: 55,
          gradeLetter: 'C',
          gradePoints: 3.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 4, code: 'PHY101', title: 'Physics I' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.calculateSemesterGpa(
        mockStudentId,
        mockSemesterId,
      );

      // GPA = (5.0*3 + 4.0*2 + 3.0*4) / (3+2+4) = (15+8+12)/9 = 35/9 = 3.89
      expect(result.gpa).toBeCloseTo(3.89, 2);
      expect(result.totalCreditUnits).toBe(9);
      expect(result.totalGradePoints).toBeCloseTo(35.0, 2);
    });

    it('should return null when no grades exist for student', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.calculateSemesterGpa(
        mockStudentId,
        mockSemesterId,
      );

      expect(result).toEqual({
        gpa: null,
        totalCreditUnits: 0,
        totalGradePoints: 0,
      });
    });

    it('should exclude DRAFT grades from calculation', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: mockStudentId,
          semesterId: mockSemesterId,
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC101', title: 'Intro to CS' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      await service.calculateSemesterGpa(mockStudentId, mockSemesterId);

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: GradeStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('should handle multiple semesters with varying credit loads', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: mockStudentId,
          semesterId: 'semester-1',
          score: 80,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 4, code: 'CSC101', title: 'Intro to CS' },
        },
        {
          id: 'grade-2',
          studentId: mockStudentId,
          semesterId: 'semester-1',
          score: 70,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 2, code: 'GST101', title: 'Use of English' },
        },
        {
          id: 'grade-3',
          studentId: mockStudentId,
          semesterId: 'semester-2',
          score: 60,
          gradeLetter: 'B',
          gradePoints: 4.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC201', title: 'Data Structures' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.calculateCgpa(mockStudentId);

      // CGPA = (5.0*4 + 5.0*2 + 4.0*3) / (4+2+3) = (20+10+12)/9 = 42/9 = 4.67
      expect(result.cgpa).toBeCloseTo(4.67, 2);
      expect(result.totalCreditUnits).toBe(9);
    });

    it('should return 0.0 CGPA when all grades are F', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: mockStudentId,
          semesterId: 'semester-1',
          score: 30,
          gradeLetter: 'F',
          gradePoints: 0.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC101', title: 'Intro to CS' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.calculateCgpa(mockStudentId);

      expect(result.cgpa).toBe(0.0);
    });
  });

  describe('calculateSessionCgpa', () => {
    const mockStudentId = 'student-1';
    const mockSessionId = 'session-1';

    it('should calculate CGPA for specific academic session', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: mockStudentId,
          semesterId: 'semester-1',
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC101', title: 'Intro to CS' },
          semester: {
            id: 'semester-1',
            academicSessionId: mockSessionId,
          },
        },
        {
          id: 'grade-2',
          studentId: mockStudentId,
          semesterId: 'semester-2',
          score: 65,
          gradeLetter: 'B',
          gradePoints: 4.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC201', title: 'Data Structures' },
          semester: {
            id: 'semester-2',
            academicSessionId: mockSessionId,
          },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.calculateSessionCgpa(
        mockStudentId,
        mockSessionId,
      );

      // CGPA = (5.0*3 + 4.0*3) / (3+3) = (15+12)/6 = 4.5
      expect(result.cgpa).toBe(4.5);
    });

    it('should return null when no grades exist for session', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.calculateSessionCgpa(
        mockStudentId,
        mockSessionId,
      );

      expect(result).toEqual({
        cgpa: null,
        totalCreditUnits: 0,
        totalGradePoints: 0,
      });
    });
  });

  describe('calculateBatchGpa', () => {
    const mockSemesterId = 'semester-1';

    it('should calculate GPA for multiple students', async () => {
      const mockStudentsWithGrades = [
        {
          id: 'student-1',
          grades: [
            {
              id: 'grade-1',
              score: 75,
              gradeLetter: 'A',
              gradePoints: 5.0,
              status: GradeStatus.PUBLISHED,
              course: { creditUnits: 3 },
            },
          ],
        },
        {
          id: 'student-2',
          grades: [
            {
              id: 'grade-2',
              score: 65,
              gradeLetter: 'B',
              gradePoints: 4.0,
              status: GradeStatus.PUBLISHED,
              course: { creditUnits: 3 },
            },
          ],
        },
      ];

      mockPrismaService.student.findMany.mockResolvedValue(
        mockStudentsWithGrades,
      );

      const result = await service.calculateBatchGpa(
        ['student-1', 'student-2'],
        mockSemesterId,
      );

      expect(result.size).toBe(2);
      expect(result.get('student-1')).toEqual({
        gpa: 5.0,
        totalCreditUnits: 3,
        totalGradePoints: 15.0,
      });
      expect(result.get('student-2')).toEqual({
        gpa: 4.0,
        totalCreditUnits: 3,
        totalGradePoints: 12.0,
      });
    });

    it('should handle students with no grades in batch', async () => {
      const mockStudentsWithGrades = [
        {
          id: 'student-1',
          grades: [
            {
              id: 'grade-1',
              score: 75,
              gradeLetter: 'A',
              gradePoints: 5.0,
              status: GradeStatus.PUBLISHED,
              course: { creditUnits: 3 },
            },
          ],
        },
        {
          id: 'student-2',
          grades: [],
        },
      ];

      mockPrismaService.student.findMany.mockResolvedValue(
        mockStudentsWithGrades,
      );

      const result = await service.calculateBatchGpa(
        ['student-1', 'student-2'],
        mockSemesterId,
      );

      expect(result.size).toBe(2);
      expect(result.get('student-1')).toEqual({
        gpa: 5.0,
        totalCreditUnits: 3,
        totalGradePoints: 15.0,
      });
      expect(result.get('student-2')).toEqual({
        gpa: null,
        totalCreditUnits: 0,
        totalGradePoints: 0,
      });
    });

    it('should return empty map for empty student list', async () => {
      mockPrismaService.student.findMany.mockResolvedValue([]);

      const result = await service.calculateBatchGpa([], mockSemesterId);

      expect(result.size).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle division by zero gracefully', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.calculateSemesterGpa(
        'student-1',
        'semester-1',
      );

      expect(result.gpa).toBeNull();
      expect(result.totalCreditUnits).toBe(0);
      expect(result.totalGradePoints).toBe(0);
    });

    it('should handle student with no exams taken', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.calculateCgpa('student-1');

      expect(result.cgpa).toBeNull();
    });

    it('should not include grades from other students', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: 'student-1',
          semesterId: 'semester-1',
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { creditUnits: 3, code: 'CSC101', title: 'Intro to CS' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      await service.calculateSemesterGpa('student-1', 'semester-1');

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            studentId: 'student-1',
          }),
        }),
      );
    });
  });
});
