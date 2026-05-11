import { Module } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { StudentModule } from '../student/student.module';

@Module({
  imports: [PrismaModule, StudentModule],
  providers: [TranscriptService],
  controllers: [TranscriptController],
  exports: [TranscriptService],
})
export class TranscriptModule {}
