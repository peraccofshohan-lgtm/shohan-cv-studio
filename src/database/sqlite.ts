/**
 * Thin, typed wrapper around sql.js.
 *
 * The database is a real SQLite file: `export()` produces the standard
 * "SQLite format 3" byte stream that the desktop build stores on disk and the
 * browser build stores in IndexedDB. Therefore desktop and web share one
 * schema, one migration path and one query layer — no drift is possible.
 */
import type { Database, SqlJsStatic } from 'sql.js';
import { MIGRATIONS, SCHEMA_VERSION } from './schema';

type SqlValue = string | number | Uint8Array | null;

export interface SqlDatabaseOptions {
  /** Called with the new file bytes after every mutation (debounced by the caller). */
  onPersist?: (bytes: Uint8Array) => void;
}

export class SqlEngine {
  private db: Database;
  private static Binary: SqlJsStatic | null = null;
  private listeners: Array<(bytes: Uint8Array) => void> = [];
  private inTransaction = false;
  private dirty = false;

  private constructor(db: Database) {
    this.db = db;
  }

  /** Initialise the sql.js WASM module exactly once per runtime. */
  static async loadBinary(): Promise<SqlJsStatic> {
    if (SqlEngine.Binary) return SqlEngine.Binary;
    const initSqlJs = (await import('sql.js')).default;
    const wasmUrl = await resolveWasmUrl();
    SqlEngine.Binary = await initSqlJs({ locateFile: () => wasmUrl });
    return SqlEngine.Binary;
  }

  static async create(bytes: Uint8Array | null, opts: SqlDatabaseOptions = {}): Promise<SqlEngine> {
    const SQL = await SqlEngine.loadBinary();
    const db = bytes && bytes.length > 0 ? new SQL.Database(bytes) : new SQL.Database();
    const engine = new SqlEngine(db);
    if (opts.onPersist) engine.onPersist(opts.onPersist);
    engine.migrate();
    return engine;
  }

  onPersist(fn: (bytes: Uint8Array) => void): void {
    this.listeners.push(fn);
  }

  /** Apply pending migrations inside a single transaction. */
  migrate(): void {
    this.db.run('PRAGMA foreign_keys = ON;');
    this.db.run(`CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);`);
    const current = this.scalar<number>('SELECT CAST(value AS INTEGER) FROM meta WHERE key = $k', { $k: 'schema_version' }) ?? 0;
    for (const migration of MIGRATIONS) {
      if (migration.version <= current) continue;
      this.transaction(() => {
        for (const stmt of migration.up) this.run(stmt);
        this.run(
          `INSERT INTO meta(key, value) VALUES('schema_version', $v)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          { $v: String(migration.version) },
        );
        this.run(`INSERT OR IGNORE INTO meta(key, value) VALUES('created_at', $d)`, { $d: new Date().toISOString() });
      });
    }
    this.markDirty();
    this.flush();
  }

  get schemaVersion(): number {
    return this.scalar<number>('SELECT CAST(value AS INTEGER) FROM meta WHERE key = $k', { $k: 'schema_version' }) ?? 0;
  }

  run(sql: string, params: Record<string, SqlValue> = {}): void {
    const bound = bindParams(sql, params);
    this.db.run(sql, bound);
    this.markDirty();
  }

  all<T = Record<string, unknown>>(sql: string, params: Record<string, SqlValue> = {}): T[] {
    const stmt = this.db.prepare(sql);
    try {
      stmt.bind(bindParams(sql, params));
      const rows: T[] = [];
      while (stmt.step()) rows.push(stmt.getAsObject() as unknown as T);
      return rows;
    } finally {
      stmt.free();
    }
  }

  first<T = Record<string, unknown>>(sql: string, params: Record<string, SqlValue> = {}): T | null {
    return this.all<T>(sql, params)[0] ?? null;
  }

  scalar<T extends string | number | null>(sql: string, params: Record<string, SqlValue> = {}): T | null {
    const row = this.first<Record<string, T>>(sql, params);
    if (!row) return null;
    const values = Object.values(row);
    return (values[0] ?? null) as T | null;
  }

  transaction<T>(fn: () => T): T {
    if (this.inTransaction) return fn();
    this.inTransaction = true;
    this.db.run('BEGIN');
    try {
      const result = fn();
      this.db.run('COMMIT');
      this.inTransaction = false;
      this.flush();
      return result;
    } catch (err) {
      try {
        this.db.run('ROLLBACK');
      } catch {
        /* rollback best effort */
      }
      this.inTransaction = false;
      throw err;
    }
  }

  export(): Uint8Array {
    return this.db.export();
  }

  /** PRAGMA integrity_check — used by backup/restore verification. */
  integrityCheck(): { ok: boolean; message: string } {
    const value = this.scalar<string>('PRAGMA integrity_check');
    return { ok: value === 'ok', message: String(value ?? 'unknown') };
  }

  close(): void {
    this.flush();
    this.db.close();
  }

  private markDirty(): void {
    this.dirty = true;
  }

  flush(): void {
    if (!this.dirty || this.listeners.length === 0) return;
    this.dirty = false;
    const bytes = this.db.export();
    for (const fn of this.listeners) {
      try {
        fn(bytes);
      } catch {
        /* persistence errors surface through the caller's adapter */
      }
    }
  }
}

/**
 * sql.js binds positional arrays only, while this codebase uses readable
 * `$name` placeholders. We therefore resolve each placeholder in the exact
 * order it appears in the SQL text (de-duplicated) and map it to its value.
 *
 * Binding by *appearance order* — never by alphabetical key order — is what
 * keeps 27-parameter inserts (…, z, aa, ab, …) correct.
 */
function bindParams(sql: string, params: Record<string, SqlValue>): SqlValue[] {
  const names: string[] = [];
  for (const match of sql.matchAll(/\$([a-zA-Z0-9_]+)/g)) {
    const name = match[1];
    if (!names.includes(name)) names.push(name);
  }
  if (names.length === 0) return [];
  // Accept both `{ k: v }` and `{ $k: v }` key styles.
  const lookup = new Map<string, SqlValue>();
  for (const [key, value] of Object.entries(params)) {
    lookup.set(key.startsWith('$') ? key.slice(1) : key, value);
  }
  return names.map((name) => {
    if (!lookup.has(name)) {
      throw new Error(
        `Missing SQL parameter $${name}. Provided: [${Object.keys(params).join(', ')}] in: ${sql.slice(0, 120)}`,
      );
    }
    return lookup.get(name) as SqlValue;
  });
}

/** Validates that every placeholder in `sql` has a supplied value. */
export function assertParamCoverage(sql: string, params: Record<string, SqlValue>): void {
  const keys = new Set(Object.keys(params).map((k) => (k.startsWith('$') ? k.slice(1) : k)));
  for (const match of sql.matchAll(/\$([a-zA-Z0-9_]+)/g)) {
    if (!keys.has(match[1])) throw new Error(`Missing SQL parameter $${match[1]} in: ${sql.slice(0, 120)}`);
  }
}

/** Build an appearance-ordered `col = $cN` SET clause. */
export function buildSet(columns: Record<string, SqlValue>): { sql: string; params: Record<string, SqlValue> } {
  const params: Record<string, SqlValue> = {};
  const sql = Object.keys(columns).map((column, index) => {
    const key = `c${index}`;
    params[key] = columns[column];
    return `${column} = $${key}`;
  });
  return { sql: sql.join(', '), params };
}

async function resolveWasmUrl(): Promise<string> {
  const isNode = typeof process !== 'undefined' && !!(process as any).versions?.node && typeof window === 'undefined';
  if (isNode) {
    const nodeModule = (await import(/* @vite-ignore */ 'node:module')) as unknown as {
      createRequire: (url: string) => NodeRequire;
    };
    const req = nodeModule.createRequire(import.meta.url);
    const path = (await import(/* @vite-ignore */ 'node:path')) as typeof import('node:path');
    const dir = path.dirname(req.resolve('sql.js'));
    return path.join(dir, 'sql-wasm.wasm');
  }
  // Browser: Vite resolves this asset URL at build time.
  const mod = await import('sql.js/dist/sql-wasm.wasm?url');
  return (mod as { default: string }).default;
}
