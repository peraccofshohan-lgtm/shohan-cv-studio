# User Manual — SHOHAN CV STUDIO 1.0.0

এই ম্যানুয়ালটি বাংলা ভাষায় ব্যবহারকারীর জন্য লেখা। Technical details are in
[TECHNICAL.md](TECHNICAL.md).

The interface language can be switched at any time in **সেটিংস → সাধারণ**
(Settings → General). The **CV language** is separate: a Bangla interface can
produce an English CV and vice versa, and mixed Bangla/English content is fully
supported in every template.

---

## 1. The main areas

| Area | Bangla | What it is for |
| --- | --- | --- |
| Dashboard | টুলটেবিল | Recent CVs, counts, quick actions |
| New CV (wizard) | নতুন CV | 19 guided steps to collect all data |
| Templates | টেমপ্লেট | Browse and preview all 20 designs |
| Editor / Studio | এডিটর | Live editing with instant A4 preview |
| Projects (drafts) | ড্রাফট | All saved CVs: search, filter, sort, duplicate, delete |
| Customers | কাস্টমার | People you make CVs for; multiple CVs per person |
| Export history | এক্সপোর্ট | Every DOCX/PDF/print action with timestamp and status |
| Backup & restore | ব্যাকআপ | Create and restore ZIP backups |
| Settings | সেটিংস | Language, theme, defaults, printing, privacy |
| Help | সহায়তা | Guide, shortcuts, compatibility status, diagnostics |

Keyboard shortcuts are listed in **সহায়তা → কীবোর্ড শর্টকাট**.

---

## 2. Creating a CV: the 20-step wizard

The wizard has one screen per step with a progress rail; you can move back and
forward freely and nothing is lost. Progress is autosaved.

| # | Step | English | Bangla | Notes |
| --- | --- | --- | --- | --- |
| 1 | Personal information | Basic Personal Information | ব্যক্তিগত তথ্য | Name, headline, contact, addresses |
| 2 | Document title & length | Document Title & Length | শিরোনাম ও পৃষ্ঠা | CV / CURRICULUM VITAE / RESUME / PROFESSIONAL RESUME / no title / custom, plus the page-length target · *optional* |
| 3 | Photo | Profile Photo | প্রোফাইল ছবি | Optional; templates without photo support ignore it · *optional* |
| 4 | Career objective | Career Objective | ক্যারিয়ার অবজেক্টিভ | Your own text, with category starters |
| 5 | Career interests | Career Interest | ক্যারিয়ার আগ্রহ | Optional tagged interests · *optional* |
| 6 | Education | Educational Qualifications | শিক্ষাগত যোগ্যতা | Degree, institution, group, result, year |
| 7 | Experience | Work Experience | কর্ম অভিজ্ঞতা | Company, title, dates, responsibilities, achievements |
| 8 | Skills | Skills | দক্ষতা | Categorised (software / technical / management …) |
| 9 | Languages | Language Proficiency | ভাষা দক্ষতা | Reading, writing, speaking, overall |
| 10 | Training | Training & Certifications | প্রশিক্ষণ ও সার্টিফিকেশন | Course, institute, year, certificate ID |
| 11 | Projects | Projects | প্রকল্প | Academic or professional · *optional* |
| 12 | Achievements | Achievements & Awards | অর্জন ও পুরস্কার | Optional · *optional* |
| 13 | Strengths | Strengths | শক্তিশালী দিক | Optional · *optional* |
| 14 | Hobbies | Hobbies & Interests | শখ ও আগ্রহ | Optional · *optional* |
| 15 | Volunteer | Volunteer Experience | স্বেচ্ছাসেবা | Optional · *optional* |
| 16 | Personal details to publish | Personal Details to Publish | ব্যক্তিগত তথ্য (প্রকাশ) | Per-field publish switches — everything here is off by default · *optional* |
| 17 | References | References | রেফারেন্স | Only real, contacted referees · *optional* |
| 18 | Declaration | Declaration | ঘোষণাপত্র | Optional declaration text · *optional* |
| 19 | Signature | Applicant Signature | স্বাক্ষর | Optional signature image · *optional* |
| 20 | Additional information | Additional Information | অতিরিক্ত তথ্য | Custom sections and anything else · *optional* |

### The anti-fabrication rule

The app never invents qualifications, jobs, certificates, references, strengths
or hobbies. Any generator only rephrases **what you typed**. If a field is empty,
the corresponding section simply does not appear in the CV.

### Optional sections

In the editor, every section has a switch and an order (left panel). Turning a section off removes
it completely — no heading, no rule, no gap, no blank page — from the on-screen
preview, the DOCX and the PDF/print. A section that is switched on but empty is
also hidden automatically, with the reason shown next to the section name
(green = prints, amber = empty so omitted, grey = switched off).

Custom sections can be added with your own title and body text.

### Recommended section order

Above the section list the **Recommended order** selector offers seven
orderings; choosing one rearranges the sections you already have:

| Ordering | Reads first |
| --- | --- |
| Fresher / Graduate | Objective → career interests → education → training → projects |
| Experienced professional | Objective → experience → skills → education → achievements |
| Executive / Leadership | Objective → achievements → experience → skills → education |
| Technical / IT | Objective → skills → experience → projects → education |
| Academic / Research | Objective → education → publications → experience → skills |
| ATS-first | Contact/objective → skills → experience → education → extras last |
| Bangladesh standard (local) | Objective → education → experience → personal details → declaration |

Applying an ordering only renumbers the sections; it **adds nothing, hides
nothing and changes no text**. A tick (✓) marks the ordering that matches the
current arrangement, and the manual up/down arrows still work afterwards, so a
custom arrangement is always one arrow away.

### Is my CV going to fit?

The **Pages** tab shows an estimate and the **Reports** tab explains any problem
it finds — a heading that would be orphaned at a page break, a bullet longer than
32 words, a duplicate skill, an experience entry with no start date, or a last
page that would be almost empty. These are advice, not blockers: you can export at
any time.

---

## 3. Choosing a template

**টেমপ্লেট** shows all **30** designs with a live preview of *your* data, not a
sample. Each has a genuinely different composition:

| Template | Character |
| --- | --- |
| Classic Professional | Ruled header, single column, split dates — the safest default |
| Traditional Corporate | Serif, centred name, fine double rule — banks & government |
| Modern Bangladesh | Noto Bengali display type, accent band, bar headings |
| Elegant Formal | Minimal identity, side-marked headings, generous white space |
| Corporate Executive | Solid colour header band, compact body |
| Premium Business | Double rule, two-column body for long careers |
| Professional Manager | Left sidebar with contact & skills rail |
| Minimal Executive | Almost no ornament, typographic hierarchy only |
| ATS Classic | Photo-free, single column, no graphics — for parsing systems |
| ATS Modern | ATS-safe with a subtle accent bar |
| Graduate Professional | Fresh-graduate composition, education first |
| Fresh Career Starter | Two-column, emphasis on coursework and projects |
| Senior Professional | Dense but readable, tuned for 10+ years of history |
| Career Achievement | Achievement-forward ordering |
| IT Technology | Dark rail, technical skill grouping |
| Engineering Professional | Boxed headings, grid-heavy technical layout |
| Banking & Finance | Formal banner, tabular feel |
| Academic Research | Centred, publication-friendly, citation-like entries |
| Creative Professional | Right rail, decorative yet professional |
| International Resume | Monochrome, English-first, Western conventions |
| Swiss Minimalist | Strict flush-left grid, one hairline, international typographic style |
| Scandinavian Executive | Airy Nordic spacing, dusty blue accent, small-cap headings |
| Modern Editorial | Magazine layout: large serif headings, two balanced columns |
| Premium Luxury | Muted gold hairlines, letter-spaced capitals, centred identity |
| Global ATS Professional | Plainest possible: one column, standard headings, no photo, no colour blocks |
| Modern Two-Column Professional | Narrow fact rail plus a wide career column |
| Executive Leadership Pro | Solid leadership band, serif headings, achievement-led entries |
| Compact One-Page Expert | Engineered for a single sheet: tight rhythm, inline dates |
| Academic International Pro | Long-form entries for research and teaching profiles |
| Contemporary Creative Portfolio | Portfolio-first layout with a tinted right rail |

Portrait position, photo shape, heading treatment, body grid, entry rhythm, font
pair and palette all differ between templates; colour alone never distinguishes
two designs.

Changing the template **never** changes your text.

---

## 4. The editor (Studio)

* Edit any field in the left panel; the A4 page on the right updates immediately.
* **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y`, or the toolbar buttons.
* **Zoom** — fit-to-width, fit-to-page, or +/- in 10 % steps; the preview scrolls,
  nothing is clipped.
* **Guides** — draws a dashed line where an A4 page ends **and** a rectangle at
  the printable margin, so you can see exactly what the printer will use.
* **Template / palette / font** — switch while keeping all content.
* Multi-page CVs are normal; content flows onto as many A4 pages as needed and
  never overlaps.

### The five editor panels

The right-hand rail has five tabs. You can finish a professional CV using only
the first one plus the template gallery; the rest are optional.

| Tab | What it is for |
| --- | --- |
| **Content** | Edit the selected section's fields; the section list on the left toggles visibility and order |
| **Design** | Basic mode: palette, font pair, density (compact / balanced / spacious), layout, text and heading size, line spacing, section spacing, page margin, photo frame. Advanced mode adds per-token colours, four-sided margins, spacing tokens, body alignment, first-line indent and footer options |
| **Title** | The six document titles and their full styling (see §4.1) |
| **Pages** | One page / two pages / automatic, maximum pages, and per-section manual page breaks (see §4.2) |
| **Reports** | Layout diagnostics, ATS suitability score and the quality checklist |
| **Presets** | Save the current look as a reusable style preset |

### 4.1 Document title

Choose one of: **CV**, **CURRICULUM VITAE**, **RESUME**, **PROFESSIONAL RESUME**,
**No title**, or **Custom** (your own text, up to 80 characters).

When a title is shown you can style it independently of everything else: font
size, weight, italic, underline, colour, letter case (UPPERCASE / lowercase /
Title Case / as typed), letter spacing, alignment, position (above the name,
below the name, or below the contact details), space above and below, a rule
under it (none / thin / thick / double / side accent), a background (none / soft
tint / solid accent), and a short accent line.

With **No title** the title element is not rendered at all — the header moves up
and no empty band is left. The choice is stored with the CV, so it is remembered
when you reopen the project, and it is respected by the preview, DOCX, PDF,
print, HTML and text output.

### 4.2 Page length

| Mode | Behaviour |
| --- | --- |
| **Exactly one page** | Composes for a single sheet. If the content cannot fit *readably*, a warning appears in **Reports** — nothing is deleted, and the font is never shrunk below 9 pt. |
| **Target two pages** | Balanced two-page composition with consistent headings and page numbering. |
| **Automatic** | The page count follows the content. |

You can also set a **maximum page count**, keep sections from splitting across
pages, and force any section to **start on a new page**.

> A page target is a target. The app will tell you when the content does not fit;
> it will never silently remove a section, a bullet or a line to reach a page
> count.

Saving happens automatically. A dot in the title bar shows unsaved changes, and
`Ctrl+S` writes immediately.

---

## 5. Exporting

Open a CV and choose **এক্সপোর্ট**:

| Action | Result |
| --- | --- |
| **DOCX** | A real Word document — editable text, A4 page size, Bengali Unicode, section headings as text, the document title, footer with page numbers. No images of text. Some web-only styling is approximated (see [Known Issues](KNOWN_ISSUES.md) 5d). |
| **PDF** | Generated by the browser/Electron print engine, so the text is selectable and searchable and the page is exactly A4. |
| **Print** | Opens a print preview, then sends to the selected printer. A4, no browser headers/footers, background colours preserved. |
| **Text** | Plain-text CV placed on the clipboard (or saved as `.txt` if the clipboard is unavailable) — for pasting into application forms and email bodies. Keeps the title, reading order and section order; drops visual formatting by design. |
| **HTML** | A single self-contained `.html` file you can archive or open in any browser. |

Every attempt is recorded in **এক্সপোর্ট** history with the format, time and
result, so you can tell whether a file was actually written.

> **Note on PDF:** the PDF is produced from the same HTML as the print preview.
> It is not a screenshot — text remains selectable, and the file can be searched.

---

## 6. Customers and projects

* A **customer** is a person; a **project** is one CV for that person.
* One customer can have many CVs (different jobs, languages, templates).
* Soft delete keeps a deleted item recoverable for a while; the trash view
  restores it. *Settings → Privacy → Delete all data* permanently erases
  everything after an explicit confirmation.
* Duplicating a project copies content and design but assigns a new ID and a new
  "last modified" time — useful for tailoring one CV to several employers.

---

## 7. Backup and restore

**ব্যাকআপ ও রিস্টোর**

* **Create backup** — writes a `.zip` containing `manifest.json`,
  `database.sqlite` and a plain-text README. The manifest records the database
  SHA-256, the schema version and the creation time.
* **Restore** — verifies the checksum first; if the archive is damaged or
  truncated, restore is refused and your current data is untouched. Before
  replacing anything, the app writes a safety copy of the current database next
  to it.
* Backups are ordinary files — copy them to a USB drive, another PC, or a CD.
  Nothing is uploaded anywhere.

Recommended: back up after every working day, and keep at least two different
physical locations.

---

## 8. Settings

| Tab | What you can change |
| --- | --- |
| General | Interface language, theme (light/dark/system), autosave interval |
| Defaults | Default CV language, template, font pair, page margin, portrait shape |
| Printing | Default printer, page fit, background graphics |
| Export | File-name pattern, default DOCX/PDF folders |
| Backup | Reminder frequency |
| Privacy | Which sensitive fields may ever appear; delete-all-data |
| About | Version, data path, fonts and licences, offline statement |

### Privacy defaults

Sensitive fields — father's and mother's names, date of birth, gender,
nationality, religion, marital status, blood group, height, weight, national ID,
passport number, permanent address, photo — are **excluded from output unless you
explicitly include them** on step 15, each with its own switch. The CV data never leaves your computer.

---

## 9. Printing correctly

1. Open the CV and press **প্রিন্ট**.
2. The preview shows exactly what will print, page by page.
3. Choose the A4 printer and confirm.
4. In the printer dialog make sure **Paper: A4**, **Scale: 100 %** (not "fit to
   page") and **Background graphics: on**.

If margins look wrong, check that the printer driver is not applying its own
scaling. Printing to PDF first is a reliable fallback.

---

## 10. Frequent questions

**Do I need internet?** No. The application contains no network calls at all.

**Where are my files?** Database and log paths are listed in *Settings → About*.

**Will Word open my DOCX?** Yes — Word 2010 and newer open it without warnings;
LibreOffice also opens it. The page size is A4 and the text is fully editable.

**Why is a section missing?** It is either switched off or empty. Step 19 shows
the reason next to each section.

**Can I make a CV in English and Bangla?** Yes, and you can mix them inside the
same CV. Both font families are embedded with every template.

**Can several people use one PC?** Use separate Windows accounts, or export a
backup per person — the database is per Windows user.
