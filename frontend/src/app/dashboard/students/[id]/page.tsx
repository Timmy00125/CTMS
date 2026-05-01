'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Student, fetchStudent } from '@/lib/api';
import { ArrowLeft, FileText, Loader2, MapPin, Calendar, Hash } from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;
    fetchStudent(studentId)
      .then((data) => { if (!cancelled) setStudent(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [studentId]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading student record...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <div className="text-center py-16">
          <p className="text-sm text-destructive">{error || 'Student not found'}</p>
          <Link
            href="/dashboard/students"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mt-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to students
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href="/dashboard/students"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Students
        </Link>
        <SectionHeader
          title={student.name}
          description={`Student record — ${student.matriculationNo}`}
        >
          <Link href={`/dashboard/transcripts?studentId=${student.id}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              View Transcript
            </Button>
          </Link>
        </SectionHeader>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Student Information</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex items-start gap-3">
                <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Matriculation No</p>
                  <p className="text-sm font-tabular font-medium">{student.matriculationNo}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Department</p>
                  <p className="text-sm font-medium">{student.departmentId}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Level</p>
                  <p className="text-sm font-medium">{student.level} Level</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Date Enrolled</p>
                  <p className="text-sm font-tabular">{new Date(student.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Summary */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Academic Summary</h3>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">CGPA</p>
                  <p className="text-2xl font-semibold font-tabular mt-1">3.72</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</p>
                  <p className="text-2xl font-semibold font-tabular mt-1">96</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Courses Taken</p>
                  <p className="text-2xl font-semibold font-tabular mt-1">24</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Standing</p>
                  <p className="text-2xl font-semibold mt-1">
                    <StatusBadge status="Good Standing" variant="success" />
                  </p>
                </div>
              </div>

              {/* Recent Grades Preview */}
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Recent Grades
              </h4>
              <div className="border border-border rounded-sm overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { course: 'CSC 101 — Intro to Programming', score: 85, grade: 'A', status: 'PUBLISHED' as const },
                      { course: 'MAT 101 — Calculus I', score: 78, grade: 'B', status: 'PUBLISHED' as const },
                      { course: 'PHY 101 — Mechanics', score: 72, grade: 'B', status: 'PUBLISHED' as const },
                      { course: 'CSC 102 — Data Structures', score: 88, grade: 'A', status: 'PUBLISHED' as const },
                    ].map((g, i) => (
                      <tr key={i} className="border-b border-border last:border-0">
                        <td className="py-2 px-3 text-sm">{g.course}</td>
                        <td className="py-2 px-3 text-center font-tabular">{g.score}</td>
                        <td className="py-2 px-3 text-center font-tabular font-medium">{g.grade}</td>
                        <td className="py-2 px-3 text-right">
                          <StatusBadge status={g.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
