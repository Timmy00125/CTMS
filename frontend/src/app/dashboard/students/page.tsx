'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { Student } from '@/lib/api';
import { ArrowRight, Loader2 } from 'lucide-react';

// Mock data for demonstration
const mockStudents: Student[] = [
  { id: '1', matriculationNo: '2023/001', name: 'Adebayo Chinedu', departmentId: 'CSC', level: 100, createdAt: '2023-09-01', updatedAt: '2023-09-01' },
  { id: '2', matriculationNo: '2023/002', name: 'Okonkwo Ngozi', departmentId: 'MAT', level: 100, createdAt: '2023-09-01', updatedAt: '2023-09-01' },
  { id: '3', matriculationNo: '2023/003', name: 'Ibrahim Fatima', departmentId: 'PHY', level: 100, createdAt: '2023-09-01', updatedAt: '2023-09-01' },
  { id: '4', matriculationNo: '2023/004', name: 'Okafor Emeka', departmentId: 'CSC', level: 200, createdAt: '2023-09-01', updatedAt: '2023-09-01' },
  { id: '5', matriculationNo: '2023/005', name: 'Adeyemi Tolu', departmentId: 'CHM', level: 200, createdAt: '2023-09-01', updatedAt: '2023-09-01' },
  { id: '6', matriculationNo: '2022/101', name: 'Mohammed Aisha', departmentId: 'MAT', level: 300, createdAt: '2022-09-01', updatedAt: '2022-09-01' },
  { id: '7', matriculationNo: '2022/102', name: 'Nwosu Chijioke', departmentId: 'CSC', level: 300, createdAt: '2022-09-01', updatedAt: '2022-09-01' },
  { id: '8', matriculationNo: '2022/103', name: 'Balogun Sekinat', departmentId: 'PHY', level: 300, createdAt: '2022-09-01', updatedAt: '2022-09-01' },
  { id: '9', matriculationNo: '2021/201', name: 'Ezeudu Ifeanyi', departmentId: 'CHM', level: 400, createdAt: '2021-09-01', updatedAt: '2021-09-01' },
  { id: '10', matriculationNo: '2021/202', name: 'Abubakar Zainab', departmentId: 'CSC', level: 400, createdAt: '2021-09-01', updatedAt: '2021-09-01' },
];

export default function StudentsPage() {
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [students, setStudents] = React.useState<Student[]>(mockStudents);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/students', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data) && data.length > 0) {
          setStudents(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

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
