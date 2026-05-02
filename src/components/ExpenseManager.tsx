import { useState, useEffect } from 'react';
import { db, Expense, ExpenseInput } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select, Textarea } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { 
  Receipt, 
  Plus, 
  Trash2, 
  Filter, 
  TrendingDown, 
  Calendar,
  Wallet
} from 'lucide-react';
import { cn } from '@/utils/cn';

const EXPENSE_CATEGORIES = [
  'Rent', 'Utilities', 'Supplies', 'Transport', 'Salary', 'M-Pesa Charges', 'Other'
];

export function ExpenseManager() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<ExpenseInput>({
    category: 'Supplies',
    amount: 0,
    description: '',
    paid_to: ''
  });

  const loadExpenses = async () => {
    try {
      const data = await db.expenses.getAll();
      setExpenses(data);
    } catch (err) {
      console.error('Failed to load expenses:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    
    setSaving(true);
    try {
      const result = await db.expenses.create(form);
      if (result.success) {
        toast('✅ Expense logged successfully', 'success');
        setIsAdding(false);
        setForm({ category: 'Supplies', amount: 0, description: '', paid_to: '' });
        await loadExpenses();
      }
    } catch (err) {
      toast('Failed to log expense', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalExpenses = expenses.reduce((a, b) => a + b.amount, 0);

  if (loading) {
    return <div className="flex justify-center py-20 animate-spin"><Receipt /></div>;
  }

  return (
    <div className="space-y-8 animate-in">
      {/* Header & Stats */}
      <div className="flex items-end justify-between flex-wrap gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Expense Ledger</h1>
          <p className="text-slate-400 text-sm mt-1">Track business costs and operational overhead.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="glass-panel px-6 py-3 rounded-2xl border border-red-500/10 text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Outflow</p>
            <p className="text-2xl font-black text-red-400 tabular-nums">
              KSH {totalExpenses.toLocaleString('en-KE')}
            </p>
          </div>
          <Button 
            variant="primary" 
            size="lg" 
            onClick={() => setIsAdding(!isAdding)}
            icon={isAdding ? <TrendingDown size={18} /> : <Plus size={18} />}
            className="rounded-xl shadow-xl shadow-indigo-900/40"
          >
            {isAdding ? 'View Ledger' : 'Log Expense'}
          </Button>
        </div>
      </div>

      {isAdding ? (
        <div className="max-w-2xl mx-auto glass-panel rounded-3xl p-8 border border-white/5 animate-in">
          <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <Wallet size={20} className="text-indigo-400" />
            New Expense Entry
          </h2>
          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Select
                label="Category"
                options={EXPENSE_CATEGORIES.map(c => ({ value: c, label: c }))}
                value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}
              />
              <Input
                label="Amount (KSH)"
                type="number"
                required
                value={form.amount}
                onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <Input
              label="Paid To / Recipient"
              placeholder="e.g. Landlord, Kenya Power, Supplier Name"
              value={form.paid_to}
              onChange={e => setForm({ ...form, paid_to: e.target.value })}
            />
            <Textarea
              label="Description / Purpose"
              placeholder="Provide details about this expense..."
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
            <div className="flex gap-3 pt-2">
              <Button type="button" variant="ghost" fullWidth onClick={() => setIsAdding(false)}>Cancel</Button>
              <Button type="submit" variant="primary" fullWidth loading={saving}>Commit to Ledger</Button>
            </div>
          </form>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
          <table className="min-w-full text-sm border-separate border-spacing-0">
            <thead>
              <tr className="bg-white/[0.02]">
                {['Date', 'Category', 'Recipient', 'Amount', 'Description'].map((h, i) => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-white/5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <p className="text-slate-500 font-medium">No expenses recorded yet.</p>
                  </td>
                </tr>
              ) : (
                expenses.map(exp => (
                  <tr key={exp.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 tabular-nums text-slate-400">
                      {new Date(exp.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="indigo" className="rounded-md uppercase text-[9px] font-bold">{exp.category}</Badge>
                    </td>
                    <td className="px-6 py-4 text-white font-bold">{exp.paid_to || '—'}</td>
                    <td className="px-6 py-4 font-black text-red-400 tabular-nums">KSH {exp.amount.toLocaleString('en-KE')}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs italic">{exp.description || 'No description'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
