import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  AcademicSessionService,
  CreateAcademicSessionDto,
  UpdateAcademicSessionDto,
} from './academic-session.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, AcademicSession } from '@prisma/client';

@Controller('academic-sessions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AcademicSessionController {
  constructor(
    private readonly academicSessionService: AcademicSessionService,
  ) {}

  @Get()
  async findAll(): Promise<AcademicSession[]> {
    return this.academicSessionService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AcademicSession> {
    return this.academicSessionService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  async create(
    @Body() dto: CreateAcademicSessionDto,
  ): Promise<AcademicSession> {
    return this.academicSessionService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAcademicSessionDto,
  ): Promise<AcademicSession> {
    return this.academicSessionService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string): Promise<void> {
    return this.academicSessionService.remove(id);
  }
}
