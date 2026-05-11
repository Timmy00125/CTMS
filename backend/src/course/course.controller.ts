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
import { CourseService } from './course.service';
import type {
  CreateCourseDto,
  UpdateCourseDto,
} from './course.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role, Course } from '@prisma/client';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseController {
  constructor(private readonly courseService: CourseService) {}

  @Get()
  async findAll(): Promise<Course[]> {
    return this.courseService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Course> {
    return this.courseService.findOne(id);
  }

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateCourseDto): Promise<Course> {
    return this.courseService.create(dto);
  }

  @Patch(':id')
  @Roles(Role.Admin)
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCourseDto,
  ): Promise<Course> {
    return this.courseService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.Admin)
  async remove(@Param('id') id: string): Promise<void> {
    return this.courseService.remove(id);
  }

  @Patch(':id/assign-lecturer')
  @Roles(Role.Admin)
  async assignLecturer(
    @Param('id') id: string,
    @Body() body: { lecturerId: string },
  ): Promise<Course> {
    return this.courseService.assignLecturer(id, body.lecturerId);
  }
}
