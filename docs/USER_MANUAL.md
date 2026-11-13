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

## 2. Creating a CV: the 19-step wizard

The wizard has one screen per step with a progress rail; you can move back and
forward freely and nothing is lost. Progress is autosaved.

| # | Step | English | Bangla | Notes |
| --- | --- | --- | --- | --- |
| 1 | Personal information | Basic Personal Information | ব্যক্তিগত তথ্য | Name, headline, contact, addresses |
| 2 | Photo | Profile Photo | প্রোফাইল ছবি | Optional; templates without photo support ignore it · *optional* |
| 3 | Career objective | Career Objective | ক্যারিয়ার অবজেক্টিভ | Your own text, with category starters |
| 4 | Career interests | Career Interest | ক্যারিয়ার আগ্রহ | Optional tagged interests · *optional* |
| 5 | Education | Educational Qualifications | শিক্ষাগত যোগ্যতা | Degree, institution, group, result, year |
| 6 | Experience | Work Experience | কর্ম অভিজ্ঞতা | Company, title, dates, responsibilities, achievements |
| 7 | Skills | Skills | দক্ষতা | Categorised (software / technical / management …) |
| 8 | Languages | Language Proficiency | ভাষা দক্ষতা | Reading, writing, speaking, overall |
| 9 | Training | Training & Certifications | প্রশিক্ষণ ও সার্টিফিকেশন | Course, institute, year, certificate ID |
| 10 | Projects | Projects | প্রকল্প | Academic or professional · *optional* |
| 11 | Achievements | Achievements & Awards | অর্জন ও পুরস্কার | Optional · *optional* |
| 12 | Strengths | Strengths | শক্তিশালী দিক | Optional · *optional* |
| 13 | Hobbies | Hobbies & Interests | শখ ও আগ্রহ | Optional · *optional* |
| 14 | Volunteer | Volunteer Experience | স্বেচ্ছাসেবা | Optional · *optional* |
| 15 | Personal details to publish | Personal Details to Publish | ব্যক্তিগত তথ্য (প্রকাশ) | Per-field publish switches — everything here is off by default · *optional* |
| 16 | References | References | রেফারেন্স | Only real, contacted referees · *optional* |
| 17 | Declaration | Declaration | ঘোষণাপত্র | Optional declaration text · *optional* |
| 18 | Signature | Applicant Signature | স্বাক্ষর | Optional signature image · *optional* |
| 19 | Additional information | Additional Information | অতিরিক্ত তথ্য | Custom sections and anything else · *optional* |

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

---

## 3. Choosing a template

**টেমপ্লেট** shows all 20 designs with a live preview of *your* data, not a
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

Portrait position, photo shape, heading treatment, body grid, entry rhythm, font
pair and palette all differ between templates; colour alone never distinguishes
two designs.

Changing the template **never** changes your text.

---

## 4. The editor (Studio)

* Edit any field in the left panel; the A4 page on the right updates immediately.
* **Undo / Redo** — `Ctrl+Z` / `Ctrl+Y`, or the toolbar buttons.
* **Zoom** — fit-page, 50 %, 75 %, 100 %; the preview scrolls, nothing is clipped.
* **Guides** — toggle the button in the toolbar to draw a dashed line where an A4 page ends.
* **Template / palette / font** — switch while keeping all content.
* Multi-page CVs are normal; content flows onto as many A4 pages as needed and
  never overlaps.

Saving happens automatically. A dot in the title bar shows unsaved changes, and
`Ctrl+S` writes immediately.

---

## 5. Exporting

Open a CV and choose **এক্সপোর্ট**:

| Action | Result |
| --- | --- |
| **DOCX** | A real Word document — editable text, A4 page size, Bengali Unicode, section headings as text, footer with page numbers. No images of text. |
| **PDF** | Generated by the browser/Electron print engine, so the text is selectable and searchable and the page is exactly A4. |
| **Print** | Opens a print preview, then sends to the selected printer. A4, no browser headers/footers, background colours preserved. |
| **Text** | Plain-text CV placed on the clipboard (or saved as `.txt` if the clipboard is unavailable) — for pasting into application forms and email bodies. |
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
