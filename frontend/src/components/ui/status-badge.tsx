'use client';

type StatusVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

interface StatusBadgeProps {
  status: string;
  variant?: StatusVariant;
  className?: string;
}

function inferVariant(status: string): StatusVariant {
  const s = status.toUpperCase();
  if (s === 'PUBLISHED' || s === 'ACTIVE' || s === 'APPROVED' || s === 'COMPLETED') return 'success';
  if (s === 'PENDING_APPROVAL' || s === 'PENDING' || s === 'WARNING') return 'warning';
  if (s === 'DRAFT' || s === 'FAILED' || s === 'REJECTED') return 'danger';
  if (s === 'INFO' || s === 'PROCESSING') return 'info';
  return 'neutral';
}

export function StatusBadge({ status, variant, className = '' }: StatusBadgeProps) {
  const v = variant || inferVariant(status);
  const classMap: Record<StatusVariant, string> = {
    success: 'badge-status-success',
    warning: 'badge-status-warning',
    danger: 'badge-status-danger',
    info: 'badge-status-info',
    neutral: 'badge-status-neutral',
  };

  return (
    <span className={`${classMap[v]} ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {status}
    </span>
  );
}
