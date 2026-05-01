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

describe('Audit Logging (e2e)', () => {
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
      email: 'admin@audit.test',
      password: 'AdminPass123!',
      name: 'Admin User',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'lecturer@audit.test',
      password: 'LecturerPass123!',
      name: 'Lecturer User',
      roles: [Role.Lecturer],
    });

    await createTestUser(prisma, {
      email: 'examofficer@audit.test',
      password: 'ExamOfficerPass123!',
      name: 'Exam Officer',
      roles: [Role.ExamOfficer],
    });

    adminAgent = await loginAs(app, 'admin@audit.test', 'AdminPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@audit.test', 'LecturerPass123!');
    examOfficerAgent = await loginAs(app, 'examofficer@audit.test', 'ExamOfficerPass123!');
  });

  describe('Grade Audit Logs', () => {
    it('should create audit log on grade submission', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/001',
        name: 'Audit Student',
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

      const gradeResponse = await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(201);

      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId: gradeResponse.body.id },
        include: { user: true },
      });

      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].oldScore).toBeNull();
      expect(auditLogs[0].newScore).toBe(75);
      expect(auditLogs[0].reason).toBe('Initial grade submission');
      expect(auditLogs[0].user.name).toBe('Lecturer User');
    });

    it('should create audit log on grade amendment', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/002',
        name: 'Amend Audit Student',
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
          reason: 'Rechecked examination script',
        })
        .expect(200);

      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId: grade.id },
        orderBy: { timestamp: 'asc' },
      });

      // createGrade bypasses controller so no initial submission log
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].oldScore).toBe(50);
      expect(auditLogs[0].newScore).toBe(75);
      expect(auditLogs[0].reason).toBe('Rechecked examination script');
    });

    it('should create audit log with default reason when none provided', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/003',
        name: 'Default Reason Student',
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

      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId: grade.id },
        orderBy: { timestamp: 'desc' },
      });

      expect(auditLogs[0].reason).toBe('Grade amended');
    });
  });

  describe('System Audit Logs', () => {
    it('should create system audit log on bulk student upload', async () => {
      await adminAgent
        .post('/ingestion/students')
        .send([
          { matriculationNo: 'MAT/004', name: 'Bulk Student', departmentId: 'CS', level: 100 },
        ])
        .expect(201);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'BULK_UPLOAD', resource: 'Student' },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].details).toContain('Bulk uploaded');
    });

    it('should create system audit log on bulk course upload', async () => {
      await adminAgent
        .post('/ingestion/courses')
        .send([
          { code: 'CSC104', title: 'Bulk Course', creditUnits: 3, departmentId: 'CS' },
        ])
        .expect(201);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'BULK_UPLOAD', resource: 'Course' },
      });

      expect(logs.length).toBeGreaterThan(0);
    });

    it('should create system audit log on grade publication', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/005',
        name: 'Publish Audit Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC105',
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
        score: 80,
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
      expect(logs[0].details).toContain('Published');
    });

    it('should create system audit log on grade amendment', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/006',
        name: 'Amend System Audit Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC106',
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
        score: 50,
        status: 'PUBLISHED',
      });

      await lecturerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({ score: 70 })
        .expect(200);

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'GRADE_AMENDMENT' },
      });

      expect(logs.length).toBeGreaterThan(0);
      expect(logs[0].details).toContain('Amended grade');
    });

    it('should store correct user ID in system audit logs', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/007',
        name: 'User ID Audit Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC107',
        title: 'User ID Course',
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

      await examOfficerAgent
        .patch('/grades/publish')
        .send({
          courseId: course.id,
          semesterId: semester.id,
        })
        .expect(200);

      const examOfficer = await prisma.user.findUnique({
        where: { email: 'examofficer@audit.test' },
      });

      const logs = await prisma.systemAuditLog.findMany({
        where: { action: 'GRADE_PUBLICATION' },
      });

      expect(logs[0].userId).toBe(examOfficer!.id);
    });
  });

  describe('Audit Log Data Integrity', () => {
    it('should maintain chronological order of audit logs', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/008',
        name: 'Chronological Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC108',
        title: 'Chronological Course',
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
        .send({ score: 60 })
        .expect(200);

      await lecturerAgent
        .patch(`/grades/${grade.id}/amend`)
        .send({ score: 70 })
        .expect(200);

      const auditLogs = await prisma.gradeAuditLog.findMany({
        where: { gradeId: grade.id },
        orderBy: { timestamp: 'asc' },
      });

      expect(auditLogs).toHaveLength(2);
      expect(auditLogs[0].oldScore).toBe(50);
      expect(auditLogs[0].newScore).toBe(60);
      expect(auditLogs[1].oldScore).toBe(60);
      expect(auditLogs[1].newScore).toBe(70);

      // Verify timestamps are in ascending order
      for (let i = 1; i < auditLogs.length; i++) {
        expect(new Date(auditLogs[i].timestamp).getTime()).toBeGreaterThanOrEqual(
          new Date(auditLogs[i - 1].timestamp).getTime(),
        );
      }
    });

    it('should track old and new scores accurately in amendment logs', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/009',
        name: 'Score Tracking Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC109',
        title: 'Score Tracking Course',
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
        .send({ score: 65 })
        .expect(200);

      const auditLog = await prisma.gradeAuditLog.findFirst({
        where: {
          gradeId: grade.id,
          reason: 'Grade amended',
        },
      });

      expect(auditLog!.oldScore).toBe(45);
      expect(auditLog!.newScore).toBe(65);
    });
  });
});
