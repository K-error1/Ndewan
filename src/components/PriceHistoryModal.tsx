import { useEffect, useState } from 'react';
import { db, PriceHistory, Product } from '@/lib/db';
import { Modal } from '@/components/ui/Modal';

interface PriceHistoryModalProps {
  product:  Product | null;
  onClose:  () => void;
}

export function PriceHistoryModal({ product, onClose }: PriceHistoryModalProps) {
  const [history, setHistory] = useState<PriceHistory[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) return;
    setLoading(true);
    db.priceHistory.get(product.id)
      .then(setHistory)
      .finally(() => setLoading(false));
  }, [product]);

  const parseDate = (dateStr: string) => {
    try {
      if (dateStr && !dateStr.includes('T') && !dateStr.endsWith('Z')) {
        return new Date(dateStr.replace(' ', 'T') + 'Z');
      }
      return new Date(dateStr);
    } catch {
      return new Date();
    }
  };

  const fmtKSH = (n: number) => `KSH ${new Intl.NumberFormat('en-KE').format(n)}`;

  return (
    <Modal
      open={!!product}
      onClose={onClose}
      title={`📈 Price History — ${product?.name ?? ''}`}
      size="md"
    >
      {loading ? (
        <div className="flex justify-center py-10">
          <svg className="animate-spin h-6 w-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-4xl mb-3">📊</div>
          <p className="text-slate-400 text-sm">No price changes recorded yet.</p>
          <p className="text-slate-500 text-xs mt-1">
            Price history is recorded automatically each time you update a product's price.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Current price banner */}
          <div className="flex items-center justify-between rounded-lg bg-indigo-900/30 border border-indigo-700/40 px-4 py-3">
            <span className="text-sm text-slate-300 font-medium">Current Price</span>
            <span className="text-xl font-bold text-indigo-300">{fmtKSH(product?.price ?? 0)}</span>
          </div>

          {/* History list */}
          <div className="space-y-2">
            {history.map((h, i) => {
              const date = parseDate(h.changed_at);
              const increased = h.new_price > h.old_price;
              const pct = h.old_price > 0
                ? (((h.new_price - h.old_price) / h.old_price) * 100).toFixed(1)
                : '∞';
              return (
                <div
                  key={h.id}
                  className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-800/40 px-4 py-3"
                >
                  {/* Timeline dot */}
                  <div className="flex flex-col items-center">
                    <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                    {i < history.length - 1 && <div className="w-px flex-1 bg-slate-700 mt-1" style={{ minHeight: 12 }} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-slate-400 line-through text-xs font-medium">{fmtKSH(h.old_price)}</span>
                      <span className="text-slate-500">→</span>
                      <span className="font-bold text-white text-sm">{fmtKSH(h.new_price)}</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded uppercase ${
                        increased ? 'bg-red-900/50 text-red-300' : 'bg-emerald-900/50 text-emerald-300'
                      }`}>
                        {increased ? '▲' : '▼'} {Math.abs(parseFloat(pct))}%
                      </span>
                    </div>
                    {h.note && <p className="text-[10px] font-medium text-slate-500 mt-0.5 uppercase tracking-wide">{h.note}</p>}
                  </div>

                  <div className="text-right">
                    <time className="block text-[10px] font-bold text-slate-400 tabular-nums">
                      {date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                    </time>
                    <time className="block text-[9px] font-medium text-slate-600 uppercase">
                      {date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </time>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Modal>
  );
}
