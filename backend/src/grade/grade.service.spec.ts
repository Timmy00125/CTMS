import { Test, TestingModule } from '@nestjs/testing';
import { GradeService } from './grade.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';
import { GradeStatus } from '@prisma/client';

const mockPrismaService = {
  grade: {
    create: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
  },
  gradeAuditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  systemAuditLog: {
    create: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
  },
  student: {
    findUnique: jest.fn(),
  },
  semester: {
    findUnique: jest.fn(),
  },
};

describe('GradeService', () => {
  let service: GradeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradeService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<GradeService>(GradeService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('mapScoreToGrade', () => {
    it('should map score 70-100 to grade A with 5 points', () => {
      expect(service.mapScoreToGrade(70)).toEqual({
        gradeLetter: 'A',
        gradePoints: 5.0,
      });
      expect(service.mapScoreToGrade(85)).toEqual({
        gradeLetter: 'A',
        gradePoints: 5.0,
      });
      expect(service.mapScoreToGrade(100)).toEqual({
        gradeLetter: 'A',
        gradePoints: 5.0,
      });
    });

    it('should map score 60-69 to grade B with 4 points', () => {
      expect(service.mapScoreToGrade(60)).toEqual({
        gradeLetter: 'B',
        gradePoints: 4.0,
      });
      expect(service.mapScoreToGrade(65)).toEqual({
        gradeLetter: 'B',
        gradePoints: 4.0,
      });
      expect(service.mapScoreToGrade(69)).toEqual({
        gradeLetter: 'B',
        gradePoints: 4.0,
      });
    });

    it('should map score 50-59 to grade C with 3 points', () => {
      expect(service.mapScoreToGrade(50)).toEqual({
        gradeLetter: 'C',
        gradePoints: 3.0,
      });
      expect(service.mapScoreToGrade(55)).toEqual({
        gradeLetter: 'C',
        gradePoints: 3.0,
      });
      expect(service.mapScoreToGrade(59)).toEqual({
        gradeLetter: 'C',
        gradePoints: 3.0,
      });
    });

    it('should map score 45-49 to grade D with 2 points', () => {
      expect(service.mapScoreToGrade(45)).toEqual({
        gradeLetter: 'D',
        gradePoints: 2.0,
      });
      expect(service.mapScoreToGrade(47)).toEqual({
        gradeLetter: 'D',
        gradePoints: 2.0,
      });
      expect(service.mapScoreToGrade(49)).toEqual({
        gradeLetter: 'D',
        gradePoints: 2.0,
      });
    });

    it('should map score 40-44 to grade E with 1 point', () => {
      expect(service.mapScoreToGrade(40)).toEqual({
        gradeLetter: 'E',
        gradePoints: 1.0,
      });
      expect(service.mapScoreToGrade(42)).toEqual({
        gradeLetter: 'E',
        gradePoints: 1.0,
      });
      expect(service.mapScoreToGrade(44)).toEqual({
        gradeLetter: 'E',
        gradePoints: 1.0,
      });
    });

    it('should map score 0-39 to grade F with 0 points', () => {
      expect(service.mapScoreToGrade(0)).toEqual({
        gradeLetter: 'F',
        gradePoints: 0.0,
      });
      expect(service.mapScoreToGrade(20)).toEqual({
        gradeLetter: 'F',
        gradePoints: 0.0,
      });
      expect(service.mapScoreToGrade(39)).toEqual({
        gradeLetter: 'F',
        gradePoints: 0.0,
      });
    });

    it('should reject scores below 0', () => {
      expect(() => service.mapScoreToGrade(-1)).toThrow(BadRequestException);
    });

    it('should reject scores above 100', () => {
      expect(() => service.mapScoreToGrade(101)).toThrow(BadRequestException);
    });

    it('should reject non-integer scores', () => {
      expect(() => service.mapScoreToGrade(75.5)).toThrow(BadRequestException);
    });
  });

  describe('submitGrade', () => {
    const mockGradeInput = {
      studentId: 'student-1',
      courseId: 'course-1',
      semesterId: 'semester-1',
      score: 75,
    };

    const mockCreatedGrade = {
      id: 'grade-1',
      ...mockGradeInput,
      gradeLetter: 'A',
      gradePoints: 5.0,
      status: GradeStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    it('should create a grade with default DRAFT status', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-1',
      });
      mockPrismaService.semester.findUnique.mockResolvedValue({
        id: 'semester-1',
      });
      mockPrismaService.grade.create.mockResolvedValue(mockCreatedGrade);

      const result = await service.submitGrade(mockGradeInput, 'lecturer-1');

      expect(result.status).toBe(GradeStatus.DRAFT);
      expect(mockPrismaService.grade.create).toHaveBeenCalledWith({
        data: {
          studentId: 'student-1',
          courseId: 'course-1',
          semesterId: 'semester-1',
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.DRAFT,
        },
      });
    });

    it('should auto-map score to grade letter and points on submission', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-1',
      });
      mockPrismaService.semester.findUnique.mockResolvedValue({
        id: 'semester-1',
      });
      mockPrismaService.grade.create.mockResolvedValue({
        ...mockCreatedGrade,
        score: 55,
        gradeLetter: 'C',
        gradePoints: 3.0,
      });

      const result = await service.submitGrade(
        { ...mockGradeInput, score: 55 },
        'lecturer-1',
      );

      expect(result.gradeLetter).toBe('C');
      expect(result.gradePoints).toBe(3.0);
    });

    it('should reject score that is not an integer', async () => {
      await expect(
        service.submitGrade({ ...mockGradeInput, score: 75.5 }, 'lecturer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject score below 0', async () => {
      await expect(
        service.submitGrade({ ...mockGradeInput, score: -1 }, 'lecturer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject score above 100', async () => {
      await expect(
        service.submitGrade({ ...mockGradeInput, score: 101 }, 'lecturer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create a GradeAuditLog entry on submission', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-1',
      });
      mockPrismaService.semester.findUnique.mockResolvedValue({
        id: 'semester-1',
      });
      mockPrismaService.grade.create.mockResolvedValue(mockCreatedGrade);
      mockPrismaService.gradeAuditLog.create.mockResolvedValue({});

      await service.submitGrade(mockGradeInput, 'lecturer-1');

      expect(mockPrismaService.gradeAuditLog.create).toHaveBeenCalledWith({
        data: {
          gradeId: 'grade-1',
          userId: 'lecturer-1',
          oldScore: null,
          newScore: 75,
          reason: 'Initial grade submission',
        },
      });
    });

    it('should reject if course does not exist', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(
        service.submitGrade(mockGradeInput, 'lecturer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if student does not exist', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.submitGrade(mockGradeInput, 'lecturer-1'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject if semester does not exist', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique.mockResolvedValue({
        id: 'student-1',
      });
      mockPrismaService.semester.findUnique.mockResolvedValue(null);

      await expect(
        service.submitGrade(mockGradeInput, 'lecturer-1'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkSubmitGrades', () => {
    const mockGradesInput = [
      {
        studentId: 'student-1',
        courseId: 'course-1',
        semesterId: 'semester-1',
        score: 75,
      },
      {
        studentId: 'student-2',
        courseId: 'course-1',
        semesterId: 'semester-1',
        score: 55,
      },
    ];

    it('should create multiple grades with DRAFT status', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique
        .mockResolvedValueOnce({ id: 'student-1' })
        .mockResolvedValueOnce({ id: 'student-2' });
      mockPrismaService.semester.findUnique.mockResolvedValue({
        id: 'semester-1',
      });
      mockPrismaService.grade.create
        .mockResolvedValueOnce({
          id: 'grade-1',
          ...mockGradesInput[0],
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.DRAFT,
        })
        .mockResolvedValueOnce({
          id: 'grade-2',
          ...mockGradesInput[1],
          gradeLetter: 'C',
          gradePoints: 3.0,
          status: GradeStatus.DRAFT,
        });
      mockPrismaService.gradeAuditLog.create.mockResolvedValue({});

      const result = await service.bulkSubmitGrades(
        mockGradesInput,
        'lecturer-1',
      );

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
    });

    it('should return partial results when some grades fail', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue({
        id: 'course-1',
        lecturerId: 'lecturer-1',
      });
      mockPrismaService.student.findUnique
        .mockResolvedValueOnce({ id: 'student-1' })
        .mockResolvedValueOnce({ id: 'student-2' });
      mockPrismaService.semester.findUnique.mockResolvedValue({
        id: 'semester-1',
      });
      mockPrismaService.grade.create
        .mockResolvedValueOnce({
          id: 'grade-1',
          ...mockGradesInput[0],
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.DRAFT,
        })
        .mockRejectedValueOnce({ code: 'P2002' });
      mockPrismaService.gradeAuditLog.create.mockResolvedValue({});

      const result = await service.bulkSubmitGrades(
        mockGradesInput,
        'lecturer-1',
      );

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('publishGrades', () => {
    const mockDraftGrades = [
      {
        id: 'grade-1',
        studentId: 'student-1',
        courseId: 'course-1',
        semesterId: 'semester-1',
        score: 75,
        status: GradeStatus.DRAFT,
      },
      {
        id: 'grade-2',
        studentId: 'student-2',
        courseId: 'course-1',
        semesterId: 'semester-1',
        score: 55,
        status: GradeStatus.DRAFT,
      },
    ];

    it('should transition DRAFT grades to PUBLISHED for a course/semester', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue(mockDraftGrades);
      mockPrismaService.grade.update.mockResolvedValue({});
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      const result = await service.publishGrades(
        'course-1',
        'semester-1',
        'exam-officer-1',
      );

      expect(result.updated).toBe(2);
      expect(mockPrismaService.grade.update).toHaveBeenCalledTimes(2);
      expect(mockPrismaService.grade.update).toHaveBeenCalledWith({
        where: { id: 'grade-1' },
        data: { status: GradeStatus.PUBLISHED },
      });
    });

    it('should only publish DRAFT grades, not already PUBLISHED ones', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([mockDraftGrades[0]]);
      mockPrismaService.grade.update.mockResolvedValue({});
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      const result = await service.publishGrades(
        'course-1',
        'semester-1',
        'exam-officer-1',
      );

      expect(result.updated).toBe(1);
    });

    it('should log to SystemAuditLog on publication', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue(mockDraftGrades);
      mockPrismaService.grade.update.mockResolvedValue({});
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.publishGrades('course-1', 'semester-1', 'exam-officer-1');

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'exam-officer-1',
          action: 'GRADE_PUBLICATION',
          resource: 'Grade',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: expect.stringContaining('2'),
        },
      });
    });

    it('should return 0 updated if no DRAFT grades found', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.publishGrades(
        'course-1',
        'semester-1',
        'exam-officer-1',
      );

      expect(result.updated).toBe(0);
      expect(mockPrismaService.grade.update).not.toHaveBeenCalled();
    });
  });

  describe('amendGrade', () => {
    const mockExistingGrade = {
      id: 'grade-1',
      studentId: 'student-1',
      courseId: 'course-1',
      semesterId: 'semester-1',
      score: 75,
      gradeLetter: 'A',
      gradePoints: 5.0,
      status: GradeStatus.PUBLISHED,
    };

    it('should update a grade score and create GradeAuditLog', async () => {
      mockPrismaService.grade.findUnique.mockResolvedValue(mockExistingGrade);
      mockPrismaService.grade.update.mockResolvedValue({
        ...mockExistingGrade,
        score: 80,
        gradeLetter: 'A',
        gradePoints: 5.0,
      });
      mockPrismaService.gradeAuditLog.create.mockResolvedValue({});

      const result = await service.amendGrade(
        'grade-1',
        { score: 80, reason: 'Score correction' },
        'lecturer-1',
      );

      expect(result.score).toBe(80);
      expect(mockPrismaService.gradeAuditLog.create).toHaveBeenCalledWith({
        data: {
          gradeId: 'grade-1',
          userId: 'lecturer-1',
          oldScore: 75,
          newScore: 80,
          reason: 'Score correction',
        },
      });
    });

    it('should recalculate grade letter and points on amendment', async () => {
      mockPrismaService.grade.findUnique.mockResolvedValue(mockExistingGrade);
      mockPrismaService.grade.update.mockResolvedValue({
        ...mockExistingGrade,
        score: 62,
        gradeLetter: 'B',
        gradePoints: 4.0,
      });
      mockPrismaService.gradeAuditLog.create.mockResolvedValue({});

      const result = await service.amendGrade(
        'grade-1',
        { score: 62, reason: 'Recalculation' },
        'lecturer-1',
      );

      expect(result.gradeLetter).toBe('B');
      expect(result.gradePoints).toBe(4.0);
    });

    it('should reject amendment if grade does not exist', async () => {
      mockPrismaService.grade.findUnique.mockResolvedValue(null);

      await expect(
        service.amendGrade(
          'nonexistent',
          { score: 80, reason: 'test' },
          'lecturer-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject amendment with invalid score', async () => {
      mockPrismaService.grade.findUnique.mockResolvedValue(mockExistingGrade);

      await expect(
        service.amendGrade(
          'grade-1',
          { score: -5, reason: 'test' },
          'lecturer-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should log to SystemAuditLog on amendment', async () => {
      mockPrismaService.grade.findUnique.mockResolvedValue(mockExistingGrade);
      mockPrismaService.grade.update.mockResolvedValue({
        ...mockExistingGrade,
        score: 80,
      });
      mockPrismaService.gradeAuditLog.create.mockResolvedValue({});
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.amendGrade(
        'grade-1',
        { score: 80, reason: 'Correction' },
        'lecturer-1',
      );

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'lecturer-1',
          action: 'GRADE_AMENDMENT',
          resource: 'Grade',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: expect.stringContaining('grade-1'),
        },
      });
    });
  });

  describe('getGradesForStudent', () => {
    it('should return only PUBLISHED grades for a student', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: 'student-1',
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { code: 'CSC101', title: 'Intro to CS', creditUnits: 3 },
          semester: { name: 'First Semester' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getGradesForStudent('student-1');

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith({
        where: {
          studentId: 'student-1',
          status: GradeStatus.PUBLISHED,
        },
        include: {
          course: {
            select: { code: true, title: true, creditUnits: true },
          },
          semester: {
            select: { name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockGrades);
    });

    it('should never return DRAFT grades to students', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.getGradesForStudent('student-1');

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: GradeStatus.PUBLISHED,
          }),
        }),
      );
      expect(result).toEqual([]);
    });

    it('should never return PENDING_APPROVAL grades to students', async () => {
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      await service.getGradesForStudent('student-1');

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: GradeStatus.PUBLISHED,
          }),
        }),
      );
      // Verify PENDING_APPROVAL is never used
      const calls = mockPrismaService.grade.findMany.mock.calls;

      const whereClause = (calls[0] as [{ where: { status: GradeStatus } }])[0]
        .where;
      expect(whereClause.status).not.toBe(GradeStatus.PENDING_APPROVAL);
    });
  });

  describe('getGradesForCourse', () => {
    it('should return all grades for a course/semester (for lecturers/exam officers)', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          studentId: 'student-1',
          score: 75,
          status: GradeStatus.DRAFT,
          student: { matriculationNo: 'MAT/2023/001', name: 'John Doe' },
        },
      ];

      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getGradesForCourse('course-1', 'semester-1');

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith({
        where: {
          courseId: 'course-1',
          semesterId: 'semester-1',
        },
        include: {
          student: {
            select: { matriculationNo: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual(mockGrades);
    });
  });

  describe('getGradeAuditLog', () => {
    it('should return audit logs for a specific grade', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          gradeId: 'grade-1',
          userId: 'lecturer-1',
          oldScore: null,
          newScore: 75,
          reason: 'Initial grade submission',
          timestamp: new Date(),
          user: { name: 'Dr. Smith', email: 'smith@ctms.edu' },
        },
      ];

      mockPrismaService.gradeAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getGradeAuditLog('grade-1');

      expect(mockPrismaService.gradeAuditLog.findMany).toHaveBeenCalledWith({
        where: { gradeId: 'grade-1' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { timestamp: 'desc' },
      });
      expect(result).toEqual(mockLogs);
    });
  });
});
