import { Test, TestingModule } from '@nestjs/testing';
import { CourseController } from './course.controller';
import { CourseService } from './course.service';

const mockCourseService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('CourseController', () => {
  let controller: CourseController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourseController],
      providers: [
        { provide: CourseService, useValue: mockCourseService },
      ],
    }).compile();

    controller = module.get<CourseController>(CourseController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /courses', () => {
    it('should return an array of courses', async () => {
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
      mockCourseService.findAll.mockResolvedValue(mockCourses);

      const result = await controller.findAll();

      expect(result).toEqual(mockCourses);
      expect(mockCourseService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /courses/:id', () => {
    it('should return a single course', async () => {
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
      mockCourseService.findOne.mockResolvedValue(mockCourse);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockCourse);
      expect(mockCourseService.findOne).toHaveBeenCalledWith('1');
    });

    it('should return null if course not found', async () => {
      mockCourseService.findOne.mockResolvedValue(null);

      const result = await controller.findOne('non-existent');

      expect(result).toBeNull();
    });
  });
});
