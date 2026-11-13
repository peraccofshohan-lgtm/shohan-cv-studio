/**
 * Restricted preload bridge. Only the channels listed here are exposed to the
 * renderer — there is no access to `require`, `fs`, `process` or arbitrary IPC.
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

const invoke = (channel, payload) => ipcRenderer.invoke(channel, payload);

contextBridge.exposeInMainWorld('shohan', {
  info: () => invoke('platform:info'),
  loadDatabase: () => invoke('db:load'),
  saveDatabase: (bytes) => invoke('db:save', bytes),
  saveFile: (req) => invoke('file:save', req),
  saveText: (req) => invoke('file:saveText', req),
  openImage: () => invoke('dialog:image'),
  openBackupFile: () => invoke('dialog:backupOpen'),
  chooseBackupPath: (suggestedName, bytes) => invoke('dialog:backupSave', { suggestedName, bytes }),
  chooseDirectory: (title) => invoke('dialog:directory', title),
  print: (req) => invoke('print:run', req),
  printToPdf: (req) => invoke('print:pdf', req),
  openPrintPreview: (html) => invoke('print:preview', html),
  /** Desktop-only extra channels (absent from the browser contract's public type). */
  exportPdf: (req) => invoke('print:pdf', req),
  listPrinters: () => invoke('print:list'),
  revealPath: (target) => invoke('shell:reveal', target),
  logError: (payload) => invoke('log:error', payload),
  appDataLocation: () => invoke('app:dataPath'),
  defaultPaths: () => invoke('app:defaultPaths'),
  onMenuAction: (handler) => {
    const listener = (_event, action) => handler(action);
    ipcRenderer.on('menu:action', listener);
    return () => ipcRenderer.removeListener('menu:action', listener);
  },
});
