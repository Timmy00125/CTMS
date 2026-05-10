import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GradeStatus } from '@prisma/client';
import { mapScoreToGrade } from '../common/utils/grade-mapping';
import { BulkUploadResult } from '../common/dto/bulk-upload-result.dto';
import {
  AuditLogService,
  AuditAction,
  AuditResource,
} from '../audit/audit-log.service';

@Injectable()
export class GradeService {
  private readonly logger = new Logger(GradeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async submitGrade(
    dto: {
      studentId: string;
      courseId: string;
      semesterId: string;
      score: number;
    },
    userId: string,
  ) {
    if (!Number.isInteger(dto.score) || dto.score < 0 || dto.score > 100) {
      throw new BadRequestException(
        'Score must be an integer between 0 and 100',
      );
    }

    const course = await this.prisma.course.findUnique({
      where: { id: dto.courseId },
    });
    if (!course) {
      throw new BadRequestException('Course not found');
    }

    const student = await this.prisma.student.findUnique({
      where: { id: dto.studentId },
    });
    if (!student) {
      throw new BadRequestException('Student not found');
    }

    const semester = await this.prisma.semester.findUnique({
      where: { id: dto.semesterId },
    });
    if (!semester) {
      throw new BadRequestException('Semester not found');
    }

    const { gradeLetter, gradePoints } = mapScoreToGrade(dto.score);

    const grade = await this.prisma.grade.create({
      data: {
        studentId: dto.studentId,
        courseId: dto.courseId,
        semesterId: dto.semesterId,
        score: dto.score,
        gradeLetter,
        gradePoints,
        status: GradeStatus.DRAFT,
      },
    });

    await this.prisma.gradeAuditLog.create({
      data: {
        gradeId: grade.id,
        userId,
        oldScore: null,
        newScore: dto.score,
        reason: 'Initial grade submission',
      },
    });

    await this.auditLogService.logGradeSubmission(
      userId,
      grade.id,
      dto.studentId,
      dto.courseId,
    );

    this.logger.log(
      `Grade submitted: ${grade.id} for student ${dto.studentId} in course ${dto.courseId}`,
    );

    return grade;
  }

  async bulkSubmitGrades(
    grades: {
      studentId: string;
      courseId: string;
      semesterId: string;
      score: number;
    }[],
    userId: string,
  ): Promise<BulkUploadResult> {
    let created = 0;
    const errors: { row: number; field?: string; message: string }[] = [];

    for (let i = 0; i < grades.length; i++) {
      const dto = grades[i];
      try {
        if (!Number.isInteger(dto.score) || dto.score < 0 || dto.score > 100) {
          errors.push({
            row: i + 1,
            field: 'score',
            message: 'Score must be an integer between 0 and 100',
          });
          continue;
        }

        const course = await this.prisma.course.findUnique({
          where: { id: dto.courseId },
        });
        if (!course) {
          errors.push({
            row: i + 1,
            field: 'courseId',
            message: 'Course not found',
          });
          continue;
        }

        const student = await this.prisma.student.findUnique({
          where: { id: dto.studentId },
        });
        if (!student) {
          errors.push({
            row: i + 1,
            field: 'studentId',
            message: 'Student not found',
          });
          continue;
        }

        const semester = await this.prisma.semester.findUnique({
          where: { id: dto.semesterId },
        });
        if (!semester) {
          errors.push({
            row: i + 1,
            field: 'semesterId',
            message: 'Semester not found',
          });
          continue;
        }

        const { gradeLetter, gradePoints } = mapScoreToGrade(dto.score);

        const grade = await this.prisma.grade.create({
          data: {
            studentId: dto.studentId,
            courseId: dto.courseId,
            semesterId: dto.semesterId,
            score: dto.score,
            gradeLetter,
            gradePoints,
            status: GradeStatus.DRAFT,
          },
        });

        await this.prisma.gradeAuditLog.create({
          data: {
            gradeId: grade.id,
            userId,
            oldScore: null,
            newScore: dto.score,
            reason: 'Initial grade submission',
          },
        });

        created++;
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
          errors.push({
            row: i + 1,
            field: 'unique',
            message: 'Grade already exists for this student/course/semester',
          });
        } else {
          errors.push({
            row: i + 1,
            message: 'Failed to create grade',
          });
        }
      }
    }

    if (created > 0) {
      await this.auditLogService.log(
        userId,
        AuditAction.BULK_UPLOAD,
        AuditResource.Grade,
        `Bulk submitted ${created} grades`,
      );
    }

    this.logger.log(
      `Bulk grade submission: ${created} created, ${errors.length} errors`,
    );

    return { created, errors };
  }

  async submitForApproval(
    courseId: string,
    semesterId: string,
    userId: string,
  ): Promise<{ updated: number }> {
    const draftGrades = await this.prisma.grade.findMany({
      where: {
        courseId,
        semesterId,
        status: GradeStatus.DRAFT,
      },
    });

    if (draftGrades.length === 0) {
      return { updated: 0 };
    }

    const { count } = await this.prisma.grade.updateMany({
      where: {
        courseId,
        semesterId,
        status: GradeStatus.DRAFT,
      },
      data: { status: GradeStatus.PENDING_APPROVAL },
    });

    await this.auditLogService.log(
      userId,
      AuditAction.GRADE_SUBMISSION,
      AuditResource.Grade,
      `Submitted ${count} grades for approval for course ${courseId}, semester ${semesterId}`,
    );

    this.logger.log(
      `Submitted ${count} grades for approval: course ${courseId}, semester ${semesterId}`,
    );

    return { updated: count };
  }

  async publishGrades(
    courseId: string,
    semesterId: string,
    userId: string,
  ): Promise<{ updated: number }> {
    const pendingGrades = await this.prisma.grade.findMany({
      where: {
        courseId,
        semesterId,
        status: GradeStatus.PENDING_APPROVAL,
      },
    });

    if (pendingGrades.length === 0) {
      return { updated: 0 };
    }

    const { count } = await this.prisma.grade.updateMany({
      where: {
        courseId,
        semesterId,
        status: GradeStatus.PENDING_APPROVAL,
      },
      data: { status: GradeStatus.PUBLISHED },
    });

    await this.auditLogService.logGradePublication(
      userId,
      courseId,
      semesterId,
      count,
    );

    this.logger.log(
      `Published ${count} grades: course ${courseId}, semester ${semesterId}`,
    );

    return { updated: count };
  }

  async amendGrade(
    gradeId: string,
    dto: { score: number; reason?: string },
    userId: string,
  ) {
    if (!Number.isInteger(dto.score) || dto.score < 0 || dto.score > 100) {
      throw new BadRequestException(
        'Score must be an integer between 0 and 100',
      );
    }

    const existingGrade = await this.prisma.grade.findUnique({
      where: { id: gradeId },
    });

    if (!existingGrade) {
      throw new BadRequestException('Grade not found');
    }

    const { gradeLetter, gradePoints } = mapScoreToGrade(dto.score);

    const updatedGrade = await this.prisma.grade.update({
      where: { id: gradeId },
      data: {
        score: dto.score,
        gradeLetter,
        gradePoints,
      },
    });

    await this.prisma.gradeAuditLog.create({
      data: {
        gradeId,
        userId,
        oldScore: existingGrade.score,
        newScore: dto.score,
        reason: dto.reason || 'Grade amended',
      },
    });

    await this.auditLogService.logGradeAmendment(
      userId,
      gradeId,
      existingGrade.score,
      dto.score,
    );

    this.logger.log(
      `Grade amended: ${gradeId}, score ${existingGrade.score} -> ${dto.score}`,
    );

    return updatedGrade;
  }

  async getGradesForStudent(studentId: string) {
    return this.prisma.grade.findMany({
      where: {
        studentId,
        status: GradeStatus.PUBLISHED,
      },
      include: {
        course: {
          select: { code: true, title: true, creditUnits: true },
        },
        semester: {
          select: { name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGradesForCourse(courseId: string, semesterId: string) {
    return this.prisma.grade.findMany({
      where: {
        courseId,
        semesterId,
      },
      include: {
        student: {
          select: { matriculationNo: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getGradeAuditLog(gradeId: string) {
    return this.prisma.gradeAuditLog.findMany({
      where: { gradeId },
      include: {
        user: {
          select: { name: true, email: true },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }
}
