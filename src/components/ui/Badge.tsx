import { cn } from '@/utils/cn';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';

interface BadgeProps {
  variant?: Variant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default: 'bg-slate-700 text-slate-200',
  success: 'bg-emerald-900/60 text-emerald-300 border border-emerald-700/50',
  warning: 'bg-amber-900/60 text-amber-300 border border-amber-700/50',
  danger:  'bg-red-900/60 text-red-300 border border-red-700/50',
  info:    'bg-sky-900/60 text-sky-300 border border-sky-700/50',
  purple:  'bg-purple-900/60 text-purple-300 border border-purple-700/50',
};

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
      variantClasses[variant],
      className,
    )}>
      {children}
    </span>
  );
}
