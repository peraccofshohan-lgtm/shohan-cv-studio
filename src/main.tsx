/**
 * SHOHAN CV STUDIO — renderer entry point.
 * Fonts are bundled locally (no network requests at runtime).
 */
/**
 * CSP hardening.
 *
 * The DOCX dependency bundles a `setImmediate` polyfill whose fallback path
 * compiles a string with `new Function`. The production CSP (correctly) forbids
 * that, so we install a plain `setTimeout`-based implementation BEFORE the
 * bundle is evaluated. Electron/Chromium 108 already provide setImmediate in the
 * renderer, but the polyfill can still install itself, so this guard is cheap
 * insurance against a runtime CSP violation while exporting a CV.
 */
type TimerApi = typeof globalThis & {
  setImmediate?: (cb: (...args: unknown[]) => void, ...args: unknown[]) => number;
  clearImmediate?: (handle: number) => void;
};
const timerApi = globalThis as TimerApi;
if (typeof timerApi.setImmediate !== 'function') {
  timerApi.setImmediate = ((cb: (...args: unknown[]) => void, ...args: unknown[]) =>
    setTimeout(() => cb(...args), 0) as unknown as number) as TimerApi['setImmediate'];
}
if (typeof timerApi.clearImmediate !== 'function') {
  timerApi.clearImmediate = ((handle: number) => clearTimeout(handle as unknown as ReturnType<typeof setTimeout>)) as TimerApi['clearImmediate'];
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/lora/400.css';
import '@fontsource/lora/600.css';
import '@fontsource/lora/700.css';
import '@fontsource/noto-sans-bengali/400.css';
import '@fontsource/noto-sans-bengali/600.css';
import '@fontsource/noto-sans-bengali/700.css';
import '@fontsource/noto-serif-bengali/400.css';
import '@fontsource/noto-serif-bengali/700.css';
import './styles/tokens.css';
import './styles/app.css';
import { AppShell } from './app/AppShell';
import { ToastHost } from './components/ui';
import { useWorkspace } from './store/workspace';

const root = createRoot(document.getElementById('root')!);

function Bootstrap() {
  const boot = useWorkspace((s) => s.boot);
  React.useEffect(() => {
    void boot();
  }, [boot]);
  return (
    <>
      <AppShell />
      <ToastHost />
    </>
  );
}

root.render(
  <React.StrictMode>
    <Bootstrap />
  </React.StrictMode>,
);
