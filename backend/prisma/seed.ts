import { PrismaClient, GradeStatus } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// ─── Grade Mapping (matches GradeService.mapScoreToGrade) ────────────────────
function mapScoreToGrade(score: number): {
  gradeLetter: string;
  gradePoints: number;
} {
  if (score >= 70) return { gradeLetter: 'A', gradePoints: 5.0 };
  if (score >= 60) return { gradeLetter: 'B', gradePoints: 4.0 };
  if (score >= 50) return { gradeLetter: 'C', gradePoints: 3.0 };
  if (score >= 45) return { gradeLetter: 'D', gradePoints: 2.0 };
  if (score >= 40) return { gradeLetter: 'E', gradePoints: 1.0 };
  return { gradeLetter: 'F', gradePoints: 0.0 };
}

// ─── Utility ─────────────────────────────────────────────────────────────────
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, n);
}

// ─── First / Last Names for realistic data ───────────────────────────────────
const firstNames = [
  'Emeka', 'Fatima', 'Chinedu', 'Aisha', 'Obinna', 'Zainab', 'Tunde',
  'Ngozi', 'Ibrahim', 'Chioma', 'Yusuf', 'Amara', 'Kola', 'Halima',
  'Uche', 'Blessing', 'Chukwuemeka', 'Funke', 'Ifeanyi', 'Maryam',
  'Oluwaseun', 'Amina', 'Ikenna', 'Grace', 'Ahmed', 'Chidinma',
  'Olumide', 'Hauwa', 'Emmanuel', 'Nneka', 'Abubakar', 'Yetunde',
  'Daniel', 'Kemi', 'Joseph', 'Adaeze', 'Musa', 'Titilayo',
  'Samuel', 'Rashidat', 'David', 'Chiamaka', 'Abdullahi', 'Folashade',
  'Michael', 'Olayinka', 'Peter', 'Ifeoma', 'Joshua', 'Bukola',
];

const lastNames = [
  'Okonkwo', 'Abubakar', 'Eze', 'Bello', 'Nnamdi', 'Mohammed',
  'Adeyemi', 'Ibrahim', 'Chukwu', 'Olawale', 'Igwe', 'Usman',
  'Okafor', 'Aliyu', 'Nwosu', 'Abdullahi', 'Onyeka', 'Garba',
  'Obi', 'Lawal', 'Chineke', 'Suleiman', 'Ekwueme', 'Danjuma',
  'Okechukwu', 'Balarabe', 'Ugwu', 'Yusuf', 'Anayo', 'Adamu',
];

// ─── Department IDs (consistent across the seed) ─────────────────────────────
const DEPT_CS = 'dept-cs-001';
const DEPT_MATH = 'dept-math-002';
const DEPT_PHY = 'dept-phy-003';
const DEPT_STAT = 'dept-stat-004';

// ─── Courses Data ────────────────────────────────────────────────────────────
const coursesData = [
  // Computer Science courses
  { code: 'CSC101', title: 'Introduction to Computer Science', creditUnits: 3, departmentId: DEPT_CS, level: 100 },
  { code: 'CSC102', title: 'Introduction to Programming', creditUnits: 3, departmentId: DEPT_CS, level: 100 },
  { code: 'CSC201', title: 'Computer Programming I (C++)', creditUnits: 3, departmentId: DEPT_CS, level: 200 },
  { code: 'CSC202', title: 'Data Structures and Algorithms', creditUnits: 3, departmentId: DEPT_CS, level: 200 },
  { code: 'CSC203', title: 'Discrete Mathematics', creditUnits: 2, departmentId: DEPT_CS, level: 200 },
  { code: 'CSC204', title: 'Computer Architecture', creditUnits: 2, departmentId: DEPT_CS, level: 200 },
  { code: 'CSC301', title: 'Operating Systems', creditUnits: 3, departmentId: DEPT_CS, level: 300 },
  { code: 'CSC302', title: 'Database Management Systems', creditUnits: 3, departmentId: DEPT_CS, level: 300 },
  { code: 'CSC303', title: 'Software Engineering', creditUnits: 3, departmentId: DEPT_CS, level: 300 },
  { code: 'CSC304', title: 'Computer Networks', creditUnits: 3, departmentId: DEPT_CS, level: 300 },
  { code: 'CSC305', title: 'Artificial Intelligence', creditUnits: 2, departmentId: DEPT_CS, level: 300 },
  { code: 'CSC401', title: 'Compiler Construction', creditUnits: 3, departmentId: DEPT_CS, level: 400 },
  { code: 'CSC402', title: 'Distributed Systems', creditUnits: 3, departmentId: DEPT_CS, level: 400 },
  { code: 'CSC403', title: 'Machine Learning', creditUnits: 3, departmentId: DEPT_CS, level: 400 },
  { code: 'CSC404', title: 'Project / Thesis', creditUnits: 6, departmentId: DEPT_CS, level: 400 },
  // Mathematics courses
  { code: 'MAT101', title: 'Elementary Mathematics I', creditUnits: 4, departmentId: DEPT_MATH, level: 100 },
  { code: 'MAT102', title: 'Elementary Mathematics II', creditUnits: 4, departmentId: DEPT_MATH, level: 100 },
  { code: 'MAT201', title: 'Mathematical Methods I', creditUnits: 3, departmentId: DEPT_MATH, level: 200 },
  { code: 'MAT202', title: 'Linear Algebra', creditUnits: 3, departmentId: DEPT_MATH, level: 200 },
  { code: 'MAT203', title: 'Real Analysis I', creditUnits: 3, departmentId: DEPT_MATH, level: 200 },
  { code: 'MAT301', title: 'Abstract Algebra I', creditUnits: 3, departmentId: DEPT_MATH, level: 300 },
  { code: 'MAT302', title: 'Complex Analysis', creditUnits: 3, departmentId: DEPT_MATH, level: 300 },
  { code: 'MAT303', title: 'Numerical Analysis', creditUnits: 3, departmentId: DEPT_MATH, level: 300 },
  { code: 'MAT401', title: 'Functional Analysis', creditUnits: 3, departmentId: DEPT_MATH, level: 400 },
  { code: 'MAT402', title: 'Topology', creditUnits: 3, departmentId: DEPT_MATH, level: 400 },
  // Physics courses
  { code: 'PHY101', title: 'General Physics I', creditUnits: 3, departmentId: DEPT_PHY, level: 100 },
  { code: 'PHY102', title: 'General Physics II', creditUnits: 3, departmentId: DEPT_PHY, level: 100 },
  { code: 'PHY201', title: 'Mechanics', creditUnits: 3, departmentId: DEPT_PHY, level: 200 },
  { code: 'PHY202', title: 'Electromagnetism', creditUnits: 3, departmentId: DEPT_PHY, level: 200 },
  { code: 'PHY301', title: 'Quantum Mechanics', creditUnits: 3, departmentId: DEPT_PHY, level: 300 },
  { code: 'PHY302', title: 'Thermodynamics', creditUnits: 3, departmentId: DEPT_PHY, level: 300 },
  // Statistics courses
  { code: 'STA101', title: 'Introduction to Statistics', creditUnits: 3, departmentId: DEPT_STAT, level: 100 },
  { code: 'STA201', title: 'Probability Theory', creditUnits: 3, departmentId: DEPT_STAT, level: 200 },
  { code: 'STA202', title: 'Statistical Inference', creditUnits: 3, departmentId: DEPT_STAT, level: 200 },
  { code: 'STA301', title: 'Regression Analysis', creditUnits: 3, departmentId: DEPT_STAT, level: 300 },
  { code: 'STA302', title: 'Experimental Design', creditUnits: 3, departmentId: DEPT_STAT, level: 300 },
];

// ─── Generate Students ───────────────────────────────────────────────────────
function generateStudents(count: number) {
  const students: { matriculationNo: string; name: string; departmentId: string; level: number }[] = [];
  const departments = [DEPT_CS, DEPT_MATH, DEPT_PHY, DEPT_STAT];
  const levels = [100, 200, 300, 400];

  for (let i = 1; i <= count; i++) {
    const dept = departments[i % departments.length];
    const level = levels[Math.floor(i / (count / 4)) % levels.length];
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[(i * 7) % lastNames.length];
    const year = 21 + Math.floor(i / 50);

    students.push({
      matriculationNo: `${year}/${String(i).padStart(4, '0')}`,
      name: `${firstName} ${lastName}`,
      departmentId: dept,
      level,
    });
  }
  return students;
}

// ─── Main Seed ───────────────────────────────────────────────────────────────
async function main() {
  console.log('🌱 Starting comprehensive seed...\n');

  // Clean existing data in correct order (respect foreign keys)
  console.log('🧹 Cleaning existing data...');
  await prisma.gradeAuditLog.deleteMany();
  await prisma.systemAuditLog.deleteMany();
  await prisma.grade.deleteMany();
  await prisma.semester.deleteMany();
  await prisma.academicSession.deleteMany();
  await prisma.course.deleteMany();
  await prisma.student.deleteMany();
  await prisma.user.deleteMany();
  console.log('   ✅ Cleaned all tables\n');

  // ═══════════════════════════════════════════════════════════════════════════
  // 1. USERS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('👤 Creating Users...');
  const hashedPassword = await argon2.hash('password123');

  const usersData = [
    // Admins
    { email: 'admin@ctms.edu', name: 'System Administrator', roles: ['Admin'], departmentId: null },
    { email: 'admin2@ctms.edu', name: 'Adebayo Admin', roles: ['Admin'], departmentId: null },

    // Exam Officers
    { email: 'examofficer@ctms.edu', name: 'Jane Okonkwo', roles: ['ExamOfficer'], departmentId: DEPT_CS },
    { email: 'examofficer2@ctms.edu', name: 'Musa Bello', roles: ['ExamOfficer'], departmentId: DEPT_MATH },
    { email: 'examofficer3@ctms.edu', name: 'Fatima Ibrahim', roles: ['ExamOfficer'], departmentId: DEPT_PHY },
    { email: 'examofficer4@ctms.edu', name: 'Chinedu Eze', roles: ['ExamOfficer'], departmentId: DEPT_STAT },

    // Lecturers - CS Department
    { email: 'lecturer1@ctms.edu', name: 'Dr. Oluwaseun Adeyemi', roles: ['Lecturer'], departmentId: DEPT_CS },
    { email: 'lecturer2@ctms.edu', name: 'Prof. Chukwuemeka Nnamdi', roles: ['Lecturer'], departmentId: DEPT_CS },
    { email: 'lecturer3@ctms.edu', name: 'Dr. Aisha Mohammed', roles: ['Lecturer'], departmentId: DEPT_CS },
    { email: 'lecturer4@ctms.edu', name: 'Dr. Tunde Okafor', roles: ['Lecturer'], departmentId: DEPT_CS },
    { email: 'lecturer5@ctms.edu', name: 'Prof. Ngozi Igwe', roles: ['Lecturer'], departmentId: DEPT_CS },

    // Lecturers - Math Department
    { email: 'lecturer6@ctms.edu', name: 'Dr. Ibrahim Yusuf', roles: ['Lecturer'], departmentId: DEPT_MATH },
    { email: 'lecturer7@ctms.edu', name: 'Prof. Kola Adeyemi', roles: ['Lecturer'], departmentId: DEPT_MATH },
    { email: 'lecturer8@ctms.edu', name: 'Dr. Halima Bello', roles: ['Lecturer'], departmentId: DEPT_MATH },

    // Lecturers - Physics Department
    { email: 'lecturer9@ctms.edu', name: 'Dr. Uche Nwosu', roles: ['Lecturer'], departmentId: DEPT_PHY },
    { email: 'lecturer10@ctms.edu', name: 'Prof. Obinna Chukwu', roles: ['Lecturer'], departmentId: DEPT_PHY },

    // Lecturers - Statistics Department
    { email: 'lecturer11@ctms.edu', name: 'Dr. Funke Lawal', roles: ['Lecturer'], departmentId: DEPT_STAT },
    { email: 'lecturer12@ctms.edu', name: 'Dr. Ifeanyi Suleiman', roles: ['Lecturer'], departmentId: DEPT_STAT },

    // Multi-role users (Admin + Lecturer)
    { email: 'multiadmin@ctms.edu', name: 'Dr. Grace Okechukwu', roles: ['Admin', 'Lecturer'], departmentId: DEPT_CS },
    { email: 'multiofficer@ctms.edu', name: 'Emmanuel Danjuma', roles: ['ExamOfficer', 'Lecturer'], departmentId: DEPT_MATH },
  ];

  const users = [];
  for (const u of usersData) {
    const user = await prisma.user.create({
      data: {
        email: u.email,
        passwordHash: hashedPassword,
        name: u.name,
        roles: u.roles as any[],
        departmentId: u.departmentId,
      },
    });
    users.push(user);
  }

  // Separate users by role for later reference
  const admins = users.filter((u) => u.roles.includes('Admin'));
  const lecturers = users.filter((u) => u.roles.includes('Lecturer'));
  const examOfficers = users.filter((u) => u.roles.includes('ExamOfficer'));
  const csLecturers = lecturers.filter((u) => u.departmentId === DEPT_CS);
  const mathLecturers = lecturers.filter((u) => u.departmentId === DEPT_MATH);
  const phyLecturers = lecturers.filter((u) => u.departmentId === DEPT_PHY);
  const statLecturers = lecturers.filter((u) => u.departmentId === DEPT_STAT);

  console.log(`   ✅ Created ${users.length} users`);
  console.log(`      - ${admins.length} admins`);
  console.log(`      - ${examOfficers.length} exam officers`);
  console.log(`      - ${lecturers.length} lecturers\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 2. ACADEMIC SESSIONS & SEMESTERS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📅 Creating Academic Sessions & Semesters...');

  const sessionsData = [
    { name: '2021/2022', startDate: '2021-09-01', endDate: '2022-06-30', isActive: false },
    { name: '2022/2023', startDate: '2022-09-01', endDate: '2023-06-30', isActive: false },
    { name: '2023/2024', startDate: '2023-09-01', endDate: '2024-06-30', isActive: false },
    { name: '2024/2025', startDate: '2024-09-01', endDate: '2025-06-30', isActive: true },
  ];

  const sessions = [];
  const semesters = [];

  for (const s of sessionsData) {
    const session = await prisma.academicSession.create({
      data: {
        name: s.name,
        startDate: new Date(s.startDate),
        endDate: new Date(s.endDate),
        isActive: s.isActive,
      },
    });
    sessions.push(session);

    const sem1 = await prisma.semester.create({
      data: {
        name: 'First Semester',
        academicSessionId: session.id,
        isActive: s.isActive, // first semester is active if session is active
      },
    });
    semesters.push(sem1);

    const sem2 = await prisma.semester.create({
      data: {
        name: 'Second Semester',
        academicSessionId: session.id,
        isActive: false,
      },
    });
    semesters.push(sem2);
  }

  console.log(`   ✅ Created ${sessions.length} academic sessions with ${semesters.length} semesters\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 3. STUDENTS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('🎓 Creating Students...');

  const studentCount = 120;
  const studentsData = generateStudents(studentCount);

  const students = [];
  for (const sd of studentsData) {
    const student = await prisma.student.create({
      data: {
        matriculationNo: sd.matriculationNo,
        name: sd.name,
        departmentId: sd.departmentId,
        level: sd.level,
      },
    });
    students.push(student);
  }

  const csStudents = students.filter((s) => s.departmentId === DEPT_CS);
  const mathStudents = students.filter((s) => s.departmentId === DEPT_MATH);
  const phyStudents = students.filter((s) => s.departmentId === DEPT_PHY);
  const statStudents = students.filter((s) => s.departmentId === DEPT_STAT);

  console.log(`   ✅ Created ${students.length} students`);
  console.log(`      - CS: ${csStudents.length}, Math: ${mathStudents.length}, Physics: ${phyStudents.length}, Stats: ${statStudents.length}\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 4. COURSES
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📚 Creating Courses...');

  const courses = [];
  for (const cd of coursesData) {
    // Assign lecturer based on department
    let lecturerId: string | null = null;
    if (cd.departmentId === DEPT_CS && csLecturers.length > 0) {
      lecturerId = pickRandom(csLecturers).id;
    } else if (cd.departmentId === DEPT_MATH && mathLecturers.length > 0) {
      lecturerId = pickRandom(mathLecturers).id;
    } else if (cd.departmentId === DEPT_PHY && phyLecturers.length > 0) {
      lecturerId = pickRandom(phyLecturers).id;
    } else if (cd.departmentId === DEPT_STAT && statLecturers.length > 0) {
      lecturerId = pickRandom(statLecturers).id;
    }

    const course = await prisma.course.create({
      data: {
        code: cd.code,
        title: cd.title,
        creditUnits: cd.creditUnits,
        departmentId: cd.departmentId,
        lecturerId,
      },
    });
    courses.push(course);
  }

  // Also create a few unassigned courses (for testing null lecturerId)
  const unassignedCourse = await prisma.course.create({
    data: {
      code: 'GST101',
      title: 'Use of English',
      creditUnits: 2,
      departmentId: DEPT_CS,
      lecturerId: null,
    },
  });
  courses.push(unassignedCourse);

  const unassignedCourse2 = await prisma.course.create({
    data: {
      code: 'GST201',
      title: 'Entrepreneurship Studies',
      creditUnits: 2,
      departmentId: DEPT_MATH,
      lecturerId: null,
    },
  });
  courses.push(unassignedCourse2);

  console.log(`   ✅ Created ${courses.length} courses (including 2 unassigned)\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 5. GRADES (the bulk of the seed data)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📝 Creating Grades...');

  // Helper: get courses for a given department and level range
  function getCoursesForStudent(deptId: string, level: number) {
    return courses.filter(
      (c) => c.departmentId === deptId && coursesData.some((cd) => cd.code === c.code && cd.level <= level),
    );
  }

  let totalGrades = 0;
  let draftCount = 0;
  let pendingCount = 0;
  let publishedCount = 0;
  const allGrades: Awaited<ReturnType<typeof prisma.grade.create>>[] = [];

  // Identify the active semester (for DRAFT/PENDING grades)
  const activeSemester = semesters.find((s) => s.isActive);
  // Identify the most recent non-active semesters (for PENDING_APPROVAL)
  const recentSemesters = semesters.filter((s) => !s.isActive).slice(-4, -2);
  // Older semesters (for PUBLISHED)
  const olderSemesters = semesters.filter((s) => !s.isActive).slice(0, -4);

  // For each student, create grades across multiple semesters
  for (const student of students) {
    const studentCourses = getCoursesForStudent(student.departmentId, student.level);

    // Determine which semesters to grade based on student level
    let semestersPool: typeof semesters;
    if (student.level >= 400) {
      // 400-level: grades in all semesters
      semestersPool = semesters;
    } else if (student.level >= 300) {
      // 300-level: grades in 6 semesters
      semestersPool = semesters.slice(0, 6);
    } else if (student.level >= 200) {
      // 200-level: grades in 4 semesters
      semestersPool = semesters.slice(0, 4);
    } else {
      // 100-level: grades in 2 semesters
      semestersPool = semesters.slice(0, 2);
    }

    for (const semester of semestersPool) {
      // Pick 4-6 courses per semester for this student
      const coursesThisSemester = pickRandomN(studentCourses, randomInt(4, Math.min(6, studentCourses.length)));

      for (const course of coursesThisSemester) {
        // Generate a realistic score distribution
        const scoreRoll = Math.random();
        let score: number;
        if (scoreRoll < 0.05) score = randomInt(0, 39); // F - 5%
        else if (scoreRoll < 0.12) score = randomInt(40, 44); // E - 7%
        else if (scoreRoll < 0.22) score = randomInt(45, 49); // D - 10%
        else if (scoreRoll < 0.40) score = randomInt(50, 59); // C - 18%
        else if (scoreRoll < 0.65) score = randomInt(60, 69); // B - 25%
        else score = randomInt(70, 95); // A - 35%

        const { gradeLetter, gradePoints } = mapScoreToGrade(score);

        // Determine grade status based on semester
        let status: GradeStatus;
        if (activeSemester && semester.id === activeSemester.id) {
          // Active semester: mix of DRAFT and PENDING_APPROVAL
          const r = Math.random();
          if (r < 0.5) {
            status = GradeStatus.DRAFT;
            draftCount++;
          } else {
            status = GradeStatus.PENDING_APPROVAL;
            pendingCount++;
          }
        } else if (recentSemesters.some((s) => s.id === semester.id)) {
          // Recent semesters: mostly PUBLISHED, some PENDING_APPROVAL
          const r = Math.random();
          if (r < 0.8) {
            status = GradeStatus.PUBLISHED;
            publishedCount++;
          } else {
            status = GradeStatus.PENDING_APPROVAL;
            pendingCount++;
          }
        } else {
          // Older semesters: all PUBLISHED
          status = GradeStatus.PUBLISHED;
          publishedCount++;
        }

        try {
          const grade = await prisma.grade.create({
            data: {
              studentId: student.id,
              courseId: course.id,
              semesterId: semester.id,
              score,
              gradeLetter,
              gradePoints,
              status,
            },
          });
          allGrades.push(grade);
          totalGrades++;
        } catch (e: any) {
          // Skip unique constraint violations (student/course/semester combo)
          if (e.code !== 'P2002') {
            console.error(`   ⚠️  Error creating grade: ${e.message}`);
          }
        }
      }
    }
  }

  console.log(`   ✅ Created ${totalGrades} grades`);
  console.log(`      - DRAFT: ${draftCount}`);
  console.log(`      - PENDING_APPROVAL: ${pendingCount}`);
  console.log(`      - PUBLISHED: ${publishedCount}\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 6. GRADE AUDIT LOGS (amendment history)
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📋 Creating Grade Audit Logs...');

  let auditLogCount = 0;

  // Initial submission audit logs for all grades
  for (const grade of allGrades) {
    // Find the lecturer who submitted (based on course assignment)
    const course = courses.find((c) => c.id === grade.courseId);
    const submitterId = course?.lecturerId || admins[0].id;

    await prisma.gradeAuditLog.create({
      data: {
        gradeId: grade.id,
        userId: submitterId,
        oldScore: null,
        newScore: grade.score,
        reason: 'Initial grade submission',
        timestamp: new Date(grade.createdAt.getTime() - randomInt(1, 30) * 24 * 60 * 60 * 1000),
      },
    });
    auditLogCount++;
  }

  // Amendment audit logs for ~15% of published grades (simulate grade corrections)
  const publishedGrades = allGrades.filter((g) => g.status === GradeStatus.PUBLISHED);
  const amendedGrades = pickRandomN(publishedGrades, Math.floor(publishedGrades.length * 0.15));

  for (const grade of amendedGrades) {
    const course = courses.find((c) => c.id === grade.courseId);
    const amenderId = course?.lecturerId || admins[0].id;

    // Generate amended score
    const oldScore = grade.score;
    const scoreChange = randomInt(-10, 15);
    const newScore = Math.max(0, Math.min(100, oldScore + scoreChange));
    const { gradeLetter, gradePoints } = mapScoreToGrade(newScore);

    // Update the grade
    await prisma.grade.update({
      where: { id: grade.id },
      data: {
        score: newScore,
        gradeLetter,
        gradePoints,
      },
    });

    // Create amendment audit log
    const amendmentReasons = [
      'Score correction after re-marking',
      'Arithmetic error in total calculation',
      'Missing CA component added',
      'Score updated per HOD directive',
      'Corrected after student complaint',
      'Exam script re-evaluated',
      'Error in score entry corrected',
    ];

    await prisma.gradeAuditLog.create({
      data: {
        gradeId: grade.id,
        userId: amenderId,
        oldScore,
        newScore,
        reason: pickRandom(amendmentReasons),
        timestamp: new Date(grade.createdAt.getTime() + randomInt(5, 60) * 24 * 60 * 60 * 1000),
      },
    });
    auditLogCount++;
  }

  console.log(`   ✅ Created ${auditLogCount} grade audit logs`);
  console.log(`      - ${auditLogCount - amendedGrades.length} initial submissions`);
  console.log(`      - ${amendedGrades.length} amendments\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // 7. SYSTEM AUDIT LOGS
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('📊 Creating System Audit Logs...');

  const systemLogs: { userId: string; action: string; resource: string; details: string; timestamp: Date }[] = [];

  // Bulk upload logs
  for (const admin of admins) {
    systemLogs.push({
      userId: admin.id,
      action: 'BULK_UPLOAD',
      resource: 'Student',
      details: `Bulk uploaded ${studentCount} students`,
      timestamp: new Date('2024-09-01T10:00:00Z'),
    });
    systemLogs.push({
      userId: admin.id,
      action: 'BULK_UPLOAD',
      resource: 'Course',
      details: `Bulk uploaded ${courses.length} courses`,
      timestamp: new Date('2024-09-01T10:30:00Z'),
    });
  }

  // Grade publication logs
  for (const examOfficer of examOfficers) {
    for (const session of sessions) {
      for (const sem of semesters.filter((s) => s.academicSessionId === session.id)) {
        systemLogs.push({
          userId: examOfficer.id,
          action: 'GRADE_PUBLICATION',
          resource: 'Grade',
          details: `Published grades for ${session.name} ${sem.name}`,
          timestamp: new Date(
            session.startDate.getTime() + (sem.name === 'First Semester' ? 90 : 180) * 24 * 60 * 60 * 1000,
          ),
        });
      }
    }
  }

  // Role change logs
  systemLogs.push({
    userId: admins[0].id,
    action: 'ROLE_CHANGE',
    resource: 'User',
    details: `Assigned ExamOfficer role to examofficer2@ctms.edu`,
    timestamp: new Date('2024-08-15T14:00:00Z'),
  });
  systemLogs.push({
    userId: admins[0].id,
    action: 'ROLE_CHANGE',
    resource: 'User',
    details: `Assigned Lecturer role to multiofficer@ctms.edu`,
    timestamp: new Date('2024-08-16T09:00:00Z'),
  });

  // Course assignment logs
  for (const course of courses.filter((c) => c.lecturerId)) {
    systemLogs.push({
      userId: admins[0].id,
      action: 'COURSE_ASSIGNMENT',
      resource: 'Course',
      details: `Assigned ${course.code} - ${course.title} to lecturer ${course.lecturerId}`,
      timestamp: new Date('2024-09-01T11:00:00Z'),
    });
  }

  // Login logs
  for (const user of users) {
    systemLogs.push({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'Auth',
      details: `User ${user.email} logged in`,
      timestamp: new Date('2024-11-15T08:00:00Z'),
    });
    systemLogs.push({
      userId: user.id,
      action: 'USER_LOGIN',
      resource: 'Auth',
      details: `User ${user.email} logged in`,
      timestamp: new Date('2024-11-20T09:30:00Z'),
    });
  }

  // Amendment window logs
  systemLogs.push({
    userId: admins[0].id,
    action: 'AMENDMENT_WINDOW_OPEN',
    resource: 'Grade',
    details: 'Opened amendment window for CSC301 grades, 2024/2025 First Semester',
    timestamp: new Date('2025-01-10T10:00:00Z'),
  });
  systemLogs.push({
    userId: admins[0].id,
    action: 'AMENDMENT_WINDOW_CLOSE',
    resource: 'Grade',
    details: 'Closed amendment window for CSC301 grades',
    timestamp: new Date('2025-01-17T10:00:00Z'),
  });

  // Create all system audit logs
  for (const log of systemLogs) {
    await prisma.systemAuditLog.create({ data: log });
  }

  console.log(`   ✅ Created ${systemLogs.length} system audit logs\n`);

  // ═══════════════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════════════
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🎉 SEED COMPLETED SUCCESSFULLY!');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Data Summary:');
  console.log(`   Users:              ${users.length}`);
  console.log(`   Students:           ${students.length}`);
  console.log(`   Courses:            ${courses.length}`);
  console.log(`   Academic Sessions:  ${sessions.length}`);
  console.log(`   Semesters:          ${semesters.length}`);
  console.log(`   Grades:             ${totalGrades}`);
  console.log(`   Grade Audit Logs:   ${auditLogCount}`);
  console.log(`   System Audit Logs:  ${systemLogs.length}`);
  console.log('');
  console.log('🔐 Login Credentials (all passwords: password123):');
  console.log('   ─────────────────────────────────────────────────');
  console.log('   Admin:           admin@ctms.edu');
  console.log('   Admin 2:         admin2@ctms.edu');
  console.log('   Exam Officer CS: examofficer@ctms.edu');
  console.log('   Exam Officer MA: examofficer2@ctms.edu');
  console.log('   Exam Officer PH: examofficer3@ctms.edu');
  console.log('   Exam Officer ST: examofficer4@ctms.edu');
  console.log('   Lecturer CS:     lecturer1@ctms.edu');
  console.log('   Lecturer CS:     lecturer2@ctms.edu');
  console.log('   Lecturer MA:     lecturer6@ctms.edu');
  console.log('   Multi Admin:     multiadmin@ctms.edu');
  console.log('   Multi Officer:   multiofficer@ctms.edu');
  console.log('');
  console.log('📁 Departments:');
  console.log(`   CS:     ${DEPT_CS}`);
  console.log(`   Math:   ${DEPT_MATH}`);
  console.log(`   Physics: ${DEPT_PHY}`);
  console.log(`   Stats:  ${DEPT_STAT}`);
  console.log('');
  console.log('📅 Sessions: 2021/2022, 2022/2023, 2023/2024, 2024/2025 (active)');
  console.log('');
  console.log('🎯 Grade Distribution:');
  console.log(`   DRAFT:            ${draftCount}`);
  console.log(`   PENDING_APPROVAL: ${pendingCount}`);
  console.log(`   PUBLISHED:        ${publishedCount}`);
  console.log('═══════════════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
