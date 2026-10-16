import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[var(--color-teal-600)] text-white hover:bg-[var(--color-teal-500)] disabled:bg-[var(--color-border)] disabled:text-[var(--color-text-muted)]',
  secondary:
    'bg-transparent border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] disabled:opacity-50',
  ghost:
    'bg-transparent text-[var(--color-text)] hover:bg-[var(--color-surface-muted)] disabled:opacity-50',
  danger:
    'bg-transparent border border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[rgba(194,59,59,0.08)] disabled:opacity-50',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className = '', children, ...props },
  ref
) {
  const sizeClasses = size === 'lg' ? 'min-h-[48px] px-6 text-base' : 'min-h-[48px] px-5 text-sm';
  return (
    <button
      ref={ref}
      className={`inline-flex items-center justify-center gap-2 rounded-[var(--radius-md)] font-medium transition-colors duration-150 disabled:cursor-not-allowed ${sizeClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
});
