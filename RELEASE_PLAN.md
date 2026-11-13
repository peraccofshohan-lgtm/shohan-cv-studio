# RELEASE VALIDATION + ULTRA UPGRADE — working plan

Status ledger. Updated as work lands. Every row must end in one of:
**Implemented & Tested** / **Implemented, not fully tested** / **Partially implemented** / **Not implemented** / **Blocked (environment)**.

## 0. Environment reality (measured in this sandbox)

| Capability | Result |
| --- | --- |
| `tsc --noEmit`, `vitest run`, `vite build` | available, green |
| Node/npm registry | reachable (`npm ping` → pong) |
| `github.com` release redirect → `objects.githubusercontent.com` | **blocked** (TLS reset / EOF) |
| `release-assets.githubusercontent.com` (electron-builder mirror) | **blocked** |
| Electron binary download (`node node_modules/electron/install.js`) | **fails**: `unable to verify the first certificate` |
| `electron-builder --win` | **fails**: cannot download `electron-v22.3.27-win32-x64.zip` |
| NSIS / `winCodeSign` downloads (needed for installer) | **blocked** |
| Chromium / headless browser | not installed; `libnss3`, `libnspr4`, `libgbm` absent; apt has no packages |
| Windows / Wine | absent |
| Python: Pillow, fontTools, uharfbuzz, freetype-py | available (HarfBuzz shaping works) |

Consequence: **no .exe can be produced or executed in this environment**, and no
Windows OS can be exercised. Those items are reported as *Blocked (environment)*
— never as passed. Everything that can be verified without a Windows host is
verified with real code paths (DOCX ZIP/OOXML parsing, standalone print HTML,
HarfBuzz-rendered A4 page bitmaps, sql.js persistence round-trips).

## 1. Gap audit against the Ultra prompt

| Part | Item | Current state | Action |
| --- | --- | --- | --- |
| 1 | CV title text/visibility per project | missing | implement |
| 1 | Title styling (font, size, weight, colour, case, spacing, alignment, rules, background, accent) | missing | implement |
| 1 | "No title" reflows header (no blank band) | missing | implement |
| 2 | One-page / two-page / automatic page-length modes | missing | implement |
| 2 | Never silently drop content on page target | missing | implement (warn, never drop) |
| 2 | Manual page breaks, section-level breaks | missing | implement |
| 3 | mm/pt/in measurement model, A4 210×297, configurable margins | partial (mm only, single margin value) | extend to 4 margins + unit helpers |
| 3 | Granular spacing controls | partial (sectionSpacing, lineHeight) | add the rest |
| 3 | Whitespace/orphan/widow engine + balanced columns | partial (break-inside rules) | implement + diagnostics |
| 3 | Layout diagnostics panel | missing | implement |
| 4 | Per-role font families (name/title/heading/body/…) | partial (2 font slots) | implement role map |
| 4 | Size/weight/italic/underline/caps/letter-spacing/line-height | partial | implement |
| 4 | Alignment (name, title, headings, body, objective, declaration, footer) | partial (justified body only) | implement |
| 4 | Paragraph formatting (indents, spacing, keep-with-next, widow/orphan) | partial | implement |
| 5 | Full colour control incl. HEX/RGB input | partial (9 palettes) | implement custom palette |
| 5 | Layout presets, density modes | partial | implement |
| 5 | Photo size/shape/border/position/zoom/crop | partial | extend |
| 5 | Per-section design overrides, borders, decorations | done (colour/align/scale/gap/bullets/page break) | — |
| 5 | Saved style presets (template_settings table already exists) | missing UI | implement |
| 6 | 10 new premium templates → 30 total | 20 exist | implement 10 |
| 7 | Density modes adjust real layout params | missing | implement |
| 7 | Section reorder + recommended orders by CV type | done (up/down + 7 named orderings) | — |
| 7 | Section visibility manager with content status | partial | extend |
| 7 | Content-length assistance warnings | missing | implement |
| 7 | ATS checker | missing | implement |
| 7 | Quality checklist | missing | implement |
| 8 | Page view modes, zoom, thumbnails, rulers, guides, print preview | done (thumbnails + page rail added) | — |
| 9 | Preset library (save/rename/duplicate/delete/apply/restore) | missing | implement |
| 10 | Exporters honour title/page-length/typography/colours | partial | implement + limitation reporting |
| 11 | 30-template test matrix + visual regression | 20 templates | extend |
| 13 | Docs parity + honest status | done for v1.0 scope | update for v1.1 |

## 2. Execution order

1. Title + page-length model (types → defaults → resolver → CSS → exporters) — *must be first: everything else composes on it.*
2. Typography/alignment/spacing token model + CSS builder.
3. Colour overrides + presets + density.
4. 10 new templates + gallery.
5. Page-length engine + diagnostics.
6. ATS checker + quality checklist + content warnings.
7. Preset library UI (uses existing `template_settings` table — no schema break).
8. Exporters (docx/pdf/print/html/text) wired to every new token.
9. Tests: matrix harness, layout contracts, visual page inspection.
10. Docs + release artefacts + checksums; honest status table.


## 3. Final ledger (1.1.0)

| Item | Status |
| --- | --- |
| Title management (Part 1) | Implemented & tested |
| Page length (Part 2) | Implemented & tested (one-page warning contract) |
| Spacing/measurement (Part 3) | Implemented & tested; reflow solver partial |
| Typography (Part 4) | Implemented & tested; font import not implemented (bundled fonts only) and documented as such |
| Design studio (Part 5) | Implemented & tested |
| 10 new templates (Part 6) | Implemented & tested — 30 total |
| Composition features (Part 7) | Implemented & tested |
| Preview controls (Part 8) | Implemented & tested |
| Preset library (Part 9) | Implemented & tested (combined preset) |
| Export consistency (Part 10) | Preview/DOCX/HTML/text tested; PDF+print payload tested; PDF file/print blocked (environment) |
| Test matrix (Part 11) | Implemented & tested — 253 tests, 60 matrix cells, 122 rendered pages |
| Performance/usability (Part 12) | Implemented; measured bundle 1.56 MB |
| Docs (Part 13) | Complete, with explicit per-feature status |
| Installers | **Blocked (environment)** |
| Windows OS testing | **Blocked (environment)** |
