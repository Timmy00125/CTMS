import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { GpaService } from './gpa.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CalculateSemesterGpaDto } from './dto/calculate-gpa.dto';

@Controller('gpa')
@UseGuards(RolesGuard)
export class GpaController {
  constructor(private readonly gpaService: GpaService) {}

  @Post('calculate/semester')
  @Roles(Role.ExamOfficer, Role.Admin)
  async calculateSemesterGpa(@Body() dto: CalculateSemesterGpaDto) {
    if (!dto.semesterId || dto.semesterId.trim() === '') {
      throw new BadRequestException('semesterId is required');
    }

    const studentIds = dto.studentIds || [];
    const results = await this.gpaService.calculateBatchGpa(
      studentIds,
      dto.semesterId,
    );

    const formattedResults = Array.from(results.entries()).map(
      ([studentId, data]) => ({
        studentId,
        ...data,
      }),
    );

    return {
      semesterId: dto.semesterId,
      results: formattedResults,
    };
  }

  @Post('calculate/student/:studentId')
  @Roles(Role.ExamOfficer, Role.Admin)
  async calculateStudentCgpa(@Param('studentId') studentId: string) {
    const result = await this.gpaService.calculateCgpa(studentId);

    return {
      studentId,
      ...result,
    };
  }

  @Get('student/:studentId')
  @Roles(Role.ExamOfficer, Role.Admin)
  async getStudentGpa(
    @Param('studentId') studentId: string,
    @Body('semesterId') semesterId: string,
  ) {
    const [gpaResult, cgpaResult] = await Promise.all([
      semesterId
        ? this.gpaService.calculateSemesterGpa(studentId, semesterId)
        : Promise.resolve({
            gpa: null,
            totalCreditUnits: 0,
            totalGradePoints: 0,
          }),
      this.gpaService.calculateCgpa(studentId),
    ]);

    return {
      studentId,
      semesterId,
      gpa: gpaResult.gpa,
      cgpa: cgpaResult.cgpa,
      totalCreditUnits: cgpaResult.totalCreditUnits,
      totalGradePoints: cgpaResult.totalGradePoints,
    };
  }

  @Get('semester/:semesterId/students')
  @Roles(Role.ExamOfficer, Role.Admin)
  async getSemesterGpaReport(@Param('semesterId') semesterId: string) {
    const results = await this.gpaService.calculateBatchGpa([], semesterId);

    const students = Array.from(results.entries()).map(([studentId, data]) => ({
      studentId,
      ...data,
    }));

    return {
      semesterId,
      students,
    };
  }
}
