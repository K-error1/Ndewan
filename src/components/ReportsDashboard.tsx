import { useState, useEffect } from 'react';
import { db } from '@/lib/db';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  PieChart as PieIcon, 
  Download,
  Calendar,
  FileText
} from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export function ReportsDashboard() {
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadReports = async () => {
    try {
      const [trend, cats, top, sum] = await Promise.all([
        db.reports.revenueTrend(),
        db.reports.categoryStats(),
        db.reports.topProducts(),
        db.reports.monthlySummary()
      ]);
      setRevenueData(trend);
      setCategoryData(cats);
      setTopProducts(top);
      setSummary(sum);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReports(); }, []);

  const handleExportCSV = () => {
    // Basic CSV export logic
    const headers = ['Date', 'Revenue'];
    const rows = revenueData.map(d => [d.date, d.amount]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `revenue_report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (loading) return <div className="flex justify-center py-20 animate-pulse text-indigo-400"><TrendingUp size={40} /></div>;

  const netProfit = (summary?.gross_profit || 0) - (summary?.expenses || 0);

  return (
    <div className="space-y-8 animate-in pb-20">
      {/* Header */}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Business Intelligence</h1>
          <p className="text-slate-400 text-sm mt-1">Analytics and financial performance overview.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={loadReports} icon={<Calendar size={16} />}>Refresh</Button>
          <Button variant="primary" onClick={handleExportCSV} icon={<Download size={16} />}>Export CSV</Button>
        </div>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-indigo-500/5 to-transparent">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Monthly Revenue</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tabular-nums">KSH {Number(summary?.revenue || 0).toLocaleString()}</span>
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Total sales this month</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/5 bg-gradient-to-br from-red-500/5 to-transparent">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Monthly Expenses</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-white tabular-nums">KSH {Number(summary?.expenses || 0).toLocaleString()}</span>
            <TrendingDown size={16} className="text-red-400" />
          </div>
          <p className="text-xs text-slate-500 mt-2">Operational costs</p>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-emerald-500/10 bg-gradient-to-br from-emerald-500/5 to-transparent">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Net Profit Estimate</p>
          <div className="flex items-baseline gap-2">
            <span className={cn(
              "text-3xl font-black tabular-nums",
              netProfit >= 0 ? "text-emerald-400" : "text-red-400"
            )}>
              KSH {Math.abs(netProfit).toLocaleString()}
              {netProfit < 0 && ' (Loss)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-2">Gross Profit - Expenses</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Revenue Trend Chart */}
        <div className="xl:col-span-2 glass-panel rounded-3xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
            <TrendingUp size={20} className="text-indigo-400" />
            30-Day Revenue Trend
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="#64748b" 
                  fontSize={10} 
                  tickFormatter={(str) => str.slice(8,10)}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  fontSize={10} 
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(val) => `KSH ${val >= 1000 ? (val/1000).toFixed(0)+'k' : val}`}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '12px' }}
                  itemStyle={{ color: '#fff', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="glass-panel rounded-3xl p-8 border border-white/5">
          <h2 className="text-lg font-bold text-white mb-8 flex items-center gap-3">
            <PieIcon size={20} className="text-emerald-400" />
            Category Mix
          </h2>
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="revenue"
                  nameKey="category"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '10px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-3 mt-4">
            {categoryData.slice(0, 4).map((cat, i) => (
              <div key={cat.category} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  <span className="text-xs text-slate-400 font-medium">{cat.category}</span>
                </div>
                <span className="text-xs text-white font-bold tabular-nums">
                  {((cat.revenue / (summary?.revenue || 1)) * 100).toFixed(0)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products Table */}
      <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
        <div className="p-6 border-b border-white/5 bg-white/[0.01]">
          <h2 className="font-bold text-white flex items-center gap-2">
            <Package size={18} className="text-amber-400" />
            Best Sellers
          </h2>
        </div>
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-black/20">
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Product</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Units Sold</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Revenue</th>
              <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-500 uppercase tracking-widest">Performance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {topProducts.map((p, i) => (
              <tr key={p.name} className="hover:bg-white/[0.01] transition-colors">
                <td className="px-6 py-4 font-bold text-white">{p.name}</td>
                <td className="px-6 py-4 tabular-nums text-slate-400 font-medium">{p.units_sold} units</td>
                <td className="px-6 py-4 tabular-nums font-black text-emerald-400">KSH {p.total_revenue.toLocaleString()}</td>
                <td className="px-6 py-4">
                  <div className="h-1.5 w-24 bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500" 
                      style={{ width: `${(p.total_revenue / topProducts[0].total_revenue) * 100}%` }}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
