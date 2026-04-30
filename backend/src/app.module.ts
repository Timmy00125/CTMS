import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { IngestionModule } from './ingestion/ingestion.module';
import { AuditModule } from './audit/audit.module';
import { GradeModule } from './grade/grade.module';
import { GpaModule } from './gpa/gpa.module';
import { TranscriptModule } from './transcript/transcript.module';
import { throttlerConfig } from './config/throttler.config';

@Module({
  imports: [
    throttlerConfig,
    PrismaModule,
    UserModule,
    AuthModule,
    IngestionModule,
    AuditModule,
    GradeModule,
    GpaModule,
    TranscriptModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
