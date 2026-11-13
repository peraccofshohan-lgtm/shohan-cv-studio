#!/usr/bin/env bash
# Feature-presence audit: fails if a capability claimed in the docs is missing
# from the source tree. Run from the repository root.
set -u
cd /home/user/shohan-cv-studio
fail=0
check() { # name, pattern, file(s)
  if grep -rqE "$2" $3 2>/dev/null; then echo "OK   $1"; else echo "MISS $1 ($2 in $3)"; fail=1; fi
}
echo "--- core features ---"
check "undo/redo store"            "undo\(\)|undoStack" src/store/workspace.ts
check "autosave"                   "autosave|flushAutosave" src/store/workspace.ts
check "customer CRUD"              "saveCustomer|deleteCustomer" src/database/cvRepository.ts
check "project duplicate"          "duplicateProject" src/database/cvRepository.ts
check "soft delete + restore"      "restoreProject" src/database/cvRepository.ts
check "search/filter/sort"         "ORDER BY|search" src/database/cvRepository.ts
check "export history logging"     "logExport|export_history" src/database/cvRepository.ts
check "backup manifest + sha256"   "sha-256|SHA-256|sha256" src/features/backup/BackupPage.tsx
check "restore safety copy"        "safety|beforeRestore|pre-restore" src/features/backup/BackupPage.tsx
check "docx exporter"              "buildDocx" src/document/docxExport.ts
check "print via electron"         "print:run|webContents.print" electron/main.cjs
check "pdf via electron"           "printToPDF" electron/main.cjs
check "CSP injection"              "Content-Security-Policy" scripts/inject-csp.mjs
check "no nodeIntegration"         "nodeIntegration: false" electron/main.cjs
check "contextIsolation on"        "contextIsolation: true" electron/main.cjs
check "navigation guard"           "will-navigate" electron/main.cjs
check "download guard"             "will-download" electron/main.cjs
echo "--- counts ---"
echo "wizard steps: $(grep -c "^    id: '" src/features/cv-wizard/steps.ts)"
echo "templates:    $(grep -cE "^  T\(" src/templates/catalog.ts)"
echo "palettes:     $(grep -c "^    id: '" src/templates/catalog.ts)"
echo "db tables:    $(grep -c 'CREATE TABLE' src/database/schema.ts)"
echo "tests:        $(ls tests/*.test.ts* | wc -l) files"
echo "exit=$fail"
