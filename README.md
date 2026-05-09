# 🏪 Ndewan Enterprises Inventory System

A comprehensive desktop inventory, point-of-sale, service desk, expense, and reporting system built with **React**, **Vite**, **Electron**, and **SQLite**.

The app is designed for small retail and cyber/service businesses that need a **local-first system** for tracking stock, sales, services, staff activity, expenses, and business reports without relying on cloud infrastructure.

---

## ✨ Features

### Core Inventory Management
- 📦 Inventory catalog with complete product CRUD operations
- 🔍 Product search with category and status filtering
- ⚠️ Low-stock and overstock alerts
- 📈 Price history tracking

### Sales & Point-of-Sale
- 💳 Point-of-sale workflow with inventory deduction
- 📊 Sales tracking and history

### Service Management
- 🛠️ Service desk workflow for cyber/services jobs
- 👨‍💼 Job queue management

### Business Operations
- 💰 Expense management and tracking
- 📋 Reports dashboard with revenue, category, top-product, and monthly summaries
- 📝 Activity/audit log for complete business transparency
- ⚙️ User login with admin and cashier role-based access
- 🏢 Settings for shop details, receipt customization, and service pricing

### Technical Highlights
- 💾 SQLite database stored locally in Electron user data folder
- 🌐 Browser fallback mode using localStorage for demo/development
- 📦 Windows packaging with electron-builder
- 🔒 Secure IPC bridge with preload whitelist

---

## 🛠️ Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| **React** | 19 | UI Framework |
| **TypeScript** | — | Type-safe development |
| **Vite** | 7 | Fast build tool |
| **Tailwind CSS** | 4 | Styling |
| **Electron** | 33 | Desktop application |
| **better-sqlite3** | — | Local database |
| **electron-builder** | — | App packaging |
| **Recharts** | — | Data visualization |
| **lucide-react** | — | Icons |

---

## 📁 Project Structure

```
inventory/
├── assets/
│   ├── icon.ico
│   └── icon.png
├── dist/                          # Production Vite build output
├── electron/
│   ├── electron-builder.json
│   ├── main.js
│   └── preload.js
├── public/
│   └── icon.png
├── scratch/
│   ├── create_ico.js
│   └── seed_db.js
├── src/
│   ├── components/
│   │   ├── ActivityLog.tsx
│   │   ├── CyberJobsQueue.tsx
│   │   ├── EmployeeDashboard.tsx
│   │   ├── ExpenseManager.tsx
│   │   ├── LoginOverlay.tsx
│   │   ├── LowStockPanel.tsx
│   │   ├── POS.tsx
│   │   ├── ProductForm.tsx
│   │   ├── ProductTable.tsx
│   │   ├── ReportsDashboard.tsx
│   │   ├── ServiceHub.tsx
│   │   ├── SettingsManager.tsx
│   │   └── ui/
│   ├── lib/
│   │   └── db.ts
│   ├── utils/
│   │   ├── cn.ts
│   │   └── printing.ts
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🏗️ Architecture

The project supports two runtime modes:

### 🖥️ Electron Desktop Mode
In Electron, the React renderer communicates with the main process through a **secure preload bridge**:

```
React UI
  ↓
window.electronAPI
  ↓
electron/preload.js
  ↓
ipcRenderer.invoke(...)
  ↓
electron/main.js
  ↓
better-sqlite3
  ↓
Local SQLite Database
```

**Security features:**
- Main process owns the database connection
- Only whitelisted IPC handlers are exposed
- Renderer process does not use Node.js directly

### 🌐 Browser Demo Mode
When opened through Vite in a normal browser, `window.electronAPI` is unavailable. In this case, `src/lib/db.ts` falls back to an **in-memory/localStorage-backed store** so the UI can still function for demo and development purposes.

---

## 💾 Database

### Storage Location
The Electron version stores the SQLite database at Electron's userData path.

**On Windows:**
```
C:\Users\<user>\AppData\Roaming\Ndewan Enterprises\inventory.db
```

The exact path can be viewed inside the app from the **sidebar data-folder action**.

### Main Tables
- `products` - Product catalog
- `price_history` - Price changes over time
- `activity_log` - Audit trail
- `sales` - Sales transactions
- `sale_items` - Individual items in sales
- `expenses` - Business expenses
- `cyber_jobs` - Service requests
- `users` - User accounts
- `settings` - App configuration

---

## 🔐 Default Login

The app seeds a default admin account if none exists:

| Field | Value |
|---|---|
| **Username** | `admin` |
| **Password** | `admin` |

⚠️ **Change these credentials before using the app in a real business environment.**

---

## 📋 Requirements

- **Windows 10 or newer** (for Windows packaging)
- **Node.js 20 or newer** (recommended)
- **npm**
- **Visual Studio Build Tools** (may be required if native modules need to rebuild from source)
  - For `better-sqlite3`, Electron packaging runs a native dependency rebuild through `electron-builder install-app-deps`

---

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# (Optional) Rebuild native modules manually if needed
npx electron-rebuild -f -w better-sqlite3
```

### Development

```bash
# Run Vite browser version
npm run dev

# Run Electron development version
npm run electron:dev
```

The Electron dev command starts Vite, waits for `http://localhost:5173`, then launches Electron with:
```
VITE_DEV_SERVER_URL=http://localhost:5173
```

### Production Build

```bash
# Build React/Vite frontend only
npm run build

# Build unpacked Windows Electron app
npm run electron:pack
# Output: release/win-unpacked/Ndewan Enterprises.exe

# Build full Windows installer
npm run electron:build
# Output: release/Ndewan Enterprises Setup 1.0.0.exe
```

---

## 📜 Available Scripts

```json
{
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "electron:dev": "concurrently \"vite\" \"wait-on http://localhost:5173 && cross-env VITE_DEV_SERVER_URL=http://localhost:5173 electron .\"",
  "electron:pack": "vite build && electron-builder --config electron/electron-builder.json --dir",
  "electron:build": "vite build && electron-builder --config electron/electron-builder.json",
  "electron:build:fast": "vite build && cross-env CSC_SKIP=true electron-builder --config electron/electron-builder.json",
  "postinstall": "electron-builder install-app-deps"
}
```

---

## 📦 Electron Packaging Notes

The project uses **electron-builder** with this configuration: `electron/electron-builder.json`

### Important Settings

- ✅ **ASAR enabled** for secure packaging
- ✅ **better-sqlite3, bindings, and file-uri-to-path unpacked** from ASAR
- ✅ **Windows target is NSIS**
- ⚠️ **signAndEditExecutable is disabled** for unsigned local builds

This setting avoids Windows symlink permission failures when electron-builder tries to download and extract signing tools.

**Production Note:** If you plan to distribute a signed production app, configure a real code-signing certificate and revisit this setting.

---

## 👥 Role-Based Workflows

### Admin Access
- 📊 Dashboard
- 📈 Reports
- 📦 Catalog
- ⚠️ Low-stock alerts
- 💰 Expenses
- 📋 Audit log
- ⚙️ Settings

### Cashier Access
- 📊 Dashboard
- 📦 Catalog
- 🛠️ Service desk
- ⚠️ Low-stock alerts

---

## 🔧 Troubleshooting

### ❌ `npm` is not recognized
Install Node.js from the [official Node.js website](https://nodejs.org/), then reopen the terminal and confirm:
```bash
node -v
npm -v
```

### ❌ Electron opens a blank screen
1. Check that the Vite build exists:
   ```bash
   npm run build
   ```
2. Confirm `vite.config.ts` has:
   ```typescript
   base: "./"
   ```
   This allows assets to load correctly from Electron's `file://` production path.

### ❌ better-sqlite3 native module errors
Rebuild native modules for Electron:
```bash
npx electron-rebuild -f -w better-sqlite3
npm run electron:build
```

### ❌ A required privilege is not held by the client
This can happen when electron-builder extracts signing tools that contain symlinks. For unsigned local builds, keep this in `electron/electron-builder.json`:
```json
"signAndEditExecutable": false
```

### ❌ app.asar is missing from release/win-unpacked/resources
Run the unpacked package build again:
```bash
npm run electron:pack
```

After a successful build, `release/win-unpacked/resources` should contain:
- `app.asar`
- `app.asar.unpacked/`

---

## 🔒 Security Notes

- ✅ Electron renderer has `nodeIntegration` disabled
- ✅ `contextIsolation` is enabled
- ✅ IPC access is exposed through a preload whitelist
- ⚠️ Passwords are currently stored in **plain text** for local/demo usage

### Before Production Use
Replace plain-text password storage with **password hashing** and consider adding role-based checks in the main process IPC handlers.

---

## 💾 Backup

The app can export the SQLite database from the UI:

- **Electron mode:** Backup copies the current database file to a selected destination
- **Browser demo mode:** Backup exports a JSON snapshot from localStorage

---

## 📚 Git Best Practices

### Recommended Files to Commit
```
src/
electron/
assets/
public/
package.json
package-lock.json
tsconfig.json
vite.config.ts
index.html
README.md
```

### Recommended Files to Ignore
```
node_modules/
dist/
release/
*.db
*.db-shm
*.db-wal
.env
```

---

## 📄 License

Add your preferred license before publishing publicly. 

**Common choices:**
- **MIT** for open-source projects
- **Proprietary/Custom** for business software

---

## 🤝 Contributing

Contributions are welcome! Please ensure:
1. Code follows the TypeScript style conventions
2. New features are well-documented
3. Security best practices are maintained
4. Tests pass before submitting PRs

---

## 📞 Support

For issues, questions, or suggestions, please open a GitHub issue or check the troubleshooting section above.

---

**Made with ❤️ for small businesses**
