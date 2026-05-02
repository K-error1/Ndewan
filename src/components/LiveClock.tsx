import { useState, useEffect } from 'react';
import { Clock as ClockIcon } from 'lucide-react';

export function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-4 bg-black/20 rounded-2xl border border-white/5 mb-4">
      <div className="flex items-center gap-2 text-indigo-400 mb-1">
        <ClockIcon size={12} />
        <span className="text-[10px] font-bold uppercase tracking-widest">Real-Time Clock</span>
      </div>
      <div className="text-2xl font-black text-white tabular-nums tracking-tighter">
        {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </div>
      <div className="text-[9px] font-bold text-slate-500 uppercase tracking-tight mt-1">
        {time.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
      </div>
    </div>
  );
}
