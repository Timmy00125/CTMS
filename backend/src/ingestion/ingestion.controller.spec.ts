import { Test, TestingModule } from '@nestjs/testing';
import { IngestionController } from './ingestion.controller';
import { IngestionService } from './ingestion.service';
import { ValidationService } from './validation.service';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

const mockIngestionService = {
  bulkUploadStudents: jest.fn(),
  bulkUploadCourses: jest.fn(),
};

const mockPrismaService = {
  student: { create: jest.fn() },
  course: { create: jest.fn() },
  systemAuditLog: { create: jest.fn() },
};

describe('IngestionController', () => {
  let controller: IngestionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [IngestionController],
      providers: [
        { provide: IngestionService, useValue: mockIngestionService },
        { provide: ValidationService, useValue: {} },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<IngestionController>(IngestionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('uploadStudents', () => {
    it('should call ingestionService.bulkUploadStudents', async () => {
      const mockResult = { created: 2, errors: [] };
      mockIngestionService.bulkUploadStudents.mockResolvedValue(mockResult);

      const mockRequest = {
        user: { sub: 'admin-id', roles: [Role.Admin], departmentId: 'dept-1' },
      };

      const rows = [
        {
          matriculationNo: 'MAT/2023/001',
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 200,
        },
      ];

      const result = await controller.uploadStudents(rows, mockRequest);

      expect(mockIngestionService.bulkUploadStudents).toHaveBeenCalledWith(
        rows,
        'admin-id',
      );
      expect(result).toEqual(mockResult);
    });
  });

  describe('uploadCourses', () => {
    it('should call ingestionService.bulkUploadCourses', async () => {
      const mockResult = { created: 2, errors: [] };
      mockIngestionService.bulkUploadCourses.mockResolvedValue(mockResult);

      const mockRequest = {
        user: { sub: 'admin-id', roles: [Role.Admin], departmentId: 'dept-1' },
      };

      const rows = [
        {
          code: 'CSC101',
          title: 'Intro to CS',
          creditUnits: 3,
          departmentId: 'dept-1',
        },
      ];

      const result = await controller.uploadCourses(rows, mockRequest);

      expect(mockIngestionService.bulkUploadCourses).toHaveBeenCalledWith(
        rows,
        'admin-id',
      );
      expect(result).toEqual(mockResult);
    });
  });
});
