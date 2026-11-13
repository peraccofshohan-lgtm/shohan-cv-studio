# Release Notes

## 1.0.0 — first release

**SHOHAN CV STUDIO** is a Bangla-first, fully offline CV builder for Windows.
This is the first complete release: the whole product — data, design, document
rendering, exporting, backup and documentation — is present and buildable.

### Highlights

**Templates**
* 20 CV designs, each with its own header composition, body grid, heading
  treatment, entry rhythm, typography pair and palette. Colour alone never
  distinguishes two designs.
* Exact A4 geometry (210 × 297 mm) in the preview, the PDF, the print pipeline
  and the DOCX (11905 × 16837 twips).
* Each template is verified with and without a portrait; four place the portrait
  on the left, the rest on the right; the ATS templates are portrait-free.
* Bengali conjuncts render correctly in every template because the Bengali and
  Latin font families are embedded (SIL OFL 1.1).

**Data capture**
* 19-step wizard with per-step progress, optional-step marking and autosave.
* Dynamic section engine: sections can be switched off, reordered and renamed;
  empty sections hide themselves. A heading can never print without content, and
  a disabled section is absent from the preview, the DOCX, the PDF and print.
* Custom sections with your own title and body.
* Customers, projects, drafts, duplication, soft delete with restore, search,
  filter and sort.

**Exporting**
* **DOCX** — editable text, real A4, Bengali Unicode, footer with PAGE/NUMPAGES.
  Verified by unzipping the produced file and asserting the OOXML.
* **PDF** — Chromium print-to-PDF, so the text is selectable and searchable.
* **Print** — A4, no browser headers/footers, backgrounds preserved.
* **HTML** — one self-contained file for archiving.
* **Text** — ATS-safe plain text on the clipboard (or a `.txt` fallback).
* Every attempt is recorded in the export history with format, time and status.

**Safety**
* SQLite database in your Windows profile; ZIP backups with SHA-256 verification
  and an automatic safety copy before any restore.
* Sensitive personal fields are excluded from output until individually enabled.
* No account, no cloud, no telemetry, no network code at all.
* Electron hardening: `contextIsolation` on, `nodeIntegration` off, allow-listed
  preload bridge, validated IPC, blocked navigation/downloads, strict CSP.

**Design**
* Golden Ratio composition and an 8-point spacing grid, in both the app UI and
  the templates.
* Light, dark and system themes; verified layout rules from 1024 × 768 to
  1920 × 1080.

### Compatibility

Targets Windows 7 SP1 through Windows 11, 32- and 64-bit, using Electron 22.3.27
(Chromium 108) — the last Electron line that supports Windows 7. Both NSIS
installer and portable builds are configured for x64 and ia32.

**No operating system, installer, printer or PDF output was verified in this
release.** Every such row is marked *Not tested* in
[COMPATIBILITY.md](COMPATIBILITY.md); the technical basis for each target is
stated there. See [TESTING.md](TESTING.md) for exactly what was executed.

### Verified in this release

* `npx tsc --noEmit` — 0 errors
* `npx vitest run` — 11 suites, 66 tests passing
* `npm run build` — production bundle with CSP injected
* 40 template × language previews rendered (80 A4 pages) through the production
  design model with HarfBuzz shaping
* Mount-level React tests for the dashboard, template gallery and editor

### Fixed during the 1.0.0 cycle

* SQL parameter binding wrote empty strings for Bengali names once a statement
  exceeded 26 parameters (sql.js binds positionally; the binder had sorted keys
  alphabetically). Now binds in SQL appearance order, guarded by a regression test.
* `color-mix()` was used in 22 places — unsupported by Chromium 108 and therefore
  by every Windows 7 target. Replaced with pre-computed design tokens; a test now
  forbids it, along with container queries, `@layer`, `subgrid` and `:has()`.
* A static CSP meta tag blocked the Vite dev preamble and HMR; CSP is now injected
  at build time only.
* The documentation renderer drifted from the product's metrics; it now consumes
  the resolved design model and the millimetre values from the document
  stylesheet, and paginates by the same "never split a section" rule.

### Known limitations

See [KNOWN_ISSUES.md](KNOWN_ISSUES.md). The most important is that the installer,
printing and PDF generation still need to be exercised on real Windows machines
before distribution.
