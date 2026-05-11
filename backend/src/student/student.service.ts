import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Student, Prisma } from '@prisma/client';

export interface CreateStudentDto {
  matriculationNo: string;
  name: string;
  departmentId: string;
  level?: number;
}

export interface UpdateStudentDto {
  name?: string;
  departmentId?: string;
  level?: number;
}

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Student[]> {
    return this.prisma.student.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    if (!student) {
      throw new NotFoundException('Student not found');
    }
    return student;
  }

  async findByUserId(userId: string): Promise<Student | null> {
    return this.prisma.student.findUnique({
      where: { userId },
    });
  }

  async create(data: CreateStudentDto): Promise<Student> {
    try {
      const student = await this.prisma.student.create({
        data: {
          matriculationNo: data.matriculationNo,
          name: data.name,
          departmentId: data.departmentId,
          level: data.level ?? 100,
        },
      });
      this.logger.log(
        `Student created: ${student.id} (${student.matriculationNo})`,
      );
      return student;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Student with matriculation number ${data.matriculationNo} already exists`,
        );
      }
      throw error;
    }
  }

  async update(id: string, data: UpdateStudentDto): Promise<Student> {
    await this.findOne(id);
    const student = await this.prisma.student.update({
      where: { id },
      data,
    });
    this.logger.log(`Student updated: ${student.id}`);
    return student;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.student.delete({ where: { id } });
    this.logger.log(`Student deleted: ${id}`);
  }
}
