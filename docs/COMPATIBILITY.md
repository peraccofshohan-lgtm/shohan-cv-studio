# Compatibility Matrix — SHOHAN CV STUDIO 1.0.0

> **Read this first.** Every row below states exactly what was observed during the
> 1.0.0 build. **No operating system was available to the build environment**, so
> no Windows version could be launched. Rows therefore say **Not tested**, not
> "Passed". They are *design targets* supported by concrete technical facts
> (which Electron line supports which Windows version, which Chromium release
> the CSS targets), never by assumption.

Legend:

| Mark | Meaning |
| --- | --- |
| **Tested Passed** | Executed on the real OS/build during this release |
| **Tested Failed** | Executed and failed; see Known Issues |
| **Not tested** | Not executed — target only, no claim made |
| **Unsupported** | Technically impossible with this stack |

---

## 1. Operating systems

| OS | Version | Architecture | Status | Basis for the target |
| --- | --- | --- | --- | --- |
| Windows 11 | 21H2 – 24H2 | x64 | **Not tested** | Electron 22 runs on Win 11 |
| Windows 11 | 21H2 – 24H2 | ARM64 (x64 emulation) | **Not tested** | Requires x64 build; emulation not exercised |
| Windows 10 | 1809 – 22H2 | x64 | **Not tested** | Electron 22 support range |
| Windows 10 | 1809 – 22H2 | ia32 | **Not tested** | 32-bit build produced |
| Windows 8.1 | 6.3 | x64 / ia32 | **Not tested** | Electron 22 still supports 8.1 |
| Windows 8 | 6.2 | x64 / ia32 | **Not tested** | Electron 22 still supports 8 |
| Windows 7 | SP1 | x64 / ia32 | **Not tested** | Electron 22 is the last line supporting Win 7 SP1; requires the SHA-2 update (KB4474419) for signed binaries |
| Windows 7 | RTM (no SP1) | — | **Unsupported** | Chromium 108 requires SP1 |
| Windows Vista / XP | — | — | **Unsupported** | No supported Electron line |
| macOS / Linux | — | — | **Unsupported** | Not built or tested; Windows-only product |

Installer artefacts produced by `npm run dist:win`: NSIS installer and portable
EXE for **x64** and **ia32**. The build configuration is committed; **running it
and testing the resulting executables was not possible in this environment**
(Electron binary download is blocked and no Windows host or GTK/NSS/X display
stack exists). See [TESTING.md](TESTING.md#what-could-not-be-run).

---

## 2. Runtime and dependencies

| Component | Version | Win 7 SP1 | Win 8/8.1 | Win 10/11 | Notes |
| --- | --- | --- | --- | --- | --- |
| Electron | 22.3.27 | Yes (last supporting line) | Yes | Yes | Pinned deliberately |
| Chromium | 108 | Yes | Yes | Yes | CSS limited to Chromium-108 features; enforced by tests |
| Node (bundled) | 16.17 | Yes | Yes | Yes | Only used in the main process |
| sql.js (SQLite → WASM) | 1.8.0 | Yes | Yes | Yes | No native compilation, works on ia32 |
| React | 18.3.1 | Yes | Yes | Yes | Transpiled to ES2019 |
| docx | 7.8.2 | Yes | Yes | Yes | Pure JavaScript |

Windows 7 also needs, per Microsoft: SP1, SHA-2 code-signing support
(KB4474419), and root-certificate update (KB931125 "rootsupd") for signed
executables.

---

## 3. Display and scaling

| Display | Width × Height | DPI | Status | Notes |
| --- | --- | --- | --- | --- |
| Minimum supported | 1024 × 768 | 96 (100 %) | **Not tested on hardware** | Layout is verified by CSS rules: sidebar collapses, panels stack, preview scales |
| Common laptop | 1366 × 768 | 96 | **Not tested** | |
| Standard desktop | 1920 × 1080 | 96 | **Not tested** | |
| High DPI | 1920 × 1080 | 144 (150 %) | **Not tested** | Uses CSS pixels throughout; no bitmap chrome |
| High DPI | 3840 × 2160 | 192 (200 %) | **Not tested** | |

---

## 4. Output formats

| Format | Implementation | Verified by | Status |
| --- | --- | --- | --- |
| DOCX | OOXML written with `docx@7.8.2` | Automated: `tests/docx.test.ts` unzips the file and asserts A4 page size, textual content, Bengali strings and absence of image parts | **Tested Passed** (structure) / **Not tested** in Microsoft Word or LibreOffice (not installed) |
| PDF | Chromium `printToPDF` (desktop) / print dialog (browser) | Code path reviewed; no PDF was generated because Electron could not be launched | **Not tested** |
| Print | `webContents.print` with A4, no headers/footers (desktop) / iframe print (browser) | Code path reviewed; no physical or virtual printer available | **Not tested** |
| A4 geometry | 210 × 297 mm in CSS and in DOCX twips | Automated: CSS assertions + DOCX page-size assertions with ±3 twip tolerance | **Tested Passed** (geometry) |
| Bengali Unicode in DOCX | UTF-8 through the OOXML writer | Automated: byte-exact round-trip of Bengali strings (`tests/regression.test.ts`, `tests/docx.test.ts`) | **Tested Passed** (data) / **Not tested** rendering in Word |

---

## 5. Printing devices

| Device type | Status |
| --- | --- |
| A4 laser (any vendor) | **Not tested** — no printer available in the build environment |
| A4 inkjet | **Not tested** |
| PDF virtual printer ("Microsoft Print to PDF") | **Not tested** |
| Label/small-format printers | Not supported for CV output (A4 only) |

---

## 6. Tested software environment

| Item | Version | Status |
| --- | --- | --- |
| Node.js (build host) | 22.22.3 | Tested Passed |
| npm (build host) | bundled with Node 22 | Tested Passed |
| TypeScript compiler | 5.x | Tested Passed — 0 errors |
| Vite production build | 5.x | Tested Passed — build completes, CSP injected |
| Vitest suites | 11 files / 66 tests | **Tested Passed — 66/66** |
| Chromium 108 CSS parity | static analysis | **Tested Passed** — no `color-mix()`, container queries, `@layer`, `subgrid` or `:has(` in the source |

---

## 7. What would change these rows

To promote a row from **Not tested** to **Tested Passed**, run the manual smoke
checklist in [TESTING.md](TESTING.md#manual-smoke-checklist) on that OS with the
signed installer, then update this table with the date, build hash and observer.
Anything less remains a target, not a claim.
