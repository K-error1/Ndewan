import { useState, useEffect } from 'react';
import {
  Printer,
  Copy,
  FileText,
  UserCheck,
  ShieldCheck,
  Smartphone,
  Camera,
  Layers,
  Scan,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Plus,
  Minus,
  RotateCcw,
  Clock,
  ChevronRight,
  Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/utils/cn';
import { db } from '@/lib/db';
import { CyberJobsQueue } from './CyberJobsQueue';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { printReceipt, ReceiptData } from '@/utils/printing';

interface ServiceItem {
  id: string;
  label: string;
  unit: string;           // e.g. "page", "photo", "task"
  category: 'cyber' | 'printing' | 'photos';
  icon: any;
  defaultPrice: number;   // price per unit
}

interface ServiceHubProps {
  onGoToCatalog?: () => void;
}

const SERVICES: ServiceItem[] = [
  // Printing & Photocopying
  { id: 'print_bw',       label: 'Printing B/W',     unit: 'page',  category: 'printing', icon: Printer,     defaultPrice: 10  },
  { id: 'print_color',    label: 'Printing Color',   unit: 'page',  category: 'printing', icon: Printer,     defaultPrice: 30  },
  { id: 'copy_bw',        label: 'Photocopy B/W',    unit: 'page',  category: 'printing', icon: Copy,        defaultPrice: 5   },
  { id: 'copy_color',     label: 'Photocopy Color',  unit: 'page',  category: 'printing', icon: Copy,        defaultPrice: 20  },
  { id: 'scanning',       label: 'Scanning (PDF)',   unit: 'page',  category: 'printing', icon: Scan,        defaultPrice: 20  },
  { id: 'lamination',     label: 'Lamination',       unit: 'sheet', category: 'printing', icon: Layers,      defaultPrice: 50  },

  // Cyber Services (Kenya Specific)
  { id: 'kra_itax',       label: 'KRA iTax / PIN',   unit: 'task',  category: 'cyber',    icon: ShieldCheck, defaultPrice: 200 },
  { id: 'ecitizen',       label: 'eCitizen Task',    unit: 'task',  category: 'cyber',    icon: UserCheck,   defaultPrice: 150 },
  { id: 'nhif_sha',       label: 'SHA / NHIF',       unit: 'task',  category: 'cyber',    icon: Smartphone,  defaultPrice: 100 },
  { id: 'nssf_huduma',    label: 'NSSF / Huduma',    unit: 'task',  category: 'cyber',    icon: CreditCard,  defaultPrice: 100 },
  { id: 'typing',         label: 'General Typing',   unit: 'page',  category: 'cyber',    icon: FileText,    defaultPrice: 100 },

  // Photos
  { id: 'passport_photo', label: 'Passport Photos',  unit: 'set',   category: 'photos',   icon: Camera,      defaultPrice: 200 },
  { id: 'id_photo',       label: 'ID Size Photos',   unit: 'set',   category: 'photos',   icon: Camera,      defaultPrice: 150 },
];

const CATEGORIES = [
  { id: 'printing', label: 'Printing', icon: Printer },
  { id: 'cyber',    label: 'Cyber',    icon: ShieldCheck },
  { id: 'photos',   label: 'Photos',   icon: Camera },
];

const CATEGORY_STYLES: Record<string, { card: string; icon: string }> = {
  cyber:    { card: 'border-purple-500/20 hover:border-purple-500/40', icon: 'bg-purple-500/10 border-purple-500/20 text-purple-400' },
  printing: { card: 'border-blue-500/20   hover:border-blue-500/40',   icon: 'bg-blue-500/10   border-blue-500/20  text-blue-400'   },
  photos:   { card: 'border-emerald-500/20 hover:border-emerald-500/40', icon: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' },
};

export function ServiceHub({ onGoToCatalog }: ServiceHubProps) {
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState<string>('printing');
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.settings.getAll().then(s => {
      setSettings(s);
      setLoading(false);
    });
  }, []);

  // Compute dynamic services based on settings
  const dynamicServices = SERVICES.map(s => {
    const customPrice = settings[`price_${s.id}`];
    return customPrice ? { ...s, defaultPrice: parseFloat(customPrice) } : s;
  });

  const [quantities, setQuantities] = useState<Record<string, number>>(() =>
    Object.fromEntries(SERVICES.map(s => [s.id, 1]))
  );
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [sessionRevenue, setSessionRevenue] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [jobModal, setJobModal] = useState<ServiceItem | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'M-Pesa'>('Cash');
  const [mpesaCode, setMpesaCode] = useState('');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const filteredServices = dynamicServices.filter(s => s.category === selectedCategory);

  const setQty = (id: string, delta: number) => {
    setQuantities(prev => ({
      ...prev,
      [id]: Math.max(1, Math.min(999, (prev[id] ?? 1) + delta)),
    }));
  };

  const handleLogService = async (service: ServiceItem, asJob: boolean = false) => {
    const qty = quantities[service.id] ?? 1;
    const total = service.defaultPrice * qty;
    
    if (asJob && !customerName.trim() && service.category === 'cyber') {
      setJobModal(service);
      return;
    }

    console.log('Logging service:', service.label, 'Qty:', qty, 'Total:', total);
    setLoadingId(service.id);
    try {
      if (asJob) {
        await db.cyberJobs.create({
          customer_name: customerName || 'Walk-in',
          service_type: service.label,
          amount: total,
          status: 'pending'
        });
        toast(`⏳ Job started: ${service.label} for ${customerName || 'Walk-in'}`, 'success');
        setCustomerName('');
        setJobModal(null);
        setRefreshTrigger(prev => prev + 1);
      } else {
        // Direct sale (done immediately)
        const res = await db.sales.create({
          sale: { 
            total_amount: total, 
            payment_method: paymentMethod, 
            mpesa_code: paymentMethod === 'M-Pesa' ? mpesaCode.toUpperCase() : undefined,
            notes: service.label 
          },
          items: [{ product_id: 0, quantity: qty, unit_price: service.defaultPrice, unit_buying_price: 0 }] 
        });

        if (res.success) {
          setSessionRevenue(prev => prev + total);
          toast(`✅ ${service.label} logged — KSH ${total.toLocaleString('en-KE')}`, 'success');
          
          const receipt: any = {
            shopName: settings.shop_name || 'Ndewan Enterprises',
            address: settings.shop_address || 'Nairobi',
            phone: settings.shop_phone || '',
            till: settings.mpesa_till || '',
            items: [{ name: service.label, qty, price: service.defaultPrice }],
            total,
            cashier: 'Staff',
            footer: settings.receipt_footer || 'Thank you!'
          };
          window.alert(`Logged: ${service.label} - KSH ${total}`);
          // printReceipt(receipt);
          if (paymentMethod === 'M-Pesa') setMpesaCode('');
        } else {
          throw new Error(res.error || 'Failed to log sale in database');
        }
      }
      setQuantities(prev => ({ ...prev, [service.id]: 1 }));
    } catch (err: any) {
      toast(err.message || 'Failed to log service', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  const handleCustomCharge = () => {
    const amount = Number(customAmount);
    if (!amount || amount <= 0) { toast('Enter a valid amount', 'error'); return; }
    const desc = customDesc.trim() || 'Miscellaneous service';
    setSessionRevenue(prev => prev + amount);
    toast(`✅ ${desc} — KSH ${amount.toLocaleString('en-KE')}`, 'success');
    setCustomAmount('');
    setCustomDesc('');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-bold text-white tracking-tight">Service Desk</h1>
          <p className="text-slate-400 text-sm mt-1 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
            Staff operations — log services instantly
          </p>
        </div>

        <div className="flex items-center gap-3 p-1.5 bg-white/5 rounded-2xl border border-white/5">
          <button 
            onClick={() => setPaymentMethod('Cash')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              paymentMethod === 'Cash' ? "bg-white/10 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
            )}
          >
            Cash
          </button>
          <button 
            onClick={() => setPaymentMethod('M-Pesa')}
            className={cn(
              "px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
              paymentMethod === 'M-Pesa' ? "bg-indigo-500 text-white shadow-lg shadow-indigo-900/40" : "text-slate-500 hover:text-slate-300"
            )}
          >
            M-Pesa
          </button>
          {paymentMethod === 'M-Pesa' && (
            <input 
              type="text"
              placeholder="Code..."
              value={mpesaCode}
              onChange={e => setMpesaCode(e.target.value.toUpperCase())}
              className="bg-black/20 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-24"
            />
          )}
        </div>

        <div className="glass-panel px-5 py-3 rounded-2xl border border-white/5 text-right">
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Session Revenue</p>
          <p className="text-2xl font-black text-emerald-400 tabular-nums">
            KSH {sessionRevenue.toLocaleString('en-KE')}
          </p>
        </div>
      </div>

      {/* ── Category filter ──────────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 w-fit">
        {CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all',
              selectedCategory === cat.id
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
            )}
          >
            <cat.icon size={13} />
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Services Grid ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const Icon = service.icon;
          const isLogging = loadingId === service.id;
          const isAnyLoading = loadingId !== null;
          const qty = quantities[service.id] ?? 1;
          const total = service.defaultPrice * qty;
          const styles = CATEGORY_STYLES[service.category];

          return (
            <div
              key={service.id}
              className={cn(
                'group relative flex flex-col gap-4 p-5 rounded-2xl glass-panel border transition-all duration-200',
                styles.card
              )}
            >
              {/* Top row: icon + label */}
              <div className="flex items-center gap-3">
                <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center border shrink-0', styles.icon)}>
                  {isLogging
                    ? <RotateCcw size={18} className="animate-spin" />
                    : <Icon size={18} />
                  }
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-white text-sm leading-tight truncate">{service.label}</p>
                  <p className="text-[10px] text-slate-600 font-bold uppercase tracking-wider">
                    KSH {service.defaultPrice.toLocaleString('en-KE')} / {service.unit}
                  </p>
                </div>
              </div>

              {/* Quantity stepper */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 bg-black/30 rounded-xl border border-white/5 p-1">
                  <button
                    onClick={() => setQty(service.id, -1)}
                    disabled={qty <= 1}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed active:scale-90"
                  >
                    <Minus size={14} />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={qty}
                    onChange={e => setQuantities(prev => ({
                      ...prev,
                      [service.id]: Math.max(1, Math.min(999, Number(e.target.value) || 1))
                    }))}
                    className="w-14 bg-transparent text-center text-white font-black text-lg tabular-nums focus:outline-none"
                  />
                  <button
                    onClick={() => setQty(service.id, +1)}
                    className="h-8 w-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all active:scale-90"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <span className="text-[11px] font-bold text-slate-500">
                  {service.unit}{qty !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Log button + total */}
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => handleLogService(service, false)}
                  className={cn(
                    'w-full flex items-center justify-between rounded-xl px-4 py-3 font-bold text-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed',
                    'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20'
                  )}
                >
                  <span>Quick Sale</span>
                  <span className="text-emerald-200 font-black tabular-nums">
                    KSH {total.toLocaleString('en-KE')}
                  </span>
                </button>
                
                {service.category === 'cyber' && (
                  <button
                    onClick={() => handleLogService(service, true)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-purple-500/30 hover:border-purple-500/60 bg-purple-500/5 text-purple-400 py-2.5 font-bold text-xs uppercase tracking-widest transition-all active:scale-95"
                  >
                    <Clock size={12} />
                    Queue Job
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Active Jobs Queue (Sprint B) ──────────────────────────────────────── */}
      <div className="border-t border-white/5 pt-10">
        <CyberJobsQueue key={refreshTrigger} onStatusChange={() => setRefreshTrigger(p => p + 1)} />
      </div>

      {/* ── Bottom panels ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Inventory Sale shortcut */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex items-center gap-5">
          <div className="h-11 w-11 shrink-0 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <ShoppingCart size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-white text-sm">Inventory Sale</p>
            <p className="text-slate-500 text-xs mt-0.5">Sell stationery, books & supplies</p>
          </div>
          {onGoToCatalog && (
            <button
              onClick={onGoToCatalog}
              className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300 font-bold text-xs uppercase tracking-wider shrink-0 transition-colors"
            >
              Catalog <ChevronRight size={14} />
            </button>
          )}
        </div>

        {/* Custom Charge */}
        <div className="glass-panel rounded-2xl p-5 border border-white/5">
          <div className="flex items-center gap-4 mb-4">
            <div className="h-11 w-11 shrink-0 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 border border-amber-500/20">
              <DollarSign size={20} />
            </div>
            <div>
              <p className="font-bold text-white text-sm">Custom Charge</p>
              <p className="text-slate-500 text-xs">Log a misc service or amount</p>
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={customDesc}
              onChange={e => setCustomDesc(e.target.value)}
              placeholder="e.g. Typing 2 pages"
              className="flex-1 bg-black/20 border border-white/10 rounded-xl py-2.5 px-3 text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
            />
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600 text-[10px] font-bold pointer-events-none">KSH</span>
              <input
                type="number"
                min="0"
                value={customAmount}
                onChange={e => setCustomAmount(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCustomCharge()}
                placeholder="0"
                className="w-24 bg-black/20 border border-white/10 rounded-xl py-2.5 pl-10 pr-2 text-white font-bold text-sm placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
              />
            </div>
            <button
              onClick={handleCustomCharge}
              className="bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold px-4 rounded-xl shadow-lg transition-all text-xs uppercase tracking-wider"
            >
              Log
            </button>
          </div>
        </div>
      </div>

      {/* Job Details Modal */}
      <Modal
        open={!!jobModal}
        onClose={() => setJobModal(null)}
        title="Job Details"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-400 font-medium leading-relaxed">
            Starting a new job for <span className="text-white font-bold">{jobModal?.label}</span>. 
            Enter the customer's name to track this request in the queue.
          </p>
          <Input
            label="Customer Name"
            placeholder="e.g. John Doe"
            value={customerName}
            onChange={e => setCustomerName(e.target.value)}
            autoFocus
          />
          <div className="flex gap-2 pt-2">
            <Button variant="ghost" fullWidth onClick={() => setJobModal(null)}>Cancel</Button>
            <Button variant="primary" fullWidth onClick={() => jobModal && handleLogService(jobModal, true)}>Start Job</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
