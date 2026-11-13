/**
 * Post-build step: inject the production Content-Security-Policy into
 * dist/index.html. Done after bundling so the policy can be strict (no inline
 * scripts, no remote origins, no eval) without breaking the Vite dev server.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const file = join(root, 'dist', 'index.html');

const POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "media-src 'none'",
  "object-src 'none'",
  "frame-src 'self' data:",
  "base-uri 'self'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

let html = readFileSync(file, 'utf8');
const meta = `<meta http-equiv="Content-Security-Policy" content="${POLICY}" />`;
if (!html.includes('http-equiv="Content-Security-Policy"')) {
  html = html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    ${meta}`);
  writeFileSync(file, html, 'utf8');
  console.log('Injected production CSP into dist/index.html');
} else {
  console.log('CSP already present');
}
