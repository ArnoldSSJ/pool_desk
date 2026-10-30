const { app, BrowserWindow, Menu, ipcMain, shell } = require('electron');
const fs = require('node:fs');
const path = require('node:path');
const initSqlJs = require('sql.js');

let sqlite;
let databasePath;

function createSchema() {
  sqlite.run(`
    PRAGMA journal_mode = DELETE;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS app_state (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      state_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS branches (
      name TEXT PRIMARY KEY,
      hourly_rate REAL NOT NULL,
      custom_types_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      branch TEXT NOT NULL,
      active INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS billiard_tables (
      id TEXT PRIMARY KEY,
      branch TEXT NOT NULL,
      table_number INTEGER NOT NULL,
      table_type TEXT NOT NULL,
      status TEXT NOT NULL,
      session_json TEXT,
      UNIQUE(branch, table_number)
    );
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      branch TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL,
      stock INTEGER NOT NULL,
      unit TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cash_sessions (
      branch TEXT PRIMARY KEY,
      open_session_json TEXT,
      last_close_json TEXT
    );
    CREATE TABLE IF NOT EXISTS sales (
      id TEXT PRIMARY KEY,
      branch TEXT NOT NULL,
      kind TEXT NOT NULL,
      sale_date TEXT NOT NULL,
      table_number INTEGER,
      total REAL NOT NULL,
      voided INTEGER NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS inventory_movements (
      id TEXT PRIMARY KEY,
      branch TEXT NOT NULL,
      product_id TEXT,
      movement_date TEXT NOT NULL,
      action TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      branch TEXT NOT NULL,
      action_date TEXT NOT NULL,
      username TEXT NOT NULL,
      action TEXT NOT NULL,
      record_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL
    );
  `);
}

function queryState() {
  const result = sqlite.exec('SELECT state_json FROM app_state WHERE singleton = 1');
  if (!result.length || !result[0].values.length) return null;
  return JSON.parse(result[0].values[0][0]);
}

function saveState(state) {
  sqlite.run('BEGIN IMMEDIATE');
  try {
    for (const table of ['branches', 'users', 'billiard_tables', 'products', 'cash_sessions', 'sales', 'inventory_movements', 'audit_log', 'settings', 'app_state']) {
      sqlite.run(`DELETE FROM ${table}`);
    }
    const branchStmt = sqlite.prepare('INSERT INTO branches(name, hourly_rate, custom_types_json) VALUES (?, ?, ?)');
    const tableStmt = sqlite.prepare('INSERT INTO billiard_tables(id, branch, table_number, table_type, status, session_json) VALUES (?, ?, ?, ?, ?, ?)');
    const userStmt = sqlite.prepare('INSERT INTO users(id, username, name, role, branch, active, record_json) VALUES (?, ?, ?, ?, ?, ?, ?)');
    const productStmt = sqlite.prepare('INSERT INTO products(id, branch, name, category, price, stock, unit, record_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const cashStmt = sqlite.prepare('INSERT INTO cash_sessions(branch, open_session_json, last_close_json) VALUES (?, ?, ?)');
    const saleStmt = sqlite.prepare('INSERT INTO sales(id, branch, kind, sale_date, table_number, total, voided, record_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    const movementStmt = sqlite.prepare('INSERT INTO inventory_movements(id, branch, product_id, movement_date, action, record_json) VALUES (?, ?, ?, ?, ?, ?)');
    const auditStmt = sqlite.prepare('INSERT INTO audit_log(id, branch, action_date, username, action, record_json) VALUES (?, ?, ?, ?, ?, ?)');
    const settingStmt = sqlite.prepare('INSERT INTO settings(key, value_json) VALUES (?, ?)');
    const use = (stmt, params) => { stmt.run(params); stmt.reset(); };
    for (const [branch, record] of Object.entries(state.branches || {})) {
      use(branchStmt, [branch, Number(record.hourly) || 0, JSON.stringify(record.customTypes || [])]);
      for (const table of record.tables || []) use(tableStmt, [table.id, branch, Number(table.number), table.type || '', table.state || 'free', table.session ? JSON.stringify(table.session) : null]);
      for (const product of (state.products && state.products[branch]) || []) use(productStmt, [product.id, branch, product.name, product.category || '', Number(product.price) || 0, Number(product.stock) || 0, product.unit || 'unidades', JSON.stringify(product)]);
      const open = (state.cash || {})[branch] || null;
      const close = (state.lastClose || {})[branch] || null;
      use(cashStmt, [branch, open ? JSON.stringify(open) : null, close ? JSON.stringify(close) : null]);
    }
    for (const user of state.users || []) use(userStmt, [user.id, user.username, user.name, user.role, user.branch, user.active ? 1 : 0, JSON.stringify(user)]);
    for (const sale of state.sales || []) {
      const tableNumber = Number(sale.tableNumber) || Number((sale.description || '').match(/Mesa\s+(\d+)/i)?.[1]) || null;
      use(saleStmt, [sale.id, sale.branch, sale.kind, sale.date, tableNumber, Number(sale.total) || 0, sale.voided ? 1 : 0, JSON.stringify(sale)]);
      if (sale.kind === 'product' || sale.kind === 'table') for (const [index, item] of (sale.items || []).entries()) use(movementStmt, [`${sale.id}:${index}`, sale.branch, item.productId || null, sale.date, sale.prepayment ? 'prepago' : 'venta', JSON.stringify({ saleId: sale.id, item, user: sale.user, sessionId: sale.sessionId || null })]);
    }
    for (const entry of state.audit || []) use(auditStmt, [entry.id, entry.branch || '', entry.date, entry.user || '', entry.action || '', JSON.stringify(entry)]);
    use(settingStmt, ['settings', JSON.stringify(state.settings || {})]);
    use(settingStmt, ['activeBranch', JSON.stringify(state.activeBranch || '')]);
    use(settingStmt, ['sessionUser', JSON.stringify(state.sessionUser || null)]);
    use(settingStmt, ['lastClose', JSON.stringify(state.lastClose || {})]);
    sqlite.run('INSERT INTO app_state(singleton, state_json, updated_at) VALUES (1, ?, ?)', [JSON.stringify(state), new Date().toISOString()]);
    for (const stmt of [branchStmt, tableStmt, userStmt, productStmt, cashStmt, saleStmt, movementStmt, auditStmt, settingStmt]) stmt.free();
    sqlite.run('COMMIT');
    fs.writeFileSync(databasePath, Buffer.from(sqlite.export()));
    return true;
  } catch (error) {
    try { sqlite.run('ROLLBACK'); } catch {}
    throw error;
  }
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#f3f5f1',
    title: 'PoolDesk BETA 1.10',
    icon: path.join(__dirname, 'app', 'assets', 'icons', 'pooldesk.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });
  window.once('ready-to-show', () => window.show());
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://')) shell.openExternal(url);
    return { action: 'deny' };
  });
  window.loadFile(path.join(__dirname, 'app', 'index.html'));
}

app.whenReady().then(async () => {
  app.setPath('userData', path.join(app.getPath('appData'), 'PoolDesk'));
  const SQL = await initSqlJs({ locateFile: file => path.join(__dirname, 'node_modules', 'sql.js', 'dist', file) });
  databasePath = path.join(app.getPath('userData'), 'pooldesk.sqlite');
  sqlite = fs.existsSync(databasePath) ? new SQL.Database(new Uint8Array(fs.readFileSync(databasePath))) : new SQL.Database();
  createSchema();
  if (!fs.existsSync(databasePath)) fs.writeFileSync(databasePath, Buffer.from(sqlite.export()));
  ipcMain.handle('pooldesk:load-state', () => queryState());
  ipcMain.handle('pooldesk:save-state', (_event, state) => saveState(state));
  ipcMain.handle('pooldesk:printers', async event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return [];
    const printers = await window.webContents.getPrintersAsync();
    return printers.map(({ name, displayName, isDefault, status }) => ({ name, displayName, isDefault, status }));
  });
  ipcMain.handle('pooldesk:print', (event, requestedSize = {}) => new Promise(resolve => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window) return resolve({ success: false, failureReason: 'Ventana de impresión no disponible' });
    const pageSize = { width: 80000, height: Math.max(4000, Math.min(500000, Math.round(Number(requestedSize.height) || 60000))) };
    const printerName = typeof requestedSize.printerName === 'string' ? requestedSize.printerName.trim() : '';
    const options = { silent: Boolean(printerName), printBackground: true, margins: { marginType: 'none' }, pageSize };
    if (printerName) options.deviceName = printerName;
    window.webContents.print(options, (success, failureReason) => {
      resolve({ success, failureReason: failureReason || '' });
    });
  }));
  Menu.setApplicationMenu(null);
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
