import { IsString, IsNotEmpty, IsArray, IsOptional } from 'class-validator';

export class CalculateSemesterGpaDto {
  @IsString()
  @IsNotEmpty()
  semesterId!: string;

  @IsArray()
  @IsOptional()
  studentIds?: string[];
}
