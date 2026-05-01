import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanupDatabase,
  createTestUser,
  loginAs,
  createStudent,
  createCourse,
  createTestApp,
} from './test-utils';
import { Role } from '@prisma/client';

describe('IngestionController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let lecturerAgent: request.SuperAgentTest;
  let examOfficerAgent: request.SuperAgentTest;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await cleanupDatabase(prisma);

    await createTestUser(prisma, {
      email: 'admin@ingestion.test',
      password: 'AdminPass123!',
      name: 'Admin User',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'lecturer@ingestion.test',
      password: 'LecturerPass123!',
      name: 'Lecturer User',
      roles: [Role.Lecturer],
    });

    await createTestUser(prisma, {
      email: 'examofficer@ingestion.test',
      password: 'ExamOfficerPass123!',
      name: 'Exam Officer',
      roles: [Role.ExamOfficer],
    });

    adminAgent = await loginAs(app, 'admin@ingestion.test', 'AdminPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@ingestion.test', 'LecturerPass123!');
    examOfficerAgent = await loginAs(app, 'examofficer@ingestion.test', 'ExamOfficerPass123!');
  });

  describe('POST /ingestion/students', () => {
    it('should bulk upload students as admin', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/001', name: 'John Doe', departmentId: 'CS', level: 100 },
        { matriculationNo: 'MAT/2023/002', name: 'Jane Smith', departmentId: 'CS', level: 100 },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(201);

      expect(response.body.created).toBe(2);
      expect(response.body.errors).toHaveLength(0);

      const dbStudents = await prisma.student.findMany();
      expect(dbStudents).toHaveLength(2);
    });

    it('should reject empty array', async () => {
      const response = await adminAgent.post('/ingestion/students').send([]).expect(400);

      expect(response.body.message).toContain('non-empty array');
    });

    it('should reject non-array body', async () => {
      const response = await adminAgent
        .post('/ingestion/students')
        .send({ matriculationNo: 'TEST' })
        .expect(400);

      expect(response.body.message).toContain('non-empty array');
    });

    it('should return validation errors for invalid student data', async () => {
      const students = [
        { matriculationNo: '', name: 'Invalid', departmentId: 'CS', level: 100 },
        { matriculationNo: 'MAT/2023/003', name: 'Valid', departmentId: 'CS', level: 100 },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(201);

      expect(response.body.created).toBe(1);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should detect duplicate matriculation numbers in same batch', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/004', name: 'First', departmentId: 'CS', level: 100 },
        { matriculationNo: 'MAT/2023/004', name: 'Duplicate', departmentId: 'CS', level: 100 },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(201);

      expect(response.body.created).toBe(1);
      expect(response.body.errors.some((e: any) => e.message.includes('Duplicate'))).toBe(true);
    });

    it('should handle duplicate matriculation number from database', async () => {
      await createStudent(prisma, {
        matriculationNo: 'MAT/2023/005',
        name: 'Existing',
        departmentId: 'CS',
        level: 100,
      });

      const students = [
        { matriculationNo: 'MAT/2023/005', name: 'Duplicate', departmentId: 'CS', level: 100 },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(201);

      expect(response.body.created).toBe(0);
      expect(response.body.errors.some((e: any) => e.field === 'matriculationNo')).toBe(true);
    });

    it('should detect SQL injection attempts', async () => {
      const students = [
        {
          matriculationNo: 'MAT/2023/006',
          name: "Robert'; DROP TABLE students; --",
          departmentId: 'CS',
          level: 100,
        },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(400);

      expect(response.body.message).toContain('SQL injection');
    });

    it('should detect XSS attempts', async () => {
      const students = [
        {
          matriculationNo: 'MAT/2023/007',
          name: '<script>alert("xss")</script>',
          departmentId: 'CS',
          level: 100,
        },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(400);

      expect(response.body.message).toContain('XSS');
    });

    it('should reject unauthorized access by lecturer', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/008', name: 'Test', departmentId: 'CS', level: 100 },
      ];

      await lecturerAgent.post('/ingestion/students').send(students).expect(403);
    });

    it('should reject unauthorized access by exam officer', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/009', name: 'Test', departmentId: 'CS', level: 100 },
      ];

      await examOfficerAgent.post('/ingestion/students').send(students).expect(403);
    });

    it('should reject unauthenticated access', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/010', name: 'Test', departmentId: 'CS', level: 100 },
      ];

      await request(app.getHttpServer())
        .post('/ingestion/students')
        .send(students)
        .expect(401);
    });

    it('should create system audit log on successful bulk upload', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/011', name: 'Audit Test', departmentId: 'CS', level: 100 },
      ];

      await adminAgent.post('/ingestion/students').send(students).expect(201);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'BULK_UPLOAD', resource: 'Student' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should sanitize valid HTML-like names that are not XSS', async () => {
      const students = [
        { matriculationNo: 'MAT/2023/012', name: 'O\'Brien', departmentId: 'CS', level: 100 },
      ];

      const response = await adminAgent.post('/ingestion/students').send(students).expect(201);

      expect(response.body.created).toBe(1);
    });
  });

  describe('POST /ingestion/courses', () => {
    it('should bulk upload courses as admin', async () => {
      const courses = [
        { code: 'CSC101', title: 'Intro to CS', creditUnits: 3, departmentId: 'CS' },
        { code: 'MTH101', title: 'Mathematics I', creditUnits: 4, departmentId: 'CS' },
      ];

      const response = await adminAgent.post('/ingestion/courses').send(courses).expect(201);

      expect(response.body.created).toBe(2);
      expect(response.body.errors).toHaveLength(0);

      const dbCourses = await prisma.course.findMany();
      expect(dbCourses).toHaveLength(2);
    });

    it('should reject empty array', async () => {
      const response = await adminAgent.post('/ingestion/courses').send([]).expect(400);

      expect(response.body.message).toContain('non-empty array');
    });

    it('should return validation errors for invalid course data', async () => {
      const courses = [
        { code: '', title: 'Invalid', creditUnits: 3, departmentId: 'CS' },
        { code: 'CSC102', title: 'Valid', creditUnits: 3, departmentId: 'CS' },
      ];

      const response = await adminAgent.post('/ingestion/courses').send(courses).expect(201);

      expect(response.body.created).toBe(1);
      expect(response.body.errors.length).toBeGreaterThan(0);
    });

    it('should reject credit units outside range 1-6', async () => {
      const courses = [
        { code: 'CSC103', title: 'Too Many Credits', creditUnits: 10, departmentId: 'CS' },
        { code: 'CSC104', title: 'Too Few Credits', creditUnits: 0, departmentId: 'CS' },
      ];

      const response = await adminAgent.post('/ingestion/courses').send(courses).expect(201);

      expect(response.body.created).toBe(0);
      expect(response.body.errors.length).toBe(2);
    });

    it('should handle duplicate course code from database', async () => {
      await createCourse(prisma, {
        code: 'CSC105',
        title: 'Existing',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const courses = [
        { code: 'CSC105', title: 'Duplicate', creditUnits: 3, departmentId: 'CS' },
      ];

      const response = await adminAgent.post('/ingestion/courses').send(courses).expect(201);

      expect(response.body.created).toBe(0);
      expect(response.body.errors.some((e: any) => e.field === 'code')).toBe(true);
    });

    it('should reject unauthorized access by lecturer', async () => {
      const courses = [
        { code: 'CSC106', title: 'Test', creditUnits: 3, departmentId: 'CS' },
      ];

      await lecturerAgent.post('/ingestion/courses').send(courses).expect(403);
    });

    it('should reject unauthorized access by exam officer', async () => {
      const courses = [
        { code: 'CSC107', title: 'Test', creditUnits: 3, departmentId: 'CS' },
      ];

      await examOfficerAgent.post('/ingestion/courses').send(courses).expect(403);
    });

    it('should create system audit log on successful bulk upload', async () => {
      const courses = [
        { code: 'CSC108', title: 'Audit Test', creditUnits: 3, departmentId: 'CS' },
      ];

      await adminAgent.post('/ingestion/courses').send(courses).expect(201);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'BULK_UPLOAD', resource: 'Course' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });
});
