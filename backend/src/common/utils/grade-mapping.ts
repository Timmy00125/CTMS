import { BadRequestException } from '@nestjs/common';

export interface GradeMapping {
  gradeLetter: string;
  gradePoints: number;
}

export function mapScoreToGrade(score: number): GradeMapping {
  if (!Number.isInteger(score)) {
    throw new BadRequestException('Score must be an integer');
  }
  if (score < 0 || score > 100) {
    throw new BadRequestException('Score must be between 0 and 100');
  }

  if (score >= 70) return { gradeLetter: 'A', gradePoints: 5.0 };
  if (score >= 60) return { gradeLetter: 'B', gradePoints: 4.0 };
  if (score >= 50) return { gradeLetter: 'C', gradePoints: 3.0 };
  if (score >= 45) return { gradeLetter: 'D', gradePoints: 2.0 };
  if (score >= 40) return { gradeLetter: 'E', gradePoints: 1.0 };
  return { gradeLetter: 'F', gradePoints: 0.0 };
}
