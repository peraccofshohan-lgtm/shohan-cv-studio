#!/usr/bin/env bash
# Feature-presence audit: fails if a capability claimed in the docs is missing
# from the source tree. Run from the repository root: npm run audit
set -u
cd "$(dirname "$0")/.."
fail=0
check() { # description, pattern, path
  if grep -rqE "$2" $3 2>/dev/null; then echo "OK   $1"; else echo "MISS $1 ($2 in $3)"; fail=1; fi
}
count() { printf '  %-26s %s\n' "$1" "$2"; }

echo "--- v1.0 core ---"
check "undo/redo store"            "undo\(\)|undoStack" src/store/workspace.ts
check "autosave"                   "flushAutosave|saveNow" src/store/workspace.ts
check "customer CRUD"              "saveCustomer|deleteCustomer" src/database/cvRepository.ts
check "project duplicate"          "duplicateProject" src/database/cvRepository.ts
check "soft delete + restore"      "restoreProject" src/database/cvRepository.ts
check "search/filter/sort"         "ORDER BY|search" src/database/cvRepository.ts
check "export history logging"     "logExport|export_history" src/database/cvRepository.ts
check "backup archive + sha256"    "buildBackupArchive" src/lib/backup.ts
check "restore validation"         "validateBackupArchive" src/lib/backup.ts
check "docx exporter"              "buildDocx" src/document/docxExport.ts
check "print via electron"         "print:run|webContents.print" electron/main.cjs
check "pdf via electron"           "printToPDF" electron/main.cjs
check "CSP injection"              "Content-Security-Policy" scripts/inject-csp.mjs
check "no nodeIntegration"         "nodeIntegration: false" electron/main.cjs
check "contextIsolation on"        "contextIsolation: true" electron/main.cjs
check "navigation guard"           "will-navigate" electron/main.cjs
check "download guard"             "will-download" electron/main.cjs

echo "--- v1.1 composition ---"
check "title model"                "interface TitleState" src/types/cv.ts
check "title presets (6 modes)"    "TITLE_PRESET_TEXT" src/types/cv.ts
check "title resolver"             "export function resolveTitle" src/lib/composition.ts
check "page length modes"          "PageLengthMode" src/types/cv.ts
check "layout/fit report"          "export function buildLayoutReport" src/lib/layoutReport.ts
check "density presets"            "DENSITY_PRESETS" src/lib/composition.ts
check "mm/pt/in/px units"          "MM_PER_UNIT" src/lib/composition.ts
check "colour tokens"              "ColorToken" src/types/cv.ts
check "font roles"                 "FontRole" src/types/cv.ts
check "spacing tokens"             "SpacingToken" src/types/cv.ts
check "title panel (editor)"       "export const TitlePanel" src/features/editor/TitlePanel.tsx
check "page length panel"          "export const PageLengthPanel" src/features/editor/PageLengthPanel.tsx
check "reports panel"              "export const ReportsPanel" src/features/editor/ReportsPanel.tsx
check "presets panel"              "export const PresetsPanel" src/features/editor/PresetsPanel.tsx
check "ATS analyser"               "export function analyseAts" src/lib/atsCheck.ts
check "quality checklist"          "QualityItem" src/lib/atsCheck.ts
check "preset store actions"       "applyPreset|duplicatePreset" src/store/workspace.ts
check "wizard document step"       "Document Title & Length" src/features/cv-wizard/steps.ts
check "margin/zoom guides"         "margin-guides" src/features/editor/EditorPage.tsx
check "schema v2 migration"        "document-composition" src/database/schema.ts
check "production verifier"        "verify-dist" package.json
check "order presets"              "export const ORDER_PRESETS" src/lib/sectionOrder.ts
check "order selector (editor)"    "applyOrderPreset" src/features/editor/EditorPage.tsx
check "section style model"        "normalizeSectionOverride" src/lib/sectionStyles.ts
check "section design panel"       "export const SectionStylePanel" src/features/editor/SectionStylePanel.tsx
check "section override in CSS"    "sec-heading-scale" src/document/styles.ts

echo "--- counts ---"
count "wizard steps:"   "$(grep -c "id: '" src/features/cv-wizard/steps.ts)"
count "templates:"      "$(grep -c '^  T(' src/templates/catalog.ts)"
count "palettes:"       "$(grep -c "^    id: '" src/templates/catalog.ts)"
count "font pairs:"     "$(awk '/FONT_PAIRS/{f=1} f&&/^    id:/{c++} /^export const fontPairById/{print c; exit}' src/templates/catalog.ts)"
count "db tables:"      "$(grep -c 'CREATE TABLE' src/database/schema.ts)"
count "test files:"     "$(ls tests/*.test.ts tests/*.test.tsx 2>/dev/null | wc -l)"
count "preview PNGs:"   "$(ls docs/images/*.png 2>/dev/null | wc -l)"
count "schema version:" "$(grep -oP 'SCHEMA_VERSION = \K[0-9]+' src/database/schema.ts)"
echo
[ $fail -eq 0 ] && echo "ALL CHECKS PRESENT" || echo "SOME CHECKS MISSING"
exit=$fail
exit $exit
