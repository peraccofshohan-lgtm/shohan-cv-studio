# Installation Guide — SHOHAN CV STUDIO 1.1.0

> **Status of this document.** The steps below describe the shipped build. Where
> an operating system or installer behaviour was not physically exercised during
> this release, it is marked **Not tested** — see
> [COMPATIBILITY.md](COMPATIBILITY.md).

---

## 1. What you need

### To run the installed application

| Requirement | Minimum | Recommended |
| --- | --- | --- |
| Operating system | Windows 7 SP1 (32- or 64-bit) | Windows 10 / 11 64-bit |
| Processor | 1.6 GHz dual-core | 2.0 GHz quad-core |
| Memory | 2 GB | 4 GB |
| Free disk space | 350 MB | 500 MB |
| Display | 1024 × 768 | 1366 × 768 or larger |
| Printer | Any A4-capable printer (for printing only) | — |
| Internet | **Never required** | — |
| Account / activation | **None** | — |

The portable build needs no installation and can run from a USB flash drive.

### To build from source

| Requirement | Version |
| --- | --- |
| Node.js | 18 LTS or 20 LTS (build tooling only) |
| npm | 9 or newer |
| Disk space | ~1.2 GB including `node_modules` |
| Internet | Required **once** to download npm packages and the Electron runtime |

The application itself never uses the network at runtime.

---

## 2. Installing the desktop app

### 2.1 Installer (recommended)

1. Run `Shohan-CV-Studio-1.0.0-<arch>.exe`.
2. If Windows SmartScreen shows *"Windows protected your PC"*, choose
   **More info → Run anyway**. The build is unsigned unless your release
   engineer supplied a code-signing certificate; unsigned executables always
   trigger this prompt on Windows 10/11.
3. Accept the licence, choose the install folder (default:
   `%LOCALAPPDATA%\Programs\shohan-cv-studio`), and finish.
4. Launch **SHOHAN CV STUDIO** from the Start Menu or the desktop shortcut.

The installer is per-user by default (`asInvoker`) and does not require
administrator rights. Choosing *"Install for all users"* requests elevation.

### 2.2 Portable build

Run `Shohan-CV-Studio-1.0.0-portable-<arch>.exe` directly. Nothing is written to
`Program Files`; user data still lives in the standard application-data folder
(see §5) so your CVs survive replacing the executable.

### 2.3 Silent install (IT deployment)

```bat
Shohan-CV-Studio-1.0.0-x64.exe /S
```

The NSIS installer accepts `/S` for silent mode. Verify the installation by
checking for `SHOHAN CV STUDIO` in the Start Menu, then run the checklist in
[TESTING.md](TESTING.md#manual-smoke-checklist).

### 2.4 Uninstalling

*Settings → Apps → SHOHAN CV STUDIO → Uninstall*, or the Start Menu uninstall
shortcut. Uninstalling **keeps your data** (database, backups, exported files) so
that reinstalling restores your work. To remove everything, delete the folder in
§5 after uninstalling.

---

## 3. Building from source

```bash
git clone <this repository>
cd shohan-cv-studio
npm install            # downloads packages + the Electron 22.3.27 runtime
npm run build          # typecheck → Vite bundle → CSP injection
npm run dist:win       # Windows installers into ./release
```

### What each script does

| Command | Purpose |
| --- | --- |
| `npm run dev` | Vite dev server on <http://localhost:5173> (browser preview, no native bridge) |
| `npm run desktop:dev` | Electron window pointed at the dev server |
| `npm run typecheck` | `tsc --noEmit` over the whole project |
| `npm test` | Vitest suites (engine, DOCX, database, design, sections) |
| `npm run build` | Production build; `scripts/inject-csp.mjs` adds the strict CSP meta tag |
| `npm run desktop` | Runs Electron against the last `npm run build` output |
| `npm run fonts` | Rebuilds the embedded font payload from the bundled WOFF2 files |
| `npm run dist:win` | Builds NSIS installer + portable EXE for x64 and ia32 |
| `npm run docs:previews` | Regenerates the template preview PNGs in `docs/images` |
| `npm run verify` | One gate: typecheck → tests → build → bundle audit → feature audit |
| `npm run verify:dist` | Audits the shipped bundle (CSP, asset/font resolution, offline, Chromium-108 rules, A4) |
| `npm run audit` | Asserts that every capability claimed in the documentation exists in the source |

### Release procedure (run on a machine with internet access)

```bash
npm ci
npm run verify                  # must be green before packaging
npm run dist:win                # downloads Electron 22 + NSIS, writes ./release
cd release
sha256sum *.exe > SHA256SUMS.txt   # or: certutil -hashfile <file> SHA256 on Windows
```

Artefacts written by `npm run dist:win`:

| File pattern | Target |
| --- | --- |
| `Shohan-CV-Studio-1.1.0-x64.exe` | NSIS installer, 64-bit |
| `Shohan-CV-Studio-1.1.0-ia32.exe` | NSIS installer, 32-bit (Windows 7 era hardware) |
| `Shohan-CV-Studio-1.1.0-portable-x64.exe` | Portable, 64-bit |
| `Shohan-CV-Studio-1.1.0-portable-ia32.exe` | Portable, 32-bit |
| `SHA256SUMS.txt` | Checksums for the four binaries |

**Status of this list:** the build was configured and reviewed, but in the
environment where 1.1.0 was assembled the Electron and NSIS downloads were
blocked, so **no `.exe` was produced and no checksum exists yet**. Nothing in this
repository claims otherwise — see [DELIVERY_REPORT.md](DELIVERY_REPORT.md).

### Build configuration

`electron-builder.config.cjs` targets:

* `nsis` installer — x64 and ia32
* `portable` executable — x64 and ia32

with `asar: true`, `compression: maximum` and no auto-update or publish channel
(the product is offline by design).

To sign the build, set `CSC_LINK` and `CSC_KEY_PASSWORD` before running
`npm run dist:win`.

---

## 4. First run

1. The app opens on the **টুলটেবিল (Dashboard)**.
2. Choose **নতুন CV** to start the 20-step wizard, or **টেমপ্লেট** to browse the
   30 designs first. Step 2 of the wizard chooses the document title and the
   page-length target.
3. Work is autosaved to the local database as you type (interval is configurable
   in *Settings → General*).
4. You never need to create an account or enter a licence key.

---

## 5. Where your data lives

| Item | Path |
| --- | --- |
| Database | `%APPDATA%\Shohan CV Studio\data\shohan-cv.sqlite` |
| Backups (`.zip`) | wherever you save them; default `Documents` |
| Exported DOCX/PDF | wherever you save them; default `Documents` |
| Desktop error log | `%APPDATA%\Shohan CV Studio\data\shohan-desktop.log` |
| Browser-preview storage | IndexedDB database `shohan-cv-studio` (only when running `npm run dev`) |
| Installed program | `%LOCALAPPDATA%\Programs\shohan-cv-studio\` |

The app shows the exact data path in *Settings → About* and *Help → Diagnostics*.

The in-app diagnostics view (*Help → Diagnostics*) shows the same errors without
you having to open the file.

Back up by copying the `.zip` produced in **ব্যাকআপ ও রিস্টোর**; the archive
contains the database plus a manifest with a SHA-256 checksum of the database
file, so a corrupted archive is rejected instead of silently overwriting good
data.

---

## 6. Troubleshooting installation

| Symptom | Cause | Fix |
| --- | --- | --- |
| "Windows protected your PC" | Unsigned executable | More info → Run anyway, or sign the build |
| Installer refuses to start on Windows 7 | Missing SP1 or updates | Install Windows 7 SP1 and the SHA-2 code-signing update (KB4474419) |
| App window is blank after install | Antivirus blocked `resources/app.asar` | Restore from quarantine, reinstall, or use the portable build |
| "The app could not start the local database" | Data folder not writable (roaming profile, controlled folder access) | Add the app to the Controlled Folder Access allow-list, or move the profile to a local path |
| Bengali text shows as boxes when printing | Printer driver substituted the embedded font | Print to PDF first, then print the PDF; report the printer model |
| Very large CV takes a moment to open | Many projects in one database | Expected below ~5,000 projects; see [KNOWN_ISSUES.md](KNOWN_ISSUES.md) |

### Resetting the application

1. Close the app.
2. Copy `%APPDATA%\Shohan CV Studio\data\shohan-cv.sqlite` somewhere safe first.
3. Delete the `data` folder to start empty.
4. Reopen the app — a fresh database is created automatically.

---

## 7. Verifying your download

Each release includes `SHA256SUMS.txt`. On Windows PowerShell:

```powershell
Get-FileHash .\Shohan-CV-Studio-1.1.0-x64.exe -Algorithm SHA256
```

Compare the value with the matching line in `SHA256SUMS.txt`.

The renderer bundle can also be audited from source before packaging:

```bash
npm run build && npm run verify:dist
```

That checks the strict CSP, that every referenced asset and font resolves inside
`dist/`, that no remote origin is referenced, and that no feature newer than
Chromium 108 (the Windows 7 runtime) has crept in.
