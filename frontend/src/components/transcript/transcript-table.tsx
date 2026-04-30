'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TranscriptCourse } from '@/types/transcript';

interface TranscriptTableProps {
  courses: TranscriptCourse[];
}

function getGradeBadgeVariant(
  gradeLetter: string | null,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (!gradeLetter) return 'outline';
  switch (gradeLetter) {
    case 'A':
      return 'default';
    case 'B':
      return 'secondary';
    case 'F':
      return 'destructive';
    default:
      return 'outline';
  }
}

export function TranscriptTable({ courses }: TranscriptTableProps) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Course Code</TableHead>
            <TableHead>Course Title</TableHead>
            <TableHead className="w-[100px] text-right">Credit Units</TableHead>
            <TableHead className="w-[80px] text-right">Score</TableHead>
            <TableHead className="w-[100px] text-center">Grade</TableHead>
            <TableHead className="w-[100px] text-right">Grade Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.gradeId}>
              <TableCell className="font-medium">{course.courseCode}</TableCell>
              <TableCell>{course.courseTitle}</TableCell>
              <TableCell className="text-right">{course.creditUnits}</TableCell>
              <TableCell className="text-right">{course.score}</TableCell>
              <TableCell className="text-center">
                <Badge variant={getGradeBadgeVariant(course.gradeLetter)}>
                  {course.gradeLetter || '-'}
                </Badge>
              </TableCell>
              <TableCell className="text-right">
                {course.gradePoints?.toFixed(1) || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
