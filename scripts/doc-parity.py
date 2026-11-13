import re, subprocess, sys
# Claims the docs make that must be traceable to code.
claims = [
 ("30 templates",            ["src/templates/catalog.ts"], r"^  T\(" , 30),
 ("20 wizard steps",         ["src/features/cv-wizard/steps.ts"], r"^    id: '", 20),
 ("9 palettes",              ["src/templates/catalog.ts"], r"PALETTE-SCOPE", 9),
 ("29 db tables",            ["src/database/schema.ts"], r"CREATE TABLE", 29),
 ("schema v3",               ["src/database/schema.ts"], r"SCHEMA_VERSION = 3", 1),
]
ok=True
def count_in_block(path, start, end, pat):
    """Count matches between a `start` marker and the next `end` marker.

    The palette and font-pair lists both use `    id: '` lines, so counting the
    whole file silently mixes the two — which is how the docs once claimed 13
    palettes when the catalog ships 9 palettes and 4 font pairs.
    """
    text = open(path).read()
    i = text.find(start)
    j = text.find(end, i + len(start))
    block = text[i:j if j != -1 else len(text)]
    return len(re.findall(pat, block, re.M))

for label, files, pat, expected in claims:
    n=0
    for f in files:
        if pat == "PALETTE-SCOPE":
            n += count_in_block(f, "export const PALETTES", "export const FONT_PAIRS", r"^    id: '")
        else:
            n += len(re.findall(pat, open(f).read(), re.M))
    status = "OK " if n==expected else "MISMATCH"
    if n!=expected: ok=False
    print(f"{status} {label}: found {n}, docs say {expected}")

# Feature identifiers the docs promise, and where they must exist.
features = {
 "title presets":        ("TITLE_PRESET_TEXT", ["src/types/cv.ts"]),
 "resolveTitle":         ("export function resolveTitle", ["src/lib/composition.ts"]),
 "applyTransform":       ("export function applyTransform", ["src/lib/composition.ts"]),
 "density presets":      ("DENSITY_PRESETS", ["src/lib/composition.ts"]),
 "unit conversion":      ("MM_PER_UNIT", ["src/lib/composition.ts"]),
 "layout report":        ("export function buildLayoutReport", ["src/lib/layoutReport.ts"]),
 "ats analysis":         ("export function analyseAts", ["src/lib/atsCheck.ts"]),
 "backup archive":       ("export async function buildBackupArchive", ["src/lib/backup.ts"]),
 "backup validation":    ("export async function validateBackupArchive", ["src/lib/backup.ts"]),
 "title panel":          ("export const TitlePanel", ["src/features/editor/TitlePanel.tsx"]),
 "page length panel":    ("export const PageLengthPanel", ["src/features/editor/PageLengthPanel.tsx"]),
 "reports panel":        ("export const ReportsPanel", ["src/features/editor/ReportsPanel.tsx"]),
 "presets panel":        ("export const PresetsPanel", ["src/features/editor/PresetsPanel.tsx"]),
 "named 10 presets":     ("export const NAMED_PRESETS", ["src/lib/namedPresets.ts"]),
 "section order presets": ("export const ORDER_PRESETS", ["src/lib/sectionOrder.ts"]),
 "section style model":  ("export function normalizeSectionOverride", ["src/lib/sectionStyles.ts"]),
 "section design panel": ("export const SectionStylePanel", ["src/features/editor/SectionStylePanel.tsx"]),
 "page navigator":       ("export const PageNavigator", ["src/features/editor/PageNavigator.tsx"]),
 "before/after compare": ("export function diffSnapshots", ["src/features/editor/BeforeAfter.tsx"]),
 "wizard document step": ("Document Title & Length", ["src/features/cv-wizard/steps.ts"]),
 "hex field":            ("export const HexField", ["src/components/studioControls.tsx"]),
 "number field":         ("export const NumberField", ["src/components/studioControls.tsx"]),
 "margin guides":        ("margin-guides", ["src/features/editor/EditorPage.tsx"]),
 "fit to page":          ("Fit to page", ["src/features/editor/EditorPage.tsx"]),
 "verify-dist script":   ("verify-dist", ["package.json"]),
 "feature audit script": ("feature-audit", ["package.json"]),
 "docs previews script": ("docs:previews", ["package.json"]),
}
for label,(needle, files) in features.items():
    found = any(needle in open(f).read() for f in files)
    if not found: ok=False
    print(("OK  " if found else "MISS")+f" {label}")

# Documentation files that must exist
import os
for doc in ["README.md","docs/INSTALLATION.md","docs/USER_MANUAL.md","docs/TECHNICAL.md",
            "docs/COMPATIBILITY.md","docs/TESTING.md","docs/KNOWN_ISSUES.md",
            "docs/RELEASE_NOTES.md","docs/DELIVERY_REPORT.md","docs/RELEASE_ARTEFACTS.md"]:
    e=os.path.exists(doc)
    if not e: ok=False
    print(("OK  " if e else "MISS")+f" {doc}")

print("\nALL PARITY CHECKS PASS" if ok else "\nPARITY GAPS FOUND")
sys.exit(0 if ok else 1)
