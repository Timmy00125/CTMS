'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Grade } from '@/lib/api';
import { Loader2, Save, CheckCircle } from 'lucide-react';

const mockGrades: Grade[] = [
  { id: '1', studentId: '1', courseId: '1', semesterId: '1', score: 85, gradeLetter: 'A', gradePoints: 5.0, status: 'PUBLISHED', createdAt: '2023-12-01', updatedAt: '2023-12-01' },
  { id: '2', studentId: '2', courseId: '1', semesterId: '1', score: 72, gradeLetter: 'B', gradePoints: 4.0, status: 'PUBLISHED', createdAt: '2023-12-01', updatedAt: '2023-12-01' },
  { id: '3', studentId: '3', courseId: '2', semesterId: '1', score: 91, gradeLetter: 'A', gradePoints: 5.0, status: 'PUBLISHED', createdAt: '2023-12-01', updatedAt: '2023-12-01' },
  { id: '4', studentId: '4', courseId: '3', semesterId: '2', score: 65, gradeLetter: 'C', gradePoints: 3.0, status: 'PENDING_APPROVAL', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '5', studentId: '5', courseId: '4', semesterId: '2', score: 78, gradeLetter: 'B', gradePoints: 4.0, status: 'PENDING_APPROVAL', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '6', studentId: '6', courseId: '5', semesterId: '2', score: 55, gradeLetter: 'D', gradePoints: 2.0, status: 'DRAFT', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '7', studentId: '7', courseId: '6', semesterId: '2', score: 45, gradeLetter: 'F', gradePoints: 0.0, status: 'DRAFT', createdAt: '2024-01-15', updatedAt: '2024-01-15' },
  { id: '8', studentId: '8', courseId: '7', semesterId: '3', score: 88, gradeLetter: 'A', gradePoints: 5.0, status: 'PUBLISHED', createdAt: '2024-05-01', updatedAt: '2024-05-01' },
];

export default function GradesPage() {
  const [loading, setLoading] = React.useState(true);
  const [grades] = React.useState<Grade[]>(mockGrades);
  const [filter, setFilter] = React.useState<'ALL' | 'DRAFT' | 'PENDING_APPROVAL' | 'PUBLISHED'>('ALL');

  React.useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 500);
    return () => clearTimeout(timer);
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

  const columns = [
    {
      key: 'id',
      header: 'ID',
      width: '60px',
      render: (row: Grade) => (
        <span className="font-tabular text-xs text-muted-foreground">{row.id}</span>
      ),
    },
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
          {row.status === 'PENDING_APPROVAL' && (
            <Button variant="outline" size="xs" className="h-6 px-2 text-[10px]">
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
