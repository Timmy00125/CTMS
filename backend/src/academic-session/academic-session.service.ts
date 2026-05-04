import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicSession } from '@prisma/client';

@Injectable()
export class AcademicSessionService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AcademicSession[]> {
    return this.prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
      include: { semesters: true },
    });
  }
}
