import { Test, TestingModule } from '@nestjs/testing';
import {
  AuditLogService,
  AuditAction,
  AuditResource,
} from './audit-log.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  systemAuditLog: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
};

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create an audit log entry', async () => {
      const mockLog = {
        id: 'log-1',
        userId: 'user-1',
        action: 'BULK_UPLOAD',
        resource: 'Student',
        details: 'Test details',
        timestamp: new Date(),
      };

      mockPrismaService.systemAuditLog.create.mockResolvedValue(mockLog);

      const result = await service.log(
        'user-1',
        AuditAction.BULK_UPLOAD,
        AuditResource.Student,
        'Test details',
      );

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'user-1',
          action: 'BULK_UPLOAD',
          resource: 'Student',
          details: 'Test details',
        },
      });
      expect(result).toEqual(mockLog);
    });
  });

  describe('logBulkUpload', () => {
    it('should log bulk upload for students', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logBulkUpload('admin-id', AuditResource.Student, 10);

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-id',
          action: 'BULK_UPLOAD',
          resource: 'Student',
          details: 'Bulk uploaded 10 students',
        },
      });
    });

    it('should log bulk upload for courses', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logBulkUpload('admin-id', AuditResource.Course, 5);

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-id',
          action: 'BULK_UPLOAD',
          resource: 'Course',
          details: 'Bulk uploaded 5 courses',
        },
      });
    });
  });

  describe('logRoleChange', () => {
    it('should log role change with old and new roles', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logRoleChange(
        'admin-id',
        'target-user-id',
        ['Lecturer'],
        ['Lecturer', 'ExamOfficer'],
      );

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-id',
          action: 'ROLE_CHANGE',
          resource: 'User',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: expect.stringContaining('target-user-id'),
        },
      });
    });
  });

  describe('logCourseAssignment', () => {
    it('should log course assignment', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logCourseAssignment('admin-id', 'course-1', 'lecturer-1');

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'admin-id',
          action: 'COURSE_ASSIGNMENT',
          resource: 'Course',
          details: 'Assigned lecturer lecturer-1 to course course-1',
        },
      });
    });
  });

  describe('logGradeSubmission', () => {
    it('should log grade submission', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logGradeSubmission(
        'lecturer-1',
        'grade-1',
        'student-1',
        'course-1',
      );

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'lecturer-1',
          action: 'GRADE_SUBMISSION',
          resource: 'Grade',
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          details: expect.stringContaining('grade-1'),
        },
      });
    });
  });

  describe('logGradePublication', () => {
    it('should log grade publication', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logGradePublication(
        'exam-officer-1',
        'course-1',
        'semester-1',
        10,
      );

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'exam-officer-1',
          action: 'GRADE_PUBLICATION',
          resource: 'Grade',
          details:
            'Published 10 grades for course course-1, semester semester-1',
        },
      });
    });
  });

  describe('logGradeAmendment', () => {
    it('should log grade amendment', async () => {
      mockPrismaService.systemAuditLog.create.mockResolvedValue({});

      await service.logGradeAmendment('lecturer-1', 'grade-1', 75, 80);

      expect(mockPrismaService.systemAuditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 'lecturer-1',
          action: 'GRADE_AMENDMENT',
          resource: 'Grade',
          details: 'Amended grade grade-1: score 75 -> 80',
        },
      });
    });
  });

  describe('getLogsForUser', () => {
    it('should return logs for a specific user', async () => {
      const mockLogs = [
        { id: 'log-1', userId: 'user-1', action: 'BULK_UPLOAD' },
        { id: 'log-2', userId: 'user-1', action: 'ROLE_CHANGE' },
      ];

      mockPrismaService.systemAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getLogsForUser('user-1');

      expect(mockPrismaService.systemAuditLog.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
        orderBy: { timestamp: 'desc' },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getLogsForResource', () => {
    it('should return logs for a specific resource type', async () => {
      const mockLogs = [
        { id: 'log-1', resource: 'Student', action: 'BULK_UPLOAD' },
      ];

      mockPrismaService.systemAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getLogsForResource(AuditResource.Student);

      expect(mockPrismaService.systemAuditLog.findMany).toHaveBeenCalledWith({
        where: { resource: 'Student' },
        orderBy: { timestamp: 'desc' },
      });
      expect(result).toEqual(mockLogs);
    });
  });

  describe('getRecentLogs', () => {
    it('should return recent logs with default limit', async () => {
      const mockLogs = Array(50).fill({ id: 'log-1' });

      mockPrismaService.systemAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecentLogs();

      expect(mockPrismaService.systemAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 50,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(result).toEqual(mockLogs);
    });

    it('should return recent logs with custom limit', async () => {
      const mockLogs = Array(10).fill({ id: 'log-1' });

      mockPrismaService.systemAuditLog.findMany.mockResolvedValue(mockLogs);

      const result = await service.getRecentLogs(10);

      expect(mockPrismaService.systemAuditLog.findMany).toHaveBeenCalledWith({
        orderBy: { timestamp: 'desc' },
        take: 10,
        include: {
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      });
      expect(result).toEqual(mockLogs);
    });
  });
});
