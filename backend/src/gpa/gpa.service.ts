import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradeStatus } from '@prisma/client';

export interface GpaResult {
  gpa: number | null;
  totalCreditUnits: number;
  totalGradePoints: number;
}

export interface CgpaResult {
  cgpa: number | null;
  totalCreditUnits: number;
  totalGradePoints: number;
}

@Injectable()
export class GpaService {
  constructor(private readonly prisma: PrismaService) {}

  async calculateSemesterGpa(
    studentId: string,
    semesterId: string,
  ): Promise<GpaResult> {
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        semesterId,
        status: GradeStatus.PUBLISHED,
      },
      include: {
        course: {
          select: {
            creditUnits: true,
            code: true,
            title: true,
          },
        },
      },
    });

    return this.computeGpa(grades);
  }

  async calculateCgpa(studentId: string): Promise<CgpaResult> {
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        status: GradeStatus.PUBLISHED,
      },
      include: {
        course: {
          select: {
            creditUnits: true,
            code: true,
            title: true,
          },
        },
      },
    });

    const result = this.computeGpa(grades);

    return {
      cgpa: result.gpa,
      totalCreditUnits: result.totalCreditUnits,
      totalGradePoints: result.totalGradePoints,
    };
  }

  async calculateSessionCgpa(
    studentId: string,
    academicSessionId: string,
  ): Promise<CgpaResult> {
    const grades = await this.prisma.grade.findMany({
      where: {
        studentId,
        status: GradeStatus.PUBLISHED,
        semester: {
          academicSessionId,
        },
      },
      include: {
        course: {
          select: {
            creditUnits: true,
            code: true,
            title: true,
          },
        },
      },
    });

    const result = this.computeGpa(grades);

    return {
      cgpa: result.gpa,
      totalCreditUnits: result.totalCreditUnits,
      totalGradePoints: result.totalGradePoints,
    };
  }

  async calculateBatchGpa(
    studentIds: string[],
    semesterId: string,
  ): Promise<Map<string, GpaResult>> {
    const result = new Map<string, GpaResult>();

    if (studentIds.length === 0) {
      return result;
    }

    const students = await this.prisma.student.findMany({
      where: {
        id: { in: studentIds },
      },
      include: {
        grades: {
          where: {
            semesterId,
            status: GradeStatus.PUBLISHED,
          },
          include: {
            course: {
              select: {
                creditUnits: true,
              },
            },
          },
        },
      },
    });

    for (const student of students) {
      const gpaResult = this.computeGpa(student.grades);
      result.set(student.id, gpaResult);
    }

    return result;
  }

  private computeGpa(
    grades: Array<{
      gradePoints: number | null;
      course: { creditUnits: number };
    }>,
  ): GpaResult {
    if (!grades || grades.length === 0) {
      return {
        gpa: null,
        totalCreditUnits: 0,
        totalGradePoints: 0,
      };
    }

    let totalCreditUnits = 0;
    let totalGradePoints = 0;

    for (const grade of grades) {
      const creditUnits = grade.course.creditUnits;
      const gradePoints = grade.gradePoints ?? 0;

      totalCreditUnits += creditUnits;
      totalGradePoints += creditUnits * gradePoints;
    }

    if (totalCreditUnits === 0) {
      return {
        gpa: null,
        totalCreditUnits: 0,
        totalGradePoints: 0,
      };
    }

    const gpa = totalGradePoints / totalCreditUnits;

    return {
      gpa: Math.round(gpa * 100) / 100,
      totalCreditUnits,
      totalGradePoints: Math.round(totalGradePoints * 100) / 100,
    };
  }
}
