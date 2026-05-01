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
import { Role } from '@prisma/client';

describe('TranscriptController (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let examOfficerAgent: request.SuperAgentTest;
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
      email: 'admin@transcript.test',
      password: 'AdminPass123!',
      name: 'Admin User',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'examofficer@transcript.test',
      password: 'ExamOfficerPass123!',
      name: 'Exam Officer',
      roles: [Role.ExamOfficer],
    });

    await createTestUser(prisma, {
      email: 'lecturer@transcript.test',
      password: 'LecturerPass123!',
      name: 'Lecturer User',
      roles: [Role.Lecturer],
    });

    adminAgent = await loginAs(app, 'admin@transcript.test', 'AdminPass123!');
    examOfficerAgent = await loginAs(app, 'examofficer@transcript.test', 'ExamOfficerPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@transcript.test', 'LecturerPass123!');
  });

  describe('GET /transcript/:studentId', () => {
    it('should return transcript for student with grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/001',
        name: 'Transcript Student',
        departmentId: 'CS',
        level: 200,
      });

      const course1 = await createCourse(prisma, {
        code: 'CSC101',
        title: 'Intro to CS',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const course2 = await createCourse(prisma, {
        code: 'MTH101',
        title: 'Mathematics I',
        creditUnits: 4,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course1.id,
        semesterId: semester.id,
        score: 70,
        status: 'PUBLISHED',
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course2.id,
        semesterId: semester.id,
        score: 60,
        status: 'PUBLISHED',
      });

      const response = await examOfficerAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      expect(response.body.student.id).toBe(student.id);
      expect(response.body.student.matriculationNo).toBe('MAT/001');
      expect(response.body.student.name).toBe('Transcript Student');
      expect(response.body.student.departmentId).toBe('CS');
      expect(response.body.student.level).toBe(200);

      expect(response.body.academicSessions).toHaveLength(1);
      expect(response.body.academicSessions[0].name).toBe('2023/2024');
      expect(response.body.academicSessions[0].semesters).toHaveLength(1);
      expect(response.body.academicSessions[0].semesters[0].name).toBe('First Semester');
      expect(response.body.academicSessions[0].semesters[0].courses).toHaveLength(2);

      expect(response.body.cgpa).toBe(4.43);
      expect(response.body.totalCreditUnits).toBe(7);
    });

    it('should return transcript for student with no grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/002',
        name: 'No Grades Student',
        departmentId: 'CS',
        level: 100,
      });

      const response = await examOfficerAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      expect(response.body.student.id).toBe(student.id);
      expect(response.body.academicSessions).toHaveLength(0);
      expect(response.body.cgpa).toBeNull();
      expect(response.body.totalCreditUnits).toBe(0);
    });

    it('should group grades by academic session and semester', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/003',
        name: 'Multi Session Student',
        departmentId: 'CS',
        level: 300,
      });

      const course1 = await createCourse(prisma, {
        code: 'CSC101',
        title: 'Intro to CS',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const course2 = await createCourse(prisma, {
        code: 'CSC201',
        title: 'Advanced CS',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session1 = await createAcademicSession(prisma, { name: '2022/2023' });
      const semester1 = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session1.id,
      });

      const session2 = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester2 = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session2.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course1.id,
        semesterId: semester1.id,
        score: 70,
        status: 'PUBLISHED',
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course2.id,
        semesterId: semester2.id,
        score: 80,
        status: 'PUBLISHED',
      });

      const response = await examOfficerAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      expect(response.body.academicSessions).toHaveLength(2);
      expect(response.body.academicSessions[0].name).toBe('2022/2023');
      expect(response.body.academicSessions[1].name).toBe('2023/2024');
    });

    it('should not include draft grades in transcript', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/004',
        name: 'Draft Student',
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

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course.id,
        semesterId: semester.id,
        score: 80,
        status: 'DRAFT',
      });

      const response = await examOfficerAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      expect(response.body.academicSessions).toHaveLength(0);
    });

    it('should return 404 for non-existent student', async () => {
      const response = await examOfficerAgent
        .get('/transcript/non-existent-id')
        .expect(404);

      expect(response.body.message).toContain('Student not found');
    });

    it('should allow access by lecturer', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/005',
        name: 'Lecturer Access Student',
        departmentId: 'CS',
        level: 100,
      });

      const response = await lecturerAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      expect(response.body.student.id).toBe(student.id);
    });

    it('should allow access by admin', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/006',
        name: 'Admin Access Student',
        departmentId: 'CS',
        level: 100,
      });

      const response = await adminAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      expect(response.body.student.id).toBe(student.id);
    });

    it('should reject unauthenticated access', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/007',
        name: 'Unauth Student',
        departmentId: 'CS',
        level: 100,
      });

      await request(app.getHttpServer())
        .get(`/transcript/${student.id}`)
        .expect(401);
    });

    it('should calculate semester GPA correctly in transcript', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/008',
        name: 'GPA Check Student',
        departmentId: 'CS',
        level: 100,
      });

      const course1 = await createCourse(prisma, {
        code: 'CSC101',
        title: 'Intro to CS',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const course2 = await createCourse(prisma, {
        code: 'MTH101',
        title: 'Mathematics I',
        creditUnits: 4,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course1.id,
        semesterId: semester.id,
        score: 70, // A = 5.0
        status: 'PUBLISHED',
      });

      await createGrade(prisma, {
        studentId: student.id,
        courseId: course2.id,
        semesterId: semester.id,
        score: 60, // B = 4.0
        status: 'PUBLISHED',
      });

      const response = await examOfficerAgent
        .get(`/transcript/${student.id}`)
        .expect(200);

      const semesterData = response.body.academicSessions[0].semesters[0];
      expect(semesterData.gpa).toBe(4.43);
      expect(semesterData.totalCreditUnits).toBe(7);
      expect(semesterData.totalGradePoints).toBe(31);
    });
  });
});
