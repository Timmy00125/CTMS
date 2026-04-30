import { Module } from '@nestjs/common';
import { GpaService } from './gpa.service';
import { GpaController } from './gpa.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [GpaService],
  controllers: [GpaController],
  exports: [GpaService],
})
export class GpaModule {}
