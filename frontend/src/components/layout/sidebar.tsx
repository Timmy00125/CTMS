'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  BookOpen,
  FileText,
  GraduationCap,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/students', label: 'Students', icon: Users },
  { href: '/dashboard/courses', label: 'Courses', icon: BookOpen },
  { href: '/dashboard/transcripts', label: 'Transcripts', icon: FileText },
  { href: '/dashboard/grades', label: 'Grades', icon: GraduationCap },
];

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  async function handleLogout() {
    try {
      await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
      window.location.href = '/login';
    } catch {
      window.location.href = '/login';
    }
  }

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-3 left-3 z-50 lg:hidden p-2 bg-card border border-border rounded-sm"
        aria-label="Toggle menu"
      >
        {mobileOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 z-40 h-screen w-56 bg-card border-r border-border
          flex flex-col transition-transform duration-200 ease-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        {/* Brand */}
        <div className="px-4 py-5 border-b border-border">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-foreground text-background flex items-center justify-center text-xs font-bold font-tabular">
              CT
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight leading-none">CTMS</span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">v1.0.0</span>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center gap-2.5 px-3 py-2 text-sm rounded-sm transition-colors
                  ${isActive
                    ? 'bg-foreground text-background font-medium'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-border">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted-foreground hover:text-destructive rounded-sm transition-colors"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
