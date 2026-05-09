Ndewan Enterprises Inventory System
A desktop inventory, point-of-sale, service desk, expense, and reporting system built with React, Vite, Electron, and SQLite.

The app is designed for small retail and cyber/service businesses that need a local-first system for tracking stock, sales, services, staff activity, expenses, and business reports without relying on a remote server.

Features
Inventory catalog with product CRUD
Product search and category/status filtering
Low-stock and overstock alerts
Point-of-sale workflow
Service desk workflow for cyber/services jobs
Sales tracking with inventory deduction
Expense management
Reports dashboard with revenue, category, top-product, and monthly summaries
Price history tracking
Activity/audit log
User login with admin and cashier roles
Settings for shop details, receipt details, and service pricing
SQLite database stored locally in the Electron user data folder
Browser fallback mode using localStorage for demo/development
Windows packaging with electron-builder
Tech Stack
React 19
TypeScript
Vite 7
Tailwind CSS 4
Electron 33
better-sqlite3
electron-builder
Recharts
lucide-react
Project Structure
inventory/
+-- assets/
|   +-- icon.ico
|   +-- icon.png
+-- dist/
|   +-- Production Vite build output
+-- electron/
|   +-- electron-builder.json
|   +-- main.js
|   +-- preload.js
+-- public/
|   +-- icon.png
+-- scratch/
|   +-- create_ico.js
|   +-- seed_db.js
+-- src/
|   +-- components/
|   |   +-- ActivityLog.tsx
|   |   +-- CyberJobsQueue.tsx
|   |   +-- EmployeeDashboard.tsx
|   |   +-- ExpenseManager.tsx
|   |   +-- LoginOverlay.tsx
|   |   +-- LowStockPanel.tsx
|   |   +-- POS.tsx
|   |   +-- ProductForm.tsx
|   |   +-- ProductTable.tsx
|   |   +-- ReportsDashboard.tsx
|   |   +-- ServiceHub.tsx
|   |   +-- SettingsManager.tsx
|   |   +-- ui/
|   +-- lib/
|   |   +-- db.ts
|   +-- utils/
|   |   +-- cn.ts
|   |   +-- printing.ts
|   +-- App.tsx
|   +-- index.css
|   +-- main.tsx
+-- index.html
+-- package.json
+-- package-lock.json
+-- tsconfig.json
+-- vite.config.ts
Architecture
The project has two runtime modes.

Electron Desktop Mode
In Electron, the React renderer talks to the main process through a secure preload bridge:

React UI
  -> window.electronAPI
  -> electron/preload.js
  -> ipcRenderer.invoke(...)
  -> electron/main.js
  -> better-sqlite3
  -> local SQLite database
The main process owns the database connection and exposes whitelisted IPC handlers only. The renderer does not use Node.js directly.

Browser Demo Mode
When the app is opened through Vite in a normal browser, window.electronAPI is not available. In that case, src/lib/db.ts falls back to an in-memory/localStorage-backed store so the UI can still be tested without Electron.

Database
The Electron version stores the SQLite database at Electron's userData path.

On Windows, this is typically:

C:\Users\<user>\AppData\Roaming\Ndewan Enterprises\inventory.db
The exact path can be viewed inside the app from the sidebar data-folder action.

Main tables created by electron/main.js:

products
price_history
activity_log
sales
sale_items
expenses
cyber_jobs
users
settings
Default Login
The app seeds a default admin account if none exists:

Username: admin
Password: admin
Change this before using the app in a real business environment.

Requirements
Windows 10 or newer for Windows packaging
Node.js 20 or newer recommended
npm
Visual Studio Build Tools may be required if native modules need to rebuild from source
For better-sqlite3, Electron packaging runs a native dependency rebuild through electron-builder install-app-deps.

Installation
Install dependencies:

npm install
If native modules need to be rebuilt manually:

npx electron-rebuild -f -w better-sqlite3
Development
Run the Vite browser version:

npm run dev
Run the Electron development version:

npm run electron:dev
The Electron dev command starts Vite, waits for http://localhost:5173, then launches Electron with:

VITE_DEV_SERVER_URL=http://localhost:5173
Production Build
Build only the React/Vite frontend:

npm run build
Build an unpacked Windows Electron app:

npm run electron:pack
Output:

release/win-unpacked/Ndewan Enterprises.exe
Build the full Windows installer:

npm run electron:build
Output:

release/Ndewan Enterprises Setup 1.0.0.exe
Electron Packaging Notes
The project uses electron-builder with this config:

electron/electron-builder.json
Important packaging settings:

asar is enabled.
better-sqlite3, bindings, and file-uri-to-path are unpacked from ASAR.
Windows target is NSIS.
signAndEditExecutable is disabled for unsigned local builds.
This setting avoids Windows symlink permission failures when electron-builder tries to download and extract winCodeSign:

"signAndEditExecutable": false
If you plan to distribute a signed production app, configure a real code-signing certificate and revisit this setting.

Available Scripts
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
Main Workflows
Admin
Admins can access:

Dashboard
Reports
Catalog
Low-stock alerts
Expenses
Audit log
Settings
Cashier
Cashiers can access:

Dashboard
Catalog
Service desk
Low-stock alerts
Troubleshooting
npm is not recognized
Install Node.js from the official Node.js website, then reopen the terminal and confirm:

node -v
npm -v
Electron opens a blank screen
Check that the Vite build exists:

npm run build
Also confirm vite.config.ts has:

base: "./"
This allows assets to load correctly from Electron's file:// production path.

better-sqlite3 native module errors
Rebuild native modules for Electron:

npx electron-rebuild -f -w better-sqlite3
Then rebuild the app:

npm run electron:build
A required privilege is not held by the client
This can happen when electron-builder extracts signing tools that contain symlinks. For unsigned local builds, keep this in electron/electron-builder.json:

"signAndEditExecutable": false
app.asar is missing from release/win-unpacked/resources
Run the unpacked package build again:

npm run electron:pack
After a successful build, release/win-unpacked/resources should contain:

app.asar
app.asar.unpacked/
Security Notes
The Electron renderer has nodeIntegration disabled.
contextIsolation is enabled.
IPC access is exposed through a preload whitelist.
Passwords are currently stored in plain text for local/demo usage.
Before production use, replace plain-text password storage with password hashing and consider adding role-based checks in the main process IPC handlers.

Backup
The app can export the SQLite database from the UI. In Electron mode, the backup copies the current database file to a selected destination.

In browser demo mode, backup exports a JSON snapshot from localStorage.

GitHub Notes
Recommended files to commit:

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
Recommended files to ignore:

node_modules/
dist/
release/
*.db
*.db-shm
*.db-wal
.env
License
Add your preferred license before publishing publicly. Common choices are MIT for open-source projects or a private/proprietary license for business software.
