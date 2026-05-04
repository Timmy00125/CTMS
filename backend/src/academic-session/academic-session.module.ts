import { Module } from '@nestjs/common';
import { AcademicSessionService } from './academic-session.service';
import { AcademicSessionController } from './academic-session.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [AcademicSessionService],
  controllers: [AcademicSessionController],
  exports: [AcademicSessionService],
})
export class AcademicSessionModule {}
