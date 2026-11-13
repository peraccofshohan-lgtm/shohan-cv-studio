// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { SqlEngine } from '@/database/sqlite';

/**
 * Regression guard: sql.js binds positionally, so named parameters MUST be
 * resolved in appearance order. The 27-parameter insert in
 * personal_information (…, z, aa, ab, …) silently wrote empty strings when
 * parameters were sorted alphabetically. This test locks the behaviour.
 */
describe('SQL parameter binding', () => {
  it('binds by appearance order, not alphabetical key order', async () => {
    const engine = await SqlEngine.create(null);
    engine.run('CREATE TABLE t (a TEXT, aa TEXT, ab TEXT, z TEXT)');
    engine.run(
      `INSERT INTO t (a, aa, ab, z) VALUES ($a, $aa, $ab, $z)`,
      { a: 'A', aa: 'AA', ab: 'AB', z: 'Z' },
    );
    const row = engine.first<{ a: string; aa: string; ab: string; z: string }>('SELECT * FROM t');
    expect(row).toEqual({ a: 'A', aa: 'AA', ab: 'AB', z: 'Z' });
  });

  it('accepts $-prefixed keys', async () => {
    const engine = await SqlEngine.create(null);
    engine.run('CREATE TABLE t (v TEXT)');
    engine.run('INSERT INTO t (v) VALUES ($v)', { $v: 'value' });
    expect(engine.scalar('SELECT v FROM t')).toBe('value');
  });

  it('keeps non-ASCII text byte-exact through save and reload', async () => {
    const engine = await SqlEngine.create(null);
    engine.run('CREATE TABLE t (v TEXT)');
    const bangla = 'মোঃ রফিকুল ইসলাম — ঢাকা, বাংলাদেশ';
    engine.run('INSERT INTO t (v) VALUES ($v)', { v: bangla });
    const reloaded = await SqlEngine.create(engine.export());
    expect(reloaded.scalar('SELECT v FROM t')).toBe(bangla);
  });
});
