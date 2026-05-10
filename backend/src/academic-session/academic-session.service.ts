import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AcademicSession, Prisma } from '@prisma/client';

export interface CreateAcademicSessionDto {
  name: string;
  startDate: string;
  endDate: string;
  isActive?: boolean;
}

export interface UpdateAcademicSessionDto {
  name?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
}

@Injectable()
export class AcademicSessionService {
  private readonly logger = new Logger(AcademicSessionService.name);

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AcademicSession[]> {
    return this.prisma.academicSession.findMany({
      orderBy: { startDate: 'desc' },
      include: { semesters: true },
    });
  }

  async findOne(id: string): Promise<AcademicSession> {
    const session = await this.prisma.academicSession.findUnique({
      where: { id },
      include: { semesters: true },
    });
    if (!session) {
      throw new NotFoundException('Academic session not found');
    }
    return session;
  }

  async create(data: CreateAcademicSessionDto): Promise<AcademicSession> {
    try {
      const session = await this.prisma.academicSession.create({
        data: {
          name: data.name,
          startDate: new Date(data.startDate),
          endDate: new Date(data.endDate),
          isActive: data.isActive ?? false,
        },
        include: { semesters: true },
      });
      this.logger.log(
        `Academic session created: ${session.id} (${session.name})`,
      );
      return session;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          `Academic session with name ${data.name} already exists`,
        );
      }
      throw error;
    }
  }

  async update(
    id: string,
    data: UpdateAcademicSessionDto,
  ): Promise<AcademicSession> {
    await this.findOne(id);
    const updateData: Prisma.AcademicSessionUpdateInput = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const session = await this.prisma.academicSession.update({
      where: { id },
      data: updateData,
      include: { semesters: true },
    });
    this.logger.log(`Academic session updated: ${session.id}`);
    return session;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.academicSession.delete({ where: { id } });
    this.logger.log(`Academic session deleted: ${id}`);
  }
}
