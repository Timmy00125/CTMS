import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Course } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Course[]> {
    return this.prisma.course.findMany({
      orderBy: { createdAt: 'desc' },
      include: { lecturer: true },
    });
  }

  async findOne(id: string): Promise<Course | null> {
    return this.prisma.course.findUnique({
      where: { id },
      include: { lecturer: true },
    });
  }
}
