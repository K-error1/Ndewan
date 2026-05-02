/**
 * Database Abstraction Layer
 * ==========================
 * In a real Electron app this module calls window.electronAPI (exposed by preload.js).
 * When running in a plain browser (demo/dev without Electron), it falls back to
 * an in-memory store so the UI is still fully functional.
 *
 * This is the ONLY file the React components talk to — they never call
 * window.electronAPI directly, making it easy to swap the backend.
 */

// ─── Type definitions ─────────────────────────────────────────────────────────

export interface Product {
  id:                  number;
  name:                string;
  category:            string;
  price:               number;
  buying_price:        number;
  quantity:            number;
  low_stock_threshold: number;
  max_stock_threshold: number;
  barcode?:            string;
  location?:           string;
  description:         string;
  sku:                 string;
  created_at:          string;
  updated_at:          string;
}

export interface ProductInput {
  name:                string;
  category:            string;
  price:               number;
  buying_price:        number;
  quantity:            number;
  low_stock_threshold: number;
  max_stock_threshold: number;
  barcode?:            string;
  location?:           string;
  description:         string;
  sku:                 string;
}

export interface ProductMovement {
  product_id: number;
  type:       'IN' | 'OUT';
  quantity:   number;
  note:       string;
}

export interface Stats {
  total_products:  number;
  total_items:     number;
  total_value:     number;
  total_cost:      number;
  low_stock_count: number;
  overstock_count: number;
}

export interface Sale {
  id:             number;
  total_amount:   number;
  payment_method: string;
  customer_name?: string;
  notes?:         string;
  created_at:     string;
}

export interface SaleItem {
  product_id:        number;
  quantity:          number;
  unit_price:        number;
  unit_buying_price: number;
}

export interface Expense {
  id:          number;
  category:    string;
  amount:      number;
  description: string;
  paid_to:     string;
  created_at:  string;
}

export interface ExpenseInput {
  category:    string;
  amount:      number;
  description: string;
  paid_to:     string;
}

export interface CyberJob {
  id:            number;
  customer_name: string;
  service_type:  string;
  amount:        number;
  status:        'pending' | 'done' | 'cancelled';
  created_at:    string;
  completed_at?: string;
}

export interface User {
  id:         number;
  username:   string;
  full_name:  string;
  role:       'admin' | 'cashier';
  created_at: string;
}

export interface UserInput {
  username:   string;
  full_name:  string;
  role:       'admin' | 'cashier';
  password:   string;
}

export interface CyberJobInput {
  customer_name: string;
  service_type:  string;
  amount:        number;
  status:        'pending' | 'done' | 'cancelled';
}

// ... existing interfaces ...

// ─── Detect Electron ─────────────────────────────────────────────────────────

const isElectron = typeof window !== 'undefined' && !!(window as any).electronAPI;

// ─── In-browser fallback store ────────────────────────────────────────────────

const STORAGE_KEY = 'stockmaster_data';

interface LocalStore {
  products:      Product[];
  priceHistory:  PriceHistory[];
  activityLog:   ActivityLog[];
  sales:         Sale[];
  saleItems:     (SaleItem & { sale_id: number })[];
  expenses:      Expense[];
  cyberJobs:     CyberJob[];
  users:         User[];
  settings:      Record<string, string>;
  nextId:        number;
  nextHistoryId: number;
  nextLogId:     number;
  nextSaleId:    number;
  nextExpenseId: number;
}

function loadStore(): LocalStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    products:      getSeedProducts(),
    priceHistory:  [],
    activityLog:   [
      { id: 1, action: 'SYSTEM', details: 'StockMaster started (browser demo mode)', created_at: new Date().toISOString() },
    ],
    sales:         [],
    saleItems:     [],
    expenses:      [],
    cyberJobs:     [],
    users:         [{ id: 1, username: 'admin', full_name: 'Administrator', role: 'admin', created_at: new Date().toISOString() }],
    settings:      {
      shop_name: 'Ndewan Enterprices',
      shop_address: 'Nairobi, Kenya',
      mpesa_till: '123456'
    },
    nextId:        100,
    nextHistoryId: 1,
    nextLogId:     2,
    nextSaleId:    1,
    nextExpenseId: 1,
  };
}

function saveStore(s: LocalStore) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s)); } catch {}
}

function addLog(s: LocalStore, action: string, details: string) {
  s.activityLog.unshift({
    id:         s.nextLogId++,
    action,
    details,
    created_at: new Date().toISOString(),
  });
  if (s.activityLog.length > 50) s.activityLog.length = 50;
}

function getSeedProducts(): Product[] {
  const now = new Date().toISOString();
  return [
    { id:1, name:'Wireless Mouse',       category:'Electronics', price:2500, buying_price:1800, quantity:45,  low_stock_threshold:10, max_stock_threshold:100, barcode:'1000001', location:'A-12-1', description:'Ergonomic 2.4GHz wireless mouse',          sku:'ELEC-001', created_at:now, updated_at:now },
    { id:2, name:'USB-C Hub 7-Port',     category:'Electronics', price:4500, buying_price:3200, quantity:8,   low_stock_threshold:10, max_stock_threshold:50,  barcode:'1000002', location:'A-12-2', description:'7-port USB-C hub with HDMI & SD card',      sku:'ELEC-002', created_at:now, updated_at:now },
    { id:3, name:'Mechanical Keyboard',  category:'Electronics', price:8500, buying_price:6000, quantity:3,   low_stock_threshold:5,  max_stock_threshold:30,  barcode:'1000003', location:'B-05-1', description:'TKL mechanical keyboard, blue switches',     sku:'ELEC-003', created_at:now, updated_at:now },
    { id:4, name:'Notebook A4 200pg',    category:'Stationery',  price:500,  buying_price:350,  quantity:120, low_stock_threshold:20, max_stock_threshold:500, barcode:'2000001', location:'C-01-A', description:'Ruled A4 notebook, 200 pages',               sku:'STAT-001', created_at:now, updated_at:now },
    { id:5, name:'Ballpoint Pens (Box)', category:'Stationery',  price:750,  buying_price:500,  quantity:6,   low_stock_threshold:10, max_stock_threshold:100, barcode:'2000002', location:'C-01-B', description:'Box of 50 blue ballpoint pens',              sku:'STAT-002', created_at:now, updated_at:now },
    { id:6, name:'Office Chair',         category:'Furniture',   price:15000,buying_price:11000,quantity:2,   low_stock_threshold:3,  max_stock_threshold:10,  barcode:'3000001', location:'W-01-R', description:'Ergonomic mesh office chair',                sku:'FURN-001', created_at:now, updated_at:now },
    { id:7, name:'Standing Desk',        category:'Furniture',   price:25000,buying_price:19000,quantity:1,   low_stock_threshold:2,  max_stock_threshold:5,   barcode:'3000002', location:'W-01-L', description:'Height-adjustable standing desk 140cm',      sku:'FURN-002', created_at:now, updated_at:now },
    { id:8, name:'Hand Sanitizer 500ml', category:'Hygiene',     price:700,  buying_price:450,  quantity:55,  low_stock_threshold:15, max_stock_threshold:200, barcode:'4000001', location:'D-02-1', description:'Antibacterial hand sanitizer, 70% alcohol',  sku:'HYG-001',  created_at:now, updated_at:now },
    { id:9, name:'Monitor 27" 4K',       category:'Electronics', price:45000,buying_price:35000,quantity:4,   low_stock_threshold:5,  max_stock_threshold:20,  barcode:'1000004', location:'A-01-1', description:'27-inch 4K IPS monitor, 144Hz',              sku:'ELEC-004', created_at:now, updated_at:now },
    { id:10,name:'Webcam 1080p',         category:'Electronics', price:8000, buying_price:5500, quantity:0,   low_stock_threshold:5,  max_stock_threshold:25,  barcode:'1000005', location:'A-01-2', description:'Full HD webcam with built-in microphone',    sku:'ELEC-005', created_at:now, updated_at:now },
  ];
}

// ─── Browser-fallback implementations ────────────────────────────────────────

const browserDB = {
  products: {
    async getAll(): Promise<Product[]> {
      return loadStore().products;
    },
    async search(query: string): Promise<Product[]> {
      const s = loadStore();
      const q = query.toLowerCase();
      return s.products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.barcode?.toLowerCase().includes(q) ||
        p.location?.toLowerCase().includes(q)
      );
    },
    async getById(id: number): Promise<Product | undefined> {
      return loadStore().products.find(p => p.id === id);
    },
    async getByBarcode(barcode: string): Promise<Product | undefined> {
      return loadStore().products.find(p => p.barcode === barcode);
    },
    async create(data: ProductInput): Promise<{ success: boolean; id?: number; error?: string }> {
      const s = loadStore();
      const id = s.nextId++;
      const now = new Date().toISOString();
      s.products.push({ ...data, id, created_at: now, updated_at: now });
      addLog(s, 'CREATE', `Added product: ${data.name}`);
      saveStore(s);
      return { success: true, id };
    },
    async update(data: ProductInput & { id: number }): Promise<{ success: boolean; error?: string }> {
      const s = loadStore();
      const idx = s.products.findIndex(p => p.id === data.id);
      if (idx === -1) return { success: false, error: 'Product not found' };
      const existing = s.products[idx];
      if (existing.price !== data.price) {
        s.priceHistory.unshift({
          id:           s.nextHistoryId++,
          product_id:   data.id,
          product_name: data.name,
          old_price:    existing.price,
          new_price:    data.price,
          changed_at:   new Date().toISOString(),
          note:         'Manual update',
        });
      }
      s.products[idx] = { ...existing, ...data, updated_at: new Date().toISOString() };
      addLog(s, 'UPDATE', `Updated product: ${data.name}`);
      saveStore(s);
      return { success: true };
    },
    async delete(id: number): Promise<{ success: boolean; error?: string }> {
      const s = loadStore();
      const product = s.products.find(p => p.id === id);
      s.products = s.products.filter(p => p.id !== id);
      addLog(s, 'DELETE', `Deleted product: ${product?.name ?? id}`);
      saveStore(s);
      return { success: true };
    },
    async stats(): Promise<Stats> {
      const s = loadStore();
      const ps = s.products;
      return {
        total_products:  ps.length,
        total_items:     ps.reduce((a, p) => a + p.quantity, 0),
        total_value:     ps.reduce((a, p) => a + p.quantity * p.price, 0),
        total_cost:      ps.reduce((a, p) => a + p.quantity * p.buying_price, 0),
        low_stock_count: ps.filter(p => p.quantity <= p.low_stock_threshold).length,
        overstock_count: ps.filter(p => p.quantity >= p.max_stock_threshold).length,
      };
    },
    async lowStock(): Promise<Product[]> {
      return loadStore().products.filter(p => p.quantity <= p.low_stock_threshold).sort((a,b)=>a.quantity-b.quantity);
    },
    async categories(): Promise<string[]> {
      const s = loadStore();
      return [...new Set(s.products.map(p => p.category))].sort();
    },
  },

  sales: {
    async create(data: { sale: Omit<Sale, 'id' | 'created_at'>; items: SaleItem[] }): Promise<{ success: boolean; id?: number; error?: string }> {
      const s = loadStore();
      const id = s.nextSaleId++;
      const now = new Date().toISOString();
      const newSale = { ...data.sale, id, created_at: now };
      s.sales.push(newSale);
      for (const item of data.items) {
        s.saleItems.push({ ...item, sale_id: id });
        const p = s.products.find(x => x.id === item.product_id);
        if (p) p.quantity -= item.quantity;
      }
      addLog(s, 'SALE', `Completed sale #${id} - KES ${data.sale.total_amount}`);
      saveStore(s);
      return { success: true, id };
    },
    async recent(): Promise<Sale[]> {
      return loadStore().sales;
    },
  },

  expenses: {
    async create(data: ExpenseInput): Promise<{ success: boolean; id?: number; error?: string }> {
      const s = loadStore();
      const id = s.nextExpenseId++;
      const now = new Date().toISOString();
      s.expenses.push({ ...data, id, created_at: now });
      addLog(s, 'EXPENSE', `Logged expense: ${data.category} - KES ${data.amount}`);
      saveStore(s);
      return { success: true, id };
    },
    async getAll(): Promise<Expense[]> {
      return loadStore().expenses;
    },
  },

  cyberJobs: {
    async create(data: CyberJobInput): Promise<{ success: boolean; id?: number; error?: string }> {
      const s = loadStore();
      const id = s.nextId++;
      const now = new Date().toISOString();
      s.cyberJobs.push({ ...data, id, created_at: now });
      addLog(s, 'CYBER', `Logged job: ${data.service_type} for ${data.customer_name || 'Walk-in'}`);
      saveStore(s);
      return { success: true, id };
    },
    async updateStatus(id: number, status: 'done' | 'cancelled'): Promise<{ success: boolean }> {
      const s = loadStore();
      const job = s.cyberJobs.find(j => j.id === id);
      if (job) {
        job.status = status;
        if (status === 'done') job.completed_at = new Date().toISOString();
      }
      saveStore(s);
      return { success: true };
    },
    async getActive(): Promise<CyberJob[]> {
      return loadStore().cyberJobs.filter(j => j.status === 'pending');
    },
    async getDailyRevenue(): Promise<{ total: number }> {
      const s = loadStore();
      const today = new Date().toISOString().slice(0, 10);
      const total = s.cyberJobs
        .filter(j => j.status === 'done' && j.created_at.startsWith(today))
        .reduce((a, b) => a + b.amount, 0);
      return { total };
    },
  },

  users: {
    async getAll(): Promise<User[]> {
      return loadStore().users;
    },
    async login(username: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
      const s = loadStore();
      const u = s.users.find(u => u.username === username);
      if (u && (u as any).password === password) {
        return { success: true, user: u };
      }
      // Demo fallback: admin/admin always works in browser mode
      if (username === 'admin' && password === 'admin') {
        return { success: true, user: s.users[0] };
      }
      return { success: false, error: 'Invalid username or password' };
    },
    async create(data: UserInput): Promise<{ success: boolean }> {
      const s = loadStore();
      s.users.push({ ...data, id: s.nextId++, created_at: new Date().toISOString() });
      saveStore(s);
      return { success: true };
    },
    async delete(id: number): Promise<{ success: boolean }> {
      const s = loadStore();
      s.users = s.users.filter(u => u.id !== id);
      saveStore(s);
      return { success: true };
    },
  },

  settings: {
    async getAll(): Promise<Record<string, string>> {
      return loadStore().settings;
    },
    async update(key: string, value: string): Promise<{ success: boolean }> {
      const s = loadStore();
      s.settings[key] = value;
      saveStore(s);
      return { success: true };
    },
  },

  reports: {
    async revenueTrend(): Promise<{ date: string; amount: number }[]> {
      const s = loadStore();
      const last30 = new Array(30).fill(0).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (29 - i));
        const ds = d.toISOString().slice(0, 10);
        const amount = s.sales
          .filter(sale => sale.created_at.startsWith(ds))
          .reduce((a, b) => a + b.total_amount, 0);
        return { date: ds, amount };
      });
      return last30;
    },
    async categoryStats(): Promise<{ category: string; revenue: number; product_count: number }[]> {
      const s = loadStore();
      const cats: Record<string, { revenue: number; count: number }> = {};
      s.products.forEach(p => {
        if (!cats[p.category]) cats[p.category] = { revenue: 0, count: 0 };
        cats[p.category].count++;
      });
      s.saleItems.forEach(item => {
        const p = s.products.find(p => p.id === item.product_id);
        if (p) {
          cats[p.category].revenue += item.quantity * item.unit_price;
        }
      });
      return Object.entries(cats).map(([category, data]) => ({ 
        category, 
        revenue: data.revenue, 
        product_count: data.count 
      }));
    },
    async topProducts(): Promise<{ name: string; units_sold: number; total_revenue: number }[]> {
      const s = loadStore();
      const sales: Record<number, { units: number; revenue: number }> = {};
      s.saleItems.forEach(item => {
        if (!sales[item.product_id]) sales[item.product_id] = { units: 0, revenue: 0 };
        sales[item.product_id].units += item.quantity;
        sales[item.product_id].revenue += item.quantity * item.unit_price;
      });
      return Object.entries(sales)
        .map(([id, data]) => ({ 
          name: s.products.find(p => p.id === Number(id))?.name || 'Unknown', 
          units_sold: data.units, 
          total_revenue: data.revenue 
        }))
        .sort((a, b) => b.total_revenue - a.total_revenue)
        .slice(0, 10);
    },
    async monthlySummary(): Promise<{ revenue: number; expenses: number; gross_profit: number }> {
      const s = loadStore();
      const thisMonth = new Date().toISOString().slice(0, 7);
      const revenue = s.sales
        .filter(sale => sale.created_at.startsWith(thisMonth))
        .reduce((a, b) => a + b.total_amount, 0);
      const expenses = s.expenses
        .filter(exp => exp.created_at.startsWith(thisMonth))
        .reduce((a, b) => a + b.amount, 0);
      const gross_profit = s.saleItems
        .filter(item => {
          const sale = s.sales.find(sl => sl.id === item.sale_id);
          return sale?.created_at.startsWith(thisMonth);
        })
        .reduce((a, b) => a + b.quantity * (b.unit_price - b.unit_buying_price), 0);
      return { revenue, expenses, gross_profit };
    },
  },

  priceHistory: {
    async get(productId: number): Promise<PriceHistory[]> {
      return loadStore().priceHistory.filter(h => h.product_id === productId);
    },
  },

  log: {
    async recent(): Promise<ActivityLog[]> {
      return loadStore().activityLog;
    },
  },

  backup: {
    async export(): Promise<{ success: boolean; path?: string; reason?: string; error?: string }> {
      // In browser: download JSON export as a workaround
      const s = loadStore();
      const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `stockmaster-backup-${new Date().toISOString().slice(0,10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      return { success: true, path: a.download };
    },
  },

  app: {
    async info(): Promise<AppInfo> {
      return { version: '1.0.0', dbPath: 'browser/localStorage', userData: 'browser' };
    },
    async openDbFolder(): Promise<void> { /* no-op in browser */ },
  },
};

// ─── Public API (used by React components) ────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db: any = {
  products:     browserDB.products,
  priceHistory: browserDB.priceHistory,
  log:          browserDB.log,
  sales:        browserDB.sales,
  expenses:     browserDB.expenses,
  cyberJobs:    browserDB.cyberJobs,
  users:        browserDB.users,
  settings:     browserDB.settings,
  reports:      browserDB.reports,
  backup:       browserDB.backup,
  app:          browserDB.app,
};

// Override with real Electron API if available
if (isElectron) {
  const api = (window as any).electronAPI;
  (db as any).products     = api.products;
  (db as any).priceHistory = api.priceHistory;
  (db as any).log          = api.log;
  (db as any).sales        = api.sales;
  (db as any).expenses     = api.expenses;
  (db as any).cyberJobs    = api.cyberJobs;
  (db as any).users        = api.users;
  (db as any).settings     = api.settings;
  (db as any).reports      = api.reports;
  (db as any).backup       = api.backup;
  (db as any).app          = api.app;
} else {
  (db as any).products     = browserDB.products;
  (db as any).priceHistory = browserDB.priceHistory;
  (db as any).log          = browserDB.log;
  (db as any).sales        = browserDB.sales;
  (db as any).expenses     = browserDB.expenses;
  (db as any).cyberJobs    = browserDB.cyberJobs;
  (db as any).users        = browserDB.users;
  (db as any).settings     = browserDB.settings;
  (db as any).reports      = browserDB.reports;
  (db as any).backup       = browserDB.backup;
  (db as any).app          = browserDB.app;
}

export const isRunningInElectron = isElectron;

export interface PriceHistory {
  id:           number;
  product_id:   number;
  product_name: string;
  old_price:    number;
  new_price:    number;
  changed_at:   string;
  note:         string;
}

export interface ActivityLog {
  id:         number;
  action:     string;
  details:    string;
  created_at: string;
}

export interface AppInfo {
  version:  string;
  dbPath:   string;
  userData: string;
}
