import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await argon2.hash('admin123');
  const lecturerPassword = await argon2.hash('lecturer123');
  const examOfficerPassword = await argon2.hash('officer123');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@ctms.edu',
      passwordHash: adminPassword,
      name: 'System Admin',
      roles: ['Admin'],
    },
  });

  const lecturer = await prisma.user.create({
    data: {
      email: 'lecturer@ctms.edu',
      passwordHash: lecturerPassword,
      name: 'Dr. Smith',
      roles: ['Lecturer'],
      departmentId: 'dept-123',
    },
  });

  const examOfficer = await prisma.user.create({
    data: {
      email: 'examofficer@ctms.edu',
      passwordHash: examOfficerPassword,
      name: 'Jane Exam Officer',
      roles: ['ExamOfficer'],
      departmentId: 'dept-123',
    },
  });

  const session = await prisma.academicSession.create({
    data: {
      name: '2023/2024',
      startDate: new Date('2023-09-01'),
      endDate: new Date('2024-06-30'),
      isActive: true,
      semesters: {
        create: [
          { name: 'First Semester', isActive: true },
          { name: 'Second Semester', isActive: false },
        ],
      },
    },
  });

  console.log('Seed completed');
  console.log('Users created:');
  console.log('  Admin:        admin@ctms.edu       / admin123');
  console.log('  Lecturer:     lecturer@ctms.edu    / lecturer123');
  console.log('  Exam Officer: examofficer@ctms.edu / officer123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
