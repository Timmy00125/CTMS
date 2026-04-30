import { IsInt, Min, Max, IsOptional, IsString } from 'class-validator';

export class UpdateGradeDto {
  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
