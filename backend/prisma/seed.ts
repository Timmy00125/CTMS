import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.create({
    data: {
      email: 'admin@ctms.edu',
      passwordHash: 'hash', // to be hashed
      name: 'System Admin',
      roles: ['Admin'],
    },
  });

  const lecturer = await prisma.user.create({
    data: {
      email: 'lecturer@ctms.edu',
      passwordHash: 'hash',
      name: 'Dr. Smith',
      roles: ['Lecturer'],
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
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
