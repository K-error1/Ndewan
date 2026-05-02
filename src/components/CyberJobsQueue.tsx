import { useState, useEffect } from 'react';
import { db, CyberJob } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  User, 
  MoreHorizontal,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/utils/cn';
import { printReceipt } from '@/utils/printing';

interface CyberJobsQueueProps {
  onStatusChange?: () => void;
}

export function CyberJobsQueue({ onStatusChange }: CyberJobsQueueProps) {
  const [jobs, setJobs] = useState<CyberJob[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState(0);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [active, revenue] = await Promise.all([
        db.cyberJobs.getActive(),
        db.cyberJobs.getDailyRevenue(),
      ]);
      setJobs(active);
      setDailyRevenue(revenue.total || 0);
    } catch (err) {
      console.error('Failed to load cyber jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (id: number, status: 'done' | 'cancelled') => {
    try {
      const job = jobs.find(j => j.id === id);
      await db.cyberJobs.updateStatus(id, status);
      
      if (status === 'done' && job) {
        const settings = await db.settings.getAll();
        printReceipt({
          shopName: settings.shop_name || 'Ndewan Enterprices',
          address: settings.shop_address || 'Nairobi',
          phone: settings.shop_phone || '',
          till: settings.mpesa_till || '',
          items: [{ name: job.service_type, qty: 1, price: job.amount }],
          total: job.amount,
          cashier: 'Staff',
          footer: settings.receipt_footer || 'Thank you!'
        });
      }

      await loadData();
      if (onStatusChange) onStatusChange();
    } catch (err) {
      console.error('Failed to update job status:', err);
    }
  };

  if (loading && jobs.length === 0) {
    return (
      <div className="flex justify-center py-10">
        <div className="h-6 w-6 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {/* Active Jobs List */}
      <div className="xl:col-span-2 space-y-4">
        <div className="flex items-center justify-between mb-2 px-2">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            Active Service Queue
          </h2>
          <Badge variant="warning" className="rounded-lg">{jobs.length} Pending</Badge>
        </div>

        {jobs.length === 0 ? (
          <div className="glass-panel rounded-2xl p-10 text-center border border-white/5 bg-white/[0.01]">
            <CheckCircle2 size={40} className="mx-auto mb-3 text-slate-700" strokeWidth={1} />
            <p className="text-slate-500 font-medium text-sm">All caught up! No pending jobs.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {jobs.map(job => (
              <div 
                key={job.id} 
                className="glass-panel rounded-2xl p-4 border border-white/5 flex items-center justify-between group hover:border-white/10 transition-all"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                    <User size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-white text-sm truncate">{job.customer_name || 'Walk-in Customer'}</p>
                      <span className="text-[10px] text-slate-600 font-bold uppercase tracking-tighter tabular-nums bg-white/5 px-1.5 py-0.5 rounded">
                        #{job.id}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mt-0.5">{job.service_type}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                      Started {new Date(job.created_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <p className="text-sm font-black text-white tabular-nums">KSH {job.amount.toLocaleString('en-KE')}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleUpdateStatus(job.id, 'done')}
                      className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-1.5"
                    >
                      <CheckCircle2 size={12} />
                      Done
                    </button>
                    <button 
                      onClick={() => handleUpdateStatus(job.id, 'cancelled')}
                      className="h-8 w-8 rounded-lg bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-400 flex items-center justify-center transition-all active:scale-95"
                    >
                      <XCircle size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cyber Summary & Cheat Sheet */}
      <div className="space-y-6">
        {/* Daily Summary Card */}
        <div className="glass-panel rounded-3xl p-6 border border-purple-500/20 bg-gradient-to-br from-purple-900/10 to-transparent relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-32 w-32 bg-purple-500/10 rounded-full blur-[40px]" />
          <div className="relative z-10">
            <p className="text-[10px] font-bold text-purple-400 uppercase tracking-[0.2em] mb-4">Today's Cyber Revenue</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white tabular-nums">KSH {dailyRevenue.toLocaleString('en-KE')}</span>
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
            <p className="text-xs text-slate-500 font-medium mt-2">Finalized jobs only</p>
          </div>
        </div>

        {/* Cheat Sheet (Kenya Specific) */}
        <div className="glass-panel rounded-3xl p-6 border border-white/5">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <MoreHorizontal size={18} className="text-slate-400" />
            Common Task Guides
          </h3>
          <div className="space-y-4">
            <div className="group">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">KRA iTax Return</p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 font-medium">
                <li>Log in to iTax with PIN & Password</li>
                <li>Download Excel/ODS sheet if needed</li>
                <li>Upload JSON/Zip & Submit</li>
                <li>Print Acknowledgment Receipt</li>
              </ul>
            </div>
            <div className="group">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">eCitizen - Driving License</p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 font-medium">
                <li>NTSA Service Portal → DL Renewal</li>
                <li>Select duration (1yr / 3yr)</li>
                <li>Pay via M-Pesa Till 202020</li>
                <li>Download DL copy for printing</li>
              </ul>
            </div>
            <div className="group">
              <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest mb-2 group-hover:text-indigo-400 transition-colors">SHA Registration</p>
              <ul className="text-[11px] text-slate-400 space-y-1.5 list-disc pl-4 font-medium">
                <li>Visit sha.go.ke or *263#</li>
                <li>Use ID Number & Phone Number</li>
                <li>Follow prompts to add dependents</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
