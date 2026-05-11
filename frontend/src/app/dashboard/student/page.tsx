'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import {
  Student,
  Grade,
  fetchStudentMe,
  fetchStudentGradesMe,
  fetchStudentGpaMe,
} from '@/lib/api';
import {
  Loader2,
  AlertCircle,
  FileText,
  GraduationCap,
  Hash,
  MapPin,
  Calendar,
  BookOpen,
  TrendingUp,
  Award,
} from 'lucide-react';

export default function StudentDashboardPage() {
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
          fetchStudentMe(),
          fetchStudentGradesMe().catch(() => []),
          fetchStudentGpaMe().catch(() => null),
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
          setError(err instanceof Error ? err.message : 'Failed to load your data');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Group grades by semester for display
  const gradesBySemester = React.useMemo(() => {
    const map = new Map<string, Grade[]>();
    for (const grade of grades) {
      const semName = grade.semester?.name || 'Unknown Semester';
      const existing = map.get(semName) || [];
      existing.push(grade);
      map.set(semName, existing);
    }
    return map;
  }, [grades]);

  const standing = cgpa && cgpa >= 2.0 ? 'Good Standing' : 'Probation';
  const standingVariant = cgpa && cgpa >= 2.0 ? 'success' : 'danger';

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your dashboard...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error || 'Unable to load your student profile'}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <SectionHeader
        title="My Dashboard"
        description={`Welcome back, ${student.name}. Here is your academic overview.`}
      />

      {/* Academic Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <div className="bg-card border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">CGPA</p>
          </div>
          <p className="text-2xl font-semibold font-tabular">{cgpa?.toFixed(2) || 'N/A'}</p>
        </div>
        <div className="bg-card border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Total Credits</p>
          </div>
          <p className="text-2xl font-semibold font-tabular">{totalCredits}</p>
        </div>
        <div className="bg-card border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Courses</p>
          </div>
          <p className="text-2xl font-semibold font-tabular">{grades.length}</p>
        </div>
        <div className="bg-card border border-border rounded-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Award className="w-4 h-4 text-muted-foreground" />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Standing</p>
          </div>
          <StatusBadge status={standing} variant={standingVariant} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Info Card */}
        <div className="lg:col-span-1">
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">My Information</h3>
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

          {/* Quick Links */}
          <div className="bg-card border border-border rounded-sm mt-4">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Quick Links</h3>
            </div>
            <div className="p-4 space-y-2">
              <Link href="/dashboard/student/grades">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <GraduationCap className="w-3.5 h-3.5" />
                  View All Grades
                </Button>
              </Link>
              <Link href="/dashboard/student/transcript">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2">
                  <FileText className="w-3.5 h-3.5" />
                  View Full Transcript
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Recent Grades */}
        <div className="lg:col-span-2">
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Grades</h3>
              <Link href="/dashboard/student/grades" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                View all
              </Link>
            </div>
            <div className="p-4">
              {grades.length > 0 ? (
                <div className="border border-border rounded-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-muted/50">
                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                        <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade</th>
                        <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {grades.slice(0, 8).map((g) => (
                        <tr key={g.id} className="border-b border-border last:border-0">
                          <td className="py-2 px-3 text-sm">
                            <div>
                              <p className="font-medium">{g.course?.code || `Course #${g.courseId}`}</p>
                              <p className="text-xs text-muted-foreground">{g.course?.title}</p>
                            </div>
                          </td>
                          <td className="py-2 px-3 text-center font-tabular">{g.score}</td>
                          <td className="py-2 px-3 text-center font-tabular font-medium">{g.gradeLetter || '-'}</td>
                          <td className="py-2 px-3 text-right font-tabular">{g.course?.creditUnits || '-'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No grades recorded yet. Check back later.
                </p>
              )}
            </div>
          </div>

          {/* Semester Breakdown */}
          {gradesBySemester.size > 0 && (
            <div className="bg-card border border-border rounded-sm mt-4">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">Semester Breakdown</h3>
              </div>
              <div className="p-4">
                <div className="space-y-3">
                  {Array.from(gradesBySemester.entries()).slice(0, 4).map(([semName, semGrades]) => {
                    const totalPoints = semGrades.reduce((sum, g) => sum + (g.gradePoints || 0) * (g.course?.creditUnits || 0), 0);
                    const totalCredits = semGrades.reduce((sum, g) => sum + (g.course?.creditUnits || 0), 0);
                    const semGpa = totalCredits > 0 ? totalPoints / totalCredits : null;

                    return (
                      <div key={semName} className="flex items-center justify-between p-3 bg-muted/50 rounded-sm">
                        <div>
                          <p className="text-sm font-medium">{semName}</p>
                          <p className="text-xs text-muted-foreground">{semGrades.length} courses</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-tabular font-medium">{semGpa?.toFixed(2) || 'N/A'}</p>
                          <p className="text-xs text-muted-foreground">GPA</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
