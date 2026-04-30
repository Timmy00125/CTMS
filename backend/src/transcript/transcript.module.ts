import { Module } from '@nestjs/common';
import { TranscriptService } from './transcript.service';
import { TranscriptController } from './transcript.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [TranscriptService],
  controllers: [TranscriptController],
  exports: [TranscriptService],
})
export class TranscriptModule {}
