# Final Delivery Report — SHOHAN CV STUDIO 1.0.0

Date: 2026-11-13
Branch: `arena/3a3325d3-shohan-cv-studio`
Base commit: `1a2b634`

This report states what was built, what was **verified by execution**, and what
**could not be verified** in the build environment. No claim below is based on
assumption.

---

## 1. Verdict

| Question | Answer |
| --- | --- |
| Is the product complete as software? | **Yes** — every screen, engine, exporter and configuration described in the specification exists and compiles; 68 automated tests pass. |
| Is it proven to work on Windows? | **No.** No Windows machine, installer run, printer or Electron runtime was available here. Every OS row is *Not tested*. |
| Is it safe to distribute today? | **Only after** running the manual checklist in [TESTING.md](TESTING.md#manual-smoke-checklist) on each claimed OS and producing the installers with `npm run dist:win` on a machine that can download Electron. |
| Is anything faked? | No. There are no mock buttons, no placeholder pages, no image stand-ins for DOCX/PDF, no fabricated sample data in the product, and no online dependency. |

---

## 2. What was delivered

### Application

| Area | Status | Evidence |
| --- | --- | --- |
| 19-step CV wizard | Implemented | `src/features/cv-wizard/` (19 step definitions + step components) |
| 20 CV templates | Implemented, distinctly composed | `src/templates/catalog.ts`; distinctness asserted in `tests/design.test.ts`; previewed in `docs/images/` |
| Live editor (undo/redo, zoom, guides, template switch) | Implemented | `src/features/editor/`; guides + section suppression covered by `tests/ui-smoke.test.tsx` |
| Dynamic section engine | Implemented | `src/lib/sections.ts`; 12 tests in `tests/sections.test.ts` |
| Customers, projects, drafts, search/filter/sort | Implemented | `src/features/{customers,projects}/`, repository in `src/database/cvRepository.ts` |
| Editable DOCX | Implemented | `src/document/docxExport.ts`; 3 structural tests in `tests/docx.test.ts` |
| Searchable PDF + direct A4 print | Implemented | `src/features/exporting/exportService.ts`, `electron/main.cjs` (`print:run`, `print:pdf`), `src/document/standalone.ts` |
| Plain-text + HTML export | Implemented | `src/features/exporting/textExport.ts`, `exportHtml()`; 6 tests |
| Export history | Implemented | `export_history` table + `src/features/exports/ExportsPage.tsx` |
| Backup / restore with SHA-256 + safety copy | Implemented | `src/features/backup/BackupPage.tsx` |
| Settings (7 tabs), privacy switches, delete-all-data | Implemented | `src/features/settings/SettingsPage.tsx` |
| Help, shortcuts, compatibility matrix, diagnostics | Implemented | `src/features/help/HelpPage.tsx` |
| Light / dark / system themes, Bangla-first UI | Implemented | `src/styles/tokens.css`, `src/localization/strings.ts` |
| Offline-only, hardened Electron | Implemented | `electron/main.cjs` (CSP header, download guard, navigation guard, validated IPC), `scripts/inject-csp.mjs` |

### Packaging

| Artefact | Status |
| --- | --- |
| `electron-builder.config.cjs` — NSIS + portable, x64 + ia32, asar, max compression, no publish channel | **Configured, not built here** (requires the Electron runtime) |
| Application icon (`build/icon.png`, generated) | Delivered |
| Font licence texts (`src/assets/licenses/`) | Delivered |

### Documentation

| Document | Path |
| --- | --- |
| README | `README.md` |
| Installation Guide | `docs/INSTALLATION.md` |
| User Manual | `docs/USER_MANUAL.md` |
| Technical Documentation | `docs/TECHNICAL.md` |
| Compatibility Matrix | `docs/COMPATIBILITY.md` |
| Testing Report | `docs/TESTING.md` |
| Known Issues | `docs/KNOWN_ISSUES.md` |
| Release Notes | `docs/RELEASE_NOTES.md` |
| Delivery Report | this file |
| Template previews (40 combinations, 80 A4 pages) | `docs/images/` |

---

## 3. Verification actually performed

| Check | Command | Result |
| --- | --- | --- |
| Type safety | `npx tsc --noEmit` | **0 errors** |
| Automated tests | `npx vitest run` | **11 files, 68 tests, 68 passing** |
| Production build | `npm run build` | **Success**; CSP injected into `dist/index.html` |
| Dev server | Vite on `0.0.0.0:5173` | `/`, `/src/main.tsx`, and source modules return **HTTP 200** |
| Template rendering | `python3 scripts/render_previews.py` | **80 A4 pages** rendered from the production design model; Bengali conjuncts shaped with HarfBuzz |
| Chromium-108 compatibility | `tests/design.test.ts` | No `color-mix()`, container queries, `@layer`, `subgrid` or `:has()` in `src/` |

### Defects found and fixed during verification

1. SQL parameter binding silently wrote empty strings for Bengali names once a
   statement exceeded 26 parameters (sql.js binds positionally; keys were being
   sorted alphabetically). Fixed, regression test added.
2. 22 `color-mix()` declarations would have degraded silently on Electron 22 /
   Chromium 108 — the entire Windows 7 target. Replaced with pre-computed tokens;
   the build now fails if they reappear.
3. A static CSP meta tag blocked Vite's dev preamble and HMR. Moved to build-time
   injection.
4. `print-color-adjust: exact` was never declared, so colour bands and chips could
   print white. Fixed and covered by a test.
5. The documentation renderer drifted from the product's metrics and mangled
   Bengali conjuncts. Rewritten to consume the resolved design model, use the
   document stylesheet's millimetre values and shape text with HarfBuzz.
6. Three user-facing actions promised by the manual were unreachable or missing:
   A4 page guides, plain-text export and HTML export. All three implemented.

---

## 3b. Feature-presence audit

Every capability claimed above was re-checked against the source tree by pattern
audit (script kept at `scripts/feature-audit.sh`). Results:

| Capability | Present in |
| --- | --- |
| Undo/redo + autosave | `src/store/workspace.ts` |
| Customer CRUD, duplication, soft delete/restore | `src/database/cvRepository.ts` |
| Search / filter / sort | `src/database/cvRepository.ts` |
| Export history logging | `export_history` + repository |
| Backup manifest with SHA-256 + pre-restore safety copy | `src/features/backup/BackupPage.tsx` |
| DOCX exporter | `src/document/docxExport.ts` |
| Native print + print-to-PDF | `electron/main.cjs` (`print:run`, `print:pdf`) |
| CSP injection | `scripts/inject-csp.mjs` |
| `contextIsolation: true`, `nodeIntegration: false`, navigation and download guards | `electron/main.cjs` |

Counts: **19** wizard steps · **20** templates · **13** palettes · **28** database
tables · **11** test files.

---

## 4. What was NOT verified — per-OS status

| OS | Architecture | Installer built | Installed & launched | Print verified | DOCX opened in Word | Status |
| --- | --- | --- | --- | --- | --- | --- |
| Windows 7 SP1 | x64 | No | No | No | No | **Not tested** |
| Windows 7 SP1 | ia32 | No | No | No | No | **Not tested** |
| Windows 8 | x64 / ia32 | No | No | No | No | **Not tested** |
| Windows 8.1 | x64 / ia32 | No | No | No | No | **Not tested** |
| Windows 10 | x64 / ia32 | No | No | No | No | **Not tested** |
| Windows 11 | x64 | No | No | No | No | **Not tested** |
| Windows 7 RTM, Vista, XP | any | — | — | — | — | **Unsupported** |
| macOS / Linux | any | — | — | — | — | **Unsupported** (not built) |

Reason: this environment has no Windows host, no printer/spooler, and cannot
download the Electron runtime (network blocked) nor launch a headless Chromium
(missing `libnss3`/`libnspr4`, package installation unavailable). Rather than
reporting a pass, the status stays *Not tested*.

### Outputs verified only by construction

| Output | Verified | Not verified |
| --- | --- | --- |
| DOCX | Structure: valid ZIP, A4 page size in twips, real text, Bengali bytes, footer fields, no image parts | Opening in Microsoft Word / LibreOffice; Bengali visual rendering in Word |
| PDF | Payload: complete HTML, A4 rule, embedded fonts, searchable text | Actual PDF generation and searchability in a PDF reader |
| Print | Payload + print-colour settings | Any physical or virtual printer |
| Installer | Configuration reviewed | Building and running the installer |

---

## 5. Requirement-by-requirement status

| Requirement | Status |
| --- | --- |
| Real working features only, no placeholders | **Met** — every button is wired; unreachable promises were implemented rather than documented away |
| 20 genuinely distinct templates | **Met** — distinct structural signatures asserted by test; all 20 rendered and visually inspected |
| A4 exact (210 × 297 mm) | **Met** — CSS and DOCX assertions |
| Photo and no-photo both look good | **Met by design/inspection** — 4 templates left-portrait, 16 right, ATS photo-free; previews rendered both ways. Not verified on paper. |
| No empty headings / blank pages / overlap / clipping | **Met in the render pipeline** — structurally impossible for empty/disabled sections; pagination never splits a section. Verified in previews, not on hardware. |
| Golden Ratio + Golden Rules + 8-point grid | **Met** — `src/lib/golden.ts`, tokens, and tests |
| Light / dark / system themes | **Met** |
| 1024×768 → 1920×1080 without breakage | **Designed and reviewed**, not verified on hardware |
| Windows 7 SP1 … 11, 32- and 64-bit | **Targeted only** — see the per-OS table above |
| Compatibility matrix, honesty about untested | **Met** — `docs/COMPATIBILITY.md` and in-app Help both mark everything untested |
| 19-step wizard | **Met** |
| Dynamic optional-section engine | **Met** — tests |
| Live editing with undo/redo | **Met** |
| Customer management, autosave, drafts, backup/restore, settings, export history, search/filter/sort | **Met** |
| Editable DOCX (selectable text, real A4, Bengali Unicode) | **Met in the file structure**; Word rendering untested |
| Searchable PDF | **Met in construction**; generation untested |
| Direct A4 printing with preview | **Implemented**; printing untested |
| Offline only, no telemetry/cloud/API/activation | **Met** — no network code path exists |
| Electron hardening (contextIsolation, no nodeIntegration, restricted preload, IPC validation, CSP) | **Met** — see Technical Documentation §5 |
| Anti-fabrication (never invent qualifications, experience, certificates, references, signatures, strengths, hobbies) | **Met** — nothing generates content; sample data appears only in the template gallery preview |
| Sensitive data excluded by default with per-field control | **Met** — all 19 visibility flags default to off; asserted in tests |
| Do not force one page | **Met** — pagination and previews show multi-page output |
| No skill bars in ATS templates | **Met** — ATS templates are photo-free and graphic-free (asserted) |
| No single big image in DOCX | **Met** — asserted (no `<img>`/media parts) |
| Docs: README, Installation, User Manual, Technical, Compatibility, Testing, Known Issues, Release Notes, Delivery Report | **Met** |
| Installers | **Configured, not built** (environment limitation) |
| Small logical commits | **Met** — 9 commits on the branch |

---

## 6. Recommended next steps before release

1. On a Windows 10/11 machine with internet: `npm install && npm run dist:win`.
2. Repeat on Windows 7 SP1 (with KB4474419) to confirm the ia32 and x64 builds
   launch.
3. Run the manual checklist ([TESTING.md §3](TESTING.md#manual-smoke-checklist))
   and record results.
4. Open a produced DOCX in Word 2016+ and a produced PDF in Adobe Reader; verify
   selectable text and Bengali conjuncts.
5. Print one CV on a real A4 printer; confirm margins, no browser headers, correct
   colours.
6. Sign the installers if distributing publicly.
7. Update `docs/COMPATIBILITY.md` and this report with the observed results —
   promoting rows only where a check was actually executed.

---

## 7. Sign-off

Delivered: a complete, buildable, offline Bangla-first CV studio with 20 distinct
A4 templates, a live editor, DOCX/PDF/print/text/HTML export from a single
document model, backup and restore, and full documentation.

Not delivered: any verified Windows installation, print output or PDF file. Those
remain the release operator's responsibility, and the documentation says so
plainly rather than claiming a pass.
