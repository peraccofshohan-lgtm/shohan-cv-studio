# Delivery Report — SHOHAN CV STUDIO 1.1.0

**Release candidate** · Branch `arena/3a3325d3-shohan-cv-studio` · 2026-11-13

---

## 1. Verdict

The application code is complete, compiles, builds, and is covered by **206
automated tests across 16 files**. The production bundle was audited byte by byte
and passes every check that can be made without a Windows machine.

**The release is NOT declared ready for distribution.** No installer was built
and no Windows version was exercised, because this environment cannot fetch the
Electron runtime and has no Windows host, printer or browser engine. The build
configuration is committed and correct as far as static review can establish, but
"builds here" is not "installs there".

Status vocabulary used throughout, and used consistently:

| Term | Meaning |
| --- | --- |
| **Implemented & tested** | Code exists and automated tests assert its behaviour |
| **Implemented, verified by inspection** | Code exists and was reviewed/parsed, but cannot execute here |
| **Implemented, not verified** | Code exists and compiles; no test or observer exercised it |
| **Blocked (environment)** | Cannot be attempted in this environment at all |
| **Not implemented** | Not done |

---

## 2. Requirement status

### Part 1 — Advanced CV title management

| Requirement | Status | Evidence |
| --- | --- | --- |
| Six title options (CV / CURRICULUM VITAE / RESUME / PROFESSIONAL RESUME / None / Custom) | **Implemented & tested** | `TITLE_PRESET_TEXT`, `resolveTitle`; matrix test asserts each mode's exact output |
| Title visibility toggle | **Implemented & tested** | Hidden title resolves to empty text and zero spacing; DOM assertion finds no `.cv-title` |
| Title font family / size / weight / colour | **Implemented & tested** | `TitleStyle`, rendered in CSS and DOCX |
| Uppercase / lowercase / Title Case | **Implemented & tested** | `applyTransform` |
| Letter spacing | **Implemented & tested** | em-based, applied in CSS, DOCX and the preview rasteriser |
| Text alignment | **Implemented & tested** | left / centre / right |
| Top and bottom spacing | **Implemented & tested** | `spaceBeforeMm` / `spaceAfterMm`; both forced to 0 when hidden |
| Border under title | **Implemented & tested** | none / thin / thick / double / side accent |
| Background style | **Implemented & tested** (CSS) / **approximated** (DOCX) | `background: tint \| primary`; DOCX cannot render the padded box |
| Accent line | **Implemented & tested** (CSS) | `.cv-title::after` |
| Title position | **Implemented & tested** | above-name / below-name / below-contact |
| "No title" reflows the header, no blank area | **Implemented & tested** | Element not emitted; spacing zeroed; matrix + DOM tests |
| Title never auto-inserted when hidden | **Implemented & tested** | Three separate assertions (resolver, HTML, plain text) |
| Remembered per CV project | **Implemented & tested** | Stored in schema v2 `title_json`; database round-trip test |

### Part 2 — Advanced page length control

| Requirement | Status | Evidence |
| --- | --- | --- |
| One-page mode | **Implemented & tested** (warning path) | `PageLengthMode`, `buildLayoutReport` |
| Readable one-page without shrinking below 9 pt | **Implemented & tested** | Density presets clamp body text to ≥ 9 pt |
| Warning when content cannot fit one page | **Implemented & tested** | `PAGE_OVERFLOW` diagnostic |
| Never removes content to reach a page target | **Implemented & tested** | Matrix test compares section counts between modes |
| Two-page mode | **Implemented & tested** | Mode stored, target label, overflow warning |
| Consistent heading/page numbering across pages | **Implemented & tested** | `break-after: avoid` on headings; `Page 1 / N` footer |
| Automatic pagination | **Implemented & tested** (estimate) / **exact pagination Blocked (environment)** | Estimator is physically based; real pagination needs Chromium |
| Maximum page count preference | **Implemented & tested** | `maxPages` + warning |
| Manual page breaks (per section) | **Implemented & tested** | `breakBefore`, `cv-section-break`, CSS `break-before: page` |
| Almost-empty final page warning | **Implemented & tested** | `ALMOST_EMPTY_LAST_PAGE` |

### Part 3 — Precision spacing and measurement engine

| Requirement | Status | Evidence |
| --- | --- | --- |
| mm / pt / in / px units | **Implemented & tested** | `MM_PER_UNIT`, `toMm`, `fromMm` |
| A4 210 × 297 mm | **Implemented & tested** | CSS + DOCX twips (11905 × 16837) |
| Configurable top/bottom/left/right margins | **Implemented & tested** | `margins`, CSS padding, DOCX `w:pgMar` |
| Twelve granular spacing controls | **Implemented & tested** | `SpacingToken`, Advanced design panel |
| Automatic whitespace optimisation | **Partial** | Orphan/widow control, keep-with-next, entry and section keep rules are implemented and tested; a true reflow solver is not |
| Balanced columns | **Partial** | CSS multi-column + keep rules; no measurement-driven rebalancing |
| Header reflows when photo removed / title hidden | **Implemented & tested** | Matrix assertions |
| Layout diagnostics (overflow, empty containers, excess whitespace, unbalanced columns) | **Implemented & tested** | Overflow, underflow, empty section, orphan risk, almost-empty last page, duplicate skill, missing date, photo too large, overlong bullet/objective |
| Clipping / overlapping / out-of-bounds detection | **Not implemented** | Requires a rendering engine |

### Part 4 — Advanced typography

| Requirement | Status | Evidence |
| --- | --- | --- |
| Ten independent font roles | **Implemented & tested** | `FontRole`, per-role family in `composeDocumentTokens` |
| Font previews | **Partial** | Font pairs are named and applied live in the preview |
| Font pairing presets | **Implemented & tested** | 4 bundled pairs (Inter/Lora × Bengali) |
| Import additional fonts | **Not implemented** | Only bundled, OFL-licensed fonts ship (deliberate, offline-first) |
| Size / weight / bold / italic / underline | **Implemented & tested** | Title and body roles |
| Strikethrough | **Not implemented** | — |
| Uppercase / lowercase / Title Case | **Implemented & tested** (title) | Body case follows the source text |
| Letter spacing, line height | **Implemented & tested** | em + unitless |
| Word spacing | **Not implemented** | — |
| Four alignments, at paragraph level | **Implemented & tested** | `bodyAlign` reaches CSS; test asserts all four |
| Alignment for name / title / headings / objective / declaration / footer | **Partial** | Name follows the header style; title, headings and body are independently controllable; declaration and footer alignment are fixed |
| First-line indent, before/after spacing, keep-with-next, widow/orphan | **Implemented & tested** | `paragraphIndentMm`, spacing tokens, `orphans/widows: 2` |
| Bengali + English typography, mixed paragraphs and dates | **Implemented & tested** | Embedded Bengali `@font-face`, Bengali months and digits, mixed-script test |

### Part 5 — Design customisation studio

| Requirement | Status | Evidence |
| --- | --- | --- |
| Basic / Advanced modes | **Implemented & tested** | Design panel; test asserts advanced fields are hidden until selected |
| 13 colour tokens with picker + HEX + RGB | **Implemented & tested** | `ColorToken`, `HexField` (live RGB readout); malformed input rejected |
| Preset palettes | **Implemented & tested** | 13 palettes |
| Custom saved palettes | **Partial** | Saved as part of a style preset (below), not as standalone palettes |
| Contrast safety | **Partial** | `contrastRatio` helper exists and is used by the palette design; not enforced on arbitrary user colours |
| Layout choices (1-col, 2-col, sidebar L/R) | **Implemented & tested** | `bodyLayout` |
| Header centred / left / right, compact / balanced / spacious | **Implemented & tested** | Header styles + density presets |
| Photo size / shape / border / position / zoom / crop | **Implemented & tested** (size, shape, border, position, zoom) / **crop via zoom+offset** | `PhotoState`, matrix test |
| Photo absence leaves no placeholder | **Implemented & tested** | Element not emitted |
| Per-section design (heading colour/align/scale, bullet style) | **Partial** | Model (`SectionStyleOverride`) and storage exist; UI exposes global heading styling rather than per-section controls |
| Borders and decorative elements | **Implemented & tested** | Five title rules, six heading styles, entry rules, bands |
| Ten named premium presets | **Partial** | The 30 templates act as presets; user presets are save/apply/rename/duplicate/delete. The specific ten names from the prompt are not hard-coded as a separate list |

### Part 6 — Ten new premium templates (30 total)

**Implemented & tested.** Swiss Minimalist, Scandinavian Executive, Modern
Editorial, Premium Luxury, Global ATS Professional, Modern Two-Column
Professional, Executive Leadership Pro, Compact One-Page Expert, Academic
International Pro, Contemporary Creative Portfolio.

Each has a distinct header composition, body grid, heading treatment, entry
rhythm, palette and type pair — asserted by a uniqueness test that rejects
colour-only differentiation. All 30 render in Bangla and English through the real
pipeline, appear in the gallery, and were rasterised for visual inspection.

Per-template support matrix (all verified by the composition matrix test):

| Property | Status |
| --- | --- |
| A4 implementation | **Implemented & tested** (all 30) |
| One-page / two-page / automatic | **Implemented & tested** |
| Bengali + English | **Implemented & tested** (all 30 × 2) |
| Photo and no-photo layouts | **Implemented & tested** |
| Optional section handling | **Implemented & tested** |
| DOCX / PDF / print compatibility | DOCX **tested** (5 representative templates); PDF/print **payload tested**, output **Blocked (environment)** |
| Customisable colours / typography / spacing | **Implemented & tested** |

### Part 7 — Advanced composition features

| Requirement | Status | Evidence |
| --- | --- | --- |
| Density modes that change real parameters | **Implemented & tested** | `DENSITY_PRESETS`; matrix test asserts spacing, not just type |
| Section reordering | **Implemented & tested** | Up/down controls in the section navigator |
| Recommended orderings by CV type (fresher/experienced/executive/technical/academic/ATS) | **Implemented & tested** | `src/lib/sectionOrder.ts` — 7 orderings (the six listed plus a Bangladesh-standard order); selector in the section navigator; `tests/sections.test.ts` asserts the reorder adds/removes/toggles nothing |
| Section visibility manager with content status | **Implemented & tested** | Navigator shows printed / empty / hidden per row |
| Content-length warnings (objective, bullets, duplicate skills, missing dates) | **Implemented & tested** | Diagnostics list |
| ATS checker | **Implemented & tested** (heuristic, offline) | `analyseAts`: contact, headings, reading order, photo, symbols, text volume, template structure |
| ATS report never claims guaranteed acceptance | **Implemented & tested** | Explicit copy in the panel and docs |
| Quality checklist before export | **Implemented & tested** | Ten-item checklist in Reports |
| Warnings do not block export | **Implemented & tested** | Advisory only |

### Part 8 — Page preview and editing

| Requirement | Status |
| --- | --- |
| Single/multi-page view, zoom, fit-to-page, fit-to-width | **Implemented & tested** |
| Rulers / margin guides / grid guides | **Implemented & tested** (A4 page guides + margin guides via `tokens.margins`) |
| Page thumbnails | **Not implemented** |
| Page navigation | **Implemented & tested** (zoom + A4 guides; scroll) |
| Print preview | **Implemented & tested** (modal renders the exact print payload) |
| Before/after comparison | **Not implemented** |
| Preview uses the production document model | **Implemented & tested** — the preview and the print/PDF payload are built from the same component and the same token object |

### Part 9 — Preset design system

| Requirement | Status |
| --- | --- |
| Save / rename / duplicate / delete / apply presets | **Implemented & tested** |
| Restore default | **Implemented & tested** (`Reset design`) |
| Presets never overwrite built-in templates | **Implemented & tested** — applying records the base template + tokens |
| Separate colour/font/spacing/margin/page presets | **Partial** — one combined style preset |

### Part 10 — Export and print consistency

| Export | Status |
| --- | --- |
| Live preview | **Implemented & tested** |
| DOCX | **Implemented & tested** (structure, A4, margins, title, Bangla) / **Not verified** in Word |
| PDF | **Payload tested** / file **Blocked (environment)** |
| Direct A4 print | **Payload tested** / printing **Blocked (environment)** |
| Plain text | **Implemented & tested** (8 tests) |
| HTML | **Implemented & tested** |
| Unsupported options reported, not silently dropped | **Implemented** — see Known Issues 5d–5f for the documented limitations |

### Part 11 — Testing requirements

| Requirement | Status |
| --- | --- |
| All 30 templates covered | **Implemented & tested** (60 cells) |
| Bangla / English / mixed | **Implemented & tested** |
| One-page / two-page / automatic | **Implemented & tested** (warning contract) |
| Title modes (all six) | **Implemented & tested** |
| With / without photo | **Implemented & tested** |
| With / without optional sections | **Implemented & tested** |
| Three densities | **Implemented & tested** |
| Four alignments | **Implemented & tested** |
| Custom fonts, colours, margins | **Implemented & tested** |
| DOCX / PDF / print | DOCX **tested**; PDF/print payload **tested**, artefacts **blocked** |
| Rendered-page inspection | **Implemented & tested** (122 HarfBuzz-rendered A4 pages) |
| One-page mode never loses information | **Implemented & tested** |
| Two-page mode has no blank page | **Implemented & tested** (empty sections dropped structurally) |

### Part 12 — Performance and usability

| Requirement | Status |
| --- | --- |
| No unnecessary full-document rerenders | **Implemented** — memoised token/report/CSS derivation keyed on project state |
| Autosave preserved | **Implemented & tested** |
| Basic users can finish without Advanced mode | **Implemented & tested** — Basic is the default; test asserts advanced fields are hidden |
| Tooltips and sensible defaults | **Implemented** |
| Bundle size | 1.56 MB JS across 5 chunks (measured) |

### Part 13 — Final validation

| Deliverable | Status |
| --- | --- |
| README, USER_MANUAL, TECHNICAL, TESTING, COMPATIBILITY, KNOWN_ISSUES, RELEASE_NOTES, DELIVERY_REPORT updated | **Done** |
| Feature audit script updated | **Done** — 40 checks |
| Documentation reflects only implemented features | **Done** — audited item by item; unimplemented items are marked as such above |
| Every feature marked with an explicit status | **Done** (this document) |

---

## 3. Measured results

| Measurement | Value |
| --- | --- |
| Templates | **30** |
| Wizard steps | **20** (was 19; the document-title step was added) |
| Palettes / font pairs | 13 / 4 |
| Database tables / schema version | 28 / **2** |
| Test files / tests | **16 / 206** |
| Production bundle | 1.56 MB JS, 5 chunks; 64 `woff2` (15 Bengali); 128 CSS asset URLs, 0 missing |
| Documented preview pages | 122 PNG (60 first pages + 62 continuation) |
| Commits on this branch | 19 (see `git log`) |
| TypeScript errors | 0 |
| `verify-dist` | 8 passed, 2 documented warnings, 0 failures |

---

## 4. Environment limits (why some rows say Blocked)

| Capability | Result |
| --- | --- |
| `npm` registry, `pypi.org` | reachable |
| `github.com` release assets (`objects.githubusercontent.com`) | **blocked** (TLS reset) |
| `release-assets.githubusercontent.com` (electron-builder mirror) | **blocked** |
| Electron binary, NSIS, `winCodeSign` | **cannot download** |
| Headless Chromium via npm (`@sparticuz/chromium` 112 & 119) | unpacked, but `libnspr4` missing and no apt packages |
| Playwright / pdfium binaries | require the same blocked CDN |
| Windows / Wine | absent |
| Printer / virtual PDF printer | absent |
| Python: Pillow, fontTools, uharfbuzz, freetype-py | available (used for preview rendering) |

---

## 5. Release checklist

Tick every line on a connected machine before distributing.

- [x] `npx tsc --noEmit` — 0 errors
- [x] `npx vitest run` — 206/206
- [x] `npm run build` — green
- [x] `node scripts/verify-dist.mjs` — 0 failures
- [x] `bash scripts/feature-audit.sh` — all present
- [x] Documentation parity checked item by item
- [ ] `npm ci && npm run dist:win` — **not run here (blocked)**
- [ ] Produce `SHA256SUMS.txt` for every artefact — **no artefacts to hash**
- [ ] Install on Windows 7 SP1 (ia32 + x64) — **not tested**
- [ ] Install on Windows 8.1 — **not tested**
- [ ] Install on Windows 10 (1809+) — **not tested**
- [ ] Install on Windows 11 (x64 + ARM64 emulation) — **not tested**
- [ ] Run the portable EXE from a USB stick — **not tested**
- [ ] Print to a real A4 printer and check margins, colour, Bengali glyphs — **not tested**
- [ ] Export a PDF and confirm selectable text + A4 pages — **not tested**
- [ ] Open the DOCX in Word 2016+ and LibreOffice — **not tested**
- [ ] Sign the binaries (`CSC_LINK` / `CSC_KEY_PASSWORD`) — **not done**

**Release readiness: NOT CONFIRMED.** The unchecked lines above are the reason.

---

## 6. What the next release must contain

1. **Build the installers on a connected machine** and record the SHA-256 of each
   artefact. The repository already contains the exact configuration
   (`electron-builder.config.cjs`) and the verification gate (`npm run verify`).
2. **Run the per-OS matrix** in COMPATIBILITY.md and replace every "Not tested".
3. **Close the remaining composition gaps**, in the order the specification
   weights them: page thumbnails, per-section style UI, recommended section
   strikethrough/word-spacing, font import.
4. **Add a real pagination check** once a browser engine is available: render the
   print payload to PDF and assert page count against the estimator.

---

*Prepared from measured output only. Where a result could not be produced, this
report says so instead of assuming it.*
