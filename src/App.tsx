/**
 * StockMaster – Root Application Component
 * ==========================================
 * Manages global state (products, stats, modals) and renders the
 * tabbed navigation: Dashboard → Products → Low Stock → Activity → Guide.
 *
 * In a real Electron app, all db.* calls go through the IPC bridge
 * (electron/preload.js → electron/main.js → better-sqlite3).
 * In demo/browser mode they use the localStorage fallback in src/lib/db.ts.
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  AlertTriangle, 
  History, 
  BookOpen, 
  Plus, 
  Database, 
  FolderOpen,
  Search,
  RotateCcw,
  Trash2,
  TrendingUp,
  Boxes,
  DollarSign,
  UserCircle,
  ShieldCheck,
  Zap,
  Wallet,
  Settings
} from 'lucide-react';
import { ToastProvider, useToast } from '@/components/ui/Toast';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { StatCard } from '@/components/StatCard';
import { ProductTable } from '@/components/ProductTable';
import { ProductForm } from '@/components/ProductForm';
import { LowStockPanel } from '@/components/LowStockPanel';
import { PriceHistoryModal } from '@/components/PriceHistoryModal';
import { DeleteConfirmModal } from '@/components/DeleteConfirmModal';
import { ActivityLog } from '@/components/ActivityLog';
import { EmployeeDashboard } from '@/components/EmployeeDashboard';
import { ServiceHub } from '@/components/ServiceHub';
import { LiveClock } from '@/components/LiveClock';
import { ExpenseManager } from '@/components/ExpenseManager';
import { SettingsManager } from '@/components/SettingsManager';
import { ReportsDashboard } from '@/components/ReportsDashboard';
import { LoginOverlay } from '@/components/LoginOverlay';
import { db, Product, ProductInput, Stats, ActivityLog as LogEntry, User, isRunningInElectron } from '@/lib/db';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { cn } from '@/utils/cn';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'dashboard' | 'products' | 'lowstock' | 'activity' | 'servicedesk' | 'expenses' | 'settings' | 'reports';
type Role = 'admin' | 'employee';

// ─── Sidebar nav items ────────────────────────────────────────────────────────

const NAV_ITEMS: { id: Tab; label: string; icon: any }[] = [
  { id: 'dashboard',   label: 'Dashboard',    icon: LayoutDashboard },
  { id: 'reports',     label: 'Reports',      icon: TrendingUp },
  { id: 'products',    label: 'Catalog',      icon: Package },
  { id: 'servicedesk', label: 'Service Desk', icon: Zap },
  { id: 'lowstock',    label: 'Low Stock',    icon: AlertTriangle },
  { id: 'expenses',    label: 'Expenses',     icon: Wallet },
  { id: 'activity',    label: 'Audit Log',    icon: History },
  { id: 'settings',    label: 'Settings',     icon: Settings },
];

// ─── Main application (inner — needs ToastContext) ────────────────────────────

function AppInner() {
  const { toast } = useToast();

  // ── Auth ───────────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>('employee');

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [tab, setTab]   = useState<Tab>('dashboard');

  // ── Data state ──────────────────────────────────────────────────────────────
  const [products,    setProducts]    = useState<Product[]>([]);
  const [lowStock,    setLowStock]    = useState<Product[]>([]);
  const [stats,       setStats]       = useState<Stats | null>(null);
  const [categories,  setCategories]  = useState<string[]>([]);
  const [logEntries,  setLogEntries]  = useState<LogEntry[]>([]);
  const [loading,     setLoading]     = useState(true);

  // ── Search / filter ─────────────────────────────────────────────────────────
  const [searchQuery,      setSearchQuery]      = useState('');
  const [filterCategory,   setFilterCategory]   = useState('__all__');
  const [filterStatus,     setFilterStatus]     = useState('__all__');
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);

  // ── Modal states ────────────────────────────────────────────────────────────
  const [addModalOpen,     setAddModalOpen]     = useState(false);
  const [editProduct,      setEditProduct]      = useState<Product | null>(null);
  const [deleteProduct,    setDeleteProduct]    = useState<Product | null>(null);
  const [historyProduct,   setHistoryProduct]   = useState<Product | null>(null);
  const [saving,           setSaving]           = useState(false);
  const [deleting,         setDeleting]         = useState(false);
  const [backing,          setBacking]          = useState(false);

  // ── App info ─────────────────────────────────────────────────────────────────
  const [appInfo,          setAppInfo]          = useState<{ version: string; dbPath: string } | null>(null);

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [prods, ls, st, cats, logs, info] = await Promise.all([
        db.products.getAll(),
        db.products.lowStock(),
        db.products.stats(),
        db.products.categories(),
        db.log.recent(),
        db.app.info(),
      ]);
      setProducts(prods);
      setLowStock(ls);
      setStats(st);
      setCategories(cats);
      setLogEntries(logs);
      setAppInfo(info);
    } catch (err) {
      toast('Failed to load data from database', 'error');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Apply search + filters ───────────────────────────────────────────────────
  useEffect(() => {
    let filtered = [...products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.sku ?? '').toLowerCase().includes(q) ||
        (p.description ?? '').toLowerCase().includes(q)
      );
    }

    if (filterCategory !== '__all__') {
      filtered = filtered.filter(p => p.category === filterCategory);
    }

    if (filterStatus === 'out') {
      filtered = filtered.filter(p => p.quantity === 0);
    } else if (filterStatus === 'low') {
      filtered = filtered.filter(p => p.quantity > 0 && p.quantity <= p.low_stock_threshold);
    } else if (filterStatus === 'ok') {
      filtered = filtered.filter(p => p.quantity > p.low_stock_threshold);
    }

    setFilteredProducts(filtered);
  }, [products, searchQuery, filterCategory, filterStatus]);

  // ── CRUD handlers ────────────────────────────────────────────────────────────

  async function handleCreate(data: ProductInput) {
    setSaving(true);
    try {
      const result = await db.products.create(data);
      if (!result.success) throw new Error(result.error);
      toast(`✅ "${data.name}" added successfully!`, 'success');
      setAddModalOpen(false);
      await loadAll();
    } catch (err: any) {
      toast(err.message ?? 'Failed to add product', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdate(data: ProductInput) {
    if (!editProduct) return;
    setSaving(true);
    try {
      const result = await db.products.update({ ...data, id: editProduct.id });
      if (!result.success) throw new Error(result.error);
      toast(`✅ "${data.name}" updated!`, 'success');
      setEditProduct(null);
      await loadAll();
    } catch (err: any) {
      toast(err.message ?? 'Failed to update product', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteProduct) return;
    setDeleting(true);
    try {
      const result = await db.products.delete(deleteProduct.id);
      if (!result.success) throw new Error(result.error);
      toast(`🗑️ "${deleteProduct.name}" deleted.`, 'warning');
      setDeleteProduct(null);
      await loadAll();
    } catch (err: any) {
      toast(err.message ?? 'Failed to delete product', 'error');
    } finally {
      setDeleting(false);
    }
  }

  async function handleBackup() {
    setBacking(true);
    try {
      const result = await db.backup.export();
      if (result.success) {
        toast(`💾 Backup saved to: ${result.path ?? 'download'}`, 'success');
        await loadAll(); // refresh activity log
      } else if (result.reason === 'cancelled') {
        // user cancelled — no toast needed
      } else {
        throw new Error(result.error);
      }
    } catch (err: any) {
      toast(err.message ?? 'Backup failed', 'error');
    } finally {
      setBacking(false);
    }
  }

  // When user clicks "Restock" on a low stock item, open edit modal
  function handleRestock(product: Product) {
    setEditProduct(product);
    setTab('products');
  }

  // ── Category options for filter ───────────────────────────────────────────────
  const categoryOptions = [
    { value: '__all__', label: 'All Categories' },
    ...categories.map(c => ({ value: c, label: c })),
  ];

  const statusOptions = [
    { value: '__all__', label: 'All Status'   },
    { value: 'ok',      label: '✅ In Stock'  },
    { value: 'low',     label: '🟡 Low Stock' },
    { value: 'out',     label: '🔴 Out of Stock' },
  ];

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setRole(user.role === 'admin' ? 'admin' : 'employee');
    setTab(user.role === 'admin' ? 'dashboard' : 'servicedesk');
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // ── Stats ─────────────────────────────────────────────────────────────────────
  const fmtCurrency = (n: number) =>
    `KSH ${new Intl.NumberFormat('en-KE', { minimumFractionDigits: 0 }).format(n)}`;

  if (!currentUser) {
    return <LoginOverlay onLogin={handleLogin} />;
  }

  return (
    <div className="flex min-h-screen bg-[#05080f] text-slate-100">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="flex w-64 shrink-0 flex-col glass-panel border-r border-white/5">
        {/* Logo */}
        <div className="flex items-center gap-3 border-b border-white/5 px-6 py-8">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-600 text-white shadow-xl shadow-indigo-900/40">
            <Boxes size={22} strokeWidth={1.5} />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-white text-base tracking-tight leading-tight">Ndewan Enterprices</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Systems v{appInfo?.version ?? '1.0.0'}</p>
          </div>
        </div>

        {/* Role Switcher */}
        <div className="px-4 py-6 border-b border-white/5">
           <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-3 px-2">Current Session</p>
           <div className="bg-black/20 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center",
                  role === 'admin' ? "bg-indigo-600 text-white" : "bg-emerald-600 text-white"
                )}>
                  {role === 'admin' ? <ShieldCheck size={14} /> : <Zap size={14} />}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white truncate">{currentUser.full_name || currentUser.username}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">{role}</p>
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full mt-3 py-2 rounded-lg bg-white/5 hover:bg-red-500/10 text-slate-500 hover:text-red-400 text-[9px] font-bold uppercase tracking-widest transition-all"
              >
                Sign Out
              </button>
           </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-4 py-8 space-y-2">
          {NAV_ITEMS.map(item => {
            const isActive = tab === item.id;
            const Icon = item.icon;
            const badge = item.id === 'lowstock' && lowStock.length > 0 ? lowStock.length : null;
            
            // Admins cannot see Service Desk; employees cannot see Audit Log/Expenses/Settings/Reports
            if (role === 'admin'    && item.id === 'servicedesk') return null;
            if (role === 'employee' && ['activity', 'expenses', 'settings', 'reports'].includes(item.id)) return null;

            return (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`w-full flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 group ${
                  isActive
                    ? (role === 'admin' ? 'bg-indigo-600 shadow-indigo-900/40' : 'bg-emerald-600 shadow-emerald-900/40') + ' text-white shadow-lg'
                    : 'text-slate-400 hover:bg-white/5 hover:text-white'
                }`}
              >
                <Icon size={18} strokeWidth={isActive ? 2 : 1.5} className={isActive ? '' : 'text-slate-500 group-hover:text-indigo-400'} />
                <span className="flex-1 text-left">{item.label}</span>
                {badge && (
                  <span className="bg-red-500 text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[18px] text-center shadow-lg shadow-red-900/40">
                    {badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-white/5 p-4 space-y-3">
          <LiveClock />
          <Button
            variant="success"
            size="sm"
            fullWidth
            loading={backing}
            onClick={handleBackup}
            icon={<Database size={14} />}
            className="rounded-xl font-semibold shadow-emerald-900/20 shadow-lg"
          >
            Backup Data
          </Button>
          {!isRunningInElectron && (
            <div className="text-center text-[10px] uppercase tracking-tighter text-slate-600 px-1 font-bold">
              Browser demo mode
            </div>
          )}
          {isRunningInElectron && appInfo && (
            <button
              onClick={() => db.app.openDbFolder()}
              className="w-full flex items-center justify-center gap-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors font-medium"
            >
              <FolderOpen size={12} />
              Open data folder
            </button>
          )}
        </div>
      </aside>

      {/* ── Main content ──────────────────────────────────────────────────────── */}
      <main className="flex-1 min-w-0 overflow-y-auto px-8 py-10">

        {/* ── DASHBOARD ──────────────────────────────────────────────────────── */}
        {tab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-10 animate-in">
            <div className="flex items-end justify-between">
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">
                  {role === 'admin' ? 'Enterprise Console' : 'Operational Status'}
                </h1>
                <p className="text-slate-400 text-sm mt-2 flex items-center gap-2">
                  <span className={cn(
                    "h-1.5 w-1.5 rounded-full shadow-lg",
                    role === 'admin' ? "bg-indigo-500 shadow-indigo-500/60" : "bg-emerald-500 shadow-emerald-500/60"
                  )}></span>
                  Ndewan Enterprices {role === 'admin' ? 'Admin' : 'Staff Portal'}
                </p>
              </div>
              <div className="text-right hidden sm:block space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Inventory Valuation</p>
                <div className="flex flex-col items-end">
                  <p className="text-2xl font-black text-emerald-400 tabular-nums leading-none">
                    {fmtCurrency(stats?.total_value ?? 0)}
                  </p>
                  <p className="text-[10px] font-bold text-slate-600 mt-1 uppercase tracking-tight">
                    Net Cost: {fmtCurrency(stats?.total_cost ?? 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              <StatCard
                label="Total Catalog"
                value={loading ? '…' : (stats?.total_products ?? 0)}
                icon={<Boxes size={24} />}
                color="indigo"
                subtitle="Unique products tracked"
              />
              <StatCard
                label="Potential Profit"
                value={loading ? '…' : fmtCurrency((stats?.total_value ?? 0) - (stats?.total_cost ?? 0))}
                icon={<TrendingUp size={24} />}
                color="emerald"
                subtitle="On current inventory"
              />
              <StatCard
                label="Low Stock Alert"
                value={loading ? '…' : (stats?.low_stock_count ?? 0)}
                icon={<AlertTriangle size={24} />}
                color={(stats?.low_stock_count ?? 0) > 0 ? 'red' : 'emerald'}
                subtitle="Below threshold"
                pulse={(stats?.low_stock_count ?? 0) > 0}
              />
              <StatCard
                label="Overstock Warning"
                value={loading ? '…' : (stats?.overstock_count ?? 0)}
                icon={<AlertTriangle size={24} className="rotate-180" />}
                color={(stats?.overstock_count ?? 0) > 0 ? 'amber' : 'emerald'}
                subtitle="Exceeding max limit"
              />
            </div>

            {/* Two-column: low stock + recent activity */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
              <div className="glass-panel rounded-3xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-white text-lg flex items-center gap-3">
                    <AlertTriangle size={18} className="text-amber-400" />
                    Low Stock Alerts
                  </h2>
                  {lowStock.length > 0 && (
                    <button
                      onClick={() => setTab('lowstock')}
                      className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                    >
                      View details →
                    </button>
                  )}
                </div>
                <LowStockPanel products={lowStock.slice(0, 5)} onRestock={handleRestock} />
              </div>

              <div className="glass-panel rounded-3xl p-6 border border-white/5">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-bold text-white text-lg flex items-center gap-3">
                    <History size={18} className="text-indigo-400" />
                    System Log
                  </h2>
                  <button
                    onClick={() => setTab('activity')}
                    className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-wider"
                  >
                    History →
                  </button>
                </div>
                <ActivityLog entries={logEntries.slice(0, 8)} />
              </div>
            </div>

            {/* Quick actions */}
            <div className="glass-panel rounded-3xl p-8 border border-white/5 bg-gradient-to-r from-indigo-950/20 to-transparent">
              <h2 className="font-bold text-white text-lg mb-6">Operations Control</h2>
              <div className="flex flex-wrap gap-4">
                <Button
                  variant="primary"
                  size="xl"
                  onClick={() => setAddModalOpen(true)}
                  icon={<Plus size={20} />}
                  className="rounded-2xl shadow-xl shadow-indigo-900/40"
                >
                  Create New Entry
                </Button>
                <Button
                  variant="secondary"
                  size="xl"
                  onClick={() => setTab('products')}
                  icon={<Package size={20} />}
                  className="rounded-2xl"
                >
                  Inventory Audit
                </Button>
                <Button
                  variant="warning"
                  size="xl"
                  onClick={() => setTab('lowstock')}
                  icon={<AlertTriangle size={20} />}
                  className="rounded-2xl"
                >
                  Restock Pipeline
                </Button>
                <Button
                  variant="success"
                  size="xl"
                  onClick={handleBackup}
                  loading={backing}
                  icon={<Database size={20} />}
                  className="rounded-2xl shadow-xl shadow-emerald-900/20"
                >
                  Export Archive
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCTS ────────────────────────────────────────────────────────── */}
        {tab === 'products' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in">
            {/* Header */}
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-4xl font-bold text-white tracking-tight">Inventory</h1>
                <p className="text-slate-400 text-sm mt-2">
                  Showing <span className="text-white font-semibold">{filteredProducts.length}</span> of {products.length} catalog items
                </p>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={() => setAddModalOpen(true)}
                icon={<Plus size={18} />}
                className="rounded-xl shadow-xl shadow-indigo-900/40"
              >
                Register Product
              </Button>
            </div>

            {/* Search + filters */}
            <div className="glass-panel rounded-2xl border border-white/5 p-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="relative group sm:col-span-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    placeholder="Search master catalog…"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="pl-12 bg-[#0a0f1d] border-white/10 rounded-xl focus:ring-indigo-500/50"
                  />
                </div>
                <Select
                  options={categoryOptions}
                  value={filterCategory}
                  onChange={e => setFilterCategory(e.target.value)}
                  className="bg-[#0a0f1d] border-white/10 rounded-xl"
                />
                <Select
                  options={statusOptions}
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  className="bg-[#0a0f1d] border-white/10 rounded-xl"
                />
              </div>
              {(searchQuery || filterCategory !== '__all__' || filterStatus !== '__all__') && (
                <button
                  onClick={() => { setSearchQuery(''); setFilterCategory('__all__'); setFilterStatus('__all__'); }}
                  className="mt-4 flex items-center gap-2 text-xs font-bold text-indigo-400 hover:text-indigo-300 transition-colors uppercase tracking-widest"
                >
                  <RotateCcw size={12} />
                  Reset View Filters
                </button>
              )}
            </div>

            {/* Table */}
            <div className="glass-panel rounded-3xl border border-white/5 overflow-hidden">
              <ProductTable
                products={filteredProducts}
                loading={loading}
                onEdit={setEditProduct}
                onDelete={setDeleteProduct}
                onHistory={setHistoryProduct}
                emptyMessage={
                  searchQuery || filterCategory !== '__all__' || filterStatus !== '__all__'
                    ? 'No records match the current filter criteria'
                    : undefined
                }
              />
            </div>
          </div>
        )}

        {/* ── LOW STOCK ───────────────────────────────────────────────────────── */}
        {tab === 'lowstock' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 shadow-lg shadow-red-500/5">
                <AlertTriangle size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Restock Required</h1>
                <p className="text-slate-400 text-sm mt-1">
                  {lowStock.length === 0
                    ? 'All inventory levels are within safe operating margins.'
                    : `${lowStock.length} items have dropped below established thresholds.`}
                </p>
              </div>
            </div>
            <div className="glass-panel rounded-3xl border border-white/5 p-8">
              <LowStockPanel products={lowStock} onRestock={handleRestock} />
            </div>
          </div>
        )}

        {/* ── SERVICE DESK ─────────────────────────────────────────────────────── */}
        {tab === 'servicedesk' && (
          <div className="space-y-12">
            <ServiceHub onGoToCatalog={() => setTab('products')} />
            <div className="border-t border-white/5 pt-12">
              <EmployeeDashboard hideHeader={true} />
            </div>
          </div>
        )}

        {/* ── ACTIVITY LOG ─────────────────────────────────────────────────────── */}
        {tab === 'activity' && (
          <div className="max-w-4xl mx-auto space-y-8 animate-in">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-500">
                <History size={24} />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white tracking-tight">Audit Trail</h1>
                <p className="text-slate-400 text-sm mt-1">Immutable record of system operations and inventory movements.</p>
              </div>
            </div>
            <div className="glass-panel rounded-3xl border border-white/5 p-8">
              <ActivityLog entries={logEntries} />
            </div>
          </div>
        )}

        {/* ── REPORTS ────────────────────────────────────────────────────────── */}
        {tab === 'reports' && (
          <div className="max-w-6xl mx-auto animate-in">
            <ReportsDashboard />
          </div>
        )}

        {/* ── EXPENSES ────────────────────────────────────────────────────────── */}
        {tab === 'expenses' && (
          <div className="max-w-6xl mx-auto animate-in">
            <ExpenseManager />
          </div>
        )}

        {/* ── SETTINGS ────────────────────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="max-w-6xl mx-auto animate-in">
            <SettingsManager />
          </div>
        )}

      </main>

      {/* ── MODALS ────────────────────────────────────────────────────────────── */}

      {/* Add product modal */}
      <Modal
        open={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        title="➕ Add New Product"
        size="lg"
      >
        <ProductForm
          categories={categories}
          onSave={handleCreate}
          onCancel={() => setAddModalOpen(false)}
          saving={saving}
        />
      </Modal>

      {/* Edit product modal */}
      <Modal
        open={!!editProduct}
        onClose={() => setEditProduct(null)}
        title={`✏️ Edit — ${editProduct?.name ?? ''}`}
        size="lg"
      >
        <ProductForm
          initialData={editProduct}
          categories={categories}
          onSave={handleUpdate}
          onCancel={() => setEditProduct(null)}
          saving={saving}
        />
      </Modal>

      {/* Delete confirm modal */}
      <DeleteConfirmModal
        product={deleteProduct}
        onConfirm={handleDelete}
        onCancel={() => setDeleteProduct(null)}
        deleting={deleting}
      />

      {/* Price history modal */}
      <PriceHistoryModal
        product={historyProduct}
        onClose={() => setHistoryProduct(null)}
      />
    </div>
  );
}

// ─── Root export (wraps with providers) ──────────────────────────────────────

export default function App() {
  return (
    <ToastProvider>
      <AppInner />
    </ToastProvider>
  );
}
