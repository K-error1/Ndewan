/**
 * StockMaster - Preload Script
 * ============================
 * This script runs in a privileged context between main and renderer.
 * It uses contextBridge to safely expose ONLY the IPC channels we want
 * to the React frontend — nothing else from Node.js is exposed.
 *
 * Security model:
 *   ✅  Whitelist of allowed channels
 *   ✅  contextIsolation = true (set in main.js)
 *   ✅  nodeIntegration  = false (set in main.js)
 *   ✅  Renderer cannot call require() at all
 */

const { contextBridge, ipcRenderer } = require('electron');

// Helper that wraps ipcRenderer.invoke and rethrows errors cleanly
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args);

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Products ──────────────────────────────────────────────────────────────
  products: {
    getAll:     ()       => invoke('products:getAll'),
    search:     (query)  => invoke('products:search', query),
    getById:    (id)     => invoke('products:getById', id),
    create:     (data)   => invoke('products:create', data),
    update:     (data)   => invoke('products:update', data),
    delete:     (id)     => invoke('products:delete', id),
    getByBarcode: (barcode) => invoke('products:getByBarcode', barcode),
    stats:      ()       => invoke('products:stats'),
    lowStock:   ()       => invoke('products:lowStock'),
    categories: ()       => invoke('products:categories'),
  },

  // ── Price history ─────────────────────────────────────────────────────────
  priceHistory: {
    get: (productId) => invoke('priceHistory:get', productId),
  },

  // ── Activity log ──────────────────────────────────────────────────────────
  log: {
    recent: () => invoke('log:recent'),
  },

  // ── Backup ────────────────────────────────────────────────────────────────
  backup: {
    export: () => invoke('backup:export'),
  },

  // ── Sales ────────────────────────────────────────────────────────────────
  sales: {
    create: (data) => invoke('sales:create', data),
    recent: ()     => invoke('sales:recent'),
  },

  // ── Expenses ──────────────────────────────────────────────────────────────
  expenses: {
    create: (data) => invoke('expenses:create', data),
    getAll: ()     => invoke('expenses:getAll'),
  },

  // ── Cyber Jobs ────────────────────────────────────────────────────────────
  cyberJobs: {
    create:          (data) => invoke('cyberJobs:create', data),
    updateStatus:    (id, status) => invoke('cyberJobs:updateStatus', { id, status }),
    getActive:       () => invoke('cyberJobs:getActive'),
    getDailyRevenue: () => invoke('cyberJobs:getDailyRevenue'),
  },

  // ── Users ─────────────────────────────────────────────────────────────────
  users: {
    getAll: ()                         => invoke('users:getAll'),
    login:  (username, password)       => invoke('users:login', { username, password }),
    create: (data)                     => invoke('users:create', data),
    delete: (id)                       => invoke('users:delete', id),
  },

  // ── Settings ──────────────────────────────────────────────────────────────
  settings: {
    getAll: ()           => invoke('settings:getAll'),
    update: (key, value) => invoke('settings:update', { key, value }),
  },

  // ── Reports ──────────────────────────────────────────────────────────────
  reports: {
    revenueTrend:   () => invoke('reports:revenueTrend'),
    categoryStats:  () => invoke('reports:categoryStats'),
    topProducts:    () => invoke('reports:topProducts'),
    monthlySummary: () => invoke('reports:monthlySummary'),
  },

  // ── App utilities ─────────────────────────────────────────────────────────
  app: {
    info:         () => invoke('app:info'),
    openDbFolder: () => invoke('app:openDbFolder'),
  },
});
