import { cn } from '@/utils/cn';

interface StatCardProps {
  label:     string;
  value:     string | number;
  icon:      React.ReactNode;
  color:     'indigo' | 'emerald' | 'amber' | 'red' | 'sky';
  subtitle?: string;
  pulse?:    boolean;
}

const colorMap = {
  indigo:  { bg: 'bg-indigo-500/10',  icon: 'text-indigo-400',  border: 'border-indigo-500/20',  glow: 'shadow-indigo-500/10'  },
  emerald: { bg: 'bg-emerald-500/10', icon: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-500/10' },
  amber:   { bg: 'bg-amber-500/10',   icon: 'text-amber-400',   border: 'border-amber-500/20',   glow: 'shadow-amber-500/10'   },
  red:     { bg: 'bg-red-500/10',     icon: 'text-red-400',     border: 'border-red-500/20',     glow: 'shadow-red-500/10'     },
  sky:     { bg: 'bg-sky-500/10',     icon: 'text-sky-400',     border: 'border-sky-500/20',     glow: 'shadow-sky-500/10'     },
};

export function StatCard({ label, value, icon, color, subtitle, pulse }: StatCardProps) {
  const c = colorMap[color];
  return (
    <div className={cn(
      'group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-1 glass-panel',
      c.border, c.glow,
    )}>
      {/* Background glow element */}
      <div className={cn('absolute -right-4 -top-4 h-24 w-24 rounded-full blur-3xl transition-opacity group-hover:opacity-100 opacity-20', c.bg)} />
      
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white tracking-tight tabular-nums">{value}</p>
          {subtitle && <p className="mt-2 text-[11px] font-medium text-slate-500 line-clamp-1">{subtitle}</p>}
        </div>
        <div className={cn('relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border transition-colors duration-300', c.bg, c.border)}>
          {pulse && (
            <span className="absolute inset-0 rounded-2xl animate-ping opacity-20 bg-current" />
          )}
          <span className={cn('relative', c.icon)}>{icon}</span>
        </div>
      </div>
    </div>
  );
}
