'use client';

import React from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { SearchInput } from '@/components/ui/search-input';
import { DataTable } from '@/components/ui/data-table';
import { Course } from '@/lib/api';
import { Loader2 } from 'lucide-react';

const mockCourses: Course[] = [
  { id: '1', code: 'CSC 101', title: 'Introduction to Programming', creditUnits: 3, departmentId: 'CSC', lecturerId: '1', lecturer: { id: '1', name: 'Dr. Smith', email: 'smith@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '2', code: 'CSC 102', title: 'Data Structures and Algorithms', creditUnits: 3, departmentId: 'CSC', lecturerId: '1', lecturer: { id: '1', name: 'Dr. Smith', email: 'smith@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '3', code: 'MAT 101', title: 'Calculus I', creditUnits: 3, departmentId: 'MAT', lecturerId: '2', lecturer: { id: '2', name: 'Dr. Jones', email: 'jones@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '4', code: 'MAT 201', title: 'Linear Algebra', creditUnits: 3, departmentId: 'MAT', lecturerId: '2', lecturer: { id: '2', name: 'Dr. Jones', email: 'jones@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '5', code: 'PHY 101', title: 'General Physics I', creditUnits: 2, departmentId: 'PHY', lecturerId: '3', lecturer: { id: '3', name: 'Dr. Brown', email: 'brown@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '6', code: 'PHY 102', title: 'General Physics II', creditUnits: 2, departmentId: 'PHY', lecturerId: '3', lecturer: { id: '3', name: 'Dr. Brown', email: 'brown@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '7', code: 'CHM 101', title: 'General Chemistry I', creditUnits: 2, departmentId: 'CHM', lecturerId: '4', lecturer: { id: '4', name: 'Dr. Wilson', email: 'wilson@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
  { id: '8', code: 'CHM 102', title: 'General Chemistry II', creditUnits: 2, departmentId: 'CHM', lecturerId: '4', lecturer: { id: '4', name: 'Dr. Wilson', email: 'wilson@uni.edu' }, createdAt: '2023-01-01', updatedAt: '2023-01-01' },
];

export default function CoursesPage() {
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(true);
  const [courses, setCourses] = React.useState<Course[]>(mockCourses);

  React.useEffect(() => {
    let cancelled = false;
    fetch('/courses', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && Array.isArray(data) && data.length > 0) {
          setCourses(data);
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
