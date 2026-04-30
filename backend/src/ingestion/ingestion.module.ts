import { Module } from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { IngestionController } from './ingestion.controller';
import { ValidationService } from './validation.service';
import { SanitizationService } from './sanitization.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [IngestionService, ValidationService, SanitizationService],
  controllers: [IngestionController],
  exports: [IngestionService],
})
export class IngestionModule {}
