'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { StatusBadge } from '@/components/ui/status-badge';
import { TranscriptCourse } from '@/types/transcript';

interface TranscriptTableProps {
  courses: TranscriptCourse[];
}

function getGradeBadgeVariant(
  gradeLetter: string | null,
): 'success' | 'warning' | 'danger' | 'neutral' {
  if (!gradeLetter) return 'neutral';
  switch (gradeLetter) {
    case 'A':
      return 'success';
    case 'B':
      return 'success';
    case 'C':
      return 'warning';
    case 'F':
      return 'danger';
    default:
      return 'neutral';
  }
}

export function TranscriptTable({ courses }: TranscriptTableProps) {
  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[100px] text-xs uppercase tracking-wider">Code</TableHead>
            <TableHead className="text-xs uppercase tracking-wider">Course Title</TableHead>
            <TableHead className="w-[80px] text-right text-xs uppercase tracking-wider">Units</TableHead>
            <TableHead className="w-[70px] text-right text-xs uppercase tracking-wider">Score</TableHead>
            <TableHead className="w-[70px] text-center text-xs uppercase tracking-wider">Grade</TableHead>
            <TableHead className="w-[80px] text-right text-xs uppercase tracking-wider">Points</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {courses.map((course) => (
            <TableRow key={course.gradeId}>
              <TableCell className="font-tabular text-xs font-medium">{course.courseCode}</TableCell>
              <TableCell className="text-sm">{course.courseTitle}</TableCell>
              <TableCell className="text-right font-tabular">{course.creditUnits}</TableCell>
              <TableCell className="text-right font-tabular font-medium">{course.score}</TableCell>
              <TableCell className="text-center">
                <StatusBadge
                  status={course.gradeLetter || '-'}
                  variant={getGradeBadgeVariant(course.gradeLetter)}
                />
              </TableCell>
              <TableCell className="text-right font-tabular text-muted-foreground">
                {course.gradePoints?.toFixed(1) || '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
