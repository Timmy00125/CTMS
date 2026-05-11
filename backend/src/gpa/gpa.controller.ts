import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { GpaService } from './gpa.service';
import { StudentService } from '../student/student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CalculateSemesterGpaDto } from './dto/calculate-gpa.dto';
import { TokenPayload } from '../auth/auth.service';

interface RequestWithUser {
  user: TokenPayload;
}

@Controller('gpa')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GpaController {
  constructor(
    private readonly gpaService: GpaService,
    private readonly studentService: StudentService,
  ) {}

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

  @Get('me')
  @Roles(Role.Student)
  async getMyGpa(@Request() req: RequestWithUser, @Query('semesterId') semesterId?: string) {
    const student = await this.studentService.findByUserId(req.user.sub);
    if (!student) {
      throw new NotFoundException('Student profile not found for this user');
    }
    const [gpaResult, cgpaResult] = await Promise.all([
      semesterId
        ? this.gpaService.calculateSemesterGpa(student.id, semesterId)
        : Promise.resolve({
            gpa: null,
            totalCreditUnits: 0,
            totalGradePoints: 0,
          }),
      this.gpaService.calculateCgpa(student.id),
    ]);

    return {
      studentId: student.id,
      semesterId,
      gpa: gpaResult.gpa,
      cgpa: cgpaResult.cgpa,
      totalCreditUnits: cgpaResult.totalCreditUnits,
      totalGradePoints: cgpaResult.totalGradePoints,
    };
  }

  @Get('student/:studentId')
  @Roles(Role.ExamOfficer, Role.Admin)
  async getStudentGpa(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId?: string,
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
    const studentIds =
      await this.gpaService.getStudentIdsForSemester(semesterId);
    const results = await this.gpaService.calculateBatchGpa(
      studentIds,
      semesterId,
    );

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
