import { ReactNode } from 'react';
import { Info, AlertTriangle, CheckCircle2, Loader2 } from 'lucide-react';

type Kind = 'info' | 'warning' | 'success' | 'loading' | 'empty';

const iconFor: Record<Kind, ReactNode> = {
  info: <Info size={18} aria-hidden="true" />,
  warning: <AlertTriangle size={18} aria-hidden="true" />,
  success: <CheckCircle2 size={18} aria-hidden="true" />,
  loading: <Loader2 size={18} aria-hidden="true" className="animate-spin" />,
  empty: <Info size={18} aria-hidden="true" />,
};

const classesFor: Record<Kind, string> = {
  info: 'bg-[var(--color-surface-muted)] text-[var(--color-text)]',
  warning: 'bg-[rgba(185,121,42,0.1)] text-[var(--color-warning)]',
  success: 'bg-[rgba(31,157,85,0.1)] text-[var(--color-success)]',
  loading: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
  empty: 'bg-[var(--color-surface-muted)] text-[var(--color-text-muted)]',
};

export function StatusMessage({
  kind = 'info',
  children,
  role,
}: {
  kind?: Kind;
  children: ReactNode;
  role?: 'status' | 'alert';
}) {
  return (
    <div
      role={role ?? (kind === 'warning' ? 'alert' : 'status')}
      className={`flex items-start gap-2 rounded-[var(--radius-md)] px-4 py-3 text-sm ${classesFor[kind]}`}
    >
      {iconFor[kind]}
      <span>{children}</span>
    </div>
  );
}
