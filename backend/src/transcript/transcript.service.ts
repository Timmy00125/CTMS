import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradeStatus } from '@prisma/client';

export interface TranscriptCourse {
  gradeId: string;
  courseCode: string;
  courseTitle: string;
  creditUnits: number;
  score: number;
  gradeLetter: string | null;
  gradePoints: number | null;
  status: GradeStatus;
}

export interface TranscriptSemester {
  id: string;
  name: string;
  gpa: number | null;
  totalCreditUnits: number;
  totalGradePoints: number;
  courses: TranscriptCourse[];
}

export interface TranscriptAcademicSession {
  id: string;
  name: string;
  semesters: TranscriptSemester[];
}

export interface TranscriptData {
  student: {
    id: string;
    matriculationNo: string;
    name: string;
    departmentId: string;
    level: number;
  };
  academicSessions: TranscriptAcademicSession[];
  cgpa: number | null;
  totalCreditUnits: number;
  totalGradePoints: number;
}

@Injectable()
export class TranscriptService {
  constructor(private readonly prisma: PrismaService) {}

  async getStudentTranscript(studentId: string): Promise<TranscriptData> {
    const student = await this.prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        status: GradeStatus.PUBLISHED,
      },
      include: {
        course: {
          select: {
            id: true,
            code: true,
            title: true,
            creditUnits: true,
          },
        },
        semester: {
          include: {
            academicSession: true,
          },
        },
      },
      orderBy: {
        semester: {
          academicSession: {
            name: 'asc',
          },
        },
      },
    });

    const academicSessionsMap = new Map<
      string,
      {
        id: string;
        name: string;
        semestersMap: Map<
          string,
          {
            id: string;
            name: string;
            courses: TranscriptCourse[];
          }
        >;
      }
    >();

    for (const grade of grades) {
      const session = grade.semester.academicSession;
      const semester = grade.semester;

      if (!academicSessionsMap.has(session.id)) {
        academicSessionsMap.set(session.id, {
          id: session.id,
          name: session.name,
          semestersMap: new Map(),
        });
      }

      const sessionEntry = academicSessionsMap.get(session.id)!;

      if (!sessionEntry.semestersMap.has(semester.id)) {
        sessionEntry.semestersMap.set(semester.id, {
          id: semester.id,
          name: semester.name,
          courses: [],
        });
      }

      const semesterEntry = sessionEntry.semestersMap.get(semester.id)!;

      semesterEntry.courses.push({
        gradeId: grade.id,
        courseCode: grade.course.code,
        courseTitle: grade.course.title,
        creditUnits: grade.course.creditUnits,
        score: grade.score,
        gradeLetter: grade.gradeLetter,
        gradePoints: grade.gradePoints,
        status: grade.status,
      });
    }

    const academicSessions: TranscriptAcademicSession[] = [];
    let totalCreditUnits = 0;
    let totalGradePoints = 0;

    const sortedSessions = Array.from(academicSessionsMap.values()).sort(
      (a, b) => a.name.localeCompare(b.name),
    );

    for (const session of sortedSessions) {
      const semesters: TranscriptSemester[] = [];
      const sortedSemesters = Array.from(session.semestersMap.values()).sort(
        (a, b) => a.name.localeCompare(b.name),
      );

      for (const semester of sortedSemesters) {
        let semCreditUnits = 0;
        let semGradePoints = 0;

        for (const course of semester.courses) {
          semCreditUnits += course.creditUnits;
          semGradePoints += course.creditUnits * (course.gradePoints ?? 0);
        }

        const gpa =
          semCreditUnits > 0
            ? Math.round((semGradePoints / semCreditUnits) * 100) / 100
            : null;

        totalCreditUnits += semCreditUnits;
        totalGradePoints += semGradePoints;

        semesters.push({
          id: semester.id,
          name: semester.name,
          gpa,
          totalCreditUnits: semCreditUnits,
          totalGradePoints: Math.round(semGradePoints * 100) / 100,
          courses: semester.courses,
        });
      }

      academicSessions.push({
        id: session.id,
        name: session.name,
        semesters,
      });
    }

    const cgpa =
      totalCreditUnits > 0
        ? Math.round((totalGradePoints / totalCreditUnits) * 100) / 100
        : null;

    return {
      student: {
        id: student.id,
        matriculationNo: student.matriculationNo,
        name: student.name,
        departmentId: student.departmentId,
        level: student.level,
      },
      academicSessions,
      cgpa,
      totalCreditUnits,
      totalGradePoints: Math.round(totalGradePoints * 100) / 100,
    };
  }
}
