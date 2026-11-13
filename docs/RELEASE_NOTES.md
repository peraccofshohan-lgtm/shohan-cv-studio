# Release Notes — SHOHAN CV STUDIO

## 1.1.0 — Studio release (2026-11-13)

The 1.0 release proved the pipeline: offline Windows app, 20 templates, 19-step
wizard, DOCX/PDF/print export, customer records and backups. 1.1 turns it into a
document-composition tool: 30 designs, complete control over the title, the page
length, the typography, the spacing and the colours, plus inspection tools that
tell the operator what is wrong before the CV is sent.

### Highlights

| Area | What is new |
| --- | --- |
| Templates | **30** designs (10 new: Swiss Minimalist, Scandinavian Executive, Modern Editorial, Premium Luxury, Global ATS Professional, Modern Two-Column Professional, Executive Leadership Pro, Compact One-Page Expert, Academic International Pro, Contemporary Creative Portfolio) |
| Document title | Six title modes (CV / CURRICULUM VITAE / RESUME / PROFESSIONAL RESUME / No title / Custom) with full styling: font, size, weight, italic, underline, colour, letter case, letter spacing, alignment, position, spacing, rules, background and accent line |
| Page length | Exactly one page / target two pages / automatic, with a page ceiling and per-section manual page breaks |
| Typography | Per-role font families (name, title, heading, subheading, body, contact, dates, bullets, footer, page numbers), exact point sizes, line height, body alignment (left/centre/right/justify), first-line indent, plus title strikethrough and Latin-only word spacing |
| Section control | Seven recommended orderings, a per-section design panel (heading colour/align/size, gap, bullet marker, page break) and the visibility manager |
| Preview | Real page-thumbnail rail and a before/after comparison against the state the project was opened in |
| Presets | Ten named looks, user-saved presets, and standalone colour palettes (schema v3) |
| Spacing | Twelve independent spacing tokens, four-sided page margins, and three density presets that change real layout parameters |
| Colour | Nine built-in palettes with 13 colour tokens each, per-token overrides (picker + HEX/RGB), ten named presets and standalone saved palettes |
| Inspection | Layout diagnostics, ATS suitability score, quality checklist and content-length warnings |
| Presets | Save / apply / rename / duplicate / delete reusable style presets |
| Preview | Fit-to-page, fit-to-width, zoom, A4 page guides and margin guides |
| Wizard | New step 2 — *Document Title & Length* — so the title and page target are chosen at creation time |

### Where the design changes are honoured

Every control reaches the live preview, PDF, print, HTML and DOCX from **one**
resolved token object (`composeDocumentTokens`). A test asserts DOCX/HTML parity
per template, so the exporters cannot silently drift.

Plain-text export deliberately drops visual formatting and keeps reading order,
as the specification requires; it does carry the document title because the title
is part of the reading order.

### Fixes found during release validation

1. **Density was cosmetic.** The compact/balanced/spacious presets scaled type
   but not spacing. Found by the new composition matrix test; spacing tokens now
   follow density.
2. **Title could leave a reserved band.** "No title" is now resolved to an empty
   element with zero space before/after, so the header reflows.
3. **`print-color-adjust`** was missing from the document stylesheet, so colour
   bands and rules could print white. (Also fixed in 1.0.1.)
4. **Bangla dates printed in English.** `formatPeriod` hard-coded `en-GB`.
   Bangla documents now render `মার্চ ২০১৯ – বর্তমান` with Bengali digits.
5. **Pre-restore safety copy was not restorable.** It is now built with the same
   archive format as a manual backup.
6. **`setImmediate` polyfill could violate the CSP.** The DOCX dependency carries
   a string-eval fallback; `src/main.tsx` installs a `setTimeout` implementation
   before the bundle evaluates.
7. **Wizard could index past the step array** if no step was supplied.
8. **`backdrop-filter` had no opaque fallback** for Windows 7 without Aero.

### Verification status

`tsc --noEmit` clean · `vitest run` **251 tests / 21 files** · production build
green · `scripts/verify-dist.mjs` 8 passed / 2 warnings / 0 failures.

**Not verified:** no Windows OS, no installed printer, no Electron runtime and no
Chromium was available in the build environment, so installers were not produced,
a real PDF was not generated, and no OS-level test was run. See
`DELIVERY_REPORT.md` for the per-item status — nothing untested is marked as
passing.

### Upgrade notes

- The database schema moves to **v2**. The migration is additive
  (`ALTER TABLE ... ADD COLUMN`), idempotent, and existing projects open with
  default title/page-length settings. Back up before upgrading, as always.
- Existing projects keep their current template and design; the new controls
  apply from the defaults until changed.

---

## 1.0.1 — Print and coverage fixes

- `print-color-adjust: exact` so bands, rules and chips survive printing/PDF.
- Bangla month names and Bengali digits in all date output.
- Page guides, plain-text export and HTML export wired to real controls.
- `Ctrl/Cmd+N` opens the wizard.
- Regression suite grown to 66 tests including print-payload and UI mount tests.

## 1.0.0 — First release

- Offline Electron 22 desktop app for Windows 7 SP1 – 11 (ia32 + x64), plus a
  portable build.
- 20 A4 templates, 19-step wizard with 13 optional steps, dynamic section engine
  (no empty headings, no blank pages).
- DOCX (editable OOXML), PDF, direct A4 printing, HTML and plain-text export.
- Customer records, projects with search/filter/sort, duplication, soft delete,
  version history and export history.
- Backup and restore with SHA-256 verification and a pre-restore safety copy.
- Bangla-first interface (Bangla/English), light and dark themes, golden-ratio
  design system with an 8 pt spacing scale.
- Documentation set: README, Installation, User Manual, Technical, Compatibility,
  Testing, Known Issues, Release Notes.
