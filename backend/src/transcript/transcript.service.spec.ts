import { Test, TestingModule } from '@nestjs/testing';
import { TranscriptService } from './transcript.service';
import { PrismaService } from '../prisma/prisma.service';
import { GradeStatus } from '@prisma/client';

const mockPrismaService = {
  student: {
    findUnique: jest.fn(),
  },
  grade: {
    findMany: jest.fn(),
  },
  academicSession: {
    findMany: jest.fn(),
  },
};

describe('TranscriptService', () => {
  let service: TranscriptService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TranscriptService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<TranscriptService>(TranscriptService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStudentTranscript', () => {
    const mockStudentId = 'student-1';

    const mockStudent = {
      id: mockStudentId,
      matriculationNo: 'MAT/2023/001',
      name: 'John Doe',
      departmentId: 'dept-1',
      level: 100,
    };

    const mockGrades = [
      {
        id: 'grade-1',
        studentId: mockStudentId,
        courseId: 'course-1',
        semesterId: 'semester-1',
        score: 75,
        gradeLetter: 'A',
        gradePoints: 5.0,
        status: GradeStatus.PUBLISHED,
        course: {
          id: 'course-1',
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 3,
        },
        semester: {
          id: 'semester-1',
          name: 'First Semester',
          academicSession: {
            id: 'session-1',
            name: '2023/2024',
          },
        },
      },
      {
        id: 'grade-2',
        studentId: mockStudentId,
        courseId: 'course-2',
        semesterId: 'semester-1',
        score: 65,
        gradeLetter: 'B',
        gradePoints: 4.0,
        status: GradeStatus.PUBLISHED,
        course: {
          id: 'course-2',
          code: 'MTH101',
          title: 'Elementary Mathematics I',
          creditUnits: 4,
        },
        semester: {
          id: 'semester-1',
          name: 'First Semester',
          academicSession: {
            id: 'session-1',
            name: '2023/2024',
          },
        },
      },
      {
        id: 'grade-3',
        studentId: mockStudentId,
        courseId: 'course-3',
        semesterId: 'semester-2',
        score: 55,
        gradeLetter: 'C',
        gradePoints: 3.0,
        status: GradeStatus.PUBLISHED,
        course: {
          id: 'course-3',
          code: 'CSC201',
          title: 'Data Structures',
          creditUnits: 3,
        },
        semester: {
          id: 'semester-2',
          name: 'Second Semester',
          academicSession: {
            id: 'session-1',
            name: '2023/2024',
          },
        },
      },
    ];

    it('should return student transcript grouped by academic session and semester', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      expect(result).toBeDefined();
      expect(result.student).toEqual({
        id: mockStudentId,
        matriculationNo: 'MAT/2023/001',
        name: 'John Doe',
        departmentId: 'dept-1',
        level: 100,
      });
      expect(result.academicSessions).toHaveLength(1);
      expect(result.academicSessions[0].name).toBe('2023/2024');
      expect(result.academicSessions[0].semesters).toHaveLength(2);
    });

    it('should include semester GPA in each semester', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      const firstSemester = result.academicSessions[0].semesters.find(
        (s) => s.name === 'First Semester',
      );

      expect(firstSemester).toBeDefined();
      expect(firstSemester!.gpa).toBeDefined();
      expect(firstSemester!.totalCreditUnits).toBe(7); // 3 + 4
    });

    it('should include cumulative CGPA in transcript', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      expect(result.cgpa).toBeDefined();
      expect(typeof result.cgpa).toBe('number');
    });

    it('should return empty academic sessions when student has no grades', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue([]);

      const result = await service.getStudentTranscript(mockStudentId);

      expect(result.academicSessions).toEqual([]);
      expect(result.cgpa).toBeNull();
    });

    it('should throw NotFoundException when student does not exist', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(
        service.getStudentTranscript('non-existent-student'),
      ).rejects.toThrow('Student not found');
    });

    it('should only include PUBLISHED grades', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      await service.getStudentTranscript(mockStudentId);

      expect(mockPrismaService.grade.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          where: expect.objectContaining({
            status: GradeStatus.PUBLISHED,
          }),
        }),
      );
    });

    it('should handle multiple academic sessions', async () => {
      const multiSessionGrades = [
        ...mockGrades,
        {
          id: 'grade-4',
          studentId: mockStudentId,
          courseId: 'course-4',
          semesterId: 'semester-3',
          score: 70,
          gradeLetter: 'A',
          gradePoints: 5.0,
          status: GradeStatus.PUBLISHED,
          course: {
            id: 'course-4',
            code: 'CSC301',
            title: 'Operating Systems',
            creditUnits: 3,
          },
          semester: {
            id: 'semester-3',
            name: 'First Semester',
            academicSession: {
              id: 'session-2',
              name: '2024/2025',
            },
          },
        },
      ];

      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(multiSessionGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      expect(result.academicSessions).toHaveLength(2);
      expect(result.academicSessions.map((s) => s.name)).toContain('2023/2024');
      expect(result.academicSessions.map((s) => s.name)).toContain('2024/2025');
    });

    it('should calculate correct GPA for semester with mixed grades', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      const firstSemester = result.academicSessions[0].semesters.find(
        (s) => s.name === 'First Semester',
      );

      // GPA = (5.0*3 + 4.0*4) / (3+4) = (15+16)/7 = 31/7 = 4.43
      expect(firstSemester!.gpa).toBeCloseTo(4.43, 2);
    });

    it('should order academic sessions by name', async () => {
      const unorderedGrades = [
        {
          ...mockGrades[0],
          semester: {
            id: 'semester-3',
            name: 'First Semester',
            academicSession: {
              id: 'session-2',
              name: '2024/2025',
            },
          },
        },
        {
          ...mockGrades[1],
          semester: {
            id: 'semester-1',
            name: 'First Semester',
            academicSession: {
              id: 'session-1',
              name: '2023/2024',
            },
          },
        },
      ];

      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(unorderedGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      expect(result.academicSessions[0].name).toBe('2023/2024');
      expect(result.academicSessions[1].name).toBe('2024/2025');
    });

    it('should include course details in each grade entry', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);
      mockPrismaService.grade.findMany.mockResolvedValue(mockGrades);

      const result = await service.getStudentTranscript(mockStudentId);

      const firstSemester = result.academicSessions[0].semesters.find(
        (s) => s.name === 'First Semester',
      );

      expect(firstSemester!.courses).toHaveLength(2);
      expect(firstSemester!.courses[0]).toHaveProperty('courseCode');
      expect(firstSemester!.courses[0]).toHaveProperty('courseTitle');
      expect(firstSemester!.courses[0]).toHaveProperty('creditUnits');
      expect(firstSemester!.courses[0]).toHaveProperty('score');
      expect(firstSemester!.courses[0]).toHaveProperty('gradeLetter');
      expect(firstSemester!.courses[0]).toHaveProperty('gradePoints');
    });
  });
});
