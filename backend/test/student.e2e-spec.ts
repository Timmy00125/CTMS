import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import {
  cleanupDatabase,
  createTestUser,
  loginAs,
  createStudent,
  createTestApp,
} from './test-utils';
import { Role } from '@prisma/client';

describe('StudentController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let lecturerAgent: request.SuperAgentTest;

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
      email: 'admin@student.test',
      password: 'AdminPass123!',
      name: 'Admin User',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'lecturer@student.test',
      password: 'LecturerPass123!',
      name: 'Lecturer User',
      roles: [Role.Lecturer],
    });

    adminAgent = await loginAs(app, 'admin@student.test', 'AdminPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@student.test', 'LecturerPass123!');
  });

  describe('GET /students', () => {
    it('should return all students for authenticated admin', async () => {
      await createStudent(prisma, {
        matriculationNo: 'MAT/001',
        name: 'Student One',
        departmentId: 'CS',
        level: 100,
      });

      await createStudent(prisma, {
        matriculationNo: 'MAT/002',
        name: 'Student Two',
        departmentId: 'ENG',
        level: 200,
      });

      const response = await adminAgent.get('/students').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);

      // Should be ordered by createdAt desc
      expect(response.body[0].name).toBe('Student Two');
      expect(response.body[1].name).toBe('Student One');
    });

    it('should return all students for authenticated lecturer', async () => {
      await createStudent(prisma, {
        matriculationNo: 'MAT/003',
        name: 'Student Three',
        departmentId: 'CS',
        level: 100,
      });

      const response = await lecturerAgent.get('/students').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
    });

    it('should return empty array when no students exist', async () => {
      const response = await adminAgent.get('/students').expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should reject unauthenticated access', async () => {
      await request(app.getHttpServer()).get('/students').expect(401);
    });
  });

  describe('GET /students/:id', () => {
    it('should return a single student by id', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/004',
        name: 'Student Four',
        departmentId: 'CS',
        level: 300,
      });

      const response = await adminAgent.get(`/students/${student.id}`).expect(200);

      expect(response.body.id).toBe(student.id);
      expect(response.body.matriculationNo).toBe('MAT/004');
      expect(response.body.name).toBe('Student Four');
      expect(response.body.departmentId).toBe('CS');
      expect(response.body.level).toBe(300);
    });

    it('should return 404 for non-existent student', async () => {
      const response = await adminAgent.get('/students/non-existent-id').expect(404);

      expect(response.body.message).toContain('Student not found');
    });

    it('should reject unauthenticated access', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/005',
        name: 'Student Five',
        departmentId: 'CS',
        level: 100,
      });

      await request(app.getHttpServer()).get(`/students/${student.id}`).expect(401);
    });

    it('should return student with correct data types', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/006',
        name: 'Student Six',
        departmentId: 'CS',
        level: 100,
      });

      const response = await lecturerAgent.get(`/students/${student.id}`).expect(200);

      expect(typeof response.body.id).toBe('string');
      expect(typeof response.body.matriculationNo).toBe('string');
      expect(typeof response.body.name).toBe('string');
      expect(typeof response.body.departmentId).toBe('string');
      expect(typeof response.body.level).toBe('number');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
    });
  });
});
