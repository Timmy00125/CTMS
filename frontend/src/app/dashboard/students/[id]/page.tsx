'use client';

import React from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Student, fetchStudent, fetchStudentGrades, calculateStudentCgpa, Grade } from '@/lib/api';
import { ArrowLeft, FileText, Loader2, MapPin, Calendar, Hash, AlertCircle } from 'lucide-react';

export default function StudentDetailPage() {
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = React.useState<Student | null>(null);
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [cgpa, setCgpa] = React.useState<number | null>(null);
  const [totalCredits, setTotalCredits] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [studentData, gradesData, gpaData] = await Promise.all([
          fetchStudent(studentId),
          fetchStudentGrades(studentId).catch(() => []),
          calculateStudentCgpa(studentId).catch(() => null),
        ]);

        if (!cancelled) {
          setStudent(studentData);
          setGrades(gradesData);
          if (gpaData) {
            setCgpa(gpaData.cgpa);
            setTotalCredits(gpaData.totalCreditUnits);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load student');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
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
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error || 'Student not found'}</p>
          <Link
            href="/dashboard/students"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
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
          <Link href={`/dashboard/transcripts/${student.id}`}>
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
                  <p className="text-2xl font-semibold font-tabular mt-1">{cgpa?.toFixed(2) || 'N/A'}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</p>
                  <p className="text-2xl font-semibold font-tabular mt-1">{totalCredits}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Courses Taken</p>
                  <p className="text-2xl font-semibold font-tabular mt-1">{grades.length}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-sm">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Standing</p>
                  <p className="text-2xl font-semibold mt-1">
                    <StatusBadge
                      status={cgpa && cgpa >= 2.0 ? 'Good Standing' : 'Probation'}
                      variant={cgpa && cgpa >= 2.0 ? 'success' : 'danger'}
                    />
                  </p>
                </div>
              </div>

              {/* Recent Grades */}
              <h4 className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Recent Grades
              </h4>
              {grades.length > 0 ? (
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
                      {grades.slice(0, 5).map((g) => (
                        <tr key={g.id} className="border-b border-border last:border-0">
                          <td className="py-2 px-3 text-sm">{g.course?.code || `Course #${g.courseId}`}</td>
                          <td className="py-2 px-3 text-center font-tabular">{g.score}</td>
                          <td className="py-2 px-3 text-center font-tabular font-medium">{g.gradeLetter || '-'}</td>
                          <td className="py-2 px-3 text-right">
                            <StatusBadge status={g.status} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No grades recorded yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
