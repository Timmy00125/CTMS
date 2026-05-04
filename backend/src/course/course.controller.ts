import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Course } from '@prisma/client';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async findAll(): Promise<Course[]> {
    return this.courseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Course | null> {
    return this.courseService.findOne(id);
  }
}
