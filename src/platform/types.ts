/**
 * Platform contract shared by the Electron preload bridge and the browser
 * adapter. The renderer never touches Node, the filesystem or a printer
 * directly: it talks to this interface only.
 */

export interface SaveFileRequest {
  suggestedName: string;
  bytes: Uint8Array;
  /** Serialised as a binary string over IPC; kept explicit for clarity. */
  mime?: string;
  filterName?: string;
  extensions?: string[];
}

export interface SaveFileResult {
  saved: boolean;
  path: string | null;
  message: string;
}

export interface OpenImageResult {
  dataUrl: string | null;
  fileName: string | null;
  cancelled: boolean;
  message?: string;
}

export interface PrintRequest {
  html: string;
  /** Optional printer name from settings. */
  printer?: string;
  landscape?: boolean;
  /** Optional explicit payload for a native silent path. */
  bytesBase64?: string;
}

export interface PrintResult {
  printed: boolean;
  message: string;
  printer?: string | null;
}

export interface PlatformInfo {
  kind: 'electron' | 'browser';
  platform: string;
  appVersion: string;
  electronVersion?: string;
  chromeVersion?: string;
  dataPath: string;
  printers: string[] | null;
  offline: boolean;
}

export interface FileDialogResult {
  path: string | null;
  cancelled: boolean;
}

export interface ShohanBridge {
  info(): Promise<PlatformInfo>;
  /** Read the SQLite database file (null when first run). */
  loadDatabase(): Promise<Uint8Array | null>;
  saveDatabase(bytes: Uint8Array): Promise<void>;
  /** Atomic write of an arbitrary file the operator chose a destination for. */
  saveFile(req: SaveFileRequest): Promise<SaveFileResult>;
  openImage(): Promise<OpenImageResult>;
  openBackupFile(): Promise<{ bytes: Uint8Array | null; fileName: string | null; cancelled: boolean }>;
  chooseDirectory(title: string): Promise<FileDialogResult>;
  chooseBackupPath(suggestedName: string, bytes: Uint8Array): Promise<SaveFileResult>;
  /** Native print of already-rendered HTML (Electron: hidden BrowserWindow + print). */
  print(req: PrintRequest): Promise<PrintResult>;
  openPrintPreview(html: string): Promise<{ ok: boolean; message: string }>;
  listPrinters(): Promise<string[]>;
  /** Reveal a saved file in the OS file manager (desktop only). */
  revealPath(path: string): Promise<void>;
  /** Save arbitrary text (used for HTML preview + logs export). */
  saveText(req: { suggestedName: string; text: string; extensions?: string[] }): Promise<SaveFileResult>;
  logError(payload: { scope: string; message: string; detail?: string }): Promise<void>;
  /** Desktop only: Chromium printToPDF with a native save dialog. */
  printToPdf?: (req: { html: string; suggestedName: string }) => Promise<SaveFileResult & { size?: number }>;
  appDataLocation(): Promise<string>;
}

declare global {
  interface Window {
    shohan?: ShohanBridge;
  }
}
