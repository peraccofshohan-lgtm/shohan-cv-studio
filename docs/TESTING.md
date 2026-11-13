# Testing Report — SHOHAN CV STUDIO 1.0.0

Build under test: branch `arena/3a3325d3-shohan-cv-studio`, version 1.0.0.
Test host: Linux container, Node.js 22.22.3, no display server, no printer, no
Windows runtime.

> This report separates **what was executed** from **what could not be executed**.
> Nothing here is inferred. Where a result is missing, the reason is given.

---

## 1. Automated results (executed)

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | **PASS** — 0 errors |
| `npx vitest run` | **PASS** — 11 files, **68 tests** |
| `npm run build` | **PASS** — typecheck → Vite bundle → CSP injected into `dist/index.html` |
| `python3 scripts/render_previews.py` | **PASS** — 80 page images across 40 template × language combinations |

### Suite detail

| File | Tests | What it proves |
| --- | --- | --- |
| `tests/smoke.test.ts` | 3 | App identity/version, embedded font payload present, default CV is structurally valid |
| `tests/sections.test.ts` | 14 | Empty sections never print; disabled sections never print; user ordering preserved; title overrides; Bangla/English headings; partial entries; period formatting (open, closed, malformed) |
| `tests/docx.test.ts` | 3 | DOCX is a valid ZIP; A4 page size in twips (±3 tolerance); document.xml contains real text; **no image parts**; Bengali strings intact; footer page fields present |
| `tests/database.test.ts` | 7 | 28-table schema + `PRAGMA integrity_check`; full project round-trip across normalised tables; cascade delete; version history & restore; customer soft delete/restore; settings JSON round-trip; export logging and counts |
| `tests/regression.test.ts` | 3 | SQL parameters bound in appearance order; `$`-prefixed keys accepted; Bangla byte-exact round-trip (`মোঃ রফিকুল ইসলাম`) |
| `tests/design.test.ts` | 16 | φ = 1.6180339887; golden split; 8-point grid; A4 tokens; **no `color-mix()`, container queries, `@layer`, `subgrid`, `:has()`** anywhere in `src/`; ES2019 target; 20 unique templates; no palette-only differentiation; ATS templates photo-free and graphic-free |
| `tests/emit-models.test.ts` | 1 | Both document languages × 20 templates produce preview models |
| `tests/text-export.test.ts` | 6 | Plain-text export mirrors the printable document: name/contact block, empty- and disabled-section suppression, user order, sensitive fields hidden unless enabled, timeline formatting, no trailing blank-line noise |
| `tests/print-output.test.ts` | 7 | The self-contained print/PDF document: complete HTML, A4 page rule, embedded `@font-face` data (including the Bengali face), real selectable text (no `<img>`), byte-exact Bangla, no heading for an emptied section, explicit print-colour-adjust, and screen guides suppressed in print |
| `tests/ui-smoke.test.tsx` | 7 | React screens actually mount: dashboard renders Bangla and English, the gallery lists all 20 templates, the editor mounts a `.cv-paper` carrying the user's name, the section navigator is populated, the A4 guides toggle works, and a switched-off section disappears from the page |
| `tests/docs-images.test.ts` | 1 | Documentation preview generation runs offline |

### Notable defects caught by these tests (and fixed)

1. **Silent Bengali data loss.** The SQL parameter binder sorted named parameters
   alphabetically while sql.js binds positionally. Statements with more than 26
   parameters wrote empty strings into `personal_information`. Fixed by rewriting
   the binder to follow SQL appearance order; locked by `tests/regression.test.ts`.
2. **Chromium 111+ CSS.** 22 `color-mix()` declarations would have failed silently
   on Electron 22/Chromium 108 (Windows 7 target). Replaced with pre-computed
   tokens; `tests/design.test.ts` now fails the build if they return.
3. **CSP breaking development.** A static `script-src 'self'` meta tag blocked
   Vite's dev preamble and HMR websocket. Moved to build-time injection via
   `scripts/inject-csp.mjs`.
4. **Print colour would have dropped.** `print-color-adjust: exact` was missing
   from the document stylesheet, so header bands, rules and skill chips could
   print white in some drivers. Added, and locked by `tests/print-output.test.ts`.
5. **English dates inside Bangla CVs.** `formatPeriod` always used
   `toLocaleDateString('en-GB')`, so a fully Bangla CV printed "Mar 2019 – বর্তমান".
   Dates are now localised through one helper (`মার্চ ২০১৯ – বর্তমান`) with Bengali
   digits, and every exporter and the preview pick it up automatically.
6. **Preview/layout drift.** The documentation renderer initially used its own type
   sizes and drifted from the product. It now reads the millimetre metrics from
   `src/document/styles.ts` and shapes text with HarfBuzz, the same stack Chromium
   uses, and paginates with the same "never split a section" rule.

---

## 2. What could not be run — and why

| Activity | Status | Reason |
| --- | --- | --- |
| Launching the Electron app | **Not run** | The Electron runtime cannot be downloaded here (network/TLS blocked) and the container has no GTK/NSS/X display libs |
| Installing the NSIS installer / portable EXE on Windows | **Not run** | No Windows host available; binaries could not even be produced (requires the Electron runtime) |
| Printing to a real A4 printer | **Not run** | No printer, no CUPS, no Windows spooler |
| Generating a real PDF | **Not run** | Requires the Electron/Chromium print pipeline |
| Opening the DOCX in Microsoft Word / LibreOffice | **Not run** | Neither is installed; DOCX verified structurally by unzipping and asserting the XML |
| Visual browser QA of the app UI (screenshots) | **Not run** | No usable headless browser: the bundled Chromium needs `libnss3`/`libnspr4`, and package installation from `deb.debian.org` fails |
| Windows 7 / 8 / 8.1 / 10 / 11 behaviour | **Not run** | No Windows machine |
| 1024×768 → 1920×1080 rendering on hardware | **Not run** | No display; layout rules reviewed statically |

**Consequence:** no platform, installer or print result is claimed as passed.
See [COMPATIBILITY.md](COMPATIBILITY.md), where every such row is **Not tested**.

What *was* possible, and was done instead:

* The complete renderer runs in a real browser environment during development
  (Vite dev server on `0.0.0.0:5173`, verified to serve `/` and `/src/main.tsx`
  with HTTP 200).
* Rendering of every template was verified through the HarfBuzz/FreeType preview
  pipeline, which uses the *production* design model and metrics — see
  `docs/images/` (40 combinations, 80 pages, including multi-page overflow).
* Bengali shaping was verified by rendering conjunct-heavy strings
  (`মার্চ ২০১৯ – চলমান`, `শিক্ষাগত যোগ্যতা`) and inspecting the output.

---

## 3. Manual smoke checklist

To be executed by the release operator on **each** claimed OS. Record
`Passed`, `Failed (with symptom)` or `Not tested` and attach it to the release.

### A. Installation
1. Run the installer on a clean machine. Does it complete without elevation?
2. Launch from the Start Menu. Does the window open at a usable size?
3. Repeat with the portable EXE from a USB drive.

### B. Data
4. Create a new CV; fill personal details with Bengali text.
5. Close the app completely; reopen. Is the CV still there and unchanged?
6. Create a second CV for the same customer; confirm both appear under the customer.
7. Delete a CV, restore it from trash, then purge it permanently.

### C. Templates and design
8. Open all 20 templates; confirm each looks distinct and no text is clipped.
9. Switch theme light → dark → system; confirm contrast and readability.
10. Resize the window from 1024×768 to 1920×1080; confirm nothing overlaps or clips.

### D. Sections
11. Switch off three sections; confirm their headings disappear from preview,
    DOCX and PDF.
12. Reorder sections; confirm the order matches in all three outputs.
13. Add a custom section; confirm it prints.

### E. Export and print
14. Export DOCX; open in Word. Is the text editable? Is the page A4? Are Bengali
    conjuncts correct?
15. Export PDF; search for a word from the CV. Is it found? (Searchable = pass.)
16. Print to an A4 printer. Is the output one page per CV page, with no browser
    headers, no clipping and exact margins?
17. Confirm each of the above appears in Export history with the right status.

### F. Backup
18. Create a backup; confirm the ZIP opens and contains `manifest.json`,
    `database.sqlite` and `README.txt`.
19. Add a new CV, then restore the backup; confirm the CV list matches the backup
    and a safety copy of the previous database was written.
20. Corrupt the ZIP (truncate it) and attempt restore; confirm it is rejected and
    no data is lost.

### G. Security and offline
21. Disconnect the network entirely; repeat steps 4–16. Everything must work.
22. In the running app, confirm no outbound connections (Resource Monitor /
    `netstat -ano | findstr <pid>`).
23. Attempt to drag a URL into the window; confirm navigation is blocked.

---

## 4. Coverage honesty statement

* **Code under automated test:** section engine, DOCX structure, database layer,
  parameter binding, design tokens, catalogue distinctness, preview generation.
* **Code exercised by mount-level UI tests:** dashboard, template gallery, editor
  (document rendering, section navigator, guides toggle, section suppression).
* **Code exercised only by compilation/build:** the remaining screens (wizard
  steps, customers, exports, backup, settings, help), Electron IPC handlers,
  print/PDF paths, installer configuration.
* **Code not executed at all in this environment:** Electron main process at
  runtime, native dialogs, printer interaction, the NSIS installer.

The last group is the reason the compatibility matrix reports "Not tested" rather
than passing rows. Promoting any row requires the checklist above on that OS.
