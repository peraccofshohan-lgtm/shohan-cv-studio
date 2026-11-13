/**
 * SHOHAN CV STUDIO — renderer entry point.
 * Fonts are bundled locally (no network requests at runtime).
 */
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
