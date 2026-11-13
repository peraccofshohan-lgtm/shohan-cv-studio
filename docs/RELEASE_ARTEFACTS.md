# Release artefacts — SHOHAN CV STUDIO 1.1.0

## Binaries

**None exist.** The Windows installers and the portable executable were not built
because this release environment cannot reach GitHub's release-asset CDN, which
is where `electron-builder` downloads the Electron 22.3.27 runtime and NSIS from.

Evidence:

```
$ node node_modules/electron/install.js
RequestError: unable to verify the first certificate

$ npx electron-builder --win --x64 --config electron-builder.config.cjs
⨯ Get "https://release-assets.githubusercontent.com/...electron-v22.3.27-win32-x64.zip": EOF
```

Because no `.exe` exists, **no checksum of an installer exists**. Producing a
checksum file for files that were never generated would be fabrication, so this
file does not contain one.

Build them on a connected machine with:

```bash
npm ci
npm run verify        # typecheck → tests → build → bundle audit → feature audit
npm run dist:win      # → ./release
cd release && sha256sum *.exe > SHA256SUMS.txt
```

## What can be hashed today: the verified source bundle

The renderer bundle in `dist/` is produced deterministically from this commit and
is the payload that ships inside the installer. To reproduce and record it:

```bash
npm run build
cd dist && find . -type f | sort | xargs sha256sum > ../dist-SHA256SUMS.txt
```

`npm run verify:dist` checks the same bytes for CSP integrity, asset and font
resolution, absence of any remote origin, and Chromium-108 feature compliance.

## Release checklist status

| Item | Status |
| --- | --- |
| Typecheck (0 errors) | PASS |
| 206 automated tests | PASS |
| Production build + CSP injection | PASS |
| Bundle audit (`verify:dist`) | PASS — 0 failures, 2 documented warnings |
| Feature-presence audit | PASS — 43 checks |
| Documentation parity | PASS — audited item by item |
| Installer build | **BLOCKED (environment)** |
| Checksums of installers | **N/A — no artefacts** |
| Windows 7 / 8 / 8.1 / 10 / 11 installation | **NOT TESTED** |
| Physical A4 print | **NOT TESTED** |
| PDF file generation | **NOT TESTED** (payload verified instead) |
