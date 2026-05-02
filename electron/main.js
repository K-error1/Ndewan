/**
 * StockMaster - Electron Main Process
 * ====================================
 * This file runs in the Node.js environment (NOT the browser).
 * It creates the window, initializes SQLite, and handles all IPC calls
 * from the renderer (React) process.
 *
 * ARCHITECTURE:
 *   Renderer (React UI)
 *       ↕ IPC via contextBridge (preload.js)
 *   Main Process (this file)
 *       ↕ better-sqlite3
 *   SQLite database file (userData/inventory.db)
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs   = require('fs');

// ─── 1. Resolve better-sqlite3 ───────────────────────────────────────────────
// In production the native module lives next to the unpacked resources.
// In dev it lives in node_modules.
let Database;
try {
  Database = require('better-sqlite3');
} catch {
  // Fallback path after electron-builder unpacks asar
  const nativePath = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3');
  Database = require(nativePath);
}

// ─── 2. Persistent database path ─────────────────────────────────────────────
// app.getPath('userData') resolves to:
//   Windows : C:\Users\<user>\AppData\Roaming\StockMaster
//   macOS   : ~/Library/Application Support/StockMaster
//   Linux   : ~/.config/StockMaster
const USER_DATA = app.getPath('userData');
const DB_PATH   = path.join(USER_DATA, 'inventory.db');

let db; // will be set in initDatabase()

// ─── 3. Database initialisation ──────────────────────────────────────────────
function initDatabase() {
  db = new Database(DB_PATH); // creates file if it doesn't exist

  // WAL mode gives much better concurrent read performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // ── Products table ──────────────────────────────────────────────────────────
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        name          TEXT    NOT NULL,
        category      TEXT    NOT NULL DEFAULT 'General',
        price         REAL    NOT NULL DEFAULT 0,
        buying_price  REAL    NOT NULL DEFAULT 0,
        quantity      INTEGER NOT NULL DEFAULT 0,
        low_stock_threshold INTEGER NOT NULL DEFAULT 10,
        max_stock_threshold INTEGER NOT NULL DEFAULT 100,
        barcode       TEXT,
        location      TEXT,
        description   TEXT,
        sku           TEXT,
        created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
        updated_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
    `);
  } catch (err) {
    console.error('[DB] Error creating products table:', err.message);
  }

  // ── Migration check for existing databases ──────────────────────────────────
  try {
    const columns = db.prepare('PRAGMA table_info(products)').all();
    const colNames = columns.map(c => c.name);

    const requiredCols = [
      { name: 'max_stock_threshold', type: 'INTEGER NOT NULL DEFAULT 100' },
      { name: 'barcode',             type: 'TEXT' },
      { name: 'location',            type: 'TEXT' },
      { name: 'description',         type: 'TEXT' },
      { name: 'sku',                 type: 'TEXT' },
      { name: 'buying_price',        type: 'REAL NOT NULL DEFAULT 0' }
    ];

    for (const col of requiredCols) {
      if (!colNames.includes(col.name)) {
        console.log(`[DB] Migrating: Adding missing column [${col.name}]...`);
        db.exec(`ALTER TABLE products ADD COLUMN ${col.name} ${col.type}`);
        if (col.name === 'barcode' || col.name === 'sku') {
           db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_products_${col.name} ON products(${col.name})`);
        }
      }
    }
    console.log('[DB] All professional metrics synchronized.');
  } catch (err) {
    console.error('[DB] Migration failed:', err.message);
  }

  // ── Price history table ──────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS price_history (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      old_price  REAL    NOT NULL,
      new_price  REAL    NOT NULL,
      changed_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      note       TEXT
    );
  `);

  // ── Activity log table ──────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_log (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      action     TEXT NOT NULL,
      details    TEXT,
      created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);
  
  // ── Sales tables ────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS sales (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      total_amount   REAL    NOT NULL,
      payment_method TEXT    NOT NULL DEFAULT 'Cash',
      customer_name  TEXT,
      notes          TEXT,
      created_at     TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
    
    CREATE TABLE IF NOT EXISTS sale_items (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      sale_id        INTEGER NOT NULL REFERENCES sales(id) ON DELETE CASCADE,
      product_id     INTEGER NOT NULL REFERENCES products(id),
      quantity       INTEGER NOT NULL,
      unit_price     REAL    NOT NULL,
      unit_buying_price REAL NOT NULL
    );
  `);

  // ── Expenses table ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS expenses (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      category    TEXT    NOT NULL,
      amount      REAL    NOT NULL,
      description TEXT,
      paid_to     TEXT,
      created_at  TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);

  // ── Cyber Jobs table ────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS cyber_jobs (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT,
      service_type  TEXT    NOT NULL,
      amount        REAL    NOT NULL,
      status        TEXT    NOT NULL DEFAULT 'pending', -- pending | done | cancelled
      created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now')),
      completed_at  TEXT
    );
  `);

  // ── Users table ─────────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      username   TEXT    NOT NULL UNIQUE,
      full_name  TEXT,
      role       TEXT    NOT NULL DEFAULT 'cashier',
      pin        TEXT    DEFAULT '',
      password   TEXT    DEFAULT 'admin',
      created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);

  // Safe migration: if users table has pin as NOT NULL, recreate it
  try {
    const tableInfo = db.prepare("PRAGMA table_info(users)").all();
    const pinCol = tableInfo.find(c => c.name === 'pin');
    const passCol = tableInfo.find(c => c.name === 'password');

    if (pinCol && pinCol.notnull === 1) {
      // Recreate table without NOT NULL on pin
      db.exec(`
        BEGIN TRANSACTION;
        ALTER TABLE users RENAME TO _users_old;
        CREATE TABLE users (
          id         INTEGER PRIMARY KEY AUTOINCREMENT,
          username   TEXT    NOT NULL UNIQUE,
          full_name  TEXT,
          role       TEXT    NOT NULL DEFAULT 'cashier',
          pin        TEXT    DEFAULT '',
          password   TEXT    DEFAULT 'admin',
          created_at TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
        );
        INSERT INTO users (id, username, full_name, role, pin, password, created_at)
          SELECT id, username, full_name, role, COALESCE(pin,''), COALESCE(password,'admin'), created_at FROM _users_old;
        DROP TABLE _users_old;
        COMMIT;
      `);
    } else if (!passCol) {
      db.exec(`ALTER TABLE users ADD COLUMN password TEXT DEFAULT 'admin'`);
    }
  } catch (err) {
    console.error('[DB] Users migration error:', err.message);
  }

  // ── Settings table ──────────────────────────────────────────────────────────
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
    );
  `);

    // ── Seed Default Admin & Settings ──
  try {
    const adminExists = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
    if (!adminExists) {
      db.prepare('INSERT INTO users (username, full_name, role, password) VALUES (?, ?, ?, ?)').run('admin', 'Administrator', 'admin', 'admin');
    }

    const defaultSettings = [
      { key: 'shop_name', value: 'Ndewan Enterprices' },
      { key: 'shop_address', value: 'Nairobi, Kenya' },
      { key: 'shop_phone', value: '+254 700 000 000' },
      { key: 'mpesa_till', value: '123456' },
      { key: 'receipt_footer', value: 'Thank you for your business!' },
      // Default Prices
      { key: 'price_print_bw', value: '10' },
      { key: 'price_print_color', value: '30' },
      { key: 'price_copy_bw', value: '5' },
      { key: 'price_copy_color', value: '20' },
      { key: 'price_scanning', value: '20' },
      { key: 'price_lamination', value: '50' },
      { key: 'price_kra_itax', value: '200' },
      { key: 'price_ecitizen', value: '150' },
      { key: 'price_nhif_sha', value: '100' },
      { key: 'price_nssf_huduma', value: '100' },
      { key: 'price_typing', value: '100' },
      { key: 'price_passport_photo', value: '200' },
      { key: 'price_id_photo', value: '150' },
    ];
    const insertSetting = db.prepare('INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)');
    for (const s of defaultSettings) insertSetting.run(s.key, s.value);
  } catch (err) {
    console.error('[DB] Seeding failed:', err.message);
  }

  // ── Auto-update trigger ──────────────────────────────────────────────────────
  db.exec(`
    CREATE TRIGGER IF NOT EXISTS update_product_timestamp
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
      UPDATE products SET updated_at = strftime('%Y-%m-%dT%H:%M:%SZ', 'now') WHERE id = OLD.id;
    END;
  `);

  // ── Final confirmation ──────────────────────────────────────────────────────
  console.log('------------------------------------------------');
  console.log('🚀 SYSTEM BOOT: Ndewan Enterprices Inventory');
  console.log('📍 DB PATH:', DB_PATH);
  console.log('✅ SCHEMA STATUS: Verified & Synchronized');
  console.log('------------------------------------------------');
}

// ─── 4. Prepared statements (created after initDatabase) ─────────────────────
let stmts = {};

function prepareStatements() {
  stmts = {
    getAllProducts: db.prepare(`
      SELECT * FROM products ORDER BY name ASC
    `),
    searchProducts: db.prepare(`
      SELECT * FROM products
      WHERE (name LIKE ? OR sku LIKE ? OR category LIKE ? OR barcode LIKE ? OR location LIKE ?)
      ORDER BY name ASC
    `),
    getProductByBarcode: db.prepare(`SELECT * FROM products WHERE barcode = ?`),
    getProductById: db.prepare(`SELECT * FROM products WHERE id = ?`),
    insertProduct: db.prepare(`
      INSERT INTO products (name, category, price, buying_price, quantity, low_stock_threshold, max_stock_threshold, description, sku, barcode, location)
      VALUES (@name, @category, @price, @buying_price, @quantity, @low_stock_threshold, @max_stock_threshold, @description, @sku, @barcode, @location)
    `),
    updateProduct: db.prepare(`
      UPDATE products
      SET name=@name, category=@category, price=@price, buying_price=@buying_price,
          quantity=@quantity, low_stock_threshold=@low_stock_threshold,
          max_stock_threshold=@max_stock_threshold,
          description=@description, sku=@sku, barcode=@barcode, location=@location
      WHERE id=@id
    `),
    deleteProduct: db.prepare(`DELETE FROM products WHERE id = ?`),
    getPriceHistory: db.prepare(`
      SELECT ph.*, p.name as product_name
      FROM price_history ph
      JOIN products p ON p.id = ph.product_id
      WHERE ph.product_id = ?
      ORDER BY ph.changed_at DESC
      LIMIT 50
    `),
    insertPriceHistory: db.prepare(`
      INSERT INTO price_history (product_id, old_price, new_price, note)
      VALUES (@product_id, @old_price, @new_price, @note)
    `),
    getLowStock: db.prepare(`
      SELECT * FROM products WHERE quantity <= low_stock_threshold ORDER BY quantity ASC
    `),
    getStats: db.prepare(`
      SELECT
        COUNT(*)                                       AS total_products,
        SUM(quantity)                                  AS total_items,
        SUM(quantity * price)                          AS total_value,
        SUM(quantity * buying_price)                   AS total_cost,
        COUNT(CASE WHEN quantity <= low_stock_threshold THEN 1 END) AS low_stock_count,
        COUNT(CASE WHEN quantity >= max_stock_threshold THEN 1 END) AS overstock_count
      FROM products
    `),
    // ── Sales Statements ──
    insertSale: db.prepare(`
      INSERT INTO sales (total_amount, payment_method, customer_name, notes)
      VALUES (@total_amount, @payment_method, @customer_name, @notes)
    `),
    insertSaleItem: db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price, unit_buying_price)
      VALUES (@sale_id, @product_id, @quantity, @unit_price, @unit_buying_price)
    `),
    getRecentSales: db.prepare(`
      SELECT * FROM sales ORDER BY created_at DESC LIMIT 50
    `),
    // ── Expense Statements ──
    insertExpense: db.prepare(`
      INSERT INTO expenses (category, amount, description, paid_to)
      VALUES (@category, @amount, @description, @paid_to)
    `),
    getAllExpenses: db.prepare(`
      SELECT * FROM expenses ORDER BY created_at DESC
    `),
    // ── Cyber Jobs Statements ──
    insertCyberJob: db.prepare(`
      INSERT INTO cyber_jobs (customer_name, service_type, amount, status)
      VALUES (@customer_name, @service_type, @amount, @status)
    `),
    updateCyberJobStatus: db.prepare(`
      UPDATE cyber_jobs SET status = ?, completed_at = CASE WHEN ? = 'done' THEN strftime('%Y-%m-%dT%H:%M:%SZ', 'now') ELSE NULL END WHERE id = ?
    `),
    getActiveCyberJobs: db.prepare(`
      SELECT * FROM cyber_jobs WHERE status = 'pending' ORDER BY created_at ASC
    `),
    getDailyCyberRevenue: db.prepare(`
      SELECT SUM(amount) as total FROM cyber_jobs 
      WHERE status = 'done' 
      AND date(created_at) = date('now')
    `),
    // ── User Statements ──
    getAllUsers: db.prepare(`SELECT id, username, full_name, role, created_at FROM users`),
    getUserByCredentials: db.prepare(`SELECT * FROM users WHERE username = ? AND password = ?`),
    insertUser: db.prepare(`INSERT INTO users (username, full_name, role, password) VALUES (@username, @full_name, @role, @password)`),
    deleteUser: db.prepare(`DELETE FROM users WHERE id = ?`),
    // ── Settings Statements ──
    getSettings: db.prepare(`SELECT * FROM settings`),
    updateSetting: db.prepare(`INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))`),
    getCategories: db.prepare(`
      SELECT DISTINCT category FROM products ORDER BY category ASC
    `),
    insertLog: db.prepare(`
      INSERT INTO activity_log (action, details) VALUES (?, ?)
    `),
    getRecentLog: db.prepare(`
      SELECT * FROM activity_log ORDER BY created_at DESC LIMIT 20
    `),
  };
}

// ─── 5. IPC handlers ─────────────────────────────────────────────────────────
function registerIpcHandlers() {

  // ── Products ────────────────────────────────────────────────────────────────
  ipcMain.handle('products:getAll', () => {
    return stmts.getAllProducts.all();
  });

  ipcMain.handle('products:search', (_e, query) => {
    const q = `%${query}%`;
    return stmts.searchProducts.all(q, q, q, q, q);
  });

  ipcMain.handle('products:getById', (_e, id) => {
    return stmts.getProductById.get(id);
  });

  ipcMain.handle('products:getByBarcode', (_e, barcode) => {
    return stmts.getProductByBarcode.get(barcode);
  });

  ipcMain.handle('products:create', (_e, data) => {
    try {
      const info = stmts.insertProduct.run(data);
      stmts.insertLog.run('CREATE', `Added product: ${data.name}`);
      return { success: true, id: info.lastInsertRowid };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:update', (_e, data) => {
    try {
      console.log('[DB] Attempting update for product:', data.id, data.name);
      // Record price history if price changed
      const existing = stmts.getProductById.get(data.id);
      if (existing && existing.price !== data.price) {
        stmts.insertPriceHistory.run({
          product_id: data.id,
          old_price:  existing.price,
          new_price:  data.price,
          note:       'Manual update',
        });
      }
      stmts.updateProduct.run(data);
      console.log('[DB] Update successful:', data.name);
      stmts.insertLog.run('UPDATE', `Updated product: ${data.name}`);
      return { success: true };
    } catch (err) {
      console.error('[DB] Update FAILED:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('products:delete', (_e, id) => {
    try {
      const product = stmts.getProductById.get(id);
      stmts.deleteProduct.run(id);
      stmts.insertLog.run('DELETE', `Deleted product: ${product?.name ?? id}`);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Stats ────────────────────────────────────────────────────────────────────
  ipcMain.handle('products:stats', () => {
    return stmts.getStats.get();
  });

  ipcMain.handle('products:lowStock', () => {
    return stmts.getLowStock.all();
  });

  ipcMain.handle('products:categories', () => {
    return stmts.getCategories.all().map(r => r.category);
  });

  // ── Price history ────────────────────────────────────────────────────────────
  ipcMain.handle('priceHistory:get', (_e, productId) => {
    return stmts.getPriceHistory.all(productId);
  });

  // ── Activity log ─────────────────────────────────────────────────────────────
  ipcMain.handle('log:recent', () => {
    return stmts.getRecentLog.all();
  });

  // ── Backup ──────────────────────────────────────────────────────────────────
  ipcMain.handle('backup:export', async () => {
    const { filePath, canceled } = await dialog.showSaveDialog({
      title:       'Export Database Backup',
      defaultPath: `inventory-backup-${new Date().toISOString().slice(0,10)}.db`,
      filters:     [{ name: 'SQLite Database', extensions: ['db'] }],
    });
    if (canceled || !filePath) return { success: false, reason: 'cancelled' };
    try {
      fs.copyFileSync(DB_PATH, filePath);
      stmts.insertLog.run('BACKUP', `Exported to: ${filePath}`);
      return { success: true, path: filePath };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── App info ─────────────────────────────────────────────────────────────────
  ipcMain.handle('app:info', () => ({
    version:  app.getVersion(),
    dbPath:   DB_PATH,
    userData: USER_DATA,
  }));

  ipcMain.handle('app:openDbFolder', () => {
    shell.openPath(USER_DATA);
  });
  // ── Sales ───────────────────────────────────────────────────────────────────
  ipcMain.handle('sales:create', (_e, { sale, items }) => {
    const transaction = db.transaction(() => {
      const info = stmts.insertSale.run(sale);
      const saleId = info.lastInsertRowid;
      
      for (const item of items) {
        stmts.insertSaleItem.run({ ...item, sale_id: saleId });
        
        // Deduct inventory
        const product = stmts.getProductById.get(item.product_id);
        if (product) {
          stmts.updateProduct.run({
            ...product,
            quantity: product.quantity - item.quantity
          });
        }
      }
      return saleId;
    });

    try {
      const id = transaction();
      stmts.insertLog.run('SALE', `Completed sale #${id} - KES ${sale.total_amount}`);
      return { success: true, id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('sales:recent', () => {
    return stmts.getRecentSales.all();
  });

  // ── Expenses ────────────────────────────────────────────────────────────────
  ipcMain.handle('expenses:create', (_e, data) => {
    try {
      const info = stmts.insertExpense.run(data);
      stmts.insertLog.run('EXPENSE', `Logged expense: ${data.category} - KES ${data.amount}`);
      return { success: true, id: info.lastInsertRowid };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('expenses:getAll', () => {
    return stmts.getAllExpenses.all();
  });

  // ── Cyber Jobs ──────────────────────────────────────────────────────────────
  ipcMain.handle('cyberJobs:create', (_e, data) => {
    try {
      const info = stmts.insertCyberJob.run(data);
      stmts.insertLog.run('CYBER', `Logged job: ${data.service_type} for ${data.customer_name || 'Walk-in'}`);
      return { success: true, id: info.lastInsertRowid };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('cyberJobs:updateStatus', (_e, { id, status }) => {
    try {
      stmts.updateCyberJobStatus.run(status, status, id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('cyberJobs:getActive', () => {
    return stmts.getActiveCyberJobs.all();
  });

  ipcMain.handle('cyberJobs:getDailyRevenue', () => {
    return stmts.getDailyCyberRevenue.get();
  });

  // ── Users ──────────────────────────────────────────────────────────────────
  ipcMain.handle('users:getAll', () => {
    return stmts.getAllUsers.all();
  });

  ipcMain.handle('users:login', (_e, { username, password }) => {
    const user = stmts.getUserByCredentials.get(username, password);
    if (user) {
      stmts.insertLog.run('AUTH', `User logged in: ${user.full_name || user.username}`);
      return { success: true, user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name } };
    }
    return { success: false, error: 'Invalid username or password' };
  });

  ipcMain.handle('users:create', (_e, data) => {
    try {
      stmts.insertUser.run(data);
      return { success: true };
    } catch (err) {
      console.error('[DB] User creation failed:', err.message);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('users:delete', (_e, id) => {
    try {
      stmts.deleteUser.run(id);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Settings ────────────────────────────────────────────────────────────────
  ipcMain.handle('settings:getAll', () => {
    const rows = stmts.getSettings.all();
    return Object.fromEntries(rows.map(r => [r.key, r.value]));
  });

  ipcMain.handle('settings:update', (_e, { key, value }) => {
    try {
      stmts.updateSetting.run(key, value);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // ── Reports ─────────────────────────────────────────────────────────────────
  ipcMain.handle('reports:revenueTrend', () => {
    return db.prepare(`
      SELECT 
        date(created_at) as date,
        SUM(total_amount) as amount
      FROM sales
      WHERE created_at >= date('now', '-30 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).all();
  });

  ipcMain.handle('reports:categoryStats', () => {
    return db.prepare(`
      SELECT 
        p.category,
        SUM(si.quantity * si.unit_price) as revenue,
        COUNT(DISTINCT p.id) as product_count
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.category
    `).all();
  });

  ipcMain.handle('reports:topProducts', () => {
    return db.prepare(`
      SELECT 
        p.name,
        SUM(si.quantity) as units_sold,
        SUM(si.quantity * si.unit_price) as total_revenue
      FROM sale_items si
      JOIN products p ON si.product_id = p.id
      GROUP BY p.id
      ORDER BY total_revenue DESC
      LIMIT 10
    `).all();
  });

  ipcMain.handle('reports:monthlySummary', () => {
    return db.prepare(`
      SELECT 
        (SELECT SUM(total_amount) FROM sales WHERE strftime('%m', created_at) = strftime('%m', 'now')) as revenue,
        (SELECT SUM(amount) FROM expenses WHERE strftime('%m', created_at) = strftime('%m', 'now')) as expenses,
        (SELECT SUM(si.quantity * (si.unit_price - si.unit_buying_price)) 
         FROM sale_items si 
         JOIN sales s ON si.sale_id = s.id 
         WHERE strftime('%m', s.created_at) = strftime('%m', 'now')) as gross_profit
    `).get();
  });
}

// ─── 6. Create window ────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width:           1280,
    height:          800,
    minWidth:        900,
    minHeight:       600,
    title:           'Ndewan Enterprices – Inventory Systems',
    backgroundColor: '#0f172a',
    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,   // SECURITY: keeps Node away from renderer
      nodeIntegration:  false,  // SECURITY: renderer cannot use require()
    },
  });

  // In production, load the built index.html
  // In development, load the Vite dev server
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

// ─── 7. App lifecycle ────────────────────────────────────────────────────────
app.whenReady().then(() => {
  initDatabase();
  prepareStatements();
  registerIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (db) db.close();
  if (process.platform !== 'darwin') app.quit();
});
