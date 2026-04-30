import { Test, TestingModule } from '@nestjs/testing';
import { GradeController } from './grade.controller';
import { GradeService } from './grade.service';
import { BadRequestException } from '@nestjs/common';
import { GradeStatus, Role } from '@prisma/client';

const mockGradeService = {
  submitGrade: jest.fn(),
  bulkSubmitGrades: jest.fn(),
  publishGrades: jest.fn(),
  amendGrade: jest.fn(),
  getGradesForStudent: jest.fn(),
  getGradesForCourse: jest.fn(),
  getGradeAuditLog: jest.fn(),
};

describe('GradeController', () => {
  let controller: GradeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GradeController],
      providers: [{ provide: GradeService, useValue: mockGradeService }],
    }).compile();

    controller = module.get<GradeController>(GradeController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /grades (submitGrade)', () => {
    const mockDto = {
      studentId: 'student-1',
      courseId: 'course-1',
      semesterId: 'semester-1',
      score: 75,
    };

    it('should submit a single grade', async () => {
      const mockResult = {
        id: 'grade-1',
        ...mockDto,
        gradeLetter: 'A',
        gradePoints: 5.0,
        status: GradeStatus.DRAFT,
      };

      mockGradeService.submitGrade.mockResolvedValue(mockResult);

      const result = await controller.submitGrade(mockDto, {
        user: { sub: 'lecturer-1', roles: [Role.Lecturer] },
      });

      expect(result).toEqual(mockResult);
      expect(mockGradeService.submitGrade).toHaveBeenCalledWith(
        mockDto,
        'lecturer-1',
      );
    });
  });

  describe('POST /grades/bulk (bulkSubmit)', () => {
    const mockDto = {
      grades: [
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
      ],
    };

    it('should submit multiple grades', async () => {
      const mockResult = { created: 2, errors: [] };
      mockGradeService.bulkSubmitGrades.mockResolvedValue(mockResult);

      const result = await controller.bulkSubmit(mockDto, {
        user: { sub: 'lecturer-1', roles: [Role.Lecturer] },
      });

      expect(result).toEqual(mockResult);
      expect(mockGradeService.bulkSubmitGrades).toHaveBeenCalledWith(
        mockDto.grades,
        'lecturer-1',
      );
    });

    it('should reject empty array', async () => {
      await expect(
        controller.bulkSubmit(
          { grades: [] },
          { user: { sub: 'lecturer-1', roles: [Role.Lecturer] } },
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('PATCH /grades/publish (publishGrades)', () => {
    it('should publish grades for a course/semester', async () => {
      const mockResult = { updated: 5 };
      mockGradeService.publishGrades.mockResolvedValue(mockResult);

      const result = await controller.publishGrades(
        { courseId: 'course-1', semesterId: 'semester-1' },
        { user: { sub: 'exam-officer-1', roles: [Role.ExamOfficer] } },
      );

      expect(result).toEqual(mockResult);
      expect(mockGradeService.publishGrades).toHaveBeenCalledWith(
        'course-1',
        'semester-1',
        'exam-officer-1',
      );
    });
  });

  describe('PATCH /grades/:id/amend (amendGrade)', () => {
    it('should amend a grade', async () => {
      const mockResult = {
        id: 'grade-1',
        score: 80,
        gradeLetter: 'A',
        gradePoints: 5.0,
        status: GradeStatus.PUBLISHED,
      };
      mockGradeService.amendGrade.mockResolvedValue(mockResult);

      const result = await controller.amendGrade(
        'grade-1',
        { score: 80, reason: 'Score correction' },
        { user: { sub: 'lecturer-1', roles: [Role.Lecturer] } },
      );

      expect(result).toEqual(mockResult);
      expect(mockGradeService.amendGrade).toHaveBeenCalledWith(
        'grade-1',
        { score: 80, reason: 'Score correction' },
        'lecturer-1',
      );
    });
  });

  describe('GET /grades/student/:studentId (getStudentGrades)', () => {
    it('should return published grades for a student', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          score: 75,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: { code: 'CSC101', title: 'Intro to CS', creditUnits: 3 },
        },
      ];
      mockGradeService.getGradesForStudent.mockResolvedValue(mockGrades);

      const result = await controller.getStudentGrades('student-1');

      expect(result).toEqual(mockGrades);
      expect(mockGradeService.getGradesForStudent).toHaveBeenCalledWith(
        'student-1',
      );
    });
  });

  describe('GET /grades/course/:courseId/semester/:semesterId (getCourseGrades)', () => {
    it('should return all grades for a course/semester', async () => {
      const mockGrades = [
        {
          id: 'grade-1',
          score: 75,
          status: GradeStatus.DRAFT,
          student: { matriculationNo: 'MAT/2023/001', name: 'John Doe' },
        },
      ];
      mockGradeService.getGradesForCourse.mockResolvedValue(mockGrades);

      const result = await controller.getCourseGrades('course-1', 'semester-1');

      expect(result).toEqual(mockGrades);
    });
  });

  describe('GET /grades/:id/audit (getGradeAuditLog)', () => {
    it('should return audit log for a grade', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          gradeId: 'grade-1',
          oldScore: null,
          newScore: 75,
          reason: 'Initial grade submission',
        },
      ];
      mockGradeService.getGradeAuditLog.mockResolvedValue(mockLogs);

      const result = await controller.getGradeAuditLog('grade-1');

      expect(result).toEqual(mockLogs);
    });
  });
});
