import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  className?: string;
}

export function StatCard({ title, value, description, icon: Icon, className = '' }: StatCardProps) {
  return (
    <div className={`bg-card border border-border rounded-sm p-4 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</p>
          <p className="text-2xl font-semibold tabular-nums tracking-tight">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>
        <div className="p-2 bg-muted rounded-sm">
          <Icon className="w-4 h-4 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
}
