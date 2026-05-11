'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { StatCard } from '@/components/ui/stat-card';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import { useStudents, useCourses } from '@/lib/hooks/use-data';
import { useAuth } from '@/lib/contexts/auth-context';
import {
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  ArrowRight,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, isStudent } = useAuth();
  const router = useRouter();
  const { data: students, loading: studentsLoading } = useStudents();
  const { data: courses, loading: coursesLoading } = useCourses();

  React.useEffect(() => {
    if (isStudent) {
      router.replace('/dashboard/student');
    }
  }, [isStudent, router]);

  const loading = studentsLoading || coursesLoading;

  const quickStats = [
    { label: 'Total Students', value: students.length.toString(), icon: Users },
    { label: 'Active Courses', value: courses.length.toString(), icon: BookOpen },
    { label: 'Transcripts Generated', value: '—', icon: FileText },
    { label: 'Pending Grades', value: '—', icon: GraduationCap },
  ];

  return (
    <AppShell>
      <SectionHeader
        title="Dashboard"
        description={`Welcome back, ${user?.name || 'User'}. Overview of academic records and system activity.`}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-sm p-4">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-24" />
                <div className="h-8 bg-muted rounded w-16" />
              </div>
            </div>
          ))
        ) : (
          quickStats.map((stat) => (
            <StatCard
              key={stat.label}
              title={stat.label}
              value={stat.value}
              icon={stat.icon}
            />
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Quick Actions</h3>
            </div>
            <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/dashboard/students"
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm hover:bg-muted transition-colors group"
              >
                <div className="p-2 bg-background border border-border rounded-sm">
                  <Users className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Manage Students</p>
                  <p className="text-xs text-muted-foreground">View, search, and edit student records</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard/courses"
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm hover:bg-muted transition-colors group"
              >
                <div className="p-2 bg-background border border-border rounded-sm">
                  <BookOpen className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Manage Courses</p>
                  <p className="text-xs text-muted-foreground">Course catalog and assignments</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard/transcripts"
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm hover:bg-muted transition-colors group"
              >
                <div className="p-2 bg-background border border-border rounded-sm">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">View Transcripts</p>
                  <p className="text-xs text-muted-foreground">Generate and print student transcripts</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
              <Link
                href="/dashboard/grades"
                className="flex items-center gap-3 p-3 bg-muted/50 rounded-sm hover:bg-muted transition-colors group"
              >
                <div className="p-2 bg-background border border-border rounded-sm">
                  <GraduationCap className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">Grade Management</p>
                  <p className="text-xs text-muted-foreground">Submit, amend, and publish grades</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </Link>
            </div>
          </div>

          {/* System Status */}
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">System Status</h3>
            </div>
            <div className="p-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Database</span>
                  <StatusBadge status="Operational" variant="success" />
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[98%] bg-status-success rounded-full" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API Services</span>
                  <StatusBadge status="Operational" variant="success" />
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[99%] bg-status-success rounded-full" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Placeholder */}
        <div className="space-y-6">
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Activity</h3>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="p-4">
              <p className="text-sm text-muted-foreground text-center py-8">
                Activity tracking coming soon
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
