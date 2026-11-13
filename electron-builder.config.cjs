/**
 * electron-builder configuration — Windows installers + portable build.
 *
 * Runtime: Electron 22.3.27 (Chromium 108, Node 16.17) — the last Electron line
 * that runs on Windows 7 SP1, 8 and 8.1 as well as Windows 10/11.
 *
 * Outputs
 *  - NSIS installer (per-user or per-machine, desktop + Start Menu shortcuts,
 *    uninstall support)
 *  - Portable single .exe (no install, runs from a USB stick)
 *  - Both ia32 and x64 architectures
 *
 * Signing is intentionally left to the release operator: set CSC_LINK /
 * CSC_KEY_PASSWORD to sign. Unsigned builds trigger SmartScreen warnings on
 * Windows 10/11 — documented in docs/INSTALLATION.md.
 */
module.exports = {
  appId: 'com.shohan.cvstudio',
  productName: 'Shohan CV Studio',
  copyright: 'Copyright © 2026 SHOHAN CV STUDIO',
  directories: {
    output: 'release',
    buildResources: 'build',
  },
  files: [
    'dist/**/*',
    'electron/**/*',
    'package.json',
    '!**/*.map',
    '!**/node_modules/**/*',
  ],
  extraMetadata: {
    main: 'electron/main.cjs',
  },
  asar: true,
  asarUnpack: [],
  compression: 'maximum',
  win: {
    target: [
      { target: 'nsis', arch: ['x64', 'ia32'] },
      { target: 'portable', arch: ['x64', 'ia32'] },
    ],
    icon: 'build/icon.png',
    // Windows 7 SP1 through 11.
    requestedExecutionLevel: 'asInvoker',
    artifactName: 'Shohan-CV-Studio-${version}-${arch}.${ext}',
    // Keep the legacy-compatible signing digest for Windows 7.
    signAndEditExecutable: true,
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'SHOHAN CV STUDIO',
    uninstallDisplayName: 'SHOHAN CV STUDIO',
    deleteAppDataOnUninstall: false,
    allowElevation: true,
    installerIcon: 'build/icon.png',
    uninstallerIcon: 'build/icon.png',
    runAfterFinish: true,
  },
  portable: {
    artifactName: 'Shohan-CV-Studio-${version}-portable-${arch}.${ext}',
  },
  // No publish/auto-update: the product is offline-first by design.
  publish: null,
};
