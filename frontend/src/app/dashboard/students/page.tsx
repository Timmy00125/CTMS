'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { useStudents } from '@/lib/hooks/use-data';
import { Student } from '@/lib/api';
import { ArrowRight, Loader2, AlertCircle } from 'lucide-react';

export default function StudentsPage() {
  const [search, setSearch] = React.useState('');
  const { data: students, loading, error, refetch } = useStudents();

  const filtered = React.useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.matriculationNo.toLowerCase().includes(q) ||
        s.departmentId.toLowerCase().includes(q)
    );
  }, [search, students]);

  const columns = [
    {
      key: 'matriculationNo',
      header: 'Matric No',
      width: '140px',
      render: (row: Student) => (
        <span className="font-tabular text-xs">{row.matriculationNo}</span>
      ),
    },
    {
      key: 'name',
      header: 'Name',
      render: (row: Student) => (
        <span className="font-medium">{row.name}</span>
      ),
    },
    {
      key: 'departmentId',
      header: 'Dept',
      width: '80px',
      align: 'center' as const,
      render: (row: Student) => (
        <span className="font-tabular text-xs">{row.departmentId}</span>
      ),
    },
    {
      key: 'level',
      header: 'Level',
      width: '80px',
      align: 'center' as const,
      render: (row: Student) => (
        <span className="font-tabular">{row.level}L</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      width: '100px',
      align: 'right' as const,
      render: (row: Student) => (
        <div className="flex items-center justify-end gap-2">
          <Link
            href={`/dashboard/students/${row.id}`}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            View
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      ),
    },
  ];

  return (
    <AppShell>
      <SectionHeader
        title="Students"
        description={`${filtered.length} student${filtered.length !== 1 ? 's' : ''} in system`}
      >
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search by name, matric, or dept..."
            className="w-64"
          />
        </div>
      </SectionHeader>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading students...</span>
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
          emptyMessage="No students found matching your search"
        />
      )}
    </AppShell>
  );
}
