import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  ShoppingCart, 
  Trash2, 
  Plus, 
  Minus, 
  CreditCard, 
  Banknote, 
  User,
  X,
  CheckCircle2,
  Printer,
  History,
  Zap,
  Tag
} from 'lucide-react';
import { db, Product, SaleItem } from '@/lib/db';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { printReceipt } from '@/utils/printing';

interface CartItem extends Product {
  cartQty: number;
}

export function POS() {
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa' | 'Credit'>('Cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [notes, setNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [settings, setSettings] = useState<Record<string, string>>({});
  
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    db.settings.getAll().then(setSettings);
    searchRef.current?.focus();
  }, []);

  const handleSearch = async (val: string) => {
    setQuery(val);
    if (val.length < 1) {
      setResults([]);
      return;
    }
    try {
      const res = await db.products.search(val);
      setResults(res.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    if (product.quantity <= 0) {
      toast(`${product.name} is out of stock`, 'error');
      return;
    }
    
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.cartQty >= product.quantity) {
          toast(`Max stock reached for ${product.name}`, 'warning');
          return prev;
        }
        return prev.map(item => 
          item.id === product.id ? { ...item, cartQty: item.cartQty + 1 } : item
        );
      }
      return [...prev, { ...product, cartQty: 1 }];
    });
    
    setQuery('');
    setResults([]);
    searchRef.current?.focus();
  };

  const updateQty = (id: number, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, Math.min(item.quantity, item.cartQty + delta));
        return { ...item, cartQty: newQty };
      }
      return item;
    }));
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const subtotal = cart.reduce((sum, item) => sum + (item.price * item.cartQty), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'M-Pesa' && !mpesaCode.trim()) {
      toast('M-Pesa Transaction Code is required', 'error');
      return;
    }
    if (paymentMethod === 'Credit' && !customerName.trim()) {
      toast('Customer Name is required for credit sales', 'error');
      return;
    }

    setProcessing(true);
    try {
      const saleData = {
        total_amount: subtotal,
        payment_method: paymentMethod,
        mpesa_code: paymentMethod === 'M-Pesa' ? mpesaCode.toUpperCase() : undefined,
        customer_name: paymentMethod === 'Credit' ? customerName : undefined,
        notes: notes.trim() || undefined
      };

      const saleItems: SaleItem[] = cart.map(item => ({
        product_id: item.id,
        quantity: item.cartQty,
        unit_price: item.price,
        unit_buying_price: item.buying_price || 0
      }));

      const res = await db.sales.create({ sale: saleData, items: saleItems });
      
      if (res.success) {
        const receiptNo = `RCP-${new Date().toISOString().slice(0,10).replace(/-/g,'')}-${res.id}`;
        
        toast(`✅ Sale #${res.id} completed successfully`, 'success');
        
        // Print Receipt
        printReceipt({
          shopName: settings.shop_name || 'Ndewan Enterprises',
          address: settings.shop_address || 'Nairobi',
          phone: settings.shop_phone || '',
          till: settings.mpesa_till || '',
          items: cart.map(item => ({ name: item.name, qty: item.cartQty, price: item.price })),
          total: subtotal,
          cashier: 'Admin', // Ideally from context
          footer: settings.receipt_footer || 'Thank you for your business!'
        });

        // Reset
        setCart([]);
        setShowCheckout(false);
        setMpesaCode('');
        setCustomerName('');
        setNotes('');
        setPaymentMethod('Cash');
      }
    } catch (err: any) {
      toast(err.message || 'Checkout failed', 'error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-12rem)] animate-in">
      
      {/* ── Left: Search & Results ────────────────────────────────────────── */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <div className="glass-panel rounded-3xl p-6 border border-white/5 space-y-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
            <input
              ref={searchRef}
              type="text"
              placeholder="Scan barcode or type product name..."
              className="w-full bg-[#0a0f1d] border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all text-lg"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && results.length > 0) {
                  addToCart(results[0]);
                }
              }}
            />
          </div>

          {results.length > 0 && (
            <div className="space-y-2 pt-2 animate-in slide-in-from-top-2">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => addToCart(p)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:border-indigo-500/30 hover:bg-indigo-500/10 transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 group-hover:text-indigo-400">
                      <Tag size={18} />
                    </div>
                    <div className="text-left">
                      <p className="text-white font-bold">{p.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{p.category} • {p.quantity} in stock</p>
                    </div>
                  </div>
                  <p className="text-lg font-black text-indigo-400">KSH {p.price.toLocaleString()}</p>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Categories / Quick Picks (Optional Placeholder) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {['Stationery', 'Books', 'Supplies', 'Gifts'].map(cat => (
            <button key={cat} className="glass-panel p-4 rounded-2xl border border-white/5 text-center hover:border-white/20 transition-all group">
              <Zap size={20} className="mx-auto mb-2 text-slate-600 group-hover:text-amber-400 transition-colors" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{cat}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── Right: Cart ──────────────────────────────────────────────────── */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <div className="glass-panel rounded-3xl border border-white/5 flex flex-col h-full overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ShoppingCart size={16} />
              </div>
              <h2 className="text-lg font-bold text-white tracking-tight">Active Cart</h2>
            </div>
            <span className="text-[10px] font-black bg-indigo-500 text-white px-2 py-0.5 rounded-full">{cart.length} ITEMS</span>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[300px]">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 opacity-50 space-y-4">
                <ShoppingCart size={48} strokeWidth={1} />
                <p className="text-sm font-medium">Cart is empty</p>
              </div>
            ) : (
              cart.map(item => (
                <div key={item.id} className="p-3 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between group">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-white truncate">{item.name}</p>
                    <p className="text-[10px] text-slate-500 font-bold">KSH {item.price.toLocaleString()}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
                      <button onClick={() => updateQty(item.id, -1)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 text-slate-400"><Minus size={12}/></button>
                      <span className="text-xs font-black text-white w-6 text-center tabular-nums">{item.cartQty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="h-6 w-6 rounded flex items-center justify-center hover:bg-white/10 text-slate-400"><Plus size={12}/></button>
                    </div>
                    <button onClick={() => removeFromCart(item.id)} className="h-8 w-8 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-400/10 flex items-center justify-center transition-all"><Trash2 size={14}/></button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-6 bg-white/[0.02] border-t border-white/5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Total Amount</span>
              <span className="text-2xl font-black text-white tabular-nums">KSH {subtotal.toLocaleString()}</span>
            </div>
            <Button
              variant="primary"
              fullWidth
              size="lg"
              disabled={cart.length === 0}
              onClick={() => setShowCheckout(true)}
              icon={<CheckCircle2 size={18} />}
              className="rounded-2xl h-14 text-lg font-black tracking-wide"
            >
              Checkout Now
            </Button>
          </div>
        </div>
      </div>

      {/* ── Checkout Modal ────────────────────────────────────────────────── */}
      {showCheckout && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowCheckout(false)} />
          <div className="relative glass-panel w-full max-w-md rounded-[2.5rem] border border-white/10 overflow-hidden animate-in zoom-in-95">
            <div className="p-8 space-y-8">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Complete Transaction</h3>
                  <p className="text-slate-400 text-sm">Select payment method & finalize</p>
                </div>
                <button onClick={() => setShowCheckout(false)} className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'Cash', icon: Banknote, color: 'text-emerald-400' },
                  { id: 'M-Pesa', icon: CreditCard, color: 'text-indigo-400' },
                  { id: 'Credit', icon: User, color: 'text-amber-400' }
                ].map(method => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id as any)}
                    className={cn(
                      "p-4 rounded-2xl border transition-all flex flex-col items-center gap-2",
                      paymentMethod === method.id 
                        ? "bg-white/10 border-white/20 ring-1 ring-white/20" 
                        : "bg-white/5 border-white/5 hover:bg-white/[0.08]"
                    )}
                  >
                    <method.icon size={20} className={cn(paymentMethod === method.id ? method.color : "text-slate-500")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", paymentMethod === method.id ? "text-white" : "text-slate-500")}>
                      {method.id}
                    </span>
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                {paymentMethod === 'M-Pesa' && (
                  <Input
                    label="M-Pesa Transaction Code"
                    placeholder="e.g. QAB1234XYZ"
                    value={mpesaCode}
                    onChange={e => setMpesaCode(e.target.value.toUpperCase())}
                    className="bg-white/5"
                  />
                )}
                {paymentMethod === 'Credit' && (
                  <Input
                    label="Customer Name"
                    placeholder="e.g. Wanjiku Njoroge"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    className="bg-white/5"
                  />
                )}
                <Input
                  label="Optional Notes"
                  placeholder="e.g. Customer loyalty discount applied"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="bg-white/5"
                />
              </div>

              <div className="p-6 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
                <span className="text-indigo-400 font-bold uppercase tracking-widest text-[10px]">Total Due</span>
                <span className="text-2xl font-black text-white tabular-nums">KSH {subtotal.toLocaleString()}</span>
              </div>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                loading={processing}
                onClick={handleCheckout}
                className="h-14 rounded-2xl text-lg font-black"
              >
                Confirm & Print Receipt
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
