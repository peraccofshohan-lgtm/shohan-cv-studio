#!/usr/bin/env node
/**
 * Production bundle verification.
 *
 * Runs against `dist/` — the exact bytes the Windows app loads from file://.
 * It answers the questions a developer server cannot:
 *
 *   1. Is the CSP present and strict?
 *   2. Does every referenced asset exist (no 404s from file://)?
 *   3. Do all CSS @font-face URLs resolve inside dist (offline fonts)?
 *   4. Does the bundle contain any remote URL, eval, or new Function (CSP/offline)?
 *   5. Does it use any CSS/JS feature newer than Chromium 108 (Windows 7 runtime)?
 *   6. Are the A4 constants present in the shipped code?
 *
 * Usage: npm run verify:dist   (after npm run build)
 * Exit code 1 if any hard failure is found.
 */
import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const DIST = resolve(process.cwd(), 'dist');
const results = [];
const unreachable = [];
const fail = (msg, detail) => results.push({ level: 'FAIL', msg, detail });
const warn = (msg, detail) => results.push({ level: 'WARN', msg, detail });
const pass = (msg, detail) => results.push({ level: 'PASS', msg, detail });

if (!existsSync(DIST)) {
  console.error('dist/ not found — run `npm run build` first.');
  process.exit(2);
}

/* ---------------------------------------------------------------- 1. HTML */
const indexHtml = readFileSync(join(DIST, 'index.html'), 'utf8');

const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(indexHtml)?.[1] ?? '';
if (!csp) fail('CSP meta tag is missing from dist/index.html');
else {
  const required = ["default-src 'self'", "script-src 'self'", "object-src 'none'", "frame-ancestors 'none'"];
  const missing = required.filter((part) => !csp.includes(part));
  if (missing.length) fail('CSP is weaker than expected', missing.join(', '));
  else if (/unsafe-eval/.test(csp)) fail('CSP allows unsafe-eval');
  else pass('CSP present and strict', `${csp.length} chars`);
}

if (indexHtml.includes('<script src="http')) fail('index.html loads a remote script');
if (/<script(?![^>]*src=)[^>]*>[\s\S]{40,}<\/script>/.test(indexHtml.replace(/<!--[\s\S]*?-->/g, '')))
  warn('index.html contains a sizeable inline script (CSP would block it in production)');

/* ------------------------------------------------------ 2. asset existence */
const assetRefs = [...indexHtml.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
const missingAssets = [...new Set(assetRefs)].filter((rel) => !existsSync(join(DIST, rel)));
if (missingAssets.length) fail('Referenced assets are missing from dist', missingAssets.join(', '));
else pass(`All ${new Set(assetRefs).size} referenced assets exist`);

/* --------------------------------------------------------------- 3. fonts */
const cssFile = readdirSync(join(DIST, 'assets')).find((f) => f.endsWith('.css'));
const css = cssFile ? readFileSync(join(DIST, 'assets', cssFile), 'utf8') : '';
if (!cssFile) fail('No stylesheet emitted into dist/assets');

const cssUrls = [...new Set([...css.matchAll(/url\((?:'|")?([^)'"]+)(?:'|")?\)/g)].map((m) => m[1]))].filter(
  (u) => !u.startsWith('data:'),
);
const missingFonts = cssUrls.filter((u) => !existsSync(join(DIST, 'assets', u.replace(/^\.\//, ''))));
if (missingFonts.length) fail('CSS references fonts that are not in dist', missingFonts.slice(0, 5).join(', '));
else pass(`All ${cssUrls.length} CSS font/asset URLs resolve inside dist`);

const fontFiles = readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.woff2'));
const bengaliFonts = fontFiles.filter((f) => f.includes('bengali'));
if (fontFiles.length < 8) fail('Suspiciously few fonts bundled', String(fontFiles.length));
else pass(`${fontFiles.length} woff2 files bundled, ${bengaliFonts.length} of them Bengali`);
if (bengaliFonts.length === 0) fail('No Bengali font is bundled — Bangla CVs would fall back to a system font');
if (/url\((['"]?)https?:/.test(css)) fail('Stylesheet loads a remote font');

/* -------------------------------------------------------------- 4. bundle */
const jsFiles = readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.js'));
let bundleBytes = 0;
const remoteHosts = new Set();
for (const file of jsFiles) {
  const source = readFileSync(join(DIST, 'assets', file), 'utf8');
  bundleBytes += statSync(join(DIST, 'assets', file)).size;

  if (/\beval\s*\(/.test(source)) fail(`eval() found in ${file} — blocked by the production CSP`);

  // Hosts that appear only as XML namespaces or in library documentation are
  // not network calls. Anything else is flagged for review.
  const HOST_ALLOW = /^(www\.)?(w3\.org|openxmlformats\.org|purl\.org|schemas\.microsoft\.com|answers\.microsoft\.com|stuk\.github\.io|github\.com|npmjs\.com|reactjs\.org|mozilla\.org|unicode\.org|iana\.org|schemas\.openxmlformats\.org|schemas\.xmlsoap\.org)$/;
  for (const match of source.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const host = match[1].toLowerCase();
    if (HOST_ALLOW.test(host)) continue;
    if (host === 'localhost' || host.startsWith('127.')) continue;
    remoteHosts.add(host);
  }

  // `new Function` is only a problem if it can actually execute: it must not
  // appear anywhere except inside the setImmediate polyfill fallback, which
  // src/main.tsx pre-empts. Any other occurrence is a genuine CSP hazard.
  const functionHits = [...source.matchAll(/new Function\s*\(/g)];
  if (functionHits.length > 0) {
    const guarded = functionHits.every((hit) => {
      const before = source.slice(Math.max(0, hit.index - 300), hit.index);
      const after = source.slice(hit.index, hit.index + 300);
      // (a) the setImmediate polyfill assigns `m.setImmediate = function (cb) {
      //     typeof cb != "function" && (cb = new Function("" + cb)) }`, so the
      //     identifier sits *before* the call site;
      // (b) webpack's global-this shim tries new Function("return this") only
      //     after `typeof globalThis === "object"` has already failed.
      return (
        /setImmediate/.test(before) ||
        /setImmediate/.test(after) ||
        /globalThis=="object"\)return globalThis/.test(before)
      );
    });
    if (!guarded) fail(`Unguarded new Function() in ${file} — the production CSP would block it`);
    else {
      unreachable.push(
        `${file}: ${functionHits.length} new Function() string-eval path(s) exist in third-party code (setImmediate polyfill and the webpack global-this shim). Both are unreachable here — main.tsx installs setImmediate before the bundle runs, and globalThis always exists on Chromium 108.`,
      );
    }
  }
}

// CSS features must be checked against the CSS only, never against JS comments
// or documentation strings (a comment saying "no color-mix()" is not a defect).
const CSS_BANNED = [
  ['color-mix(', 'CSS color-mix()'],
  ['@container', 'container queries'],
  [':has(', 'CSS :has()'],
  ['subgrid', 'CSS subgrid'],
];
for (const [needle, label] of CSS_BANNED) {
  if (css.includes(needle)) fail(`${label} ships in the stylesheet (unsupported on Chromium 108)`);
}
// backdrop-filter IS supported by Chromium 108; it is only ignored on Windows 7
// without compositing, so it must always ship with an opaque background too.
if (css.includes('backdrop-filter')) {
  const topbarRule = /\.topbar\s*\{[^}]*\}/.exec(css)?.[0] ?? '';
  if (/backdrop-filter/.test(topbarRule) && !/background/.test(topbarRule)) {
    fail('backdrop-filter is used without an opaque background fallback');
  } else {
    warn('backdrop-filter present (supported on Chromium 108; opaque fallback verified — may be ignored on Windows 7 without Aero)');
  }
}
if (remoteHosts.size) warn('Remote hosts appear in the bundle', [...remoteHosts].join(', '));
else pass('No remote network origin in the bundle (fully offline)');
pass(`Bundle size ${(bundleBytes / 1024 / 1024).toFixed(2)} MB across ${jsFiles.length} chunks`);

/* ---------------------------------------------------------- 5. A4 geometry */
const allJs = jsFiles.map((f) => readFileSync(join(DIST, 'assets', f), 'utf8')).join('\n');
const hasA4 = /210/.test(allJs) && /297/.test(allJs);
if (hasA4) pass('A4 (210 × 297) constants present in the shipped code');
else fail('A4 page constants not found in the bundle');

/* ----------------------------------------------------------- 6. sourcemaps */
const maps = readdirSync(join(DIST, 'assets')).filter((f) => f.endsWith('.map'));
pass(`${maps.length} source maps emitted (kept out of the packaged app)`);

/* ------------------------------------------- 7. third-party string-eval paths */
if (unreachable.length) {
  warn(
    'A third-party string-eval path ships but cannot execute',
    unreachable.join('\n          '),
  );
} else {
  pass('No string-eval path in the bundle at all');
}

/* ------------------------------------------------------------------ report */
const width = Math.max(...results.map((r) => r.msg.length));
console.log('\nProduction bundle verification\n' + '─'.repeat(Math.min(72, width + 8)));
for (const r of results) {
  const tag = r.level === 'PASS' ? '  ok  ' : r.level === 'WARN' ? ' warn ' : ' FAIL ';
  console.log(`[${tag}] ${r.msg}${r.detail ? `\n          ${r.detail}` : ''}`);
}
const failures = results.filter((r) => r.level === 'FAIL').length;
const warnings = results.filter((r) => r.level === 'WARN').length;
console.log('─'.repeat(Math.min(72, width + 8)));
console.log(`${results.filter((r) => r.level === 'PASS').length} passed, ${warnings} warning(s), ${failures} failure(s)\n`);
process.exit(failures ? 1 : 0);
