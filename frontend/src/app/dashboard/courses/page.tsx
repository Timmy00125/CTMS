'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { useCourses } from '@/lib/hooks/use-data';
import { Course } from '@/lib/api';
import { Loader2, AlertCircle } from 'lucide-react';

export default function CoursesPage() {
  const [search, setSearch] = React.useState('');
  const { data: courses, loading, error, refetch } = useCourses();

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return courses.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.departmentId.toLowerCase().includes(q) ||
        c.lecturer?.name.toLowerCase().includes(q)
    );
  }, [search, courses]);

  const columns = [
    {
      key: 'code',
      header: 'Code',
      width: '100px',
      render: (row: Course) => (
        <span className="font-tabular text-xs font-medium">{row.code}</span>
      ),
    },
    {
      key: 'title',
      header: 'Title',
      render: (row: Course) => (
        <span className="text-sm">{row.title}</span>
      ),
    },
    {
      key: 'creditUnits',
      header: 'Units',
      width: '70px',
      align: 'center' as const,
      render: (row: Course) => (
        <span className="font-tabular">{row.creditUnits}</span>
      ),
    },
    {
      key: 'departmentId',
      header: 'Dept',
      width: '80px',
      align: 'center' as const,
      render: (row: Course) => (
        <span className="font-tabular text-xs">{row.departmentId}</span>
      ),
    },
    {
      key: 'lecturer',
      header: 'Lecturer',
      width: '160px',
      render: (row: Course) => (
        <span className="text-sm text-muted-foreground">{row.lecturer?.name || 'Unassigned'}</span>
      ),
    },
  ];

  return (
    <AppShell>
      <SectionHeader
        title="Courses"
        description={`${filtered.length} course${filtered.length !== 1 ? 's' : ''} in catalog`}
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search courses..."
          className="w-64"
        />
      </SectionHeader>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading courses...</span>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error}</p>
          <button
            onClick={() => refetch()}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Try again
          </button>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(row) => row.id}
          emptyMessage="No courses found matching your search"
        />
      )}
    </AppShell>
  );
}
