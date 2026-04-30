import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { GradeService } from './grade.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TokenPayload } from '../auth/auth.service';
import { CreateGradeDto } from './dto/create-grade.dto';
import { UpdateGradeDto } from './dto/update-grade.dto';
import { BulkCreateGradeDto } from './dto/bulk-create-grade.dto';

interface RequestWithUser {
  user: TokenPayload;
}

@Controller('grades')
@UseGuards(RolesGuard)
export class GradeController {
  constructor(private readonly gradeService: GradeService) {}

  @Post()
  @Roles(Role.Lecturer, Role.Admin)
  async submitGrade(
    @Body() dto: CreateGradeDto,
    @Request() req: RequestWithUser,
  ) {
    return this.gradeService.submitGrade(dto, req.user.sub);
  }

  @Post('bulk')
  @Roles(Role.Lecturer, Role.Admin)
  async bulkSubmit(
    @Body() dto: BulkCreateGradeDto,
    @Request() req: RequestWithUser,
  ) {
    if (!dto.grades || dto.grades.length === 0) {
      throw new BadRequestException('Grades array must not be empty');
    }
    return this.gradeService.bulkSubmitGrades(dto.grades, req.user.sub);
  }

  @Patch('publish')
  @Roles(Role.ExamOfficer, Role.Admin)
  async publishGrades(
    @Body() body: { courseId: string; semesterId: string },
    @Request() req: RequestWithUser,
  ) {
    return this.gradeService.publishGrades(
      body.courseId,
      body.semesterId,
      req.user.sub,
    );
  }

  @Patch(':id/amend')
  @Roles(Role.Lecturer, Role.Admin)
  async amendGrade(
    @Param('id') id: string,
    @Body() dto: UpdateGradeDto,
    @Request() req: RequestWithUser,
  ) {
    return this.gradeService.amendGrade(id, dto, req.user.sub);
  }

  @Get('student/:studentId')
  @Roles(Role.Lecturer, Role.ExamOfficer, Role.Admin)
  async getStudentGrades(@Param('studentId') studentId: string) {
    return this.gradeService.getGradesForStudent(studentId);
  }

  @Get('course/:courseId/semester/:semesterId')
  @Roles(Role.Lecturer, Role.ExamOfficer, Role.Admin)
  async getCourseGrades(
    @Param('courseId') courseId: string,
    @Param('semesterId') semesterId: string,
  ) {
    return this.gradeService.getGradesForCourse(courseId, semesterId);
  }

  @Get(':id/audit')
  @Roles(Role.ExamOfficer, Role.Admin)
  async getGradeAuditLog(@Param('id') id: string) {
    return this.gradeService.getGradeAuditLog(id);
  }
}
