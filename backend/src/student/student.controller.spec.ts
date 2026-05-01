import { Test, TestingModule } from '@nestjs/testing';
import { StudentController } from './student.controller';
import { StudentService } from './student.service';
import { NotFoundException } from '@nestjs/common';

const mockStudentService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
};

describe('StudentController', () => {
  let controller: StudentController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentController],
      providers: [
        { provide: StudentService, useValue: mockStudentService },
      ],
    }).compile();

    controller = module.get<StudentController>(StudentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /students', () => {
    it('should return an array of students', async () => {
      const mockStudents = [
        {
          id: '1',
          matriculationNo: '2023/001',
          name: 'John Doe',
          departmentId: 'CSC',
          level: 100,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      mockStudentService.findAll.mockResolvedValue(mockStudents);

      const result = await controller.findAll();

      expect(result).toEqual(mockStudents);
      expect(mockStudentService.findAll).toHaveBeenCalled();
    });
  });

  describe('GET /students/:id', () => {
    it('should return a single student', async () => {
      const mockStudent = {
        id: '1',
        matriculationNo: '2023/001',
        name: 'John Doe',
        departmentId: 'CSC',
        level: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockStudentService.findOne.mockResolvedValue(mockStudent);

      const result = await controller.findOne('1');

      expect(result).toEqual(mockStudent);
      expect(mockStudentService.findOne).toHaveBeenCalledWith('1');
    });

    it('should propagate NotFoundException', async () => {
      mockStudentService.findOne.mockRejectedValue(
        new NotFoundException('Student not found'),
      );

      await expect(controller.findOne('non-existent')).rejects.toThrow(
        'Student not found',
      );
    });
  });
});
