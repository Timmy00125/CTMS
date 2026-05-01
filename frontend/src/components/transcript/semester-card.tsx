'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { TranscriptTable } from './transcript-table';
import { TranscriptSemester } from '@/types/transcript';

interface SemesterCardProps {
  semester: TranscriptSemester;
}

export function SemesterCard({ semester }: SemesterCardProps) {
  return (
    <Card className="border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold">{semester.name}</CardTitle>
          <div className="flex gap-4 text-sm">
            <span className="text-muted-foreground text-xs">
              Credits: <span className="font-tabular font-medium text-foreground">{semester.totalCreditUnits}</span>
            </span>
            <span className="text-muted-foreground text-xs">
              GPA: <span className="font-tabular font-medium text-foreground">{semester.gpa?.toFixed(2) || 'N/A'}</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <TranscriptTable courses={semester.courses} />
      </CardContent>
    </Card>
  );
}
