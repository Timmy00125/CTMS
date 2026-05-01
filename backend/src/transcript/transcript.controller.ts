import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('transcript')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Get(':studentId')
  @Roles(Role.ExamOfficer, Role.Admin, Role.Lecturer)
  async getStudentTranscript(@Param('studentId') studentId: string) {
    return this.transcriptService.getStudentTranscript(studentId);
  }
}
