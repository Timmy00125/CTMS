'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { Grade, fetchStudentGradesMe } from '@/lib/api';
import { Loader2, AlertCircle, ArrowLeft } from 'lucide-react';

export default function StudentGradesPage() {
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const gradesData = await fetchStudentGradesMe();
        if (!cancelled) setGrades(gradesData);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load grades');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  // Group grades by semester
  const grouped = React.useMemo(() => {
    const map = new Map<string, Grade[]>();
    for (const grade of grades) {
      const key = `${grade.semester?.academicSession?.name || ''} — ${grade.semester?.name || 'Unknown'}`;
      const existing = map.get(key) || [];
      existing.push(grade);
      map.set(key, existing);
    }
    return new Map([...map.entries()].sort());
  }, [grades]);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your grades...</span>
        </div>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mb-6">
        <Link
          href="/dashboard/student"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          My Dashboard
        </Link>
        <SectionHeader
          title="My Grades"
          description="All your published grades and academic performance."
        />
      </div>

      {grades.length === 0 ? (
        <div className="bg-card border border-border rounded-sm p-8 text-center">
          <p className="text-sm text-muted-foreground">No grades have been published yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([semesterName, semGrades]) => (
            <div key={semesterName} className="bg-card border border-border rounded-sm">
              <div className="px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold">{semesterName}</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Course</th>
                      <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Title</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Credits</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Score</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Grade</th>
                      <th className="py-2 px-3 text-center text-xs font-medium text-muted-foreground uppercase tracking-wider">Points</th>
                      <th className="py-2 px-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {semGrades.map((g) => (
                      <tr key={g.id} className="border-b border-border last:border-0">
                        <td className="py-2 px-3 font-tabular font-medium">{g.course?.code || '-'}</td>
                        <td className="py-2 px-3">{g.course?.title || '-'}</td>
                        <td className="py-2 px-3 text-center font-tabular">{g.course?.creditUnits || '-'}</td>
                        <td className="py-2 px-3 text-center font-tabular font-medium">{g.score}</td>
                        <td className="py-2 px-3 text-center font-tabular font-medium">{g.gradeLetter || '-'}</td>
                        <td className="py-2 px-3 text-center font-tabular">{g.gradePoints?.toFixed(1) || '-'}</td>
                        <td className="py-2 px-3 text-right">
                          <StatusBadge status={g.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
