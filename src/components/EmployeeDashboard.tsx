import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Scan, 
  Plus, 
  Minus, 
  Package, 
  MapPin, 
  Barcode, 
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { db, Product } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';

interface EmployeeDashboardProps {
  hideHeader?: boolean;
}

export function EmployeeDashboard({ hideHeader }: EmployeeDashboardProps) {
  const [query, setQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [movementCount, setMovementCount] = useState(0);
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input on mount and after actions
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 3) {
      if (!val) setSelectedProduct(null);
      return;
    }

    setLoading(true);
    try {
      // First try exact barcode match
      let product = await db.products.getByBarcode(val);
      
      // If no barcode match, try fuzzy search
      if (!product) {
        const results = await db.products.search(val);
        if (results.length === 1) {
          product = results[0];
        }
      }

      if (product) {
        setSelectedProduct(product);
        setQuery(''); // clear query so scanner is ready for next item if we didn't want selection, 
        // but here we want to show the selection.
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdjustStock = async (delta: number) => {
    if (!selectedProduct) return;
    const newQty = Math.max(0, selectedProduct.quantity + delta);
    
    try {
      const res = await db.products.update({
        ...selectedProduct,
        quantity: newQty
      });
      
      if (res.success) {
        toast(
          `${delta > 0 ? 'Stock Intake Successful' : 'Stock Picked Successfully'}: ${selectedProduct.name} (${selectedProduct.quantity} -> ${newQty})`,
          'success'
        );
        setSelectedProduct({ ...selectedProduct, quantity: newQty });
        setMovementCount(prev => prev + 1);
        inputRef.current?.focus();
      }
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to update stock', variant: 'danger' });
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white tracking-tight">Operations</h1>
            <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>
              Ready for Scanning
            </p>
          </div>
          <div className="glass-panel px-4 py-2 rounded-xl border border-white/5 text-right">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Movements Today</p>
            <p className="text-xl font-bold text-white tabular-nums">{movementCount}</p>
          </div>
        </div>
      )}

      {/* Main Scanner Input */}
      <div className="relative group">
        <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
          {loading ? (
            <RotateCcw size={18} className="text-indigo-400 animate-spin" />
          ) : (
            <Scan size={18} className="text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
          )}
        </div>
        <input
          ref={inputRef}
          type="text"
          placeholder="Scan barcode or search product…"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-full bg-[#0a0f1d] border-2 border-white/5 rounded-2xl py-4 pl-12 pr-36 text-base font-medium text-white placeholder:text-slate-600 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2">
          <Badge variant="purple" className="px-3 py-1 font-bold text-[10px] uppercase tracking-tighter">Scanner Ready</Badge>
        </div>
      </div>

      {/* Selected Product Card */}
      {selectedProduct ? (
        <div className="glass-panel rounded-[2.5rem] p-10 border border-white/10 shadow-2xl animate-in relative overflow-hidden">
          {/* Background glow */}
          <div className="absolute -right-20 -top-20 h-64 w-64 bg-indigo-500/10 rounded-full blur-[100px]" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 relative z-10">
            {/* Details */}
            <div className="space-y-6">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em]">Active Selection</p>
                <h2 className="text-4xl font-bold text-white leading-tight">{selectedProduct.name}</h2>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <MapPin size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Location</span>
                  </div>
                  <p className="text-lg font-bold text-white">{selectedProduct.location || 'Not Set'}</p>
                </div>
                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                  <div className="flex items-center gap-2 text-slate-500 mb-1">
                    <Barcode size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">SKU/Barcode</span>
                  </div>
                  <p className="text-lg font-bold text-white truncate">{selectedProduct.sku || selectedProduct.barcode || '—'}</p>
                </div>
              </div>

              <div className="pt-4">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Current Inventory</p>
                <div className="flex items-baseline gap-3">
                  <span className={cn(
                    "text-7xl font-black tabular-nums tracking-tighter",
                    selectedProduct.quantity <= selectedProduct.low_stock_threshold ? "text-red-500" : "text-white"
                  )}>
                    {selectedProduct.quantity}
                  </span>
                  <span className="text-2xl font-bold text-slate-700">/ {selectedProduct.max_stock_threshold} units</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col justify-center gap-6">
              <div className="grid grid-cols-1 gap-4">
                <button
                  onClick={() => handleAdjustStock(1)}
                  className="flex items-center justify-center gap-4 bg-emerald-500 hover:bg-emerald-400 text-white rounded-3xl py-10 transition-all active:scale-95 shadow-xl shadow-emerald-500/20 group"
                >
                  <Plus size={48} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
                  <span className="text-3xl font-black uppercase tracking-tighter">Stock Intake</span>
                </button>
                <button
                  onClick={() => handleAdjustStock(-1)}
                  disabled={selectedProduct.quantity === 0}
                  className="flex items-center justify-center gap-4 bg-red-500 hover:bg-red-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-3xl py-10 transition-all active:scale-95 shadow-xl shadow-red-500/20 group"
                >
                  <Minus size={48} strokeWidth={3} className="group-hover:-translate-x-2 transition-transform" />
                  <span className="text-3xl font-black uppercase tracking-tighter">Pick Stock</span>
                </button>
              </div>
              <button
                onClick={() => { setSelectedProduct(null); inputRef.current?.focus(); }}
                className="text-slate-500 hover:text-white text-sm font-bold uppercase tracking-widest transition-colors py-2"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 glass-panel rounded-2xl border border-white/5 px-6 py-4">
          <div className="h-9 w-9 bg-white/5 rounded-xl flex items-center justify-center border border-white/5 text-slate-600 shrink-0">
            <Scan size={18} strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-400">Waiting for scan…</p>
            <p className="text-[11px] text-slate-600 font-medium">Type a product name or scan a barcode to begin</p>
          </div>
          <span className="ml-auto h-2 w-2 rounded-full bg-indigo-500 animate-pulse shadow-lg shadow-indigo-500/50" />
        </div>
      )}

      {/* Quick Action Hints */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="flex items-center gap-4 p-6 glass-panel-light rounded-2xl border border-white/5">
          <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
             <CheckCircle2 size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tighter">Real-Time Sync</p>
            <p className="text-[10px] text-slate-500 font-medium">Auto-updates across devices</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 glass-panel-light rounded-2xl border border-white/5">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
             <TrendingUp size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tighter">History Logged</p>
            <p className="text-[10px] text-slate-500 font-medium">All movements are audited</p>
          </div>
        </div>
        <div className="flex items-center gap-4 p-6 glass-panel-light rounded-2xl border border-white/5">
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400">
             <AlertTriangle size={20} />
          </div>
          <div>
            <p className="text-xs font-bold text-white uppercase tracking-tighter">Shortage Alert</p>
            <p className="text-[10px] text-slate-500 font-medium">Instantly flags low stock</p>
          </div>
        </div>
      </div>
    </div>
  );
}
