import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaService } from '../src/prisma/prisma.service';
import { cleanupDatabase, createTestUser, loginAs, createTestApp } from './test-utils';
import { Role, GradeStatus } from '@prisma/client';

describe('CTMS Workflow (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  // Test data
  let adminAgent: request.SuperAgentTest;
  let lecturerAgent: request.SuperAgentTest;
  let examOfficerAgent: request.SuperAgentTest;
  let studentId: string;
  let courseId: string;
  let semesterId: string;
  let gradeId: string;

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
      email: 'admin@workflow.test',
      password: 'AdminPass123!',
      name: 'Test Admin',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'lecturer@workflow.test',
      password: 'LecturerPass123!',
      name: 'Test Lecturer',
      roles: [Role.Lecturer],
    });

    await createTestUser(prisma, {
      email: 'examofficer@workflow.test',
      password: 'ExamOfficerPass123!',
      name: 'Test Exam Officer',
      roles: [Role.ExamOfficer],
    });

    adminAgent = await loginAs(app, 'admin@workflow.test', 'AdminPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@workflow.test', 'LecturerPass123!');
    examOfficerAgent = await loginAs(app, 'examofficer@workflow.test', 'ExamOfficerPass123!');
  });

  describe('Health Check', () => {
    it('should return hello world', () => {
      return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });
  });

  describe('Complete Academic Workflow', () => {
    it('should execute full workflow: register users, ingest data, submit grades, publish, calculate GPA, generate transcript', async () => {
      // Step 1: Bulk upload students
      const studentsResponse = await adminAgent
        .post('/ingestion/students')
        .send([
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
        ])
        .expect(201);

      expect(studentsResponse.body.created).toBe(2);

      // Step 2: Bulk upload courses
      const coursesResponse = await adminAgent
        .post('/ingestion/courses')
        .send([
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
        ])
        .expect(201);

      expect(coursesResponse.body.created).toBe(2);

      // Step 3: Create academic session and semester
      const session = await prisma.academicSession.create({
        data: {
          name: '2023/2024',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-08-31'),
          isActive: true,
        },
      });

      const semester = await prisma.semester.create({
        data: {
          name: 'First Semester',
          academicSessionId: session.id,
          isActive: true,
        },
      });

      semesterId = semester.id;

      // Get student and course IDs
      const student = await prisma.student.findFirst({
        where: { matriculationNo: 'MAT/2023/001' },
      });
      studentId = student!.id;

      const course = await prisma.course.findFirst({
        where: { code: 'CSC101' },
      });
      courseId = course!.id;

      // Step 4: Submit grade as lecturer
      const gradeResponse = await lecturerAgent
        .post('/grades')
        .send({
          studentId,
          courseId,
          semesterId,
          score: 75,
        })
        .expect(201);

      expect(gradeResponse.body.score).toBe(75);
      expect(gradeResponse.body.gradeLetter).toBe('A');
      expect(gradeResponse.body.gradePoints).toBe(5.0);
      expect(gradeResponse.body.status).toBe(GradeStatus.DRAFT);

      gradeId = gradeResponse.body.id;

      // Step 5: Publish grades as exam officer
      const publishResponse = await examOfficerAgent
        .patch('/grades/publish')
        .send({
          courseId,
          semesterId,
        })
        .expect(200);

      expect(publishResponse.body.updated).toBe(1);

      // Verify grade is published
      const publishedGrade = await prisma.grade.findUnique({
        where: { id: gradeId },
      });
      expect(publishedGrade!.status).toBe(GradeStatus.PUBLISHED);

      // Step 6: Get published grades for student
      const studentGradesResponse = await lecturerAgent
        .get(`/grades/student/${studentId}`)
        .expect(200);

      expect(studentGradesResponse.body).toHaveLength(1);
      expect(studentGradesResponse.body[0].id).toBe(gradeId);

      // Step 7: Calculate semester GPA
      const gpaResponse = await examOfficerAgent
        .post('/gpa/calculate/semester')
        .send({
          semesterId,
          studentIds: [studentId],
        })
        .expect(201);

      expect(gpaResponse.body.results).toHaveLength(1);
      expect(gpaResponse.body.results[0].gpa).toBe(5.0);

      // Step 8: Calculate student CGPA
      const cgpaResponse = await examOfficerAgent
        .post(`/gpa/calculate/student/${studentId}`)
        .expect(201);

      expect(cgpaResponse.body.cgpa).toBe(5.0);
      expect(cgpaResponse.body.totalCreditUnits).toBe(3);

      // Step 9: Generate transcript
      const transcriptResponse = await examOfficerAgent
        .get(`/transcript/${studentId}`)
        .expect(200);

      expect(transcriptResponse.body.student.id).toBe(studentId);
      expect(transcriptResponse.body.academicSessions).toHaveLength(1);
      expect(transcriptResponse.body.academicSessions[0].semesters).toHaveLength(1);
      expect(transcriptResponse.body.cgpa).toBe(5.0);

      // Step 10: Verify audit logs
      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      expect(auditLogs[0].reason).toBe('Initial grade submission');

      const systemLogs = await prisma.systemAuditLog.findMany({
        where: { action: 'GRADE_PUBLICATION' },
      });

      expect(systemLogs.length).toBeGreaterThan(0);
    });

    it('should handle grade amendment workflow', async () => {
      // Setup data
      const student = await prisma.student.create({
        data: {
          matriculationNo: 'MAT/2023/003',
          name: 'Amendment Student',
          departmentId: 'CS',
          level: 100,
        },
      });

      const course = await prisma.course.create({
        data: {
          code: 'CSC102',
          title: 'Data Structures',
          creditUnits: 3,
          departmentId: 'CS',
        },
      });

      const session = await prisma.academicSession.create({
        data: {
          name: '2023/2024',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-08-31'),
          isActive: true,
        },
      });

      const semester = await prisma.semester.create({
        data: {
          name: 'First Semester',
          academicSessionId: session.id,
          isActive: true,
        },
      });

      // Submit grade
      const gradeResponse = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 55,
        })
        .expect(201);

      const gradeId = gradeResponse.body.id;

      // Publish grade
      await examOfficerAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(200);

      // Amend grade
      const amendResponse = await lecturerAgent
        .patch(`/grades/${gradeId}/amend`)
        .send({
          score: 75,
          reason: 'Script review completed',
        })
        .expect(200);

      expect(amendResponse.body.score).toBe(75);
      expect(amendResponse.body.gradeLetter).toBe('A');

      // Verify audit trail
      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId },
        orderBy: { timestamp: 'asc' },
      });

      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[0].reason).toBe('Initial grade submission');
      expect(auditLogs[1].oldScore).toBe(55);
      expect(auditLogs[1].newScore).toBe(75);
      expect(auditLogs[1].reason).toBe('Script review completed');
    });
  });

  describe('Error Handling', () => {
    it('should return standardized error for unauthorized access', async () => {
      const response = await request(app.getHttpServer())
        .get('/students')
        .expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/students');
      expect(response.body).toHaveProperty('method', 'GET');
    });

    it('should return empty array for student with no grades', async () => {
      const student = await prisma.student.create({
        data: {
          matriculationNo: 'MAT/2023/004',
          name: 'No Grades',
          departmentId: 'CS',
          level: 100,
        },
      });

      const response = await lecturerAgent
        .get(`/grades/student/${student.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });
});
