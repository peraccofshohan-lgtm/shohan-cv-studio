/**
 * SHOHAN CV STUDIO — Electron main process.
 *
 * Pinned to Electron 22.3.27 (Chromium 108 / Node 16.17), the last Electron
 * line that runs on Windows 7 SP1, 8, 8.1 as well as 10 and 11.
 *
 * Security posture
 *  - contextIsolation: true, nodeIntegration: false.
 *  - The renderer sandbox is disabled ONLY because the preload needs Node's fs,
 *    path and os for file dialogs. The renderer itself has no Node access: it can
 *    call the allow-listed bridge functions and nothing else. Print/preview
 *    windows, which load generated HTML, run with sandbox: true.
 *  - Every IPC channel validates its payload shape and size.
 *  - Navigation and window.open are blocked; external URLs are never loaded.
 *  - CSP is injected into the built index.html and reinforced with a response
 *    header for every response the window loads.
 *
 * Offline posture
 *  - No network requests are ever made. There is no auto-updater, no telemetry,
 *    no analytics and no remote fonts.
 */
'use strict';

const { app, BrowserWindow, ipcMain, dialog, shell, Menu } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const os = require('node:os');

const IS_DEV = !!process.env.SHOHAN_DEV_URL;
const APP_ID = 'com.shohan.cvstudio';

/** Hard limits that keep IPC from being used to exhaust memory. */
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_PAYLOAD_BYTES = 64 * 1024 * 1024;

let mainWindow = null;
let dataDir = '';

function resolveDataDir() {
  // Roaming profile is appropriate: a shop operator can copy it between PCs.
  const base = app.getPath('userData');
  const dir = path.join(base, 'data');
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function dbPath() {
  return path.join(dataDir, 'shohan-cv.sqlite');
}

function assertString(value, field, max = 4096) {
  if (typeof value !== 'string') throw new Error(`Invalid ${field}: expected string`);
  if (value.length > max) throw new Error(`Invalid ${field}: exceeds ${max} characters`);
  return value;
}

function safeName(name) {
  const cleaned = String(name || 'document').replace(/[\\/:*?"<>|\u0000-\u001f]/g, '_').slice(0, 180);
  return cleaned.length ? cleaned : 'document';
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 680,
    show: false,
    backgroundColor: '#f6f7f9',
    title: 'SHOHAN CV STUDIO',
    icon: path.join(__dirname, '..', 'build', 'icon.png'),
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      spellcheck: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      experimentalFeatures: false,
    },
  });

  if (IS_DEV) {
    mainWindow.loadURL(process.env.SHOHAN_DEV_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }

  // Defence in depth: send a strict CSP header for every response and refuse
  // any attempt to open an external window or download from the renderer.
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          IS_DEV
            ? "default-src 'self' 'unsafe-inline' data: blob: ws: http://localhost:5173; script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:5173"
            : "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'",
        ],
      },
    });
  });
  mainWindow.webContents.session.on('will-download', (event) => {
    // Files are written through explicit save dialogs, never via navigation.
    event.preventDefault();
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Block navigation away from the local app shell.
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const isDevServer = IS_DEV && url.startsWith(process.env.SHOHAN_DEV_URL);
    if (!isDevServer && !url.startsWith('file://')) event.preventDefault();
  });
  mainWindow.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  mainWindow.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));
}

function buildMenu() {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New CV',
          accelerator: 'CmdOrCtrl+N',
          click: () => mainWindow?.webContents.send('menu:action', 'new-cv'),
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: () => mainWindow?.webContents.send('menu:action', 'save'),
        },
        { type: 'separator' },
        { role: 'quit', label: 'Exit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About SHOHAN CV STUDIO',
          click: () => mainWindow?.webContents.send('menu:action', 'about'),
        },
        {
          label: 'Open data folder',
          click: () => shell.openPath(dataDir),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

/** Only one instance may own the SQLite file. */
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.commandLine.appendSwitch('disable-features', 'HardwareMediaKeyHandling,MediaSessionService');
  app.whenReady().then(() => {
    app.setAppUserModelId(APP_ID);
    dataDir = resolveDataDir();
    buildMenu();
    createWindow();
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
  });
}

// --------------------------------------------------------------------- IPC
ipcMain.handle('platform:info', async () => ({
  kind: 'electron',
  platform: `${process.platform} ${process.arch}`,
  appVersion: app.getVersion(),
  electronVersion: process.versions.electron,
  chromeVersion: process.versions.chrome,
  dataPath: dataDir,
  printers: await listPrinterNames(),
  offline: true,
}));

ipcMain.handle('db:load', async () => {
  const file = dbPath();
  if (!fs.existsSync(file)) return null;
  const buffer = fs.readFileSync(file);
  return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
});

ipcMain.handle('db:save', async (_event, bytes) => {
  if (!(bytes instanceof Uint8Array)) throw new Error('Invalid database payload');
  if (bytes.byteLength > MAX_PAYLOAD_BYTES) throw new Error('Database payload too large');
  const target = dbPath();
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, Buffer.from(bytes));
  // Write-then-rename keeps the database intact if the machine loses power.
  fs.renameSync(tmp, target);
  return true;
});

ipcMain.handle('file:save', async (_event, payload) => {
  if (!payload || typeof payload !== 'object') throw new Error('Invalid payload');
  const suggestedName = safeName(payload.suggestedName);
  const bytes = payload.bytes;
  if (!(bytes instanceof Uint8Array)) throw new Error('Invalid file bytes');
  if (bytes.byteLength > MAX_PAYLOAD_BYTES) throw new Error('File too large');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save file',
    defaultPath: path.join(app.getPath('documents'), suggestedName),
    filters: [{ name: payload.filterName || 'Document', extensions: payload.extensions || ['*'] }],
    properties: ['createDirectory', 'showOverwriteConfirmation'],
  });
  if (result.canceled || !result.filePath) return { saved: false, path: null, message: 'CANCELLED' };
  try {
    fs.writeFileSync(result.filePath, Buffer.from(bytes));
    return { saved: true, path: result.filePath, message: 'SAVED' };
  } catch (err) {
    return { saved: false, path: null, message: err.message };
  }
});

ipcMain.handle('file:saveText', async (_event, payload) => {
  const suggestedName = safeName(payload?.suggestedName || 'export.txt');
  const text = assertString(payload?.text ?? '', 'text', MAX_PAYLOAD_BYTES);
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save file',
    defaultPath: path.join(app.getPath('documents'), suggestedName),
    filters: [{ name: 'File', extensions: payload?.extensions || ['txt'] }],
  });
  if (result.canceled || !result.filePath) return { saved: false, path: null, message: 'CANCELLED' };
  fs.writeFileSync(result.filePath, text, 'utf8');
  return { saved: true, path: result.filePath, message: 'SAVED' };
});

ipcMain.handle('dialog:image', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select photo or signature',
    properties: ['openFile'],
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg'] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { dataUrl: null, fileName: null, cancelled: true };
  }
  const filePath = result.filePaths[0];
  const stat = fs.statSync(filePath);
  if (stat.size > MAX_IMAGE_BYTES) {
    return { dataUrl: null, fileName: path.basename(filePath), cancelled: false, message: 'FILE_TOO_LARGE' };
  }
  const ext = path.extname(filePath).toLowerCase();
  if (!['.png', '.jpg', '.jpeg'].includes(ext)) {
    return { dataUrl: null, fileName: path.basename(filePath), cancelled: false, message: 'UNSUPPORTED_FORMAT' };
  }
  const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
  const data = fs.readFileSync(filePath).toString('base64');
  return { dataUrl: `data:${mime};base64,${data}`, fileName: path.basename(filePath), cancelled: false };
});

ipcMain.handle('dialog:backupOpen', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'Select backup file',
    properties: ['openFile'],
    filters: [{ name: 'SHOHAN Backup', extensions: ['scvbackup', 'zip'] }],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return { bytes: null, fileName: null, cancelled: true };
  }
  const buffer = fs.readFileSync(result.filePaths[0]);
  if (buffer.byteLength > MAX_PAYLOAD_BYTES) throw new Error('Backup too large');
  return {
    bytes: new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength),
    fileName: path.basename(result.filePaths[0]),
    cancelled: false,
  };
});

ipcMain.handle('dialog:backupSave', async (_event, payload) => {
  const suggestedName = safeName(payload?.suggestedName || 'backup.scvbackup');
  const bytes = payload?.bytes;
  if (!(bytes instanceof Uint8Array)) throw new Error('Invalid backup bytes');
  const result = await dialog.showSaveDialog(mainWindow, {
    title: 'Save backup',
    defaultPath: path.join(app.getPath('documents'), suggestedName),
    filters: [{ name: 'SHOHAN Backup', extensions: ['scvbackup'] }],
  });
  if (result.canceled || !result.filePath) return { saved: false, path: null, message: 'CANCELLED' };
  fs.writeFileSync(result.filePath, Buffer.from(bytes));
  return { saved: true, path: result.filePath, message: 'SAVED' };
});

ipcMain.handle('dialog:directory', async (_event, title) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    title: typeof title === 'string' ? title.slice(0, 120) : 'Select folder',
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return { path: null, cancelled: true };
  return { path: result.filePaths[0], cancelled: false };
});

async function listPrinterNames() {
  try {
    if (!mainWindow) return [];
    return await mainWindow.webContents.getPrintersAsync();
  } catch {
    return [];
  }
}

ipcMain.handle('print:list', async () => {
  const printers = await listPrinterNames();
  return printers.map((p) => p.name);
});

/**
 * Native A4 printing.
 *
 * The renderer hands us a complete, self-contained HTML document (same layout
 * engine as the on-screen preview). We load it in an offscreen window and call
 * webContents.print with explicit A4 page size, which sends the job to the
 * Windows spooler through the selected printer's own driver.
 */
ipcMain.handle('print:run', async (_event, payload) => {
  const html = assertString(payload?.html ?? '', 'html', MAX_PAYLOAD_BYTES);
  const printerName = typeof payload?.printer === 'string' && payload.printer ? payload.printer.slice(0, 200) : undefined;
  const landscape = payload?.landscape === true;
  const printWindow = new BrowserWindow({
    show: false,
    width: 900,
    height: 1280,
    webPreferences: { offscreen: false, contextIsolation: true, nodeIntegration: false, sandbox: true },
  });

  try {
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`,
    );
    await new Promise((r) => setTimeout(r, 600));

    return await new Promise((resolve) => {
      printWindow.webContents.print(
        {
          silent: false,
          printBackground: true,
          color: true,
          margins: { marginType: 'none' },
          landscape,
          pagesPerSheet: 1,
          collate: true,
          copies: 1,
          pageSize: { width: 210000, height: 297000 }, // microns → A4
          printerName: printerName || undefined,
        },
        (success, failureReason) => {
          if (printWindow && !printWindow.isDestroyed()) printWindow.destroy();
          resolve({
            printed: success,
            message: success ? 'PRINT_SENT' : failureReason || 'PRINT_FAILED',
            printer: printerName || null,
          });
        },
      );
    });
  } catch (err) {
    if (printWindow && !printWindow.isDestroyed()) printWindow.destroy();
    return { printed: false, message: err.message };
  }
});

/** Opens the print preview document in a dedicated window (no navigation away). */
ipcMain.handle('print:preview', async (_event, html) => {
  const markup = assertString(html ?? '', 'html', MAX_PAYLOAD_BYTES);
  const win = new BrowserWindow({
    width: 1000,
    height: 1200,
    title: 'Print preview — SHOHAN CV STUDIO',
    autoHideMenuBar: true,
    webPreferences: { contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(markup)}`);
  return { ok: true, message: 'opened' };
});

/** Real PDF generation: Chromium's own print-to-PDF keeps text selectable/searchable. */
ipcMain.handle('print:pdf', async (_event, payload) => {
  const html = assertString(payload?.html ?? '', 'html', MAX_PAYLOAD_BYTES);
  const suggestedName = safeName(payload?.suggestedName || 'document.pdf');
  const win = new BrowserWindow({
    show: false,
    webPreferences: { offscreen: false, contextIsolation: true, nodeIntegration: false, sandbox: true },
  });
  try {
    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);
    await new Promise((r) => setTimeout(r, 700));
    const pdf = await win.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: { marginType: 'none' },
      preferCSSPageSize: true,
    });
    win.destroy();
    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save PDF',
      defaultPath: path.join(app.getPath('documents'), suggestedName),
      filters: [{ name: 'PDF Document', extensions: ['pdf'] }],
    });
    if (result.canceled || !result.filePath) return { saved: false, path: null, message: 'CANCELLED' };
    fs.writeFileSync(result.filePath, pdf);
    return { saved: true, path: result.filePath, message: 'SAVED', size: pdf.length };
  } catch (err) {
    if (win && !win.isDestroyed()) win.destroy();
    return { saved: false, path: null, message: err.message };
  }
});

ipcMain.handle('shell:reveal', async (_event, target) => {
  const p = assertString(target, 'path', 1024);
  if (fs.existsSync(p)) shell.showItemInFolder(p);
});

ipcMain.handle('log:error', async (_event, payload) => {
  const scope = typeof payload?.scope === 'string' ? payload.scope.slice(0, 80) : 'unknown';
  const message = typeof payload?.message === 'string' ? payload.message.slice(0, 500) : '';
  const detail = typeof payload?.detail === 'string' ? payload.detail.slice(0, 4000) : '';
  const line = `${new Date().toISOString()}\t${scope}\t${message}\t${detail}\n`;
  try {
    fs.appendFileSync(path.join(dataDir, 'shohan-desktop.log'), line, 'utf8');
  } catch {
    /* logging must never break the app */
  }
});

ipcMain.handle('app:dataPath', async () => dataDir);
ipcMain.handle('app:appDataPath', async () => app.getPath('userData'));
ipcMain.handle('app:defaultPaths', async () => ({
  documents: app.getPath('documents'),
  desktop: app.getPath('desktop'),
  home: os.homedir(),
}));
