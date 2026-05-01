'use client';

import React from 'react';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { SemesterCard } from './semester-card';
import { TranscriptData } from '@/types/transcript';
import { SectionHeader } from '@/components/ui/section-header';
import { ArrowLeft, Printer } from 'lucide-react';

interface TranscriptViewProps {
  transcript: TranscriptData;
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const { student, academicSessions, cgpa, totalCreditUnits } = transcript;

  return (
    <div className="transcript-container space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Link
            href="/dashboard/transcripts"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors no-print"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Transcripts
          </Link>
          <SectionHeader
            title="Academic Transcript"
            description={`${student.name} — ${student.matriculationNo}`}
          />
        </div>
        <div className="flex items-center gap-2 no-print">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-card border border-border rounded-sm hover:bg-muted transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Print Header */}
      <div className="transcript-header hidden print:block">
        <h1 className="text-xl font-bold font-heading">Academic Transcript</h1>
        <p className="text-sm text-muted-foreground">Official Student Academic Record</p>
      </div>

      {/* Student Information */}
      <Card className="page-break-avoid border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Student Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="student-info grid grid-cols-2 gap-x-6 gap-y-3 md:grid-cols-4">
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">Name</dt>
              <dd className="text-sm font-medium mt-0.5">{student.name}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">Matriculation No</dt>
              <dd className="text-sm font-tabular font-medium mt-0.5">{student.matriculationNo}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">Department</dt>
              <dd className="text-sm font-medium mt-0.5">{student.departmentId}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">Level</dt>
              <dd className="text-sm font-tabular font-medium mt-0.5">{student.level}L</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {/* Academic Sessions */}
      {academicSessions.map((session) => (
        <div key={session.id} className="space-y-4 page-break-avoid">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-semibold font-heading uppercase tracking-wider">
              {session.name}
            </h2>
            <Separator className="flex-1" />
          </div>
          {session.semesters.map((semester) => (
            <SemesterCard key={semester.id} semester={semester} />
          ))}
        </div>
      ))}

      {/* Cumulative Summary */}
      <Card className="summary-card bg-muted/50 border-border page-break-avoid">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Cumulative Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credit Units</p>
              <p className="text-2xl font-bold font-tabular mt-1">{totalCreditUnits}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Cumulative GPA</p>
              <p className="text-2xl font-bold font-tabular mt-1">{cgpa?.toFixed(2) || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Academic Sessions</p>
              <p className="text-2xl font-bold font-tabular mt-1">{academicSessions.length}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
