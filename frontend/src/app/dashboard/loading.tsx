import { AppShell } from '@/components/layout/app-shell';
import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <AppShell>
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Loading dashboard...</span>
      </div>
    </AppShell>
  );
}
