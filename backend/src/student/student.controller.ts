import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  NotFoundException,
} from '@nestjs/common';
import { StudentService } from './student.service';
import type {
  CreateStudentDto,
  UpdateStudentDto,
} from './student.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, Student } from '@prisma/client';
import { TokenPayload } from '../auth/auth.service';

interface RequestWithUser {
  user: TokenPayload;
}

@Controller('students')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  async findAll(): Promise<Student[]> {
    return this.studentService.findAll();
  }

  @Get('me')
  @Roles(Role.Student)
  async findMe(@Request() req: RequestWithUser): Promise<Student> {
    const student = await this.studentService.findByUserId(req.user.sub);
    if (!student) {
      throw new NotFoundException('Student profile not found for this user');
    }
    return student;
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Student> {
    return this.studentService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateStudentDto): Promise<Student> {
    return this.studentService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ): Promise<Student> {
    return this.studentService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string): Promise<void> {
    return this.studentService.remove(id);
  }
}
