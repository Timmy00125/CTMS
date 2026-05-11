import { Module } from '@nestjs/common';
import { GpaService } from './gpa.service';
import { GpaController } from './gpa.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [PrismaModule, StudentModule],
  providers: [GpaService],
  controllers: [GpaController],
  exports: [GpaService],
})
export class GpaModule {}
