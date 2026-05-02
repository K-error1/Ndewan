import { useState } from 'react';

interface SectionProps {
  step?: number | string;
  title: string;
  color?: string;
  children: React.ReactNode;
}

function Section({ step, title, color = 'indigo', children }: SectionProps) {
  const [open, setOpen] = useState(true);
  const colorMap: Record<string, string> = {
    indigo:  'text-indigo-400 border-indigo-700/50 bg-indigo-900/20',
    emerald: 'text-emerald-400 border-emerald-700/50 bg-emerald-900/20',
    amber:   'text-amber-400  border-amber-700/50  bg-amber-900/20',
    red:     'text-red-400    border-red-700/50    bg-red-900/20',
    sky:     'text-sky-400    border-sky-700/50    bg-sky-900/20',
    purple:  'text-purple-400 border-purple-700/50 bg-purple-900/20',
  };
  return (
    <div className={`rounded-2xl border ${colorMap[color]} mb-4`}>
      <button
        className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-3">
          {step !== undefined && (
            <span className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold border ${colorMap[color]}`}>
              {step}
            </span>
          )}
          <h3 className={`font-semibold ${colorMap[color].split(' ')[0]}`}>{title}</h3>
        </div>
        <svg
          className={`h-4 w-4 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${colorMap[color].split(' ')[0]}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 text-sm text-slate-300 space-y-3">{children}</div>}
    </div>
  );
}

function Code({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(children).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 overflow-x-auto text-emerald-300 text-xs leading-relaxed">
        {children}
      </pre>
      <button
        onClick={copy}
        className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
      >
        {copied ? '✅ Copied!' : '📋 Copy'}
      </button>
    </div>
  );
}

function FileTree() {
  const tree = [
    { indent: 0, name: 'stockmaster/',                   icon: '📁', bold: true },
    { indent: 1, name: 'electron/',                      icon: '📁', bold: true, note: '← Electron process files' },
    { indent: 2, name: 'main.js',                        icon: '⚡', note: 'Main process + SQLite + IPC handlers' },
    { indent: 2, name: 'preload.js',                     icon: '🔒', note: 'contextBridge security layer' },
    { indent: 2, name: 'electron-builder.json',          icon: '📦', note: 'Packaging config' },
    { indent: 1, name: 'src/',                           icon: '📁', bold: true, note: '← React / Vite frontend' },
    { indent: 2, name: 'lib/db.ts',                      icon: '🗄️',  note: 'Database abstraction layer' },
    { indent: 2, name: 'components/',                    icon: '📁' },
    { indent: 3, name: 'ui/ (Button, Modal, Toast…)',    icon: '🎨' },
    { indent: 3, name: 'ProductTable.tsx',               icon: '📋' },
    { indent: 3, name: 'ProductForm.tsx',                icon: '📝' },
    { indent: 3, name: 'LowStockPanel.tsx',              icon: '⚠️' },
    { indent: 3, name: 'PriceHistoryModal.tsx',          icon: '📈' },
    { indent: 3, name: 'ActivityLog.tsx',                icon: '📜' },
    { indent: 2, name: 'App.tsx',                        icon: '🏠', note: 'Root application component' },
    { indent: 1, name: 'index.html',                     icon: '🌐' },
    { indent: 1, name: 'vite.config.ts',                 icon: '⚙️' },
    { indent: 1, name: 'package.json',                   icon: '📦', note: 'main → electron/main.js' },
    { indent: 1, name: 'assets/icon.ico',                icon: '🖼️',  note: 'App icon (required for .exe)' },
    { indent: 1, name: 'release/',                       icon: '📂', note: '← Generated .exe goes here' },
    { indent: 2, name: 'StockMaster Setup 1.0.0.exe',   icon: '💿', bold: true },
  ];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-0.5 overflow-x-auto">
      {tree.map((node, i) => (
        <div key={i} className="flex items-start gap-1" style={{ paddingLeft: node.indent * 16 }}>
          <span>{node.icon}</span>
          <span className={node.bold ? 'text-white font-semibold' : 'text-emerald-300'}>{node.name}</span>
          {node.note && <span className="text-slate-500 ml-2 font-sans">{node.note}</span>}
        </div>
      ))}
    </div>
  );
}

export function SetupGuide() {
  return (
    <div className="max-w-4xl mx-auto space-y-2 pb-8">
      {/* Hero */}
      <div className="rounded-2xl border border-indigo-700/40 bg-gradient-to-br from-indigo-950/60 to-slate-900 p-6 mb-6 text-center">
        <div className="text-5xl mb-3">⚡</div>
        <h1 className="text-2xl font-bold text-white">StockMaster – Complete Build Guide</h1>
        <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
          Full step-by-step instructions to turn this React UI into a real, installable
          Windows .exe file that runs without Node.js or any external dependencies.
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
          {['Electron 28', 'React + Vite', 'better-sqlite3', 'electron-builder', 'TypeScript'].map(t => (
            <span key={t} className="px-2.5 py-1 rounded-full bg-indigo-900/50 border border-indigo-700/50 text-indigo-300">{t}</span>
          ))}
        </div>
      </div>

      {/* Architecture */}
      <Section step="🗺️" title="Architecture Overview" color="purple">
        <p className="text-slate-400">Three isolated layers communicate via IPC (inter-process communication):</p>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-1">
          <div className="text-sky-300">┌──────────────────────────────────────────┐</div>
          <div className="text-sky-300">│  RENDERER PROCESS  (React / Vite UI)      │ ← Sandboxed, no Node.js</div>
          <div className="text-sky-300">│  window.electronAPI.products.getAll()     │</div>
          <div className="text-sky-300">└─────────────────┬────────────────────────┘</div>
          <div className="text-slate-500">                  │ IPC (contextBridge)</div>
          <div className="text-slate-500">                  │ Only whitelisted channels allowed</div>
          <div className="text-amber-300">┌─────────────────▼────────────────────────┐</div>
          <div className="text-amber-300">│  PRELOAD SCRIPT  (electron/preload.js)    │ ← Bridge (trusted)</div>
          <div className="text-amber-300">│  contextBridge.exposeInMainWorld(...)     │</div>
          <div className="text-amber-300">└─────────────────┬────────────────────────┘</div>
          <div className="text-slate-500">                  │ ipcRenderer → ipcMain</div>
          <div className="text-emerald-300">┌─────────────────▼────────────────────────┐</div>
          <div className="text-emerald-300">│  MAIN PROCESS  (electron/main.js)         │ ← Full Node.js</div>
          <div className="text-emerald-300">│  ipcMain.handle('products:getAll', ...)   │</div>
          <div className="text-emerald-300">│  better-sqlite3 Database                  │</div>
          <div className="text-emerald-300">│  %APPDATA%\StockMaster\inventory.db       │</div>
          <div className="text-emerald-300">└──────────────────────────────────────────┘</div>
        </div>
        <p>The database file lives in <code className="text-emerald-400 bg-slate-800 px-1 rounded">%APPDATA%\StockMaster\inventory.db</code> on Windows — it persists across updates.</p>
      </Section>

      {/* Folder structure */}
      <Section step="1" title="Folder Structure" color="indigo">
        <FileTree />
      </Section>

      {/* Prerequisites */}
      <Section step="2" title="Prerequisites (One-time setup)" color="sky">
        <p>Install these tools on the <em>developer</em> machine only — <strong className="text-white">end users need nothing installed</strong>.</p>
        <ul className="list-disc list-inside space-y-1 text-slate-300">
          <li>Node.js 18+ LTS — <code className="text-emerald-400">https://nodejs.org</code></li>
          <li>Git (optional but recommended)</li>
          <li>Windows Build Tools (for compiling native modules):
            <Code>{`# Run as Administrator in PowerShell\nnpm install -g windows-build-tools\n# Or install "Desktop development with C++" via Visual Studio Installer`}</Code>
          </li>
        </ul>
      </Section>

      {/* Installation */}
      <Section step="3" title="Project Installation" color="indigo">
        <p>Clone the project and install all dependencies:</p>
        <Code>{`# 1. Clone / copy the project folder
git clone https://github.com/yourname/stockmaster.git
cd stockmaster

# 2. Install all dependencies
npm install

# 3. Install Electron + SQLite + builder
npm install --save-dev electron electron-builder
npm install better-sqlite3
npm install --save-dev electron-rebuild

# 4. Rebuild native modules for Electron's Node version
npx electron-rebuild -f -w better-sqlite3`}</Code>
      </Section>

      {/* package.json changes */}
      <Section step="4" title="package.json — Required Changes" color="amber">
        <p>Your <code className="text-emerald-400 bg-slate-800 px-1 rounded">package.json</code> must have these critical fields:</p>
        <Code>{`{
  "name": "stockmaster",
  "version": "1.0.0",
  "description": "Offline Inventory Management System",

  // ⚠️  CRITICAL: tells Electron where to start
  "main": "electron/main.js",

  // Remove "type": "module" — Electron uses CommonJS
  // "type": "module",   ← DELETE this line

  "scripts": {
    "dev":     "vite",
    "build":   "vite build",

    // Start Electron in development (with Vite dev server)
    "electron:dev": "concurrently \\"vite\\" \\"wait-on http://localhost:5173 && electron .\\"",

    // Build React first, then package into .exe
    "electron:build": "vite build && electron-builder --config electron/electron-builder.json",

    // Rebuild native modules after any npm install
    "postinstall": "electron-rebuild -f -w better-sqlite3"
  },

  "build": {
    // Points to our electron-builder.json (or inline config here)
  }
}`}</Code>
        <p className="text-amber-300">⚠️ <strong>Important:</strong> Remove <code className="bg-slate-800 px-1 rounded">"type": "module"</code> from package.json. Electron's main process uses CommonJS <code>require()</code>, not ES module <code>import</code>.</p>
      </Section>

      {/* Vite config */}
      <Section step="5" title="vite.config.ts — Required Changes" color="indigo">
        <Code>{`import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

export default defineConfig({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: { '@': path.resolve(__dirname, 'src') },
  },

  build: {
    outDir: 'dist',
    // Don't inline assets — Electron loads them as files
    assetsInlineLimit: 0,
  },

  // ⚠️  Tell Vite to use relative paths so Electron can
  //     load index.html with file:// protocol
  base: './',
})`}</Code>
        <p className="text-amber-300">⚠️ Remove <code className="bg-slate-800 px-1 rounded">viteSingleFile()</code> plugin — it causes issues with Electron's file loading.</p>
      </Section>

      {/* Development */}
      <Section step="6" title="Running in Development Mode" color="emerald">
        <Code>{`# Terminal 1: Start Vite dev server
npm run dev

# Terminal 2: Start Electron (points to Vite dev server)
VITE_DEV_SERVER_URL=http://localhost:5173 npx electron .

# Or use the combined command (requires concurrently package):
npm run electron:dev`}</Code>
        <p>During development, Electron loads the Vite dev server URL. Hot-reload works for the React UI. Changes to <code className="text-emerald-400">electron/main.js</code> require restarting Electron.</p>
      </Section>

      {/* Building the .exe */}
      <Section step="7" title="Building the .exe Installer" color="purple">
        <Code>{`# Build React app + package into Windows installer
npm run electron:build

# Output:
#   release/
#   └── StockMaster Setup 1.0.0.exe   ← Send this to users!
#
# The installer (~80-120 MB) includes:
#   ✅ Electron runtime
#   ✅ React frontend (compiled)
#   ✅ better-sqlite3 native module
#   ✅ Node.js (bundled by Electron)
#   ✅ NO external dependencies needed by end user`}</Code>

        <p>To build for multiple platforms from Windows (cross-compilation is limited):</p>
        <Code>{`npx electron-builder --win    # Windows .exe + .msi
npx electron-builder --mac    # macOS .dmg  (must run on Mac)
npx electron-builder --linux  # Linux AppImage`}</Code>
      </Section>

      {/* App icon */}
      <Section step="8" title="App Icon Setup" color="amber">
        <Code>{`# Create the assets/ folder and add your icon files:
assets/
  icon.ico    # Windows (256x256 ICO format)
  icon.icns   # macOS (ICNS format)
  icon.png    # Linux (512x512 PNG)

# Convert PNG to ICO (free tool):
# https://www.icoconverter.com/
# Or use ImageMagick:
magick convert icon.png -resize 256x256 icon.ico`}</Code>
      </Section>

      {/* Database */}
      <Section step="9" title="Database & Data Persistence" color="sky">
        <p>The SQLite database is stored in the OS user data folder — it survives app updates:</p>
        <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 font-mono text-xs space-y-1">
          <div><span className="text-slate-500">Windows:</span>  <span className="text-emerald-300">C:\Users\YourName\AppData\Roaming\StockMaster\inventory.db</span></div>
          <div><span className="text-slate-500">macOS:  </span>  <span className="text-emerald-300">~/Library/Application Support/StockMaster/inventory.db</span></div>
          <div><span className="text-slate-500">Linux:  </span>  <span className="text-emerald-300">~/.config/StockMaster/inventory.db</span></div>
        </div>
        <p>The "Backup Data" button copies this file to a location you choose. To restore, simply copy a backup .db file back to the userData folder.</p>
        <Code>{`-- Database schema (auto-created on first launch)
CREATE TABLE products (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT    NOT NULL,
  category      TEXT    NOT NULL DEFAULT 'General',
  price         REAL    NOT NULL DEFAULT 0,
  quantity      INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 10,
  description   TEXT,
  sku           TEXT    UNIQUE,
  created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE price_history (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  old_price  REAL NOT NULL,
  new_price  REAL NOT NULL,
  changed_at TEXT NOT NULL DEFAULT (datetime('now')),
  note       TEXT
);`}</Code>
      </Section>

      {/* Installing on another computer */}
      <Section step="🖥️" title="Installing on Another Computer" color="emerald">
        <p className="text-emerald-300 font-semibold">For the end user — no technical knowledge required:</p>
        <ol className="list-decimal list-inside space-y-2 text-slate-300">
          <li>Copy <code className="text-emerald-400 bg-slate-800 px-1 rounded">StockMaster Setup 1.0.0.exe</code> to a USB drive or share via network</li>
          <li>Double-click the installer on the target computer</li>
          <li>Follow the on-screen installer wizard (next, next, install)</li>
          <li>A desktop shortcut "StockMaster" is created automatically</li>
          <li>Double-click the shortcut — the app starts immediately ✅</li>
          <li>The database is created automatically on first launch</li>
        </ol>
        <p className="text-amber-300">⚠️ Windows SmartScreen may show a warning on first launch (because the .exe is unsigned). Click "More info" → "Run anyway". To avoid this, purchase a code signing certificate (~$200/year).</p>
      </Section>

      {/* Common issues */}
      <Section step="🔧" title="Common Issues & Fixes" color="red">
        <div className="space-y-4">
          {[
            {
              issue: 'Error: Cannot find module \'better-sqlite3\'',
              fix: 'Run: npx electron-rebuild -f -w better-sqlite3\nThis recompiles the native module for Electron\'s Node.js version.',
            },
            {
              issue: 'White screen / blank window in production',
              fix: 'Check vite.config.ts has base: \'./\' so assets use relative paths.\nVerify dist/ folder exists (run npm run build first).',
            },
            {
              issue: '"type": "module" conflicts with Electron',
              fix: 'Remove "type": "module" from package.json.\nElectron main/preload use CommonJS (require), not ES modules.',
            },
            {
              issue: 'Database not persisting between restarts',
              fix: 'Ensure the DB path uses app.getPath(\'userData\').\nNever save the .db file inside the app\'s installation folder.',
            },
            {
              issue: 'App opens then immediately closes',
              fix: 'Open DevTools: win.webContents.openDevTools()\nCheck the console for errors. Common cause: missing preload.js path.',
            },
            {
              issue: 'electron-builder: "asar" module errors',
              fix: 'Add better-sqlite3 to asarUnpack in electron-builder.json.\nNative modules cannot be inside the asar archive.',
            },
            {
              issue: 'IPC channel not returning data',
              fix: 'Ensure ipcMain.handle() returns the data (not void).\nIn preload.js, use ipcRenderer.invoke() (not .send()) for request-response.',
            },
          ].map(({ issue, fix }) => (
            <div key={issue} className="rounded-lg border border-red-800/40 bg-red-950/20 p-3">
              <p className="text-red-300 font-semibold text-sm mb-1">❌ {issue}</p>
              <pre className="text-slate-300 text-xs whitespace-pre-wrap">{fix}</pre>
            </div>
          ))}
        </div>
      </Section>

      {/* Future improvements */}
      <Section step="🚀" title="Future Improvements" color="purple">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: '📊', title: 'Sales Tracking', desc: 'Record sales transactions, generate daily/monthly revenue reports' },
            { icon: '🔍', title: 'Barcode Scanning', desc: 'Integrate USB barcode scanner or camera scan via QuaggaJS/ZXing' },
            { icon: '👥', title: 'Multi-User Roles', desc: 'Admin vs. staff roles, login screen, JWT sessions' },
            { icon: '📄', title: 'PDF Reports', desc: 'Export inventory reports as PDF using pdfkit or jsPDF' },
            { icon: '📧', title: 'Email Alerts', desc: 'Send low-stock notifications via email using nodemailer' },
            { icon: '🔄', title: 'Auto Updates', desc: 'Use electron-updater to push app updates automatically' },
            { icon: '☁️', title: 'Cloud Sync', desc: 'Sync inventory to cloud (Supabase, Firebase) for multi-device access' },
            { icon: '📱', title: 'Mobile App', desc: 'Add a React Native companion app for warehouse scanning' },
            { icon: '🌙', title: 'Offline POS', desc: 'Add a point-of-sale screen for checkout and receipt printing' },
            { icon: '📦', title: 'Purchase Orders', desc: 'Track supplier orders, receive stock, manage vendor contacts' },
            { icon: '🔐', title: 'Database Encryption', desc: 'Encrypt SQLite using SQLCipher for sensitive inventory data' },
            { icon: '📈', title: 'Charts & Analytics', desc: 'Add recharts/chart.js for visual inventory trends and forecasting' },
          ].map(f => (
            <div key={f.title} className="flex gap-3 rounded-lg bg-slate-800/40 border border-slate-700/50 p-3">
              <span className="text-2xl">{f.icon}</span>
              <div>
                <p className="font-semibold text-white text-sm">{f.title}</p>
                <p className="text-slate-400 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      {/* Tech stack summary */}
      <Section step="📚" title="Technology Stack Summary" color="sky">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left py-2 pr-4 text-slate-400">Layer</th>
                <th className="text-left py-2 pr-4 text-slate-400">Technology</th>
                <th className="text-left py-2 text-slate-400">Purpose</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {[
                ['Desktop Shell',   'Electron 28',          'Wraps web app as native .exe, provides OS APIs'],
                ['Frontend',        'React 19 + TypeScript', 'UI components, state management'],
                ['Build Tool',      'Vite 6',               'Fast bundling, HMR in development'],
                ['Styling',         'Tailwind CSS 4',       'Utility-first CSS, no external CSS files needed'],
                ['Database',        'better-sqlite3',       'Synchronous SQLite, fast, file-based, no server'],
                ['IPC Bridge',      'contextBridge',        'Secure main↔renderer communication'],
                ['Packaging',       'electron-builder',     'Creates Windows NSIS installer (.exe)'],
                ['Security',        'contextIsolation',     'Renderer cannot access Node.js APIs directly'],
              ].map(([layer, tech, purpose]) => (
                <tr key={layer}>
                  <td className="py-2 pr-4 text-sky-300 font-medium whitespace-nowrap">{layer}</td>
                  <td className="py-2 pr-4 text-emerald-300 whitespace-nowrap">{tech}</td>
                  <td className="py-2 text-slate-400">{purpose}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </div>
  );
}
