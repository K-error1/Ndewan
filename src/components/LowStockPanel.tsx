import { Product } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowUpRight, 
  TrendingUp, 
  Package
} from 'lucide-react';
import { cn } from '@/utils/cn';

interface LowStockPanelProps {
  products: Product[];
  onRestock: (product: Product) => void;
}

export function LowStockPanel({ products, onRestock }: LowStockPanelProps) {
  const outOfStock = products.filter(p => p.quantity === 0);
  const lowStock   = products.filter(p => p.quantity > 0);

  if (products.length === 0) {
    return (
      <div className="rounded-3xl border border-emerald-500/10 bg-emerald-500/[0.03] p-10 text-center animate-in">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-500/10 text-emerald-500 mb-4 border border-emerald-500/20 shadow-lg shadow-emerald-500/10">
          <CheckCircle2 size={32} />
        </div>
        <p className="text-xl font-bold text-white">Inventory Synchronized</p>
        <p className="text-slate-500 text-sm mt-1 max-w-xs mx-auto">All product quantities are within established safety margins.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {outOfStock.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-red-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse"></span>
            Critical: Depleted ({outOfStock.length})
          </h3>
          <div className="space-y-3">
            {outOfStock.map(p => (
              <StockRow key={p.id} product={p} onRestock={onRestock} />
            ))}
          </div>
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
            Warning: Low Supply ({lowStock.length})
          </h3>
          <div className="space-y-3">
            {lowStock.map(p => (
              <StockRow key={p.id} product={p} onRestock={onRestock} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StockRow({ product, onRestock }: { product: Product; onRestock: (p: Product) => void }) {
  const isOut = product.quantity === 0;
  const pct   = isOut ? 0 : Math.min(100, Math.round((product.quantity / product.low_stock_threshold) * 100));

  return (
    <div className={cn(
      "group relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:border-white/10 glass-panel-light",
      isOut ? "border-red-500/10" : "border-amber-500/10"
    )}>
      <div className="flex items-center justify-between gap-6">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center border",
              isOut ? "bg-red-500/10 border-red-500/20 text-red-500" : "bg-amber-500/10 border-amber-500/20 text-amber-500"
            )}>
              <Package size={18} />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white tracking-tight truncate">{product.name}</p>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest truncate">{product.category}</p>
            </div>
          </div>

          {/* Stock indicator */}
          <div className="flex items-center gap-4">
            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-1000 ease-out",
                  isOut ? "bg-red-500" : "bg-amber-500"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex items-baseline gap-1 text-xs tabular-nums">
              <span className={cn("font-bold", isOut ? "text-red-400" : "text-amber-400")}>
                {product.quantity}
              </span>
              <span className="text-slate-600 font-bold">/ {product.low_stock_threshold}</span>
            </div>
          </div>
        </div>

        <Button
          variant={isOut ? 'danger' : 'warning'}
          size="sm"
          onClick={() => onRestock(product)}
          icon={<ArrowUpRight size={14} />}
          className="rounded-xl font-bold shadow-lg h-10 px-4"
        >
          Restock
        </Button>
      </div>
    </div>
  );
}
