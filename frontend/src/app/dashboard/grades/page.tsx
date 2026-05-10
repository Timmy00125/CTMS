'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/contexts/auth-context';
import { useToast } from '@/lib/contexts/toast-context';
import { Grade, publishGrades } from '@/lib/api';
import { Loader2, Save, CheckCircle, AlertCircle } from 'lucide-react';

export default function GradesPage() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [grades, setGrades] = React.useState<Grade[]>([]);
  const [filter, setFilter] = React.useState<'ALL' | 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED'>('ALL');

  React.useEffect(() => {
    async function loadGrades() {
      try {
        setLoading(true);
        setError(null);
        // Fetch grades for the current user's students or all grades
        // For now, we'll show an empty state as there's no "all grades" endpoint
        setGrades([]);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load grades');
      } finally {
        setLoading(false);
      }
    }
    loadGrades();
  }, []);

  const filtered = React.useMemo(() => {
    if (filter === 'ALL') return grades;
    return grades.filter((g) => g.status === filter);
  }, [filter, grades]);

  const stats = React.useMemo(() => {
    return {
      total: grades.length,
      published: grades.filter((g) => g.status === 'PUBLISHED').length,
      pending: grades.filter((g) => g.status === 'PENDING_APPROVAL').length,
      draft: grades.filter((g) => g.status === 'DRAFT').length,
    };
  }, [grades]);

  async function handlePublish(courseId: string, semesterId: string) {
    try {
      await publishGrades(courseId, semesterId);
      addToast('Grades published successfully', 'success');
      // Reload grades
    } catch (err) {
      addToast(err instanceof Error ? err.message : 'Failed to publish grades', 'error');
    }
  }

  const columns = [
    {
      key: 'student',
      header: 'Student',
      render: (row: Grade) => (
        <span className="text-sm">Student #{row.studentId}</span>
      ),
    },
    {
      key: 'course',
      header: 'Course',
      render: (row: Grade) => (
        <span className="font-tabular text-xs">Course #{row.courseId}</span>
      ),
    },
    {
      key: 'score',
      header: 'Score',
      width: '80px',
      align: 'center' as const,
      render: (row: Grade) => (
        <span className="font-tabular font-medium">{row.score}</span>
      ),
    },
    {
      key: 'gradeLetter',
      header: 'Grade',
      width: '70px',
      align: 'center' as const,
      render: (row: Grade) => (
        <span className="font-tabular font-semibold">{row.gradeLetter || '-'}</span>
      ),
    },
    {
      key: 'gradePoints',
      header: 'Points',
      width: '70px',
      align: 'center' as const,
      render: (row: Grade) => (
        <span className="font-tabular text-muted-foreground">{row.gradePoints?.toFixed(1) || '-'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      width: '140px',
      render: (row: Grade) => (
        <StatusBadge status={row.status} />
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right' as const,
      render: (row: Grade) => (
        <div className="flex items-center justify-end gap-1">
          {row.status === 'DRAFT' && (
            <Button variant="outline" size="xs" className="h-6 px-2 text-[10px]">
              <Save className="w-3 h-3 mr-1" />
              Submit
            </Button>
          )}
          {row.status === 'PENDING_APPROVAL' && user?.roles?.includes('ExamOfficer') && (
            <Button
              variant="outline"
              size="xs"
              className="h-6 px-2 text-[10px]"
              onClick={() => handlePublish(row.courseId, row.semesterId)}
            >
              <CheckCircle className="w-3 h-3 mr-1" />
              Publish
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <SectionHeader
        title="Grade Management"
        description="Review, submit, and publish student grades"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total', value: stats.total, filter: 'ALL' as const },
          { label: 'Published', value: stats.published, filter: 'PUBLISHED' as const, color: 'text-status-success' },
          { label: 'Pending', value: stats.pending, filter: 'PENDING_APPROVAL' as const, color: 'text-status-warning' },
          { label: 'Draft', value: stats.draft, filter: 'DRAFT' as const, color: 'text-status-danger' },
        ].map((stat) => (
          <button
            key={stat.filter}
            onClick={() => setFilter(stat.filter)}
            className={`text-left p-3 bg-card border rounded-sm transition-colors ${
              filter === stat.filter
                ? 'border-foreground'
                : 'border-border hover:border-muted-foreground'
            }`}
          >
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-semibold font-tabular mt-1 ${stat.color || ''}`}>
              {stat.value}
            </p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading grades...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage="No grades found for selected filter"
        />
      )}
    </AppShell>
  );
}
