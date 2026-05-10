import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Course, Prisma } from '@prisma/client';

export interface CreateCourseDto {
  code: string;
  title: string;
  creditUnits: number;
  departmentId: string;
  lecturerId?: string;
}

export interface UpdateCourseDto {
  title?: string;
  creditUnits?: number;
  departmentId?: string;
  lecturerId?: string | null;
}

@Injectable()
export class CourseService {
  private readonly logger = new Logger(CourseService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Course[]> {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lecturer: true },
    });
  }

  async findOne(id: string): Promise<Course> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: { lecturer: true },
    });
    if (!course) {
      throw new NotFoundException('Course not found');
    }
    return course;
  }

  async create(data: CreateCourseDto): Promise<Course> {
    try {
      const course = await this.prisma.course.create({
        data: {
          code: data.code,
          title: data.title,
          creditUnits: data.creditUnits,
          departmentId: data.departmentId,
          lecturerId: data.lecturerId,
        },
        include: { lecturer: true },
      });
      this.logger.log(`Course created: ${course.id} (${course.code})`);
      return course;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Course with code ${data.code} already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateCourseDto): Promise<Course> {
    await this.findOne(id);
    const course = await this.prisma.course.update({
      where: { id },
      data,
      include: { lecturer: true },
    });
    this.logger.log(`Course updated: ${course.id}`);
    return course;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.course.delete({ where: { id } });
    this.logger.log(`Course deleted: ${id}`);
  }

  async assignLecturer(courseId: string, lecturerId: string): Promise<Course> {
    await this.findOne(courseId);
    const course = await this.prisma.course.update({
      where: { id: courseId },
      data: { lecturerId },
      include: { lecturer: true },
    });
    this.logger.log(`Lecturer ${lecturerId} assigned to course ${courseId}`);
    return course;
  }
}
