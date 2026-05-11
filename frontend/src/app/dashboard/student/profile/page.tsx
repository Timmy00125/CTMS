'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { SectionHeader } from '@/components/ui/section-header';
import { Student, fetchStudentMe } from '@/lib/api';
import { Loader2, AlertCircle, ArrowLeft, Hash, MapPin, Calendar, Mail, User } from 'lucide-react';

export default function StudentProfilePage() {
  const [student, setStudent] = React.useState<Student | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const data = await fetchStudentMe();
        if (!cancelled) setStudent(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load profile');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadData();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Loading your profile...</span>
        </div>
      </AppShell>
    );
  }

  if (error || !student) {
    return (
      <AppShell>
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <AlertCircle className="w-8 h-8 text-destructive" />
          <p className="text-sm text-destructive">{error || 'Unable to load your profile'}</p>
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
          title="My Profile"
          description="Your personal and academic information."
        />
      </div>

      <div className="max-w-xl">
        <div className="bg-card border border-border rounded-sm">
          <div className="px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold">Student Information</h3>
          </div>
          <div className="p-4 space-y-5">
            <div className="flex items-start gap-3">
              <User className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Full Name</p>
                <p className="text-sm font-medium">{student.name}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Hash className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Matriculation Number</p>
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
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Current Level</p>
                <p className="text-sm font-medium">{student.level} Level</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Date Enrolled</p>
                <p className="text-sm font-tabular">{new Date(student.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
