# Technical Documentation — SHOHAN CV STUDIO 1.1.0

Audience: developers and administrators maintaining or auditing the product.

---

## 1. Architecture at a glance

```
┌──────────────────────────────────────────────────────────────┐
│ Electron 22 main process (electron/main.cjs)                 │
│  • window + print + PDF (webContents.print / printToPDF)     │
│  • native dialogs: save/open/choose folder/choose image      │
│  • SQLite file I/O for the renderer                          │
│  • CSP response header, download guard, navigation guard     │
└───────────────▲──────────────────────────────────────────────┘
                │ contextBridge (preload.cjs) — validated, allow-listed IPC
┌───────────────┴──────────────────────────────────────────────┐
│ Renderer: React 18 + Zustand + TypeScript                    │
│  features/  screens (Bangla UI)                              │
│  document/  ONE document model → preview, print, PDF, DOCX   │
│  lib/       section engine, golden-ratio maths, colours      │
│  database/  schema + sql.js engine + repository              │
└──────────────────────────────────────────────────────────────┘
```

The renderer never touches Node APIs directly; everything goes through the
preload bridge, which exposes a fixed, documented surface (`src/platform/types.ts`).

The same renderer also runs in a plain browser (`npm run dev`) through
`browserAdapter.ts`, which implements the identical contract with IndexedDB,
Blob downloads and an iframe print dialog. This is what makes the app testable
without Electron and gives a genuine browser fallback.

---

## 2. Technology choices (and why)

| Choice | Version | Reason |
| --- | --- | --- |
| Electron | 22.3.27 | Last line with Chromium 108 / Node 16 — **the last version supporting Windows 7 SP1, 8 and 8.1** |
| React | 18.3.1 | Mature, no experimental features needed |
| TypeScript | 5.x | Compile-time safety across the document model |
| Zustand | 4.5.7 | Tiny store, no context re-render pitfalls |
| sql.js | 1.8.0 | SQLite compiled to WebAssembly — a real SQL database with no native build step, which matters for 32-bit Windows |
| docx | 7.8.2 | Generates genuine OOXML Word files |
| fflate | 0.8.2 | Small, fast ZIP (backups) and DEFLATE |
| Vite | 5.x | Fast dev server; `es2019` target for the shipped Chromium |
| Zod | 3.25.76 | Runtime validation of imported settings/backup manifests |

**Deliberately avoided:** anything requiring Chromium ≥ 111 (`color-mix()`),
native modules (no compiler needed on the build machine), and any network SDK.

---

## 3. Data layer

### 3.1 Engine

`src/database/sqlite.ts` wraps sql.js:

```ts
SqlEngine.create(bytes | null, { onPersist })
  .run(sql, params)        // single statement
  .all(sql, params)        // array of rows
  .first(sql, params)      // one row or null
  .scalar(sql, params)     // one value
  .transaction(fn)         // BEGIN/COMMIT with rollback
  .export()                // Uint8Array — the whole database
  .integrityCheck()        // PRAGMA integrity_check → { ok, message }
  .schemaVersion           // PRAGMA user_version
```

**Parameter binding contract.** sql.js binds positional arrays, so the engine
parses `$name` placeholders **in the order they appear in the SQL text**, builds a
positional array, and accepts parameter objects keyed either `name` or `$name`.
A missing parameter throws with a snippet of the statement rather than silently
inserting an empty value. This is covered by `tests/regression.test.ts` because an
earlier alphabetical-key implementation silently blanked Bengali names.

### 3.2 Schema (29 tables, version 3)

`meta`, `customers`, `cv_projects`, `personal_information`, `education`,
`work_experience`, `skills`, `languages`, `training`, `projects`, `achievements`,
`strengths`, `hobbies`, `volunteer_experience`, `cv_references`, `declarations`,
`signatures`, `career_objective`, `career_interests`, `custom_sections`,
`section_config`, `templates`, `template_settings`, `export_history`,
`project_versions`, `application_settings`, `backup_history`, `error_log`.

Design rules:

* Normalised child tables keyed by `project_id` with `ON DELETE CASCADE`.
* `cv_projects` holds language, career level, template and design overrides, plus
  the v1.1 document-composition columns: `title_json`, `page_length_json` and
  `section_styles_json`. They are JSON blobs because they are read and written as
  a unit and are never queried individually.
* `personal_information` carries one `include_*` flag per sensitive field; all
  default to 0 so nothing sensitive is emitted without an explicit opt-in.
* `project_versions` records snapshots for restore.
* `export_history` records format, timestamp, path and status for every export.
* `error_log` backs the diagnostics view.

`schemaVersion` is stored in `meta.schema_version`; migrations apply sequentially
and are idempotent. `CREATE TABLE IF NOT EXISTS` covers table creation, and the
migration runner additionally inspects `PRAGMA table_info` before any
`ALTER TABLE … ADD COLUMN`, so a half-applied migration can always be re-run
safely.

**v2 (1.1.0)** is additive only: three `TEXT NOT NULL DEFAULT ''` columns on
`cv_projects` plus two indexes. Projects saved by 1.0 load with default title and
page-length settings via `hydrateTitle()`, which merges the stored blob over the
current defaults and drops unknown or wrongly-typed fields, so a corrupt blob can
never crash the editor.

Persistence: in Electron the bytes are written to
`%APPDATA%\Shohan CV Studio\data\shohan-cv.sqlite` through the bridge after each
mutating transaction (debounced); in the browser they are written to IndexedDB.

---

## 4. The document pipeline

One model, six outputs — the core reason the formats cannot disagree.

```
CVData + DesignOverrides
        │
        ▼
composeDocumentTokens()      ← v1.1: density, margins, typography roles,
        │                      spacing tokens, colours, title block, page policy
        │
        ├──────────────────────────┐
        ▼                          ▼
resolveSections()            buildLayoutReport()
  ← drops disabled and          ← page fit estimate + diagnostics
    empty sections                 (never mutates content)
        │
        ├── CvDocument.tsx   → on-screen A4 preview (React)
        ├── buildDocumentCss → mm-based A4 CSS shared by screen/print/PDF
        ├── standalone.ts    → self-contained HTML (fonts as data: URIs)
        │        └── bridge.print()       → webContents.print()  (A4, no headers)
        │        └── bridge.printToPdf()  → webContents.printToPDF()
        ├── buildDocx()      → OOXML (A4, real text, footer PAGE/NUMPAGES)
        ├── buildPlainText() → clipboard / .txt (reading order, privacy flags)
        └── saveText(.html)  → archival HTML
```

`composeDocumentTokens` is the single place where a design decision becomes a
number. It returns a plain serialisable object — no React, no DOM — which is why
the DOCX generator and the Node-based tests can consume exactly what the browser
renders.

### 4.0 Composition tokens (v1.1)

| Concern | Module | Note |
| --- | --- | --- |
| Density presets | `DENSITY_PRESETS` | Compact / balanced / spacious change **spacing tokens and type scale together**, clamped so body text never drops below 9 pt |
| Units | `MM_PER_UNIT`, `toMm`, `fromMm` | mm / pt / in / px; A4 constants exported as `A4` |
| Typography roles | `DocumentTokens.typography` | Ten roles, each with family, point size, weight, italic, underline, letter spacing, line height and colour |
| Spacing | `DocumentTokens.spacing` | Twelve multipliers with documented base millimetres (`SPACING_BASE_MM`) |
| Title block | `resolveTitle()` | Returns `visible: false` **and** zero before/after spacing when the operator chose "No title", so no element and no gap can exist |
| Page policy | `DocumentTokens.pageLength` | Mode, ceiling, per-section breaks, keep-together — consumed by the renderer and the report, never used to delete content |

Colour input is validated in `cleanColors()` before it can reach a stylesheet, so
a half-typed `#12` cannot produce invalid CSS.

### 4.0.1 Layout report

`buildLayoutReport()` converts the resolved sections and tokens into a page-fit
estimate and a diagnostic list. The estimate uses the real text box
(`210 − left − right` mm), real point sizes and line heights, and the actual
heading/entry gaps, then divides by the printable height. Diagnostics cover page
overflow, underflow, an almost-empty last page, headings taller than half a page,
over-long bullets and objectives, duplicate skills, missing dates, oversized
photos and enabled-but-empty sections.

This is an **estimate by design**: there is no layout engine on the render thread.
The print/PDF path uses Chromium's real pagination, so the documented behaviour is
"estimate in the editor, authoritative in the print preview".

### 4.1 Sections

`resolveSections` returns **all** sections with a `hasContent` flag and a
`hiddenReason`, while `printableSections` returns only what will print. Exports
use `printableSections`, so a heading can never print without content.

`buildLayoutReport` also runs a **contrast check** (`LOW_CONTRAST`): body and
muted text must clear 4.5:1, the name and headings 3:1, against the resolved
page background. It is a warning, not a gate — a brand palette that fails WCAG
exports unchanged, exactly as the operator designed it.

`src/lib/sectionOrder.ts` holds the seven recommended orderings. Each preset is
a pure `SectionId[]`; `applyOrderPreset` rewrites only the `order` field of the
**caller's** section array (contiguous `0…n-1`, unlisted ids keep their relative
place at the end) and never touches `enabled` or content, so it cannot delete a
section. `detectOrderPreset` compares the stored order against each preset and
returns the match (or `null` for a hand-made order), which is what the ✓ marker
in the navigator reads.

**Per-section overrides (Part 5.4).** `src/lib/sectionStyles.ts` sanitises the
`SectionStyleOverride` that schema v2 introduced per section:
hex-only heading colour, four alignments, heading scale clamped to 0.8–1.25,
section-gap multiplier clamped to 1–2.5 (it can add space, never squeeze),
four bullet markers, and an optional page break. `normalizeSectionOverride`
returns `null` when nothing differs, so "reset" deletes the entry instead of
storing defaults, and an untouched document keeps byte-identical markup.

The renderer reads the override three ways, all from the same object:

* `sectionCssVars` → inline custom properties (`--sec-heading`,
  `--sec-heading-scale`, `--sec-heading-align`, `--sec-gap-mul`) on the
  `<section>`, plus `data-head-align` / `data-bullets` attributes. The
  stylesheet defines the same variables with template defaults as fallbacks.
* `sectionsStartingNewPage` unions the page-length policy's `breakBefore` with
  every section's `pageBreakBefore`, deduplicated — one section, one break.
* `buildDocx` re-reads the override for the heading colour, size, alignment,
  paragraph spacing and `pageBreakBefore`, and selects a Word numbering
  reference per bullet marker (`cv-bullets`, `cv-bullets-dash`,
  `cv-bullets-square`; `none` emits plain indented paragraphs).

### 4.2 Geometry

* A4 = 210 × 297 mm = 11905 × 16837 twips (DOCX) = 793.7 × 1122.5 px @96 dpi.
* The document stylesheet uses millimetres so Chromium's pagination is exact;
  `@page { size: A4 portrait; margin: 0 }`.
* Body copy is 9.9 pt at scale 1 with 1.5 line height — comfortable for A4.
* Section spacing and entry rhythm are derived from a single `sectionSpacing`
  multiplier, so templates stay internally consistent.

### 4.3 DOCX

Built with the `docx` library: sections are real paragraphs and tables, the page
size is A4 in twips, headings are text (not images), dates are right-aligned with
a tab stop, and the footer uses `PAGE` / `NUMPAGES` fields. The split-entry
header uses a borderless two-column table for alignment. Bengali text is written
as Unicode with the font fallback chain in the run properties, so Word renders
conjuncts correctly.

`tests/docx.test.ts` unzips the produced file with fflate and asserts the
document XML, page size (with ±3 twip tolerance for mm conversion), absence of
image parts, and presence of the Bengali strings byte-for-byte.

### 4.4 Print and PDF

`standalone.ts` builds one HTML document with `@font-face` rules inlined as
base64 data URIs, so printing never depends on installed fonts. In Electron it is
passed to `webContents.print()` (A4, `printBackground: true`, no headers/footers)
or to `webContents.printToPDF()` for a searchable PDF. In a browser the same HTML
is written into a hidden iframe and printed through the native dialog.

---

## 5. Security model

| Control | Implementation |
| --- | --- |
| `contextIsolation` | **on** |
| `nodeIntegration` | **off** |
| `sandbox` | **on** for print/preview windows; the renderer window runs with the sandbox off only because the preload needs `fs`/`path`/`os` for file dialogs — the renderer itself has no Node access |
| Preload surface | Explicit allow-list of functions in `preload.cjs`; no `require` in the renderer |
| IPC validation | Every handler type-checks and length-caps its payload; file names are sanitised; payloads over 64 MB rejected |
| Navigation | `will-navigate` and `setWindowOpenHandler` deny anything outside the app |
| Downloads | `will-download` is cancelled — files are only written through explicit save dialogs |
| CSP (production) | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'none'` |
| CSP injection | `scripts/inject-csp.mjs` writes the meta tag during `npm run build`, so development is not broken by a static policy |
| Network | No fetch/XHR/WebSocket to any remote host anywhere in `src/` |

The renderer's only I/O paths are the bridge functions, and each one corresponds
to an explicit user action (a dialog, a print, a backup).

---

## 6. Design system

* **φ = 1.6180339887** — `goldenSplit()` for composition, `typeScale()` for the
  display steps.
* **8-point spacing grid** — `--sp-1 … --sp-9` (4, 8, 12, 16, 24, 32, 40, 56, 72 px).
* **Colour** — `src/lib/color.ts` provides `hexToRgb`, `hexToRgba`, `mixHex`,
  `darken`, `lighten`, `luminance`, `contrastRatio`. Derived tones are pre-computed
  tokens, never `color-mix()`, because Electron 22 is Chromium 108.
* **Themes** — light / dark / system via `[data-theme]` on the root element; every
  token is declared for both.
* **Responsiveness** — tested layouts from 1024 × 768 to 1920 × 1080; the sidebar
  collapses, panels stack, and the A4 preview scales rather than clipping.

These rules are enforced by `tests/design.test.ts` against the source and by
`scripts/verify-dist.mjs` against the shipped bundle, which fail if `color-mix(`,
container queries, `@layer`, `subgrid` or `:has(` ever appear. The bundle audit
also verifies the strict CSP, that every CSS font URL resolves inside `dist`, and
that no remote origin is referenced — the three ways an offline desktop app
usually breaks after a dependency update.

`backdrop-filter` is permitted (Chromium 108 supports it) but must ship with an
opaque background, because Windows 7 without Aero compositing ignores it.

---

## 7. Testing

| Suite | Covers |
| --- | --- |
| `tests/smoke.test.ts` | App metadata, fonts, defaults integrity |
| `tests/sections.test.ts` | Empty/disabled section suppression, ordering, overrides, localisation, periods, recommended order presets |
| `tests/docx.test.ts` | A4 twips, real text (no images), Bengali round-trip, footer fields |
| `tests/database.test.ts` | Schema + integrity, full project round-trip, cascade delete, version history, soft delete, settings, export logging |
| `tests/regression.test.ts` | Parameter-binding order, `$`-prefixed keys, Bangla byte-exact round-trip |
| `tests/design.test.ts` | φ maths, 8-point grid, A4 tokens, Chromium-108 compatibility, catalogue distinctness |
| `tests/emit-models.test.ts` | Documentation preview models (60 previews) |
| `tests/composition-matrix.test.ts` | 30 templates × 2 languages, six title modes, photo reflow, optional sections, density, alignment, colours, margins, DOCX parity, page-target contract |
| `tests/print-payload.test.ts` | The exact print/PDF payload: A4 `@page`, pagination rules, widow/orphan, selectable text, embedded Bengali fonts, colour adjust, page numbering |
| `tests/docx-payload.test.ts` | OOXML package structure, A4 twips, margin parity, title present/absent |
| `tests/backup-restore.test.ts` | Real SQLite → archive → validate → restore round-trip; rejection of tampered, foreign and newer-schema archives |
| `tests/text-export.test.ts` | Plain-text reading order, privacy flags, title handling |
| `tests/ui-smoke.test.tsx` | Real React mounts: dashboard, gallery (all 30), editor, all five panels, wizard document step |
| `tests/production-entry.test.tsx` | `dist/index.html` integrity and asset resolution |

Run with `npm test`. `npm run verify` chains typecheck, tests, build, bundle audit
and feature audit. See [TESTING.md](TESTING.md) for measured results and
[DELIVERY_REPORT.md](DELIVERY_REPORT.md) for what could not be executed.

---

## 7.1 Renderer hardening

`src/main.tsx` runs two guards before the React bundle evaluates:

1. **CSP-safe `setImmediate`.** The bundled `docx` dependency ships a
   `setImmediate` polyfill whose fallback compiles a string with `new Function`.
   The production CSP forbids that, so a `setTimeout`-based implementation is
   installed first. `verify-dist.mjs` flags any *unguarded* occurrence of
   `new Function` and reports the known unreachable ones explicitly.
2. **Opaque top bar.** `backdrop-filter` keeps its visual effect but always has an
   opaque `background-color` underneath.

---

## 8. Extending the product

**Add a template** — append an entry to `src/templates/catalog.ts` with a layout
signature that differs from every existing one, then run
`npm run docs:previews` to regenerate the preview images. The gallery, wizard,
editor and all exporters pick it up automatically.

**Add a section** — add the id to `SECTION_DEFS`, the title to `SECTION_TITLES`,
the type to `CVData`, a case in `resolveSections`, and a form step in the wizard.
Exports need no changes.

**Add a locale** — UI strings live in `src/localization/strings.ts` keyed by
language; section headings live in `SECTION_TITLES`.

---

## 9. Known architectural trade-offs

1. **sql.js keeps the database in memory** and writes the whole file on change.
   Simple, portable and 32-bit friendly; not suitable for multi-gigabyte data —
   irrelevant for CVs, documented in [KNOWN_ISSUES.md](KNOWN_ISSUES.md).
2. **Electron 22 is old by design.** Windows 7 support is a hard requirement, and
   that pins the runtime. The codebase therefore avoids every modern CSS/JS
   feature that Chromium 108 lacks, and `tests/design.test.ts` enforces it.
3. **No auto-update.** Offline-first requirement; distribution is a new installer.
4. **Page count is estimated, not measured.** No layout engine is available on the
   render thread (an offscreen render would cost a second per keystroke). The
   estimator is physically based and the print preview is authoritative; this is a
   deliberate accuracy/latency trade-off, documented in KNOWN_ISSUES 5b.
5. **DOCX is a reduced projection of the token model.** OOXML can express
   paragraphs, tables, borders, images and page setup, but not a padded tinted
   title box or per-role letter-spacing. The exporter maps what it can and the
   remainder is listed as a limitation instead of being silently dropped.
6. **Presets store tokens, never content.** Applying a preset cannot damage a
   project's text, and `Reset design` always restores the built-in template.
