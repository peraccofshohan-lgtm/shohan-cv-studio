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
