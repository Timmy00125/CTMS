import { Module } from '@nestjs/common';
import { GradeService } from './grade.service';
import { GradeController } from './grade.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [PrismaModule, AuditModule, StudentModule],
  providers: [GradeService],
  controllers: [GradeController],
  exports: [GradeService],
})
export class GradeModule {}
