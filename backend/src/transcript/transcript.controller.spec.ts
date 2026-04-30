import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptController } from './transcript.controller';
import { TranscriptService } from './transcript.service';
import { Role, GradeStatus } from '@prisma/client';

const mockTranscriptService = {
  getStudentTranscript: jest.fn(),
};

describe('TranscriptController', () => {
  let controller: TranscriptController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TranscriptController],
      providers: [
        { provide: TranscriptService, useValue: mockTranscriptService },
      ],
    }).compile();

    controller = module.get<TranscriptController>(TranscriptController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /transcript/:studentId', () => {
    const mockTranscript = {
      student: {
        id: 'student-1',
        matriculationNo: 'MAT/2023/001',
        name: 'John Doe',
        departmentId: 'dept-1',
        level: 100,
      },
      academicSessions: [
        {
          id: 'session-1',
          name: '2023/2024',
          semesters: [
            {
              id: 'semester-1',
              name: 'First Semester',
              gpa: 4.43,
              totalCreditUnits: 7,
              totalGradePoints: 31.0,
              courses: [
                {
                  gradeId: 'grade-1',
                  courseCode: 'CSC101',
                  courseTitle: 'Introduction to Computer Science',
                  creditUnits: 3,
                  score: 75,
                  gradeLetter: 'A',
                  gradePoints: 5.0,
                  status: GradeStatus.PUBLISHED,
                },
              ],
            },
          ],
        },
      ],
      cgpa: 4.43,
      totalCreditUnits: 7,
      totalGradePoints: 31.0,
    };

    it('should return student transcript', async () => {
      mockTranscriptService.getStudentTranscript.mockResolvedValue(
        mockTranscript,
      );

      const result = await controller.getStudentTranscript('student-1', {
        user: {
          sub: 'exam-officer-1',
          roles: [Role.ExamOfficer] as Role[],
        },
      });

      expect(result).toEqual(mockTranscript);
      expect(mockTranscriptService.getStudentTranscript).toHaveBeenCalledWith(
        'student-1',
      );
    });

    it('should allow ExamOfficer to view any student transcript', async () => {
      mockTranscriptService.getStudentTranscript.mockResolvedValue(
        mockTranscript,
      );

      await expect(
        controller.getStudentTranscript('student-1', {
          user: {
            sub: 'exam-officer-1',
            roles: [Role.ExamOfficer] as Role[],
          },
        }),
      ).resolves.toBeDefined();
    });

    it('should allow Admin to view any student transcript', async () => {
      mockTranscriptService.getStudentTranscript.mockResolvedValue(
        mockTranscript,
      );

      await expect(
        controller.getStudentTranscript('student-1', {
          user: { sub: 'admin-1', roles: [Role.Admin] as Role[] },
        }),
      ).resolves.toBeDefined();
    });

    it('should allow Lecturer to view student transcript', async () => {
      mockTranscriptService.getStudentTranscript.mockResolvedValue(
        mockTranscript,
      );

      await expect(
        controller.getStudentTranscript('student-1', {
          user: { sub: 'lecturer-1', roles: [Role.Lecturer] as Role[] },
        }),
      ).resolves.toBeDefined();
    });

    it('should propagate service errors', async () => {
      mockTranscriptService.getStudentTranscript.mockRejectedValue(
        new Error('Student not found'),
      );

      await expect(
        controller.getStudentTranscript('non-existent', {
          user: {
            sub: 'exam-officer-1',
            roles: [Role.ExamOfficer] as Role[],
          },
        }),
      ).rejects.toThrow('Student not found');
    });
  });
});
