import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { IngestionService } from './ingestion.service';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { TokenPayload } from '../auth/auth.service';

interface RequestWithUser {
  user: TokenPayload;
}

@Controller('ingestion')
@UseGuards(RolesGuard)
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post('students')
  @Roles(Role.Admin)
  async uploadStudents(
    @Body() rows: Record<string, unknown>[],
    @Request() req: RequestWithUser,
  ) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Request body must be a non-empty array');
    }

    return this.ingestionService.bulkUploadStudents(rows, req.user.sub);
  }

  @Post('courses')
  @Roles(Role.Admin)
  async uploadCourses(
    @Body() rows: Record<string, unknown>[],
    @Request() req: RequestWithUser,
  ) {
    if (!Array.isArray(rows) || rows.length === 0) {
      throw new BadRequestException('Request body must be a non-empty array');
    }

    return this.ingestionService.bulkUploadCourses(rows, req.user.sub);
  }
}
