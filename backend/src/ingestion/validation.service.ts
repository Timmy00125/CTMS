import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateStudentDto } from './dto/create-student.dto';
import { CreateCourseDto } from './dto/create-course.dto';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult<T> {
  valid: T[];
  errors: ValidationError[];
}

@Injectable()
export class ValidationService {
  async validateStudentRows(
    rows: Record<string, unknown>[],
  ): Promise<ValidationResult<CreateStudentDto>> {
    const valid: CreateStudentDto[] = [];
    const errors: ValidationError[] = [];
    const seenMatriculationNos = new Set<string>();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const dto = plainToInstance(CreateStudentDto, row);
      const validationErrors = await validate(dto);

      if (validationErrors.length > 0) {
        for (const err of validationErrors) {
          const constraints = err.constraints ?? {};
          for (const [field, message] of Object.entries(constraints)) {
            errors.push({ row: i + 1, field: field, message });
          }
        }
      } else {
        if (seenMatriculationNos.has(dto.matriculationNo)) {
          errors.push({
            row: i + 1,
            field: 'matriculationNo',
            message: `Duplicate matriculation number: ${dto.matriculationNo}`,
          });
        } else {
          seenMatriculationNos.add(dto.matriculationNo);
          valid.push(dto);
        }
      }
    }

    return { valid, errors };
  }

  async validateCourseRows(
    rows: Record<string, unknown>[],
  ): Promise<ValidationResult<CreateCourseDto>> {
    const valid: CreateCourseDto[] = [];
    const errors: ValidationError[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const dto = plainToInstance(CreateCourseDto, row);
      const validationErrors = await validate(dto);

      if (validationErrors.length > 0) {
        for (const err of validationErrors) {
          const constraints = err.constraints ?? {};
          for (const [field, message] of Object.entries(constraints)) {
            errors.push({ row: i + 1, field: field, message });
          }
        }
      } else {
        valid.push(dto);
      }
    }

    return { valid, errors };
  }
}
