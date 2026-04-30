import { IsInt, Min, Max, IsNotEmpty, IsString } from 'class-validator';

export class CreateGradeDto {
  @IsString()
  @IsNotEmpty()
  studentId!: string;

  @IsString()
  @IsNotEmpty()
  courseId!: string;

  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @IsInt()
  @Min(0)
  @Max(100)
  score!: number;
}
