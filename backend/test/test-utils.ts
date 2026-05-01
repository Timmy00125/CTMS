import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import cookieParser from 'cookie-parser';
import { PrismaService } from '../src/prisma/prisma.service';
import { Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { AppModule } from '../src/app.module';
import { GlobalExceptionFilter } from '../src/common/filters/global-exception.filter';

export async function createTestApp(): Promise<INestApplication> {
  const moduleFixture: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleFixture.createNestApplication();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  app.useGlobalFilters(new GlobalExceptionFilter());
  await app.init();
  return app;
}

export interface TestUser {
  email: string;
  password: string;
  name: string;
  roles: Role[];
  departmentId?: string;
}

export async function cleanupDatabase(prisma: PrismaService): Promise<void> {
  // Delete in order to respect foreign key constraints
  await prisma.gradeAuditLog.deleteMany();
  await prisma.systemAuditLog.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.student.deleteMany();
  await prisma.course.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.user.deleteMany();
}

export async function createTestUser(
  prisma: PrismaService,
  data: TestUser,
): Promise<{ id: string; email: string; name: string; roles: Role[] }> {
  const passwordHash = await argon2.hash(data.password);
  const user = await prisma.user.create({
    data: {
      email: data.email,
      passwordHash,
      name: data.name,
      roles: data.roles,
      departmentId: data.departmentId ?? null,
    },
  });
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
  };
}

export function createAgent(app: INestApplication) {
  return request.agent(app.getHttpServer());
}

export async function loginAs(
  app: INestApplication,
  email: string,
  password: string,
): Promise<request.SuperAgentTest> {
  const agent = createAgent(app);
  const response = await agent.post('/auth/login').send({ email, password }).expect(200);

  // Verify cookies were set
  expect(response.headers['set-cookie']).toBeDefined();
  expect(response.headers['set-cookie'].some((c: string) => c.includes('access_token'))).toBe(true);
  expect(response.headers['set-cookie'].some((c: string) => c.includes('refresh_token'))).toBe(true);

  return agent;
}

export async function createAcademicSession(
  prisma: PrismaService,
  data: {
    name: string;
    startDate?: Date;
    endDate?: Date;
    isActive?: boolean;
  },
) {
  return prisma.academicSession.create({
    data: {
      name: data.name,
      startDate: data.startDate ?? new Date('2023-09-01'),
      endDate: data.endDate ?? new Date('2024-08-31'),
      isActive: data.isActive ?? true,
    },
  });
}

export async function createSemester(
  prisma: PrismaService,
  data: {
    name: string;
    academicSessionId: string;
    isActive?: boolean;
  },
) {
  return prisma.semester.create({
    data: {
      name: data.name,
      academicSessionId: data.academicSessionId,
      isActive: data.isActive ?? true,
    },
  });
}

export async function createStudent(
  prisma: PrismaService,
  data: {
    matriculationNo: string;
    name: string;
    departmentId: string;
    level?: number;
  },
) {
  return prisma.student.create({
    data: {
      matriculationNo: data.matriculationNo,
      name: data.name,
      departmentId: data.departmentId,
      level: data.level ?? 100,
    },
  });
}

export async function createCourse(
  prisma: PrismaService,
  data: {
    code: string;
    title: string;
    creditUnits: number;
    departmentId: string;
    lecturerId?: string;
  },
) {
  return prisma.course.create({
    data: {
      code: data.code,
      title: data.title,
      creditUnits: data.creditUnits,
      departmentId: data.departmentId,
      lecturerId: data.lecturerId ?? null,
    },
  });
}

export async function createGrade(
  prisma: PrismaService,
  data: {
    studentId: string;
    courseId: string;
    semesterId: string;
    score: number;
    gradeLetter?: string;
    gradePoints?: number;
    status?: 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED';
  },
) {
  let gradeLetter = data.gradeLetter;
  let gradePoints = data.gradePoints;

  if (!gradeLetter || gradePoints === undefined) {
    const mapping = mapScoreToGrade(data.score);
    gradeLetter = mapping.gradeLetter;
    gradePoints = mapping.gradePoints;
  }

  return prisma.grade.create({
    data: {
      studentId: data.studentId,
      courseId: data.courseId,
      semesterId: data.semesterId,
      score: data.score,
      gradeLetter,
      gradePoints,
      status: data.status ?? 'DRAFT',
    },
  });
}

function mapScoreToGrade(score: number): { gradeLetter: string; gradePoints: number } {
  if (score >= 70) return { gradeLetter: 'A', gradePoints: 5.0 };
  if (score >= 60) return { gradeLetter: 'B', gradePoints: 4.0 };
  if (score >= 50) return { gradeLetter: 'C', gradePoints: 3.0 };
  if (score >= 45) return { gradeLetter: 'D', gradePoints: 2.0 };
  if (score >= 40) return { gradeLetter: 'E', gradePoints: 1.0 };
  return { gradeLetter: 'F', gradePoints: 0.0 };
}
