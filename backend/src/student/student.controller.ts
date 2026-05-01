import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { StudentService } from './student.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Student } from '@prisma/client';

@Controller('students')
@UseGuards(RolesGuard)
export class StudentController {
  constructor(private readonly studentService: StudentService) {}

  @Get()
  async findAll(): Promise<Student[]> {
    return this.studentService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Student> {
    return this.studentService.findOne(id);
  }
}
