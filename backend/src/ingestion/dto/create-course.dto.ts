import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateCourseDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsInt()
  @Min(1)
  @Max(6)
  creditUnits!: number;

  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @IsString()
  @IsOptional()
  lecturerId?: string;
}
