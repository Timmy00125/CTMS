import { Test, TestingModule } from '@nestjs/testing';
import { GpaController } from './gpa.controller';
import { GpaService } from './gpa.service';
import { BadRequestException } from '@nestjs/common';
import { Role } from '@prisma/client';

const mockGpaService = {
  calculateSemesterGpa: jest.fn(),
  calculateCgpa: jest.fn(),
  calculateSessionCgpa: jest.fn(),
  calculateBatchGpa: jest.fn(),
};

describe('GpaController', () => {
  let controller: GpaController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GpaController],
      providers: [{ provide: GpaService, useValue: mockGpaService }],
    }).compile();

    controller = module.get<GpaController>(GpaController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /gpa/calculate/semester', () => {
    const mockDto = {
      semesterId: 'semester-1',
      studentIds: ['student-1', 'student-2'],
    };

    it('should calculate GPA for multiple students in semester', async () => {
      const mockResult = new Map([
        [
          'student-1',
          { gpa: 5.0, totalCreditUnits: 3, totalGradePoints: 15.0 },
        ],
        [
          'student-2',
          { gpa: 4.0, totalCreditUnits: 3, totalGradePoints: 12.0 },
        ],
      ]);

      mockGpaService.calculateBatchGpa.mockResolvedValue(mockResult);

      const result = await controller.calculateSemesterGpa(mockDto, {
        user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
      });

      expect(result).toEqual({
        semesterId: 'semester-1',
        results: [
          {
            studentId: 'student-1',
            gpa: 5.0,
            totalCreditUnits: 3,
            totalGradePoints: 15.0,
          },
          {
            studentId: 'student-2',
            gpa: 4.0,
            totalCreditUnits: 3,
            totalGradePoints: 12.0,
          },
        ],
      });
      expect(mockGpaService.calculateBatchGpa).toHaveBeenCalledWith(
        ['student-1', 'student-2'],
        'semester-1',
      );
    });

    it('should handle empty student list', async () => {
      const mockResult = new Map();
      mockGpaService.calculateBatchGpa.mockResolvedValue(mockResult);

      const result = await controller.calculateSemesterGpa(
        { semesterId: 'semester-1', studentIds: [] },
        {
          user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
        },
      );

      expect(result.results).toEqual([]);
    });

    it('should reject if semesterId is missing', async () => {
      await expect(
        controller.calculateSemesterGpa(
          { semesterId: '', studentIds: ['student-1'] },
          {
            user: {
              sub: 'exam-officer-1',
              roles: [Role.ExamOfficer] as Role[],
            },
          },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('POST /gpa/calculate/student/:studentId', () => {
    it('should calculate CGPA for specific student', async () => {
      const mockResult = {
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      };

      mockGpaService.calculateCgpa.mockResolvedValue(mockResult);

      const result = await controller.calculateStudentCgpa('student-1', {
        user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
      });

      expect(result).toEqual({
        studentId: 'student-1',
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      });
      expect(mockGpaService.calculateCgpa).toHaveBeenCalledWith('student-1');
    });

    it('should handle student with no grades', async () => {
      const mockResult = {
        cgpa: null,
        totalCreditUnits: 0,
        totalGradePoints: 0,
      };

      mockGpaService.calculateCgpa.mockResolvedValue(mockResult);

      const result = await controller.calculateStudentCgpa('student-1', {
        user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
      });

      expect(result.cgpa).toBeNull();
    });
  });

  describe('GET /gpa/student/:studentId', () => {
    it('should return GPA/CGPA for student', async () => {
      const mockGpaResult = {
        gpa: 5.0,
        totalCreditUnits: 3,
        totalGradePoints: 15.0,
      };
      const mockCgpaResult = {
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      };

      mockGpaService.calculateSemesterGpa.mockResolvedValue(mockGpaResult);
      mockGpaService.calculateCgpa.mockResolvedValue(mockCgpaResult);

      const result = await controller.getStudentGpa('student-1', 'semester-1', {
        user: { sub: 'student-1', roles: [Role.Student] as Role[] },
      });

      expect(result).toEqual({
        studentId: 'student-1',
        semesterId: 'semester-1',
        gpa: 5.0,
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      });
    });

    it('should allow student to view own GPA', async () => {
      mockGpaService.calculateSemesterGpa.mockResolvedValue({
        gpa: 5.0,
        totalCreditUnits: 3,
        totalGradePoints: 15.0,
      });
      mockGpaService.calculateCgpa.mockResolvedValue({
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      });

      const result = await controller.getStudentGpa('student-1', 'semester-1', {
        user: { sub: 'student-1', roles: [Role.Student] as Role[] },
      });

      expect(result).toBeDefined();
    });
  });

  describe('GET /gpa/semester/:semesterId/students', () => {
    it('should return GPA report for all students in semester', async () => {
      const mockResult = new Map([
        [
          'student-1',
          { gpa: 5.0, totalCreditUnits: 3, totalGradePoints: 15.0 },
        ],
        [
          'student-2',
          { gpa: 4.0, totalCreditUnits: 3, totalGradePoints: 12.0 },
        ],
      ]);

      mockGpaService.calculateBatchGpa.mockResolvedValue(mockResult);

      const result = await controller.getSemesterGpaReport('semester-1', {
        user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
      });

      expect(result).toEqual({
        semesterId: 'semester-1',
        students: [
          {
            studentId: 'student-1',
            gpa: 5.0,
            totalCreditUnits: 3,
            totalGradePoints: 15.0,
          },
          {
            studentId: 'student-2',
            gpa: 4.0,
            totalCreditUnits: 3,
            totalGradePoints: 12.0,
          },
        ],
      });
    });

    it('should handle semester with no students', async () => {
      const mockResult = new Map();
      mockGpaService.calculateBatchGpa.mockResolvedValue(mockResult);

      const result = await controller.getSemesterGpaReport('semester-1', {
        user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
      });

      expect(result.students).toEqual([]);
    });
  });

  describe('Authorization', () => {
    it('should allow ExamOfficer to calculate semester GPA', async () => {
      mockGpaService.calculateBatchGpa.mockResolvedValue(new Map());

      await expect(
        controller.calculateSemesterGpa(
          { semesterId: 'semester-1', studentIds: [] },
          {
            user: {
              sub: 'exam-officer-1',
              roles: [Role.ExamOfficer] as Role[],
            },
          },
        ),
      ).resolves.toBeDefined();
    });

    it('should allow Admin to calculate semester GPA', async () => {
      mockGpaService.calculateBatchGpa.mockResolvedValue(new Map());

      await expect(
        controller.calculateSemesterGpa(
          { semesterId: 'semester-1', studentIds: [] },
          { user: { sub: 'admin-1', roles: [Role.Admin] as Role[] } },
        ),
      ).resolves.toBeDefined();
    });

    it('should allow ExamOfficer to calculate student CGPA', async () => {
      mockGpaService.calculateCgpa.mockResolvedValue({
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      });

      await expect(
        controller.calculateStudentCgpa('student-1', {
          user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] as Role[] },
        }),
      ).resolves.toBeDefined();
    });

    it('should allow Student to view own GPA', async () => {
      mockGpaService.calculateSemesterGpa.mockResolvedValue({
        gpa: 5.0,
        totalCreditUnits: 3,
        totalGradePoints: 15.0,
      });
      mockGpaService.calculateCgpa.mockResolvedValue({
        cgpa: 4.5,
        totalCreditUnits: 6,
        totalGradePoints: 27.0,
      });

      await expect(
        controller.getStudentGpa('student-1', 'semester-1', {
          user: { sub: 'student-1', roles: [Role.Student] as Role[] },
        }),
      ).resolves.toBeDefined();
    });
  });
});
