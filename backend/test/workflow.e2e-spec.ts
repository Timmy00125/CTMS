import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role, GradeStatus } from '@prisma/client';

describe('CTMS Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prismaService: PrismaService;

  // Test data
  let adminToken: string;
  let lecturerToken: string;
  let examOfficerToken: string;
  let studentId: string;
  let courseId: string;
  let semesterId: string;
  let gradeId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    // Apply global configurations
    app.useGlobalFilters(new GlobalExceptionFilter());

    await app.init();

    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    // Clean up test data
    await prismaService.gradeAuditLog.deleteMany();
    await prismaService.systemAuditLog.deleteMany();
    await prismaService.grade.deleteMany();
    await prismaService.student.deleteMany();
    await prismaService.course.deleteMany();
    await prismaService.semester.deleteMany();
    await prismaService.academicSession.deleteMany();
    await prismaService.user.deleteMany();

    await app.close();
  });

  describe('Health Check', () => {
    it('should return hello world', () => {
      return request(app.getHttpServer())
        .get('/')
        .expect(200)
        .expect('Hello World!');
    });
  });

  describe('Authentication Flow', () => {
    const adminUser = {
      email: 'admin@ctms.test',
      password: 'AdminPass123!',
      name: 'Test Admin',
      roles: [Role.Admin],
    };

    const lecturerUser = {
      email: 'lecturer@ctms.test',
      password: 'LecturerPass123!',
      name: 'Test Lecturer',
      roles: [Role.Lecturer],
    };

    const examOfficerUser = {
      email: 'examofficer@ctms.test',
      password: 'ExamOfficerPass123!',
      name: 'Test Exam Officer',
      roles: [Role.ExamOfficer],
    };

    it('should create admin user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(adminUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.email).toBe(adminUser.email);
    });

    it('should create lecturer user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(lecturerUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should create exam officer user', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(examOfficerUser)
        .expect(201);

      expect(response.body).toHaveProperty('id');
    });

    it('should login as admin', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: adminUser.email,
          password: adminUser.password,
        })
        .expect(200);

      expect(response.body).toHaveProperty('accessToken');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      adminToken = response.body.accessToken;
    });

    it('should login as lecturer', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: lecturerUser.email,
          password: lecturerUser.password,
        })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      lecturerToken = response.body.accessToken;
    });

    it('should login as exam officer', async () => {
      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: examOfficerUser.email,
          password: examOfficerUser.password,
        })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      examOfficerToken = response.body.accessToken;
    });
  });

  describe('Data Ingestion', () => {
    it('should bulk upload students as admin', async () => {
      const students = [
        {
          matriculationNo: 'MAT/2023/001',
          name: 'John Doe',
          departmentId: 'CS',
          level: 100,
        },
        {
          matriculationNo: 'MAT/2023/002',
          name: 'Jane Smith',
          departmentId: 'CS',
          level: 100,
        },
      ];

      const response = await request(app.getHttpServer())
        .post('/ingestion/students')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(students)
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.created).toBe(2);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.errors).toHaveLength(0);

      // Get student ID for later tests
      const student = await prismaService.student.findFirst({
        where: { matriculationNo: 'MAT/2023/001' },
      });
      studentId = student!.id;
    });

    it('should bulk upload courses as admin', async () => {
      const courses = [
        {
          code: 'CSC101',
          title: 'Introduction to Computer Science',
          creditUnits: 3,
          departmentId: 'CS',
        },
        {
          code: 'MTH101',
          title: 'Elementary Mathematics I',
          creditUnits: 4,
          departmentId: 'CS',
        },
      ];

      const response = await request(app.getHttpServer())
        .post('/ingestion/courses')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(courses)
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.created).toBe(2);

      // Get course ID for later tests
      const course = await prismaService.course.findFirst({
        where: { code: 'CSC101' },
      });
      courseId = course!.id;
    });

    it('should create academic session and semester', async () => {
      const session = await prismaService.academicSession.create({
        data: {
          name: '2023/2024',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-08-31'),
          isActive: true,
        },
      });

      const semester = await prismaService.semester.create({
        data: {
          name: 'First Semester',
          academicSessionId: session.id,
          isActive: true,
        },
      });

      semesterId = semester.id;
    });

    it('should reject unauthorized bulk upload', async () => {
      await request(app.getHttpServer())
        .post('/ingestion/students')
        .send([{ matriculationNo: 'TEST', name: 'Test', departmentId: 'CS' }])
        .expect(401);
    });
  });

  describe('Grade Management', () => {
    it('should submit grade as lecturer', async () => {
      const response = await request(app.getHttpServer())
        .post('/grades')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send({
          studentId,
          courseId,
          semesterId,
          score: 75,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.score).toBe(75);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.gradeLetter).toBe('A');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.gradePoints).toBe(5.0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.status).toBe(GradeStatus.DRAFT);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      gradeId = response.body.id;
    });

    it('should reject invalid score', async () => {
      await request(app.getHttpServer())
        .post('/grades')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .send({
          studentId,
          courseId,
          semesterId,
          score: 101, // Invalid
        })
        .expect(400);
    });

    it('should publish grades as exam officer', async () => {
      const response = await request(app.getHttpServer())
        .patch('/grades/publish')
        .set('Authorization', `Bearer ${examOfficerToken}`)
        .send({
          courseId,
          semesterId,
        })
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.updated).toBe(1);
    });

    it('should verify grade is published', async () => {
      const grade = await prismaService.grade.findUnique({
        where: { id: gradeId },
      });

      expect(grade!.status).toBe(GradeStatus.PUBLISHED);
    });

    it('should get published grades for student', async () => {
      const response = await request(app.getHttpServer())
        .get(`/grades/student/${studentId}`)
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body[0].id).toBe(gradeId);
    });
  });

  describe('GPA/CGPA Calculations', () => {
    it('should calculate semester GPA', async () => {
      const response = await request(app.getHttpServer())
        .post('/gpa/calculate/semester')
        .set('Authorization', `Bearer ${examOfficerToken}`)
        .send({
          semesterId,
          studentIds: [studentId],
        })
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.results).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.results[0].gpa).toBe(5.0);
    });

    it('should calculate student CGPA', async () => {
      const response = await request(app.getHttpServer())
        .post(`/gpa/calculate/student/${studentId}`)
        .set('Authorization', `Bearer ${examOfficerToken}`)
        .expect(201);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.cgpa).toBe(5.0);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.totalCreditUnits).toBe(3);
    });
  });

  describe('Transcript Generation', () => {
    it('should get student transcript', async () => {
      const response = await request(app.getHttpServer())
        .get(`/transcript/${studentId}`)
        .set('Authorization', `Bearer ${examOfficerToken}`)
        .expect(200);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.student.id).toBe(studentId);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.academicSessions).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.academicSessions[0].semesters).toHaveLength(1);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      expect(response.body.cgpa).toBe(5.0);
    });

    it('should return 404 for non-existent student', async () => {
      await request(app.getHttpServer())
        .get('/transcript/non-existent-id')
        .set('Authorization', `Bearer ${examOfficerToken}`)
        .expect(404);
    });
  });

  describe('Audit Logging', () => {
    it('should have grade audit log', async () => {
      const auditLogs = await prismaService.gradeAuditLog.findMany({
        where: { gradeId },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].reason).toBe('Initial grade submission');
    });

    it('should have system audit log for grade publication', async () => {
      const systemLogs = await prismaService.systemAuditLog.findMany({
        where: { action: 'GRADE_PUBLICATION' },
      });

      expect(systemLogs.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should return standardized error for unauthorized access', async () => {
      const response = await request(app.getHttpServer())
        .get(`/grades/student/${studentId}`)
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);

      expect(response.body).toHaveProperty('message');

      expect(response.body).toHaveProperty('error');

      expect(response.body).toHaveProperty('timestamp');

      expect(response.body).toHaveProperty('path');

      expect(response.body).toHaveProperty('method');
    });

    it('should return empty array for student with no grades', async () => {
      const response = await request(app.getHttpServer())
        .get('/grades/student/non-existent')
        .set('Authorization', `Bearer ${lecturerToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });
});
