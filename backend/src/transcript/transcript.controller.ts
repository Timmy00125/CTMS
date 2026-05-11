import { Controller, Get, Param, UseGuards, Request, NotFoundException } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { StudentService } from '../student/student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TokenPayload } from '../auth/auth.service';

interface RequestWithUser {
  user: TokenPayload;
}

@Controller('transcript')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscriptController {
  constructor(
    private readonly transcriptService: TranscriptService,
    private readonly studentService: StudentService,
  ) {}

  @Get('me')
  @Roles(Role.Student)
  async getMyTranscript(@Request() req: RequestWithUser) {
    const student = await this.studentService.findByUserId(req.user.sub);
    if (!student) {
      throw new NotFoundException('Student profile not found for this user');
    }
    return this.transcriptService.getStudentTranscript(student.id);
  }

  @Get(':studentId')
  @Roles(Role.ExamOfficer, Role.Admin, Role.Lecturer)
  async getStudentTranscript(@Param('studentId') studentId: string) {
    return this.transcriptService.getStudentTranscript(studentId);
  }
}
