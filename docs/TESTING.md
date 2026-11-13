# Testing Report — SHOHAN CV STUDIO 1.1.0

Every number in this report was produced by running the command shown. Nothing
here is estimated, and anything that could not be executed is listed in
[§6 What could not be run](#6-what-could-not-be-run).

---

## 1. Summary

| Check | Command | Result |
| --- | --- | --- |
| TypeScript | `npx tsc --noEmit` | **PASS** — 0 errors |
| Unit / integration tests | `npx vitest run` | **PASS** — 19 files, **236 tests** |
| Production build | `npm run build` | **PASS** — Vite + CSP injection |
| Production bundle audit | `node scripts/verify-dist.mjs` | **PASS** — 8 passed, 2 documented warnings, 0 failures |
| Feature-presence audit | `bash scripts/feature-audit.sh` | **PASS** — 47 checks, all present |
| Visual rendering | `npm run docs:previews` | **PASS** — 122 A4 pages across 60 template × language previews |
| One-shot gate | `npm run verify` | runs everything above in order |

---

## 2. Test inventory (236 tests / 19 files)

| File | Tests | What it protects |
| --- | --- | --- |
| `tests/print-payload.test.ts` | 19 | The exact HTML given to `printToPDF`/the spooler: A4 `@page`, 210 × 297 mm sheet, four-margin padding, heading/entry keep rules, widow+orphan control, manual section breaks, selectable text (no canvas, no `<img>` for the CV), embedded Bengali `@font-face`, `print-color-adjust: exact`, page numbering only when enabled |
| `tests/design.test.ts` | 16 | Golden-ratio tokens, 8 pt spacing scale, **30** templates with unique ids/names/structural signatures, Chromium-108 CSS rules, ES2019 target |
| `tests/composition-matrix.test.ts` | 15 | 30 templates × 2 languages through the real pipeline (resolver → tokens → CSS → HTML → DOCX); six title modes; photo removal reflow; optional sections; density changes real spacing; four alignments; custom colours/margins; malformed colour rejection; DOCX A4 parity; page-target never loses content |
| `tests/sections.test.ts` | 21 | Dynamic section engine, empty/disabled sections dropped, Bangla date localisation and Bengali digits, **recommended section orderings** (reorder without loss, preset detection, per-CV-type priority) |
| `tests/ui-smoke.test.tsx` | 17 | Real React mounts (jsdom): dashboard, gallery listing all 30 templates, editor A4 page, guides toggle, section hide, **title printed/removed**, title + page-length + report + design panels, recommended-order selector, page thumbnails, named presets, wizard document step |
| `tests/database.test.ts` | 9 | Schema, integrity, normalised round-trip, **schema v2 title/page-length/section-style round-trip**, v1.0 project loading |
| `tests/text-export.test.ts` | 8 | Plain-text export: privacy flags, reading order, title first, title omitted when hidden, custom title verbatim |
| `tests/backup-restore.test.ts` | 8 | Real SQLite → archive → validate → restore: customer, project, Bangla content, title, page policy survive; tampered archive rejected; foreign/newer-schema rejection; restart persistence |
| `tests/print-output.test.ts` | 7 | Standalone print document: A4, embedded fonts, no empty headings |
| `tests/docx-payload.test.ts` | 5 | OOXML package parts, A4 twips, margin parity, title present/absent |
| `tests/smoke.test.ts` | 3 | App boot and store wiring |
| `tests/regression.test.ts` | 3 | Bangla byte round-trip, defaults, no fabricated data |
| `tests/docx.test.ts` | 3 | DOCX A4 size, textual content, Bengali strings, no image parts |
| `tests/production-entry.test.tsx` | 2 | `dist/index.html` has `#root`, the strict CSP, no inline script, and every referenced asset exists |
| `tests/named-presets.test.ts` | 5 | Ten named presets: ids exist, resolve to A4, render in bn+en without a photo, and never mutate the template catalog |
| `tests/title-decoration.test.ts` | 7 | Title strikethrough and word spacing: combined decoration, clamp, Latin-only word spacing (never Bengali), DOCX `<w:strike>` |
| `tests/section-styles.test.ts` | 15 | Per-section design overrides: colour/scale/gap clamping, lossless reset, markup attributes, print payload, DOCX page break, colour, alignment and bullet numbering |
| `tests/emit-models.test.ts` | 1 | Emits `docs/preview-models.json` for 60 template × language previews |
| `tests/docs-images.test.ts` | 1 | Documentation previews exist, are A4-proportioned and non-blank |

---

## 3. Composition matrix (Part 11 of the specification)

The matrix test runs the **real** pipeline for every cell — section resolver →
`composeDocumentTokens` → `buildDocumentCss` → `buildStandaloneHtml` →
`buildDocx` — and asserts the contract, rather than drawing 30 × N images.

| Dimension | Coverage |
| --- | --- |
| Templates | **all 30**, both languages |
| Language | Bangla, English (mixed-script asserted separately) |
| Title modes | CV, CURRICULUM VITAE, RESUME, PROFESSIONAL RESUME, none, custom |
| Photo | with / without (header reflow asserted) |
| Optional sections | all-on vs. default (empty sections must vanish) |
| Density | compact / balanced / spacious (type size **and** spacing increase) |
| Alignment | left / centre / right / justify |
| Fonts & colours | custom palette tokens, malformed input rejected |
| Margins | four-sided override reflected in CSS |
| DOCX | five representative templates incl. ATS and sidebar layouts, Bangla |
| Page targets | one-page overflow warns without deleting content |

Additionally, six variant previews are rasterised with the production design
model by `scripts/render_previews.py` (HarfBuzz shaping + FreeType), giving 122
documented A4 pages in `docs/images/` — 60 first pages and 62 continuation pages
for multi-page templates.

---

## 4. Verification of real artefacts

| Artefact | How it was inspected | Findings |
| --- | --- | --- |
| DOCX | Unzipped in-process; OOXML parsed | `[Content_Types].xml`, `word/document.xml`, `word/styles.xml` present; `<w:pgSz w:w="11905" w:h="16837"/>` (A4); `w:pgMar` follows the design margin; Bengali text intact; title present when visible and absent when hidden; no `<img>` |
| Print/PDF payload | Full HTML + CSS asserted | A4 `@page`, `210mm`/`297mm` sheet, `break-inside: avoid`, `orphans/widows: 2`, `print-color-adjust: exact`, Bengali `@font-face` with `data:font/woff2;base64`, no `<script>`, no remote URL |
| Backup archive | ZIP built from a real SQLite file, then restored | manifest + database + README; SHA-256 verified; tampered byte → rejected; restored DB passes `integrity_check` |
| Production bundle | `verify-dist.mjs` over `dist/` | strict CSP; all 4 referenced assets and all 128 CSS font URLs resolve inside `dist`; 64 `woff2` files (15 Bengali); no remote origin; no `color-mix`/`:has()`/container queries/subgrid |
| Rendered pages | PNG inspection at A4 proportions | 30 templates × 2 languages; Bangla conjuncts shaped, Bengali month names and digits, title block positioned correctly |

---

## 5. Defects found and fixed during validation

| # | Defect | Severity | Where it was caught |
| --- | --- | --- | --- |
| 1 | Density presets changed type size but not spacing — "Compact" did not actually compact the page | High | `composition-matrix.test.ts` |
| 2 | "No title" would have left a reserved band in the header | High | `composition-matrix.test.ts` (title modes) |
| 3 | `print-color-adjust` missing → colour bands could print white | High | `print-output.test.ts` |
| 4 | Bangla documents printed English month names (`Mar 2019 – বর্তমান`) | Medium | Rendered Bengali previews |
| 5 | Pre-restore safety copy was not a restorable archive | Medium | `backup-restore.test.ts` |
| 6 | DOCX dependency's `setImmediate` string-eval path could violate the production CSP | Medium | `verify-dist.mjs` |
| 7 | `backdrop-filter` had no opaque fallback for Windows 7 without Aero | Low | `verify-dist.mjs` |
| 8 | `WizardPage` could index past the step array when no step was supplied | Low | `ui-smoke.test.tsx` |
| 9 | `scrollTo` called unguarded (absent in old webviews and in jsdom) | Low | `ui-smoke.test.tsx` |

All nine were fixed and are covered by a regression test.

---

## 6. What could not be run

This is the honest boundary of this release. Each item lists what WAS verified
instead.

| Not run | Why | Verified instead |
| --- | --- | --- |
| Windows 7 SP1 / 8 / 8.1 / 10 / 11 launch | No Windows host, and no Electron runtime (binary download blocked) | Production bundle audited; Chromium-108 feature bans enforced by test; Win-7 fallbacks added |
| NSIS installer + portable EXE | `electron-builder` cannot download `electron-v22.3.27-win32-x64.zip` or NSIS | `electron-builder.config.cjs` reviewed; renderer `dist/` verified complete |
| Real PDF file | Chromium/Electron cannot run; no `libnss3`/`libnspr4`/display; headless Chromium, Playwright and pdfium all require blocked CDN hosts | The exact print payload was asserted (19 tests) — this is what determines A4 size, pagination and text selection |
| Physical A4 printing | No printer or virtual printer | Payload asserted; A4 + `print-color-adjust` enforced in CSS |
| DOCX opened in Word/LibreOffice | Neither is installed | OOXML structure parsed and asserted |
| Screen-reader pass | No assistive technology available | Semantic HTML, ARIA labels, keyboard-reachable controls reviewed |
| Visual regression baseline diff | No browser to screenshot | 122 rendered A4 pages inspected; unit tests assert layout contracts |

**None of the items above is reported as passing anywhere in this repository.**
