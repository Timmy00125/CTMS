import { Test, TestingModule } from '@nestjs/testing';
import { StudentService } from './student.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

const mockPrismaService = {
  student: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
  },
};

describe('StudentService', () => {
  let service: StudentService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<StudentService>(StudentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all students ordered by createdAt desc', async () => {
      const mockStudents = [{ id: '1', name: 'John' }];
      mockPrismaService.student.findMany.mockResolvedValue(mockStudents);

      const result = await service.findAll();

      expect(result).toEqual(mockStudents);
      expect(mockPrismaService.student.findMany).toHaveBeenCalledWith({
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return a student by id', async () => {
      const mockStudent = { id: '1', name: 'John' };
      mockPrismaService.student.findUnique.mockResolvedValue(mockStudent);

      const result = await service.findOne('1');

      expect(result).toEqual(mockStudent);
      expect(mockPrismaService.student.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should throw NotFoundException if student not found', async () => {
      mockPrismaService.student.findUnique.mockResolvedValue(null);

      await expect(service.findOne('1')).rejects.toThrow(NotFoundException);
    });
  });
});
