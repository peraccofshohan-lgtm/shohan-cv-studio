/**
 * Browser / preview adapter.
 *
 * Provides the full platform contract using standard web APIs:
 *  - SQLite bytes persisted in IndexedDB
 *  - downloads via Blob + <a download>
 *  - file picking via <input type="file">
 *  - printing via a dedicated print iframe (real browser print dialog)
 *
 * This makes the product genuinely usable (and testable end-to-end) in a
 * browser preview, while the Electron adapter uses native dialogs and the OS
 * spooler on Windows.
 */
import type {
  FileDialogResult,
  OpenImageResult,
  PlatformInfo,
  PrintResult,
  SaveFileRequest,
  SaveFileResult,
  ShohanBridge,
} from './types';
import { APP_VERSION } from '@/lib/appMeta';

const DB_NAME = 'shohan-cv-studio';
const STORE = 'kv';
const DB_KEY = 'database.sqlite';

function openIdb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(key);
    req.onsuccess = () => resolve((req.result ?? null) as T | null);
    req.onerror = () => reject(req.error);
  });
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await openIdb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

function download(bytes: Uint8Array | string, fileName: string, mime: string): void {
  const blob =
    typeof bytes === 'string'
      ? new Blob([bytes], { type: mime })
      : new Blob([bytes.slice().buffer as ArrayBuffer], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

function pickFile(accept: string): Promise<File | null> {
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = accept;
    input.style.position = 'fixed';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    let settled = false;
    const finish = (file: File | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(file);
    };
    input.addEventListener('change', () => finish(input.files?.[0] ?? null));
    // Chrome fires focus back on window when the dialog is dismissed; a short
    // delay lets the change event win the race.
    window.addEventListener(
      'focus',
      () => setTimeout(() => finish(input.files?.[0] ?? null), 700),
      { once: true },
    );
    document.body.appendChild(input);
    input.click();
  });
}

async function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function createBrowserBridge(): ShohanBridge {
  const bridge: ShohanBridge = {
    async info(): Promise<PlatformInfo> {
      return {
        kind: 'browser',
        platform: navigator.platform || 'web',
        appVersion: APP_VERSION,
        dataPath: 'Browser storage (IndexedDB)',
        printers: null,
        offline: navigator.onLine === false,
      };
    },
    async loadDatabase() {
      const stored = await idbGet<ArrayBuffer | Uint8Array>(DB_KEY);
      if (!stored) return null;
      return stored instanceof Uint8Array ? stored : new Uint8Array(stored);
    },
    async saveDatabase(bytes) {
      // Copy into a plain ArrayBuffer so IndexedDB can structured-clone it.
      await idbSet(DB_KEY, bytes.slice().buffer);
    },
    async saveFile(req: SaveFileRequest): Promise<SaveFileResult> {
      download(req.bytes, req.suggestedName, req.mime ?? 'application/octet-stream');
      return { saved: true, path: req.suggestedName, message: 'Downloaded' };
    },
    async saveText({ suggestedName, text }) {
      download(text, suggestedName, 'text/plain;charset=utf-8');
      return { saved: true, path: suggestedName, message: 'Downloaded' };
    },
    async openImage(): Promise<OpenImageResult> {
      const file = await pickFile('image/png,image/jpeg');
      if (!file) return { dataUrl: null, fileName: null, cancelled: true };
      if (!/^image\/(png|jpeg)$/.test(file.type)) {
        return { dataUrl: null, fileName: file.name, cancelled: false, message: 'UNSUPPORTED_FORMAT' };
      }
      if (file.size > 12 * 1024 * 1024) {
        return { dataUrl: null, fileName: file.name, cancelled: false, message: 'FILE_TOO_LARGE' };
      }
      return { dataUrl: await fileToDataUrl(file), fileName: file.name, cancelled: false };
    },
    async openBackupFile() {
      const file = await pickFile('.scvbackup,.zip,application/zip');
      if (!file) return { bytes: null, fileName: null, cancelled: true };
      const buf = new Uint8Array(await file.arrayBuffer());
      return { bytes: buf, fileName: file.name, cancelled: false };
    },
    async chooseDirectory(): Promise<FileDialogResult> {
      // Browsers cannot hand out real directory paths; the download folder is
      // used instead. The UI states this explicitly in browser mode.
      return { path: null, cancelled: true };
    },
    async chooseBackupPath(suggestedName, bytes) {
      download(bytes, suggestedName, 'application/zip');
      return { saved: true, path: suggestedName, message: 'Downloaded' };
    },
    async print({ html }): Promise<PrintResult> {
      const frame = document.createElement('iframe');
      frame.setAttribute('aria-hidden', 'true');
      frame.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';
      document.body.appendChild(frame);
      const doc = frame.contentDocument;
      if (!doc) return { printed: false, message: 'PRINT_FRAME_FAILED' };
      doc.open();
      doc.write(html);
      doc.close();
      await new Promise((r) => setTimeout(r, 350));
      try {
        frame.contentWindow?.focus();
        frame.contentWindow?.print();
        setTimeout(() => frame.remove(), 2000);
        return { printed: true, message: 'PRINT_DIALOG_OPENED' };
      } catch (err) {
        frame.remove();
        return { printed: false, message: (err as Error).message };
      }
    },
    async openPrintPreview(html) {
      const w = window.open('', '_blank');
      if (!w) return { ok: false, message: 'POPUP_BLOCKED' };
      w.document.open();
      w.document.write(html);
      w.document.close();
      return { ok: true, message: 'opened' };
    },
    async listPrinters() {
      return [];
    },
    async revealPath() {
      /* not available in browser */
    },
    async logError(payload) {
      // eslint-disable-next-line no-console
      console.warn(`[${payload.scope}] ${payload.message}`, payload.detail ?? '');
    },
    async appDataLocation() {
      return 'Browser storage (IndexedDB)';
    },
  };
  return bridge;
}
