const Database = require('better-sqlite3');
const path = require('path');

// Path to the database
const dbPath = 'C:/Users/chrid/AppData/Roaming/react-vite-tailwind/inventory.db';
const db = new Database(dbPath);

console.log('🌱 Starting database seeding at:', dbPath);

// Seed Products
const products = [
  // Stationery (20 items)
  ['Bic Pen Blue', 'Stationery', 15, 25, 100, 10, 500, 'BIC001', 'Shelf A1', 'ST-001', 'Blue ink'],
  ['Bic Pen Red', 'Stationery', 15, 25, 80, 10, 500, 'BIC002', 'Shelf A1', 'ST-002', 'Red ink'],
  ['A4 Exercise Book 200pg', 'Stationery', 45, 70, 50, 5, 200, 'EXB200', 'Shelf B2', 'ST-003', '200 pages'],
  ['A5 Notebook 120pg', 'Stationery', 30, 50, 40, 5, 150, 'NB120', 'Shelf B2', 'ST-004', '120 pages'],
  ['HB Pencil', 'Stationery', 10, 20, 200, 20, 1000, 'PEN001', 'Shelf A2', 'ST-005', 'Standard HB'],
  ['Eraser Large', 'Stationery', 5, 15, 150, 15, 500, 'ERA001', 'Shelf A3', 'ST-006', 'White large'],
  ['Ruler 30cm', 'Stationery', 20, 40, 60, 10, 200, 'RUL030', 'Shelf A4', 'ST-007', 'Plastic 30cm'],
  ['Sharpener Dual', 'Stationery', 15, 30, 70, 10, 200, 'SHA001', 'Shelf A3', 'ST-008', 'Two holes'],
  ['Stapler Medium', 'Stationery', 150, 250, 20, 3, 100, 'STA001', 'Shelf C1', 'ST-009', 'Standard size'],
  ['Staples No.10', 'Stationery', 50, 100, 40, 5, 200, 'STN10', 'Shelf C1', 'ST-010', 'Box of 1000'],
  ['Mathematical Set', 'Stationery', 180, 300, 15, 3, 50, 'MAT001', 'Shelf C2', 'ST-011', 'Complete set'],
  ['Glue Stick 20g', 'Stationery', 40, 80, 30, 5, 100, 'GLU020', 'Shelf A5', 'ST-012', '20g stick'],
  ['Crayons 12-pack', 'Stationery', 60, 120, 25, 5, 100, 'CRA012', 'Shelf D1', 'ST-013', '12 colors'],
  ['Watercolor Set', 'Stationery', 120, 200, 10, 2, 50, 'WAT012', 'Shelf D1', 'ST-014', '12 pans'],
  ['Paper Clips Box', 'Stationery', 30, 60, 50, 10, 200, 'CLP001', 'Shelf C3', 'ST-015', 'Standard size'],
  ['Clear Tape 18mm', 'Stationery', 25, 50, 40, 5, 150, 'TAP018', 'Shelf C3', 'ST-016', '18mm x 30m'],
  ['Correction Tape', 'Stationery', 80, 150, 15, 3, 100, 'COR001', 'Shelf A2', 'ST-017', '5mm x 6m'],
  ['Marker Black', 'Stationery', 35, 70, 50, 10, 200, 'MAR001', 'Shelf A6', 'ST-018', 'Permanent'],
  ['Highlighter Yellow', 'Stationery', 30, 60, 40, 5, 150, 'HIG001', 'Shelf A6', 'ST-019', 'Chisel tip'],
  ['File Folders 10pk', 'Stationery', 100, 200, 30, 5, 100, 'FIL010', 'Shelf E1', 'ST-020', 'Manila folders'],

  // Books (10 items)
  ['The Great Gatsby', 'Books', 450, 800, 5, 2, 20, 'BOK001', 'Aisle 1', 'BK-001', 'F. Scott Fitzgerald'],
  ['1984', 'Books', 500, 850, 8, 2, 25, 'BOK002', 'Aisle 1', 'BK-002', 'George Orwell'],
  ['To Kill a Mockingbird', 'Books', 480, 820, 6, 2, 20, 'BOK003', 'Aisle 1', 'BK-003', 'Harper Lee'],
  ['The Alchemist', 'Books', 400, 700, 10, 3, 30, 'BOK004', 'Aisle 2', 'BK-004', 'Paulo Coelho'],
  ['Atomic Habits', 'Books', 650, 1200, 15, 5, 50, 'BOK005', 'Aisle 3', 'BK-005', 'James Clear'],
  ['Thinking Fast and Slow', 'Books', 700, 1300, 4, 2, 20, 'BOK006', 'Aisle 3', 'BK-006', 'Daniel Kahneman'],
  ['Sapiens', 'Books', 750, 1400, 7, 2, 25, 'BOK007', 'Aisle 2', 'BK-007', 'Yuval Noah Harari'],
  ['Rich Dad Poor Dad', 'Books', 450, 850, 12, 4, 40, 'BOK008', 'Aisle 3', 'BK-008', 'Robert Kiyosaki'],
  ['The Power of Habit', 'Books', 550, 950, 6, 2, 20, 'BOK009', 'Aisle 3', 'BK-009', 'Charles Duhigg'],
  ['Principles', 'Books', 850, 1600, 3, 1, 15, 'BOK010', 'Aisle 3', 'BK-010', 'Ray Dalio'],

  // Printing Supplies
  ['A4 Paper Ream', 'Supplies', 450, 650, 40, 10, 200, 'SUP001', 'Stock Room', 'SP-001', '80gsm'],
  ['A3 Paper Ream', 'Supplies', 900, 1300, 10, 2, 50, 'SUP002', 'Stock Room', 'SP-002', '80gsm'],
  ['Toner Cartridge Black', 'Supplies', 2500, 4500, 5, 1, 20, 'SUP003', 'Stock Room', 'SP-003', 'HP 85A'],
  ['Ink Bottle Cyan', 'Supplies', 400, 800, 12, 2, 40, 'SUP004', 'Stock Room', 'SP-004', 'Epson T664']
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products 
  (name, category, buying_price, price, quantity, low_stock_threshold, max_stock_threshold, barcode, location, sku, description, created_at, updated_at) 
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const insertUser = db.prepare(`
  INSERT OR IGNORE INTO users 
  (username, full_name, role, password, created_at) 
  VALUES (?, ?, ?, ?, datetime('now'))
`);

db.transaction(() => {
  for (const p of products) {
    insertProduct.run(...p);
  }
  insertUser.run('cashier', 'Main Cashier', 'cashier', '1234');
})();

console.log('✅ Seeding complete! Added products and cashier account.');
db.close();
