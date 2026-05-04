import { Test, TestingModule } from '@nestjs/testing';
import { CourseService } from './course.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  course: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('CourseService', () => {
  let service: CourseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<CourseService>(CourseService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of courses with lecturer relation', async () => {
      const mockCourses = [
        {
          id: '1',
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 3,
          departmentId: 'dept-cs-001',
          lecturerId: 'lecturer-1',
          lecturer: { id: 'lecturer-1', name: 'Dr. Smith', email: 'smith@ctms.edu' },
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

      const result = await service.findAll();

      expect(result).toEqual(mockCourses);
      expect(mockPrismaService.course.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
        include: { lecturer: true },
      });
    });
  });

  describe('findOne', () => {
    it('should return a single course with lecturer relation', async () => {
      const mockCourse = {
        id: '1',
        code: 'CSC101',
        title: 'Introduction to Computer Science',
        creditUnits: 3,
        departmentId: 'dept-cs-001',
        lecturerId: 'lecturer-1',
        lecturer: { id: 'lecturer-1', name: 'Dr. Smith', email: 'smith@ctms.edu' },
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);

      const result = await service.findOne('1');

      expect(result).toEqual(mockCourse);
      expect(mockPrismaService.course.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { lecturer: true },
      });
    });

    it('should return null if course not found', async () => {
      mockPrismaService.course.findUnique.mockResolvedValue(null);

      const result = await service.findOne('non-existent');

      expect(result).toBeNull();
    });
  });
});
