import { ActivityLog as LogEntry } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Database, 
  Settings, 
  Activity,
  Circle
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface ActivityLogProps {
  entries: LogEntry[];
  loading?: boolean;
}

const actionConfig: Record<string, { icon: any; color: string; border: string; bg: string }> = {
  CREATE: { icon: Plus,      color: 'text-emerald-400', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10' },
  UPDATE: { icon: Edit2,     color: 'text-indigo-400',  border: 'border-indigo-500/20',  bg: 'bg-indigo-500/10'  },
  DELETE: { icon: Trash2,    color: 'text-red-400',     border: 'border-red-500/20',     bg: 'bg-red-500/10'     },
  BACKUP: { icon: Database,  color: 'text-purple-400',  border: 'border-purple-500/20',  bg: 'bg-purple-500/10'  },
  SYSTEM: { icon: Settings,  color: 'text-amber-400',   border: 'border-amber-500/20',   bg: 'bg-amber-500/10'   },
};

export function ActivityLog({ entries, loading }: ActivityLogProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center py-12 animate-in">
        <div className="h-12 w-12 rounded-2xl bg-white/5 flex items-center justify-center text-slate-600 mx-auto mb-3 border border-white/5">
          <Activity size={24} strokeWidth={1} />
        </div>
        <p className="text-sm font-medium text-slate-500">No activity recorded in the audit trail.</p>
      </div>
    );
  }

  const parseDate = (dateStr: string) => {
    try {
      // Handle legacy SQLite timestamps (YYYY-MM-DD HH:MM:SS) by appending Z
      if (dateStr && !dateStr.includes('T') && !dateStr.endsWith('Z')) {
        return new Date(dateStr.replace(' ', 'T') + 'Z');
      }
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  return (
    <div className="relative space-y-6 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-px before:bg-white/5">
      {entries.map(entry => {
        const cfg = actionConfig[entry.action] ?? { icon: Circle, color: 'text-slate-400', border: 'border-white/10', bg: 'bg-white/5' };
        const Icon = cfg.icon;
        const date = parseDate(entry.created_at);
        
        return (
          <div
            key={entry.id}
            className="group relative flex items-start gap-4 transition-all duration-300 animate-in"
          >
            {/* Timeline Icon */}
            <div className={cn(
              "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 group-hover:scale-110",
              cfg.bg, cfg.border, cfg.color
            )}>
              <Icon size={16} strokeWidth={2} />
            </div>

            {/* Content Card */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center justify-between gap-4 mb-1">
                <p className="text-sm font-bold text-white tracking-tight leading-none group-hover:text-indigo-400 transition-colors">
                  {entry.details}
                </p>
                <time className="text-[10px] font-bold text-slate-600 uppercase tracking-widest tabular-nums shrink-0">
                  {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </time>
              </div>
              <div className="flex items-center gap-2">
                <span className={cn("text-[9px] font-black uppercase tracking-[0.15em]", cfg.color)}>
                  {entry.action}
                </span>
                <span className="h-1 w-1 rounded-full bg-slate-800" />
                <span className="text-[10px] font-medium text-slate-500">
                  {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
