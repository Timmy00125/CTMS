'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { StatCard } from '@/components/ui/stat-card';
import { SectionHeader } from '@/components/ui/section-header';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  AlertCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';

// Mock data for demo purposes - in production these would come from API
const recentActivity = [
  { id: '1', action: 'Grade published', target: 'CSC 101 — Introduction to Programming', user: 'Dr. Smith', time: '2 hours ago', status: 'PUBLISHED' as const },
  { id: '2', action: 'Grade amended', target: 'MAT 201 — Linear Algebra', user: 'Dr. Jones', time: '5 hours ago', status: 'PENDING_APPROVAL' as const },
  { id: '3', action: 'Student registered', target: 'John Doe (2023/001)', user: 'Admin', time: '1 day ago', status: 'INFO' as const },
  { id: '4', action: 'Course created', target: 'PHY 301 — Quantum Mechanics', user: 'Admin', time: '2 days ago', status: 'INFO' as const },
];

const quickStats = [
  { label: 'Total Students', value: '1,247', change: '+12 this week', icon: Users },
  { label: 'Active Courses', value: '86', change: '+3 this semester', icon: BookOpen },
  { label: 'Transcripts Generated', value: '3,892', change: '+45 this month', icon: FileText },
  { label: 'Pending Grades', value: '142', change: 'Requires attention', icon: AlertCircle, alert: true },
];

export default function DashboardPage() {
  return (
    <AppShell>
      <SectionHeader
        title="Dashboard"
        description="Overview of academic records and system activity"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
        {quickStats.map((stat) => (
          <StatCard
            key={stat.label}
            title={stat.label}
            value={stat.value}
            description={stat.change}
            icon={stat.icon}
            className={stat.alert ? 'border-l-2 border-l-warning' : ''}
          />
        ))}
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

          {/* Recent Activity */}
          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-semibold">Recent Activity</h3>
              <span className="text-xs text-muted-foreground">Last 7 days</span>
            </div>
            <div className="divide-y divide-border">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="px-4 py-3 flex items-center gap-3">
                  <StatusBadge status={activity.status} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{activity.action}</p>
                    <p className="text-xs text-muted-foreground truncate">{activity.target}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs text-muted-foreground">{activity.user}</p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="space-y-6">
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
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Storage</span>
                  <span className="text-xs text-muted-foreground">42% used</span>
                </div>
                <div className="h-1 bg-muted rounded-full overflow-hidden">
                  <div className="h-full w-[42%] bg-foreground rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-sm">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold">Grade Distribution</h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { grade: 'A', count: 312, pct: 28 },
                { grade: 'B', count: 445, pct: 40 },
                { grade: 'C', count: 223, pct: 20 },
                { grade: 'D', count: 89, pct: 8 },
                { grade: 'F', count: 45, pct: 4 },
              ].map((item) => (
                <div key={item.grade} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-tabular font-medium w-6">{item.grade}</span>
                    <span className="text-xs text-muted-foreground">{item.count} students</span>
                    <span className="text-xs text-muted-foreground w-8 text-right">{item.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-foreground rounded-full transition-all"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
