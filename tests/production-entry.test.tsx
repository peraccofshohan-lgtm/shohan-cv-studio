// @vitest-environment jsdom
import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

describe('production entry', () => {
  it('index.html has a root node and the strict CSP', () => {
    const html = readFileSync(resolve('dist/index.html'), 'utf8');
    expect(html).toContain('id="root"');
    expect(html).toMatch(/Content-Security-Policy/);
    expect(html).not.toMatch(/<script(?![^>]*src=)/);
  });
  it('every dist asset referenced by index.html exists', () => {
    const html = readFileSync(resolve('dist/index.html'), 'utf8');
    const refs = [...html.matchAll(/(?:src|href)="\.?\/?(assets\/[^"]+)"/g)].map((m) => m[1]);
    expect(refs.length).toBeGreaterThan(0);
    for (const rel of refs) expect(() => readFileSync(resolve('dist', rel))).not.toThrow();
  });
});

describe('release version consistency', () => {
  it('the app version, package.json and the docs agree', () => {
    const meta = readFileSync(resolve('src/lib/appMeta.ts'), 'utf8');
    const pkg = JSON.parse(readFileSync(resolve('package.json'), 'utf8')) as { version: string };
    const app = /APP_VERSION = '([^']+)'/.exec(meta)?.[1];
    expect(app).toBe(pkg.version);
    // Every document titles itself with the same version.
    for (const doc of ['README.md', 'docs/RELEASE_NOTES.md', 'docs/DELIVERY_REPORT.md', 'docs/RELEASE_ARTEFACTS.md']) {
      expect(readFileSync(resolve(doc), 'utf8'), doc).toContain(pkg.version);
    }
  });
});
