import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export enum AuditAction {
  BULK_UPLOAD = 'BULK_UPLOAD',
  ROLE_CHANGE = 'ROLE_CHANGE',
  COURSE_ASSIGNMENT = 'COURSE_ASSIGNMENT',
  GRADE_SUBMISSION = 'GRADE_SUBMISSION',
  GRADE_APPROVAL = 'GRADE_APPROVAL',
  GRADE_PUBLICATION = 'GRADE_PUBLICATION',
  GRADE_AMENDMENT = 'GRADE_AMENDMENT',
  USER_CREATED = 'USER_CREATED',
  STUDENT_CREATED = 'STUDENT_CREATED',
  COURSE_CREATED = 'COURSE_CREATED',
}

export enum AuditResource {
  User = 'User',
  Student = 'Student',
  Course = 'Course',
  Grade = 'Grade',
  System = 'System',
}

@Injectable()
export class AuditLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(
    userId: string,
    action: AuditAction,
    resource: AuditResource,
    details?: string,
  ) {
    return this.prisma.systemAuditLog.create({
      data: {
        userId,
        action,
        resource,
        details,
      },
    });
  }

  async logBulkUpload(
    userId: string,
    resource: AuditResource.Student | AuditResource.Course,
    count: number,
  ) {
    return this.log(
      userId,
      AuditAction.BULK_UPLOAD,
      resource,
      `Bulk uploaded ${count} ${resource.toLowerCase()}s`,
    );
  }

  async logRoleChange(
    adminId: string,
    targetUserId: string,
    oldRoles: string[],
    newRoles: string[],
  ) {
    return this.log(
      adminId,
      AuditAction.ROLE_CHANGE,
      AuditResource.User,
      `Changed roles for user ${targetUserId}: [${oldRoles.join(', ')}] -> [${newRoles.join(', ')}]`,
    );
  }

  async logCourseAssignment(
    adminId: string,
    courseId: string,
    lecturerId: string,
  ) {
    return this.log(
      adminId,
      AuditAction.COURSE_ASSIGNMENT,
      AuditResource.Course,
      `Assigned lecturer ${lecturerId} to course ${courseId}`,
    );
  }

  async logGradeSubmission(
    userId: string,
    gradeId: string,
    studentId: string,
    courseId: string,
  ) {
    return this.log(
      userId,
      AuditAction.GRADE_SUBMISSION,
      AuditResource.Grade,
      `Submitted grade ${gradeId} for student ${studentId} in course ${courseId}`,
    );
  }

  async logGradePublication(
    userId: string,
    courseId: string,
    semesterId: string,
    count: number,
  ) {
    return this.log(
      userId,
      AuditAction.GRADE_PUBLICATION,
      AuditResource.Grade,
      `Published ${count} grades for course ${courseId}, semester ${semesterId}`,
    );
  }

  async logGradeAmendment(
    userId: string,
    gradeId: string,
    oldScore: number,
    newScore: number,
  ) {
    return this.log(
      userId,
      AuditAction.GRADE_AMENDMENT,
      AuditResource.Grade,
      `Amended grade ${gradeId}: score ${oldScore} -> ${newScore}`,
    );
  }

  async getLogsForUser(userId: string) {
    return this.prisma.systemAuditLog.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getLogsForResource(resource: AuditResource) {
    return this.prisma.systemAuditLog.findMany({
      where: { resource },
      orderBy: { timestamp: 'desc' },
    });
  }

  async getRecentLogs(limit: number = 50) {
    return this.prisma.systemAuditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: limit,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }
}
