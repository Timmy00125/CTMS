import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateGradeDto } from './create-grade.dto.js';

export class BulkCreateGradeDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateGradeDto)
  grades!: CreateGradeDto[];
}
