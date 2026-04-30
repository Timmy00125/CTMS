import {
  IsString,
  IsNotEmpty,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';

export class CreateStudentDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[A-Za-z0-9/-]+$/, {
    message:
      'Matriculation number must contain only alphanumeric characters, slashes, or hyphens',
  })
  matriculationNo!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  departmentId!: string;

  @IsInt()
  @Min(100)
  @Max(800)
  level!: number;
}
