import { Controller, Get, UseGuards } from '@nestjs/common';
import { AcademicSessionService } from './academic-session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { AcademicSession } from '@prisma/client';

@Controller('academic-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicSessionController {
  constructor(private readonly academicSessionService: AcademicSessionService) {}

  @Get()
  async findAll(): Promise<AcademicSession[]> {
    return this.academicSessionService.findAll();
  }
}
