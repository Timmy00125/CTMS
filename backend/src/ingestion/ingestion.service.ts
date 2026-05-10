import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ValidationService } from './validation.service';
import { SanitizationService } from './sanitization.service';
import { BulkUploadResult } from '../common/dto/bulk-upload-result.dto';
import { AuditLogService, AuditResource } from '../audit/audit-log.service';

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validationService: ValidationService,
    private readonly sanitizationService: SanitizationService,
    private readonly auditLogService: AuditLogService,
  ) {}

  async bulkUploadStudents(
    rows: Record<string, unknown>[],
    userId: string,
  ): Promise<BulkUploadResult> {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
          if (this.sanitizationService.hasSqlInjection(value)) {
            throw new BadRequestException(
              `Row ${i + 1}, field "${key}": potential SQL injection detected`,
            );
          }
          if (this.sanitizationService.hasXssAttempt(value)) {
            throw new BadRequestException(
              `Row ${i + 1}, field "${key}": potential XSS attempt detected`,
            );
          }
        }
      }
    }

    const sanitizedRows = this.sanitizationService.sanitizeArray(rows);

    const { valid, errors } =
      await this.validationService.validateStudentRows(sanitizedRows);

    let created = 0;
    const dbErrors: { row: number; field?: string; message: string }[] = [];

    for (let i = 0; i < valid.length; i++) {
      const dto = valid[i];
      const originalRowIndex =
        rows.findIndex((r) => r.matriculationNo === dto.matriculationNo) + 1;

      try {
        await this.prisma.student.create({
          data: {
            matriculationNo: dto.matriculationNo,
            name: dto.name,
            departmentId: dto.departmentId,
            level: dto.level,
          },
        });
        created++;
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
          dbErrors.push({
            row: originalRowIndex || i + 1,
            field: 'matriculationNo',
            message: `Student with matriculation number ${dto.matriculationNo} already exists`,
          });
        } else {
          dbErrors.push({
            row: originalRowIndex || i + 1,
            message: 'Failed to create student record',
          });
        }
      }
    }

    if (created > 0) {
      await this.auditLogService.logBulkUpload(
        userId,
        AuditResource.Student,
        created,
      );
      this.logger.log(`Bulk uploaded ${created} students by user ${userId}`);
    }

    return { created, errors: [...errors, ...dbErrors] };
  }

  async bulkUploadCourses(
    rows: Record<string, unknown>[],
    userId: string,
  ): Promise<BulkUploadResult> {
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      for (const [key, value] of Object.entries(row)) {
        if (typeof value === 'string') {
          if (this.sanitizationService.hasSqlInjection(value)) {
            throw new BadRequestException(
              `Row ${i + 1}, field "${key}": potential SQL injection detected`,
            );
          }
          if (this.sanitizationService.hasXssAttempt(value)) {
            throw new BadRequestException(
              `Row ${i + 1}, field "${key}": potential XSS attempt detected`,
            );
          }
        }
      }
    }

    const sanitizedRows = this.sanitizationService.sanitizeArray(rows);

    const { valid, errors } =
      await this.validationService.validateCourseRows(sanitizedRows);

    let created = 0;
    const dbErrors: { row: number; field?: string; message: string }[] = [];

    for (let i = 0; i < valid.length; i++) {
      const dto = valid[i];
      const originalRowIndex = rows.findIndex((r) => r.code === dto.code) + 1;

      try {
        await this.prisma.course.create({
          data: {
            code: dto.code,
            title: dto.title,
            creditUnits: dto.creditUnits,
            departmentId: dto.departmentId,
            lecturerId: dto.lecturerId,
          },
        });
        created++;
      } catch (error: unknown) {
        const prismaError = error as { code?: string };
        if (prismaError.code === 'P2002') {
          dbErrors.push({
            row: originalRowIndex || i + 1,
            field: 'code',
            message: `Course with code ${dto.code} already exists`,
          });
        } else {
          dbErrors.push({
            row: originalRowIndex || i + 1,
            message: 'Failed to create course record',
          });
        }
      }
    }

    if (created > 0) {
      await this.auditLogService.logBulkUpload(
        userId,
        AuditResource.Course,
        created,
      );
      this.logger.log(`Bulk uploaded ${created} courses by user ${userId}`);
    }

    return { created, errors: [...errors, ...dbErrors] };
  }
}
