# SHOHAN CV STUDIO

**A fully offline, Bangla-first CV / résumé studio for Windows.** Build professional
Bangladeshi-format CVs, design them in a live studio, and export editable DOCX,
searchable PDF or send them straight to an A4 printer — with no account, no
internet connection, no subscription and no telemetry.

<p align="center">
  <img src="docs/images/template-classic-professional-en.png" width="46%" alt="Classic Professional template" />
  <img src="docs/images/template-corporate-executive-bn.png" width="46%" alt="Corporate Executive template in Bangla" />
</p>

---

## What it does

| Area | Detail |
| --- | --- |
| **30 CV templates** | Each one a different composition — header, body grid, heading treatment, entry rhythm and typography — not the same page recoloured. A4 210 × 297 mm exactly. |
| **20-step wizard** | Guided data entry for personal details, **document title and page length**, photo, education, experience, skills, languages, training, projects and optional sections. |
| **Dynamic sections** | Optional sections are switchable, reorderable and support custom titles. A section that is empty or turned off **never** produces a heading, a rule or a blank page in any output format. |
| **Live studio** | Edit any field and see the A4 page update immediately. Undo/redo, zoom, fit-to-page, A4 and margin guides, template switching without touching your text. |
| **Document title** | CV / CURRICULUM VITAE / RESUME / PROFESSIONAL RESUME / no title / custom — with font, size, weight, colour, case, letter spacing, alignment, position, spacing, rules and background. "No title" removes the block completely; the header reflows. |
| **Page length** | Exactly one page, a two-page target, or automatic — with a page ceiling and per-section manual page breaks. A page target **never** deletes information; it warns instead. |
| **Section design** | Restyle one section without touching the rest: heading colour, alignment and size (0.8–1.25×), the gap above it (1–2.5×, add-only), dot/dash/square/no bullets and an optional page break. Reset returns the section to the template's exact look. |
| **Recommended order** | Seven orderings (fresher, experienced, executive, technical, academic, ATS-first, Bangladesh standard) that rearrange existing sections only — nothing is added, hidden or rewritten. |
| **Typography & spacing** | Ten font roles, exact point sizes, line height, four alignments, first-line indent, twelve spacing tokens, four-sided margins and compact/balanced/spacious density modes that change real layout parameters. |
| **Colour studio** | 13 palettes plus per-token overrides with a colour picker and HEX/RGB entry; save any look as a reusable preset. |
| **Inspection** | Layout diagnostics (overflow, orphan headings, duplicate skills, missing dates), an offline ATS suitability score and a ten-point quality checklist. |
| **Exports** | Editable `.docx` (real A4, selectable text, Bengali Unicode, footer page numbers), searchable `.pdf` (Chromium's own print-to-PDF), and direct printing with a preview. |
| **Customers & projects** | Save multiple projects per person, duplicate, soft-delete and restore. Search, filter and sort across everything. |
| **Backup** | One-click ZIP backup (database + manifest + SHA-256 verification), restore with an automatic safety copy of the current data first. A corrupted, foreign or newer-schema archive is rejected before anything is written. |
| **Offline only** | SQLite (sql.js) on disk, embedded fonts, no network code paths, no analytics, no activation. |

## Design system

The application UI and every CV template follow the same two rules:

- **Golden Ratio (φ = 1.618…) for composition** — major/minor splits, the type
  scale, card proportions.
- **The Golden Rules for usability** — hierarchy, contrast, alignment, 8-point
  spacing rhythm, and never decoration at the expense of legibility.

Themes: light, dark, or follow Windows. The layout is verified from 1024 × 768
through 1920 × 1080.

## Windows support

The desktop build uses **Electron 22.3.27 (Chromium 108, Node 16.17)**, the last
Electron line that runs on Windows 7. Both `ia32` (32-bit) and `x64` installers are
produced, plus a portable executable that needs no installation.

> **Honesty note:** the compatibility matrix in
> [`docs/COMPATIBILITY.md`](docs/COMPATIBILITY.md) marks every operating system as
> **Not tested** unless it was actually run during this build. Nothing in this
> repository claims a platform pass that was not observed.

## Getting started

```bash
npm install          # Node 18+ (dev only; the app itself ships Node 16 via Electron)
npm run dev          # http://localhost:5173 — browser preview
npm run desktop:dev  # Electron window with the real preload bridge
npm run build        # typecheck → production bundle → CSP injection
npm run verify       # typecheck + tests + build + bundle audit + feature audit
npm run verify:dist  # audit the shipped bundle (CSP, assets, fonts, offline, A4)
npm run audit        # assert every documented feature exists in the source
npm run docs:previews # regenerate the 122 documentation previews
npm run dist:win     # Windows installers into release/
```

> `npm run dist:win` downloads the Electron 22 runtime and NSIS from GitHub. In
> the environment where this release was prepared those hosts were unreachable,
> so **no installer artefact exists yet**. See
> [`docs/DELIVERY_REPORT.md`](docs/DELIVERY_REPORT.md).

Full instructions: [`docs/INSTALLATION.md`](docs/INSTALLATION.md).

## Documentation

| Document | Contents |
| --- | --- |
| [Installation Guide](docs/INSTALLATION.md) | Requirements, install, portable use, uninstall, data locations |
| [User Manual](docs/USER_MANUAL.md) | Every screen, the 20-step wizard, title and page-length controls, templates, exporting, backups |
| [Technical Documentation](docs/TECHNICAL.md) | Architecture, data model, render pipeline, security model |
| [Compatibility Matrix](docs/COMPATIBILITY.md) | Per-OS status, honestly marked |
| [Testing Report](docs/TESTING.md) | What was executed, what passed, what could not be run |
| [Known Issues](docs/KNOWN_ISSUES.md) | Current limitations and workarounds |
| [Release Notes](docs/RELEASE_NOTES.md) | What changed in 1.1.0 |
| [Delivery Report](docs/DELIVERY_REPORT.md) | Requirement-by-requirement status and what remains unverified |
| [Release Artefacts](docs/RELEASE_ARTEFACTS.md) | Installer/checksum status and how to produce them |

## Repository layout

```
electron/            Electron main process + preload bridge (contextIsolation on)
src/database/        SQLite schema (v2), engine, repository (28 tables)
src/document/        HTML/print renderer, CSS builder, DOCX exporter
src/templates/       30-template catalogue, palettes, font pairs
src/features/        Screens: dashboard, wizard, gallery, editor, projects,
                     customers, exports, backup, settings, help
src/lib/             Golden-ratio maths, section engine, composition tokens,
                     layout report, ATS checks, backup format, colour maths
scripts/             CSP injection, font builder, preview renderer, bundle
                     verifier, feature audit
tests/               Vitest suites — 18 files / 229 tests
docs/                Deliverable documentation + generated template previews
```

## Licence and fonts

Application code © 2026 SHOHAN CV STUDIO. Bundled typefaces — Inter, Lora, Noto
Sans Bengali and Noto Serif Bengali — are used under the SIL Open Font License
1.1; the licence texts ship in [`src/assets/fonts/`](src/assets) and are credited
in Settings → About.
