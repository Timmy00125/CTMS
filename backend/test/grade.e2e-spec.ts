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
  createGrade,
  createAcademicSession,
  createSemester,
  createTestApp,
} from './test-utils';
import { Role, GradeStatus } from '@prisma/client';

describe('GradeController (e2e)', () => {
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
      email: 'admin@grade.test',
      password: 'AdminPass123!',
      name: 'Admin User',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'lecturer@grade.test',
      password: 'LecturerPass123!',
      name: 'Lecturer User',
      roles: [Role.Lecturer],
    });

    await createTestUser(prisma, {
      email: 'examofficer@grade.test',
      password: 'ExamOfficerPass123!',
      name: 'Exam Officer',
      roles: [Role.ExamOfficer],
    });

    adminAgent = await loginAs(app, 'admin@grade.test', 'AdminPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@grade.test', 'LecturerPass123!');
    examOfficerAgent = await loginAs(app, 'examofficer@grade.test', 'ExamOfficerPass123!');
  });

  describe('POST /grades', () => {
    it('should submit a grade as lecturer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/001',
        name: 'Student One',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC101',
        title: 'Intro to CS',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.score).toBe(75);
      expect(response.body.gradeLetter).toBe('A');
      expect(response.body.gradePoints).toBe(5.0);
      expect(response.body.status).toBe(GradeStatus.DRAFT);
    });

    it('should submit a grade as admin', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/002',
        name: 'Student Two',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC102',
        title: 'Data Structures',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await adminAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 55,
        })
        .expect(201);

      expect(response.body.gradeLetter).toBe('C');
      expect(response.body.gradePoints).toBe(3.0);
    });

    it('should reject grade submission with score > 100', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/003',
        name: 'Student Three',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC103',
        title: 'Algorithms',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 101,
        })
        .expect(400);

      expect(response.body.message).toContain('score must not be greater than 100');
    });

    it('should reject grade submission with score < 0', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/004',
        name: 'Student Four',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC104',
        title: 'Networks',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: -5,
        })
        .expect(400);

      expect(response.body.message).toContain('score must not be less than 0');
    });

    it('should reject grade submission with non-integer score', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/005',
        name: 'Student Five',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC105',
        title: 'Databases',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75.5,
        })
        .expect(400);

      expect(response.body.message).toContain('score must be an integer number');
    });

    it('should reject grade for non-existent student', async () => {
      const course = await createCourse(prisma, {
        code: 'CSC106',
        title: 'AI',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: 'non-existent',
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(400);

      expect(response.body.message).toContain('Student not found');
    });

    it('should reject grade for non-existent course', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/006',
        name: 'Student Six',
        departmentId: 'CS',
        level: 100,
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: 'non-existent',
          semesterId: semester.id,
          score: 75,
        })
        .expect(400);

      expect(response.body.message).toContain('Course not found');
    });

    it('should reject grade for non-existent semester', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/007',
        name: 'Student Seven',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC107',
        title: 'ML',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: 'non-existent',
          score: 75,
        })
        .expect(400);

      expect(response.body.message).toContain('Semester not found');
    });

    it('should reject grade submission by exam officer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/008',
        name: 'Student Eight',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC108',
        title: 'Security',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await examOfficerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(403);
    });

    it('should reject unauthenticated grade submission', async () => {
      await request(app.getHttpServer())
        .post('/grades')
        .send({
          studentId: 'some-id',
          courseId: 'some-id',
          semesterId: 'some-id',
          score: 75,
        })
        .expect(401);
    });

    it('should create grade audit log on submission', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/009',
        name: 'Student Nine',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC109',
        title: 'Graphics',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 85,
        })
        .expect(201);

      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId: response.body.id },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].oldScore).toBeNull();
      expect(auditLogs[0].newScore).toBe(85);
      expect(auditLogs[0].reason).toBe('Initial grade submission');
    });
  });

  describe('POST /grades/bulk', () => {
    it('should bulk submit grades as lecturer', async () => {
      const student1 = await createStudent(prisma, {
        matriculationNo: 'MAT/010',
        name: 'Student Ten',
        departmentId: 'CS',
        level: 100,
      });

      const student2 = await createStudent(prisma, {
        matriculationNo: 'MAT/011',
        name: 'Student Eleven',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC110',
        title: 'Bulk Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades/bulk')
        .send({
          grades: [
            { studentId: student1.id, courseId: course.id, semesterId: semester.id, score: 70 },
            { studentId: student2.id, courseId: course.id, semesterId: semester.id, score: 80 },
          ],
        })
        .expect(201);

      expect(response.body.created).toBe(2);
      expect(response.body.errors).toHaveLength(0);
    });

    it('should handle partial failures in bulk submission', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/012',
        name: 'Student Twelve',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC111',
        title: 'Partial Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .post('/grades/bulk')
        .send({
          grades: [
            { studentId: student.id, courseId: course.id, semesterId: semester.id, score: 70 },
            { studentId: 'non-existent', courseId: course.id, semesterId: semester.id, score: 80 },
          ],
        })
        .expect(201);

      expect(response.body.created).toBe(1);
      expect(response.body.errors).toHaveLength(1);
      expect(response.body.errors[0].message).toContain('Student not found');
    });

    it('should reject empty grades array', async () => {
      const response = await lecturerAgent
        .post('/grades/bulk')
        .send({ grades: [] })
        .expect(400);

      expect(response.body.message).toContain('grades must contain at least 1 elements');
    });

    it('should reject missing grades field', async () => {
      const response = await lecturerAgent.post('/grades/bulk').send({}).expect(400);

      expect(response.body).toHaveProperty('statusCode', 400);
    });

    it('should handle duplicate grade unique constraint in bulk', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/013',
        name: 'Student Thirteen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC112',
        title: 'Duplicate Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      // First submission
      await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 70,
        })
        .expect(201);

      // Bulk submission with same student/course/semester
      const response = await lecturerAgent
        .post('/grades/bulk')
        .send({
          grades: [
            { studentId: student.id, courseId: course.id, semesterId: semester.id, score: 80 },
          ],
        })
        .expect(201);

      expect(response.body.created).toBe(0);
      expect(response.body.errors[0].message).toContain('already exists');
    });
  });

  describe('PATCH /grades/publish', () => {
    it('should publish draft grades as exam officer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/014',
        name: 'Student Fourteen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC113',
        title: 'Publish Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 75,
        status: 'DRAFT',
      });

      const response = await examOfficerAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(200);

      expect(response.body.updated).toBe(1);

      const grade = await prisma.grade.findFirst({
        where: { studentId: student.id, courseId: course.id },
      });

      expect(grade!.status).toBe(GradeStatus.PUBLISHED);
    });

    it('should publish draft grades as admin', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/015',
        name: 'Student Fifteen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC114',
        title: 'Admin Publish',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 60,
        status: 'DRAFT',
      });

      const response = await adminAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(200);

      expect(response.body.updated).toBe(1);
    });

    it('should return 0 updated when no draft grades exist', async () => {
      const course = await createCourse(prisma, {
        code: 'CSC115',
        title: 'No Drafts',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await examOfficerAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(200);

      expect(response.body.updated).toBe(0);
    });

    it('should reject publication by lecturer', async () => {
      const course = await createCourse(prisma, {
        code: 'CSC116',
        title: 'Lecturer Publish',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await lecturerAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(403);
    });

    it('should create system audit log on publication', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/016',
        name: 'Student Sixteen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC117',
        title: 'Audit Publish',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 90,
        status: 'DRAFT',
      });

      await examOfficerAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(200);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'GRADE_PUBLICATION' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('PATCH /grades/:id/amend', () => {
    it('should amend a grade as lecturer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/017',
        name: 'Student Seventeen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC118',
        title: 'Amend Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 55,
        status: 'PUBLISHED',
      });

      const response = await lecturerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({
          score: 75,
          reason: 'Reviewed script',
        })
        .expect(200);

      expect(response.body.score).toBe(75);
      expect(response.body.gradeLetter).toBe('A');
      expect(response.body.gradePoints).toBe(5.0);
    });

    it('should amend a grade as admin', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/018',
        name: 'Student Eighteen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC119',
        title: 'Admin Amend',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 40,
        status: 'PUBLISHED',
      });

      const response = await adminAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({
          score: 65,
        })
        .expect(200);

      expect(response.body.score).toBe(65);
      expect(response.body.gradeLetter).toBe('B');
    });

    it('should reject amendment with invalid score', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/019',
        name: 'Student Nineteen',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC120',
        title: 'Invalid Amend',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 50,
        status: 'PUBLISHED',
      });

      const response = await lecturerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({
          score: 150,
        })
        .expect(400);

      expect(response.body.message).toContain('score must not be greater than 100');
    });

    it('should reject amendment for non-existent grade', async () => {
      const response = await lecturerAgent
        .patch('/grades/non-existent/amend')
        .send({
          score: 75,
        })
        .expect(400);

      expect(response.body.message).toContain('Grade not found');
    });

    it('should reject amendment by exam officer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/020',
        name: 'Student Twenty',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC121',
        title: 'Exam Officer Amend',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 50,
        status: 'PUBLISHED',
      });

      await examOfficerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({
          score: 75,
        })
        .expect(403);
    });

    it('should create grade audit log on amendment', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/021',
        name: 'Student Twenty One',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC122',
        title: 'Audit Amend',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 50,
        status: 'PUBLISHED',
      });

      await lecturerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({
          score: 75,
          reason: 'Rechecked',
        })
        .expect(200);

      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId: grade.id },
        orderBy: { timestamp: 'desc' },
      });

      expect(auditLogs.length).toBeGreaterThan(0);
      const amendLog = auditLogs.find((log) => log.reason === 'Rechecked');
      expect(amendLog).toBeDefined();
      expect(amendLog!.oldScore).toBe(50);
      expect(amendLog!.newScore).toBe(75);
    });

    it('should create system audit log on amendment', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/022',
        name: 'Student Twenty Two',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC123',
        title: 'System Audit Amend',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 45,
        status: 'PUBLISHED',
      });

      await lecturerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({
          score: 65,
        })
        .expect(200);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'GRADE_AMENDMENT' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('GET /grades/student/:studentId', () => {
    it('should return published grades for student', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/023',
        name: 'Student Twenty Three',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC124',
        title: 'Published Grade',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 80,
        status: 'PUBLISHED',
      });

      const response = await lecturerAgent
        .get(`/grades/student/${student.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].course.code).toBe('CSC124');
    });

    it('should not return draft grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/024',
        name: 'Student Twenty Four',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC125',
        title: 'Draft Grade',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 80,
        status: 'DRAFT',
      });

      const response = await lecturerAgent
        .get(`/grades/student/${student.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should return empty array for student with no grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/025',
        name: 'Student Twenty Five',
        departmentId: 'CS',
        level: 100,
      });

      const response = await lecturerAgent
        .get(`/grades/student/${student.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it('should allow access by exam officer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/026',
        name: 'Student Twenty Six',
        departmentId: 'CS',
        level: 100,
      });

      const response = await examOfficerAgent
        .get(`/grades/student/${student.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject access by unauthenticated user', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/027',
        name: 'Student Twenty Seven',
        departmentId: 'CS',
        level: 100,
      });

      await request(app.getHttpServer())
        .get(`/grades/student/${student.id}`)
        .expect(401);
    });
  });

  describe('GET /grades/course/:courseId/semester/:semesterId', () => {
    it('should return grades for course and semester', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/028',
        name: 'Student Twenty Eight',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC126',
        title: 'Course Grades',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 85,
        status: 'PUBLISHED',
      });

      const response = await lecturerAgent
        .get(`/grades/course/${course.id}/semester/${semester.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0].student.matriculationNo).toBe('MAT/028');
    });

    it('should return empty array when no grades exist', async () => {
      const course = await createCourse(prisma, {
        code: 'CSC127',
        title: 'Empty Grades',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const response = await lecturerAgent
        .get(`/grades/course/${course.id}/semester/${semester.id}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /grades/:id/audit', () => {
    it('should return audit log for grade as exam officer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/029',
        name: 'Student Twenty Nine',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC128',
        title: 'Audit Log Grade',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 70,
        status: 'PUBLISHED',
      });

      const response = await examOfficerAgent
        .get(`/grades/${grade.id}/audit`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should return audit log for grade as admin', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/030',
        name: 'Student Thirty',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC129',
        title: 'Admin Audit Log',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 70,
        status: 'PUBLISHED',
      });

      const response = await adminAgent.get(`/grades/${grade.id}/audit`).expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should reject access by lecturer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/031',
        name: 'Student Thirty One',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC130',
        title: 'Lecturer Audit',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      const grade = await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 70,
        status: 'PUBLISHED',
      });

      await lecturerAgent.get(`/grades/${grade.id}/audit`).expect(403);
    });
  });
});
