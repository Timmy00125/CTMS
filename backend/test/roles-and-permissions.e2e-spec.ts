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

describe('Roles and Permissions (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let adminAgent: request.SuperAgentTest;
  let lecturerAgent: request.SuperAgentTest;
  let examOfficerAgent: request.SuperAgentTest;
  let noRoleAgent: request.SuperAgentTest;

  beforeAll(async () => {
    app = await createTestApp();
    prisma = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    jest.setTimeout(15000);
    await cleanupDatabase(prisma);

    await createTestUser(prisma, {
      email: 'admin@roles.test',
      password: 'AdminPass123!',
      name: 'Admin User',
      roles: [Role.Admin],
    });

    await createTestUser(prisma, {
      email: 'lecturer@roles.test',
      password: 'LecturerPass123!',
      name: 'Lecturer User',
      roles: [Role.Lecturer],
    });

    await createTestUser(prisma, {
      email: 'examofficer@roles.test',
      password: 'ExamOfficerPass123!',
      name: 'Exam Officer',
      roles: [Role.ExamOfficer],
    });

    await createTestUser(prisma, {
      email: 'norole@roles.test',
      password: 'NoRolePass123!',
      name: 'No Role User',
      roles: [],
    });

    adminAgent = await loginAs(app, 'admin@roles.test', 'AdminPass123!');
    lecturerAgent = await loginAs(app, 'lecturer@roles.test', 'LecturerPass123!');
    examOfficerAgent = await loginAs(app, 'examofficer@roles.test', 'ExamOfficerPass123!');
    noRoleAgent = await loginAs(app, 'norole@roles.test', 'NoRolePass123!');
  });

  describe('Admin Permissions', () => {
    it('should allow admin to upload students', async () => {
      await adminAgent
        .post('/ingestion/students')
        .send([
          { matriculationNo: 'MAT/001', name: 'Test', departmentId: 'CS', level: 100 },
        ])
        .expect(201);
    });

    it('should allow admin to upload courses', async () => {
      await adminAgent
        .post('/ingestion/courses')
        .send([
          { code: 'CSC101', title: 'Test', creditUnits: 3, departmentId: 'CS' },
        ])
        .expect(201);
    });

    it('should allow admin to submit grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/002',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC102',
        title: 'Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await adminAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(201);
    });

    it('should allow admin to publish grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/003',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC103',
        title: 'Course',
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

      await adminAgent
        .patch('/grades/publish')
        .send({ courseId: course.id, semesterId: semester.id })
        .expect(200);
    });

    it('should allow admin to calculate GPA', async () => {
      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await adminAgent
        .post('/gpa/calculate/semester')
        .send({ semesterId: semester.id, studentIds: [] })
        .expect(201);
    });

    it('should allow admin to view transcripts', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/004',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      await adminAgent.get(`/transcript/${student.id}`).expect(200);
    });

    it('should allow admin to view grade audit logs', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/005',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC104',
        title: 'Course',
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
        score: 75,
        status: 'PUBLISHED',
      });

      await adminAgent.get(`/grades/${grade.id}/audit`).expect(200);
    });
  });

  describe('Lecturer Permissions', () => {
    it('should allow lecturer to view students', async () => {
      await lecturerAgent.get('/students').expect(200);
    });

    it('should allow lecturer to submit grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/006',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC105',
        title: 'Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await lecturerAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(201);
    });

    it('should allow lecturer to amend grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/007',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC106',
        title: 'Course',
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
    });

    it('should allow lecturer to view student grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/008',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      await lecturerAgent.get(`/grades/student/${student.id}`).expect(200);
    });

    it('should allow lecturer to view transcripts', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/009',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      await lecturerAgent.get(`/transcript/${student.id}`).expect(200);
    });

    it('should reject lecturer from uploading students', async () => {
      await lecturerAgent
        .post('/ingestion/students')
        .send([
          { matriculationNo: 'MAT/010', name: 'Test', departmentId: 'CS', level: 100 },
        ])
        .expect(403);
    });

    it('should reject lecturer from uploading courses', async () => {
      await lecturerAgent
        .post('/ingestion/courses')
        .send([
          { code: 'CSC107', title: 'Test', creditUnits: 3, departmentId: 'CS' },
        ])
        .expect(403);
    });

    it('should reject lecturer from publishing grades', async () => {
      await lecturerAgent
        .patch('/grades/publish')
        .send({ courseId: 'some-id', semesterId: 'some-id' })
        .expect(403);
    });

    it('should reject lecturer from calculating GPA', async () => {
      await lecturerAgent
        .post('/gpa/calculate/semester')
        .send({ semesterId: 'some-id', studentIds: [] })
        .expect(403);
    });

    it('should reject lecturer from viewing grade audit logs', async () => {
      await lecturerAgent.get('/grades/some-id/audit').expect(403);
    });
  });

  describe('Exam Officer Permissions', () => {
    it('should allow exam officer to view students', async () => {
      await examOfficerAgent.get('/students').expect(200);
    });

    it('should allow exam officer to view student grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/011',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      await examOfficerAgent.get(`/grades/student/${student.id}`).expect(200);
    });

    it('should allow exam officer to view course grades', async () => {
      const course = await createCourse(prisma, {
        code: 'CSC108',
        title: 'Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await examOfficerAgent
        .get(`/grades/course/${course.id}/semester/${semester.id}`)
        .expect(200);
    });

    it('should allow exam officer to publish grades', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/012',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC109',
        title: 'Course',
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

      await examOfficerAgent
        .patch('/grades/publish')
        .send({ courseId: course.id, semesterId: semester.id })
        .expect(200);
    });

    it('should allow exam officer to calculate GPA', async () => {
      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      await examOfficerAgent
        .post('/gpa/calculate/semester')
        .send({ semesterId: semester.id, studentIds: [] })
        .expect(201);
    });

    it('should allow exam officer to view transcripts', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/013',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      await examOfficerAgent.get(`/transcript/${student.id}`).expect(200);
    });

    it('should allow exam officer to view grade audit logs', async () => {
      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/014',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC110',
        title: 'Course',
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
        score: 75,
        status: 'PUBLISHED',
      });

      await examOfficerAgent.get(`/grades/${grade.id}/audit`).expect(200);
    });

    it('should reject exam officer from uploading students', async () => {
      await examOfficerAgent
        .post('/ingestion/students')
        .send([
          { matriculationNo: 'MAT/015', name: 'Test', departmentId: 'CS', level: 100 },
        ])
        .expect(403);
    });

    it('should reject exam officer from uploading courses', async () => {
      await examOfficerAgent
        .post('/ingestion/courses')
        .send([
          { code: 'CSC111', title: 'Test', creditUnits: 3, departmentId: 'CS' },
        ])
        .expect(403);
    });

    it('should reject exam officer from submitting grades', async () => {
      await examOfficerAgent
        .post('/grades')
        .send({
          studentId: 'some-id',
          courseId: 'some-id',
          semesterId: 'some-id',
          score: 75,
        })
        .expect(403);
    });

    it('should reject exam officer from amending grades', async () => {
      await examOfficerAgent
        .patch('/grades/some-id/amend')
        .send({ score: 80 })
        .expect(403);
    });
  });

  describe('User with No Roles', () => {
    it('should allow no-role user to access endpoints without role restrictions', async () => {
      await noRoleAgent.get('/students').expect(200);
    });

    it('should reject no-role user from accessing student grades', async () => {
      await noRoleAgent.get('/grades/student/some-id').expect(403);
    });

    it('should reject no-role user from accessing GPA calculations', async () => {
      await noRoleAgent
        .post('/gpa/calculate/semester')
        .send({ semesterId: 'some-id', studentIds: [] })
        .expect(403);
    });

    it('should reject no-role user from accessing transcripts', async () => {
      await noRoleAgent.get('/transcript/some-id').expect(403);
    });

    it('should reject no-role user from uploading data', async () => {
      await noRoleAgent
        .post('/ingestion/students')
        .send([
          { matriculationNo: 'MAT/016', name: 'Test', departmentId: 'CS', level: 100 },
        ])
        .expect(403);
    });
  });

  describe('Unauthenticated Access', () => {
    it('should reject unauthenticated access to students', async () => {
      await request(app.getHttpServer()).get('/students').expect(401);
    });

    it('should reject unauthenticated access to grades', async () => {
      await request(app.getHttpServer()).get('/grades/student/some-id').expect(401);
    });

    it('should reject unauthenticated access to GPA calculations', async () => {
      await request(app.getHttpServer())
        .post('/gpa/calculate/semester')
        .send({ semesterId: 'some-id', studentIds: [] })
        .expect(401);
    });

    it('should reject unauthenticated access to transcripts', async () => {
      await request(app.getHttpServer()).get('/transcript/some-id').expect(401);
    });

    it('should reject unauthenticated access to ingestion', async () => {
      await request(app.getHttpServer())
        .post('/ingestion/students')
        .send([
          { matriculationNo: 'MAT/017', name: 'Test', departmentId: 'CS', level: 100 },
        ])
        .expect(401);
    });

    it('should reject unauthenticated access to grade audit logs', async () => {
      await request(app.getHttpServer()).get('/grades/some-id/audit').expect(401);
    });

    it('should return standardized error for unauthenticated access', async () => {
      const response = await request(app.getHttpServer()).get('/students').expect(401);

      expect(response.body).toHaveProperty('statusCode', 401);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('error');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('path', '/students');
      expect(response.body).toHaveProperty('method', 'GET');
    });
  });

  describe('Multi-role Users', () => {
    it('should allow user with both Lecturer and ExamOfficer roles to access all grade endpoints', async () => {
      await cleanupDatabase(prisma);

      await createTestUser(prisma, {
        email: 'multi@roles.test',
        password: 'MultiPass123!',
        name: 'Multi Role User',
        roles: [Role.Lecturer, Role.ExamOfficer],
      });

      const multiAgent = await loginAs(app, 'multi@roles.test', 'MultiPass123!');

      const student = await createStudent(prisma, {
        matriculationNo: 'MAT/018',
        name: 'Student',
        departmentId: 'CS',
        level: 100,
      });

      const course = await createCourse(prisma, {
        code: 'CSC112',
        title: 'Course',
        creditUnits: 3,
        departmentId: 'CS',
      });

      const session = await createAcademicSession(prisma, { name: '2023/2024' });
      const semester = await createSemester(prisma, {
        name: 'First Semester',
        academicSessionId: session.id,
      });

      // Should be able to submit grades (Lecturer)
      await multiAgent
        .post('/grades')
        .send({
          studentId: student.id,
          courseId: course.id,
          semesterId: semester.id,
          score: 75,
        })
        .expect(201);

      // Should be able to publish grades (ExamOfficer)
      await multiAgent
        .patch('/grades/publish')
        .send({ courseId: course.id, semesterId: semester.id })
        .expect(200);

      // Should be able to view audit logs (ExamOfficer)
      const grade = await prisma.grade.findFirst({
        where: { studentId: student.id },
      });

      await multiAgent.get(`/grades/${grade!.id}/audit`).expect(200);
    });
  });
});
