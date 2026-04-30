import { Test, TestingModule } from '@nestjs/testing';
import { ValidationService } from './validation.service';

describe('ValidationService', () => {
  let service: ValidationService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidationService],
    }).compile();

    service = module.get<ValidationService>(ValidationService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateStudentRows', () => {
    it('should validate valid student rows', async () => {
      const rows = [
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

      const result = await service.validateStudentRows(rows);

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.valid[0].matriculationNo).toBe('MAT/2023/001');
      expect(result.valid[0].name).toBe('John Doe');
    });

    it('should return errors for invalid student rows', async () => {
      const rows = [
        {
          matriculationNo: '',
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 200,
        },
      ];

      const result = await service.validateStudentRows(rows);

      expect(result.valid).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].row).toBe(1);
    });

    it('should reject invalid matriculation number format', async () => {
      const rows = [
        {
          matriculationNo: 'MAT@2023#001',
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 200,
        },
      ];

      const result = await service.validateStudentRows(rows);

      expect(result.valid).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].field).toBe('matches');
    });

    it('should reject invalid level values', async () => {
      const rows = [
        {
          matriculationNo: 'MAT/2023/001',
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 50,
        },
      ];

      const result = await service.validateStudentRows(rows);

      expect(result.valid).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle partial success with mixed valid and invalid rows', async () => {
      const rows = [
        {
          matriculationNo: 'MAT/2023/001',
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 200,
        },
        {
          matriculationNo: '',
          name: '',
          departmentId: '',
          level: 0,
        },
        {
          matriculationNo: 'MAT/2023/003',
          name: 'Bob Wilson',
          departmentId: 'dept-2',
          level: 400,
        },
      ];

      const result = await service.validateStudentRows(rows);

      expect(result.valid).toHaveLength(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].row).toBe(2);
    });

    it('should reject duplicate matriculation numbers within batch', async () => {
      const rows = [
        {
          matriculationNo: 'MAT/2023/001',
          name: 'John Doe',
          departmentId: 'dept-1',
          level: 200,
        },
        {
          matriculationNo: 'MAT/2023/001',
          name: 'Jane Smith',
          departmentId: 'dept-1',
          level: 300,
        },
      ];

      const result = await service.validateStudentRows(rows);

      expect(result.valid).toHaveLength(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].row).toBe(2);
      expect(result.errors[0].message).toContain('Duplicate');
    });
  });

  describe('validateCourseRows', () => {
    it('should validate valid course rows', async () => {
      const rows = [
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

      const result = await service.validateCourseRows(rows);

      expect(result.valid).toHaveLength(2);
      expect(result.errors).toHaveLength(0);
      expect(result.valid[0].code).toBe('CSC101');
    });

    it('should return errors for invalid course rows', async () => {
      const rows = [
        {
          code: '',
          title: 'Introduction to Computer Science',
          creditUnits: 3,
          departmentId: 'dept-1',
        },
      ];

      const result = await service.validateCourseRows(rows);

      expect(result.valid).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid credit units', async () => {
      const rows = [
        {
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 0,
          departmentId: 'dept-1',
        },
      ];

      const result = await service.validateCourseRows(rows);

      expect(result.valid).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject credit units above maximum', async () => {
      const rows = [
        {
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 10,
          departmentId: 'dept-1',
        },
      ];

      const result = await service.validateCourseRows(rows);

      expect(result.valid).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle partial success with mixed valid and invalid rows', async () => {
      const rows = [
        {
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 3,
          departmentId: 'dept-1',
        },
        {
          code: '',
          title: '',
          creditUnits: 0,
          departmentId: '',
        },
        {
          code: 'MTH201',
          title: 'Mathematical Methods',
          creditUnits: 4,
          departmentId: 'dept-2',
        },
      ];

      const result = await service.validateCourseRows(rows);

      expect(result.valid).toHaveLength(2);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0].row).toBe(2);
    });

    it('should accept optional lecturerId', async () => {
      const rows = [
        {
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 3,
          departmentId: 'dept-1',
          lecturerId: 'lecturer-1',
        },
      ];

      const result = await service.validateCourseRows(rows);

      expect(result.valid).toHaveLength(1);
      expect(result.valid[0].lecturerId).toBe('lecturer-1');
    });
  });
});
