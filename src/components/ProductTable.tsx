import { Product } from '@/lib/db';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/utils/cn';
import { 
  Edit2, 
  Trash2, 
  History, 
  AlertTriangle, 
  Package,
  TrendingUp,
  Boxes
} from 'lucide-react';

interface ProductTableProps {
  products:    Product[];
  onEdit:      (product: Product) => void;
  onDelete:    (product: Product) => void;
  onHistory:   (product: Product) => void;
  loading?:    boolean;
  emptyMessage?: string;
}

function StockBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  if (quantity === 0)             return <Badge variant="danger" className="rounded-md uppercase text-[10px] tracking-wider font-bold">Out of Stock</Badge>;
  if (quantity <= threshold)      return <Badge variant="warning" className="rounded-md uppercase text-[10px] tracking-wider font-bold">Low Stock</Badge>;
  return <Badge variant="success" className="rounded-md uppercase text-[10px] tracking-wider font-bold">In Stock</Badge>;
}

export function ProductTable({ products, onEdit, onDelete, onHistory, loading, emptyMessage }: ProductTableProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-slate-400 text-sm font-medium tracking-wide">Synchronizing catalog assets…</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-center animate-in">
        <div className="h-20 w-20 rounded-3xl bg-white/5 flex items-center justify-center text-slate-600 border border-white/5">
          <Package size={40} strokeWidth={1} />
        </div>
        <div>
          <p className="text-xl font-bold text-white">
            {emptyMessage ?? 'Catalog Empty'}
          </p>
          <p className="text-sm text-slate-500 mt-1 max-w-[200px] mx-auto">
            {emptyMessage ? 'Adjust your filters or search criteria' : 'Register your first product to begin tracking.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm border-separate border-spacing-0">
        <thead>
          <tr className="bg-white/[0.02]">
            {['Product', 'SKU', 'Buying', 'Selling', 'Profit', 'Stock', 'Status', 'Actions'].map((h, i) => (
              <th 
                key={h} 
                className={cn(
                  "px-6 py-4 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 border-b border-white/5",
                  i === 0 && "pl-8"
                )}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {products.map(p => {
            const isLow   = p.quantity > 0 && p.quantity <= p.low_stock_threshold;
            const isOut   = p.quantity === 0;
            return (
              <tr
                key={p.id}
                className={cn(
                  'transition-all duration-200 hover:bg-white/[0.04] group',
                  isOut && 'bg-red-500/[0.03]',
                  isLow && !isOut && 'bg-amber-500/[0.03]',
                )}
              >
                {/* Product name */}
                <td className="px-6 py-5 pl-8">
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border",
                      isOut ? "bg-red-500/10 border-red-500/20 text-red-500" : 
                      isLow ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : 
                      "bg-slate-800/50 border-white/5 text-slate-400"
                    )}>
                      {isOut ? <AlertTriangle size={18} /> : isLow ? <TrendingUp size={18} /> : <Boxes size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-white tracking-tight truncate">{p.name}</p>
                      <p className="text-[11px] font-medium text-slate-500 truncate mt-0.5">{p.category}</p>
                    </div>
                  </div>
                </td>

                {/* SKU */}
                <td className="px-6 py-5">
                  <code className="text-[11px] font-bold text-slate-400 bg-white/5 px-2 py-1 rounded-md border border-white/5 tabular-nums">
                    {p.sku || 'N/A'}
                  </code>
                </td>

                {/* Buying Price */}
                <td className="px-6 py-5">
                  <span className="font-semibold text-slate-400 tabular-nums">KSH {Number(p.buying_price || 0).toLocaleString('en-KE')}</span>
                </td>

                {/* Selling Price */}
                <td className="px-6 py-5">
                  <span className="font-bold text-white tabular-nums">KSH {Number(p.price).toLocaleString('en-KE')}</span>
                </td>

                {/* Profit */}
                <td className="px-6 py-5">
                  <span className="font-bold text-emerald-400 tabular-nums">
                    KSH {(p.price - (p.buying_price || 0)).toLocaleString('en-KE')}
                  </span>
                </td>

                {/* Quantity */}
                <td className="px-6 py-5">
                  <div className="flex items-baseline gap-1.5">
                    <span className={cn(
                      'font-bold text-base tabular-nums',
                      isOut && 'text-red-400',
                      isLow && !isOut && 'text-amber-400',
                      !isOut && !isLow && 'text-white',
                    )}>
                      {p.quantity}
                    </span>
                    <span className="text-slate-600 text-[10px] font-bold">/ {p.low_stock_threshold}</span>
                  </div>
                </td>

                {/* Status badge */}
                <td className="px-6 py-5">
                  <StockBadge quantity={p.quantity} threshold={p.low_stock_threshold} />
                </td>

                {/* Actions */}
                <td className="px-6 py-5 pr-8">
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onHistory(p)}
                      title="History"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-400"
                    >
                      <History size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(p)}
                      title="Edit"
                      className="h-8 w-8 p-0 rounded-lg hover:bg-white/10 hover:text-white"
                    >
                      <Edit2 size={14} />
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => onDelete(p)}
                      title="Remove"
                      className="h-8 w-8 p-0 rounded-lg"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
