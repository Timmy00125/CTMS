import { Test, TestingModule } from '@nestjs/testing';
import { IngestionService } from './ingestion.service';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationService } from './validation.service';
import { SanitizationService } from './sanitization.service';
import { BadRequestException } from '@nestjs/common';

const mockPrismaService = {
  student: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  course: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  systemAuditLog: {
    create: jest.fn(),
  },
};

const mockValidationService = {
  validateStudentRows: jest.fn(),
  validateCourseRows: jest.fn(),
};

const mockSanitizationService = {
  sanitizeArray: jest.fn(<T>(rows: T[]): T[] => rows),
  hasSqlInjection: jest.fn((): boolean => false),
  hasXssAttempt: jest.fn((): boolean => false),
};

describe('IngestionService', () => {
  let service: IngestionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IngestionService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ValidationService, useValue: mockValidationService },
        { provide: SanitizationService, useValue: mockSanitizationService },
      ],
    }).compile();

    service = module.get<IngestionService>(IngestionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bulkUploadStudents', () => {
    const validRows = [
      {
        matriculationNo: 'MAT/2023/001',
        name: 'John Doe',
        departmentId: 'dept-1',
        level: 200,
      },
      {
        matriculationNo: 'MAT/2023/002',
        name: 'Jane Smith',
        departmentId: 'dept-1',
        level: 300,
      },
    ];

    it('should successfully upload valid student rows', async () => {
      mockValidationService.validateStudentRows.mockResolvedValue({
        valid: validRows,
        errors: [],
      });

      mockPrismaService.student.create
        .mockResolvedValueOnce({ id: 's1', ...validRows[0] })
        .mockResolvedValueOnce({ id: 's2', ...validRows[1] });

      const result = await service.bulkUploadStudents(validRows, 'admin-id');

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockPrismaService.student.create).toHaveBeenCalledTimes(2);
    });

    it('should return validation errors for invalid rows', async () => {
      mockValidationService.validateStudentRows.mockResolvedValue({
        valid: [],
        errors: [
          { row: 1, field: 'matriculationNo', message: 'must not be empty' },
        ],
      });

      const result = await service.bulkUploadStudents([], 'admin-id');

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(mockPrismaService.student.create).not.toHaveBeenCalled();
    });

    it('should handle partial success - some rows fail DB insert', async () => {
      mockValidationService.validateStudentRows.mockResolvedValue({
        valid: validRows,
        errors: [],
      });

      mockPrismaService.student.create
        .mockResolvedValueOnce({ id: 's1', ...validRows[0] })
        .mockRejectedValueOnce({ code: 'P2002' });

      const result = await service.bulkUploadStudents(validRows, 'admin-id');

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
    });

    it('should log to SystemAuditLog on successful upload', async () => {
      mockValidationService.validateStudentRows.mockResolvedValue({
        valid: validRows,
        errors: [],
      });

      mockPrismaService.student.create
        .mockResolvedValueOnce({ id: 's1', ...validRows[0] })
        .mockResolvedValueOnce({ id: 's2', ...validRows[1] });

      await service.bulkUploadStudents(validRows, 'admin-id');

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-id',
          action: 'BULK_UPLOAD',
          resource: 'Student',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: expect.stringContaining('2'),
        },
      });
    });

    it('should reject SQL injection attempts', async () => {
      mockSanitizationService.hasSqlInjection.mockReturnValueOnce(true);

      const maliciousRows = [
        {
          matriculationNo: "'; DROP TABLE students--",
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 200,
        },
      ];

      await expect(
        service.bulkUploadStudents(maliciousRows, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject XSS attempts', async () => {
      mockSanitizationService.hasXssAttempt.mockReturnValueOnce(true);

      const maliciousRows = [
        {
          matriculationNo: 'MAT/2023/001',
          name: '<script>alert("xss")</script>',
          departmentId: 'dept-1',
          level: 200,
        },
      ];

      await expect(
        service.bulkUploadStudents(maliciousRows, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('bulkUploadCourses', () => {
    const validRows = [
      {
        code: 'CSC101',
        title: 'Introduction to Computer Science',
        creditUnits: 3,
        departmentId: 'dept-1',
      },
      {
        code: 'MTH201',
        title: 'Mathematical Methods',
        creditUnits: 4,
        departmentId: 'dept-2',
      },
    ];

    it('should successfully upload valid course rows', async () => {
      mockValidationService.validateCourseRows.mockResolvedValue({
        valid: validRows,
        errors: [],
      });

      mockPrismaService.course.create
        .mockResolvedValueOnce({ id: 'c1', ...validRows[0] })
        .mockResolvedValueOnce({ id: 'c2', ...validRows[1] });

      const result = await service.bulkUploadCourses(validRows, 'admin-id');

      expect(result.created).toBe(2);
      expect(result.errors).toHaveLength(0);
      expect(mockPrismaService.course.create).toHaveBeenCalledTimes(2);
    });

    it('should return validation errors for invalid rows', async () => {
      mockValidationService.validateCourseRows.mockResolvedValue({
        valid: [],
        errors: [{ row: 1, field: 'code', message: 'must not be empty' }],
      });

      const result = await service.bulkUploadCourses([], 'admin-id');

      expect(result.created).toBe(0);
      expect(result.errors).toHaveLength(1);
      expect(mockPrismaService.course.create).not.toHaveBeenCalled();
    });

    it('should handle partial success - some rows fail DB insert', async () => {
      mockValidationService.validateCourseRows.mockResolvedValue({
        valid: validRows,
        errors: [],
      });

      mockPrismaService.course.create
        .mockResolvedValueOnce({ id: 'c1', ...validRows[0] })
        .mockRejectedValueOnce({ code: 'P2002' });

      const result = await service.bulkUploadCourses(validRows, 'admin-id');

      expect(result.created).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
    });

    it('should log to SystemAuditLog on successful upload', async () => {
      mockValidationService.validateCourseRows.mockResolvedValue({
        valid: validRows,
        errors: [],
      });

      mockPrismaService.course.create
        .mockResolvedValueOnce({ id: 'c1', ...validRows[0] })
        .mockResolvedValueOnce({ id: 'c2', ...validRows[1] });

      await service.bulkUploadCourses(validRows, 'admin-id');

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-id',
          action: 'BULK_UPLOAD',
          resource: 'Course',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: expect.stringContaining('2'),
        },
      });
    });

    it('should reject SQL injection attempts', async () => {
      mockSanitizationService.hasSqlInjection.mockReturnValueOnce(true);

      const maliciousRows = [
        {
          code: "CSC101'; DROP TABLE courses--",
          title: 'Intro to CS',
          creditUnits: 3,
          departmentId: 'dept-1',
        },
      ];

      await expect(
        service.bulkUploadCourses(maliciousRows, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject XSS attempts', async () => {
      mockSanitizationService.hasXssAttempt.mockReturnValueOnce(true);

      const maliciousRows = [
        {
          code: 'CSC101',
          title: '<script>alert("xss")</script>',
          creditUnits: 3,
          departmentId: 'dept-1',
        },
      ];

      await expect(
        service.bulkUploadCourses(maliciousRows, 'admin-id'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
