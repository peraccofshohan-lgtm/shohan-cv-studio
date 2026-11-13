/**
 * SHOHAN CV STUDIO — canonical CV data model.
 *
 * This single model feeds the live preview, the DOCX exporter, the PDF
 * exporter and the A4 print pipeline. Nothing in this file may contain
 * fabricated user data: every field is either entered by the operator or
 * deliberately left empty.
 */

export type UUID = string;

export type CVLanguage = 'en' | 'bn' | 'mixed';
export type PhotoShape = 'circle' | 'square' | 'rounded' | 'none';
export type ProficiencyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type LanguageProficiency = 'basic' | 'conversational' | 'intermediate' | 'fluent' | 'native';
export type ProjectStatus = 'draft' | 'completed' | 'archived';

export interface LinkItem {
  id: UUID;
  label: string;
  url: string;
}

export interface PersonalInfo {
  fullName: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fatherName: string;
  motherName: string;
  dateOfBirth: string; // ISO yyyy-mm-dd
  gender: string;
  nationality: string;
  religion: string;
  maritalStatus: string;
  bloodGroup: string;
  height: string;
  weight: string;
  nationalId: string;
  passportNo: string;
  presentAddress: string;
  permanentAddress: string;
  city: string;
  district: string;
  postalCode: string;
  country: string;
  mobile: string;
  altPhone: string;
  email: string;
  linkedin: string;
  portfolio: string;
  website: string;
  otherLinks: LinkItem[];
  headline: string; // short professional tagline printed under the name
}

export interface PhotoState {
  dataUrl: string | null;
  shape: PhotoShape;
  zoom: number; // 1 = fit
  offsetX: number; // -100..100 (percent of frame)
  offsetY: number;
  rotation: number; // degrees
  frameSize: number; // mm
}

export interface EducationEntry {
  id: UUID;
  degree: string;
  group: string;
  institution: string;
  board: string;
  passingYear: string;
  result: string;
  gpa: string;
  scale: string;
  division: string;
  location: string;
  additionalInfo: string;
  currentlyStudying: boolean;
}

export interface ExperienceEntry {
  id: UUID;
  industry: string;
  company: string;
  jobTitle: string;
  employmentType: string;
  location: string;
  startDate: string;
  endDate: string;
  currentlyWorking: boolean;
  responsibilities: string[]; // bullet points
  achievements: string[];
  projects: string;
  tools: string;
  additionalDetails: string;
}

export interface SkillEntry {
  id: UUID;
  name: string;
  category: string;
  level: ProficiencyLevel;
}

export interface LanguageEntry {
  id: UUID;
  name: string;
  reading: LanguageProficiency;
  writing: LanguageProficiency;
  speaking: LanguageProficiency;
  listening: LanguageProficiency;
  overall: LanguageProficiency;
}

export interface TrainingEntry {
  id: UUID;
  title: string;
  institution: string;
  issuingOrganization: string;
  completionDate: string;
  duration: string;
  certificateId: string;
  description: string;
  skillsLearned: string;
}

export interface ProjectEntry {
  id: UUID;
  name: string;
  description: string;
  role: string;
  technologies: string;
  startDate: string;
  endDate: string;
  url: string;
  contributions: string[];
  outcome: string;
}

export interface AchievementEntry {
  id: UUID;
  title: string;
  awardName: string;
  organization: string;
  date: string;
  description: string;
}

export interface VolunteerEntry {
  id: UUID;
  organization: string;
  role: string;
  duration: string;
  responsibilities: string[];
  achievements: string;
}

export interface ReferenceEntry {
  id: UUID;
  name: string;
  designation: string;
  organization: string;
  relationship: string;
  phone: string;
  email: string;
  address: string;
  referenceType: string;
  additionalDetails: string;
  signatureDataUrl: string | null;
  consentGiven: boolean;
}

export interface CustomSectionEntry {
  id: UUID;
  title: string;
  items: { id: UUID; heading: string; subheading: string; period: string; body: string }[];
  enabled: boolean;
}

export interface DeclarationState {
  enabled: boolean;
  text: string;
  language: 'bn' | 'en';
  place: string;
  date: string;
}

export interface SignatureState {
  enabled: boolean;
  dataUrl: string | null;
  scale: number; // 0.5..2
  align: 'left' | 'center' | 'right';
}

export interface CareerInterestState {
  enabled: boolean;
  selected: string[];
  custom: string;
}

export interface CareerObjectiveState {
  enabled: boolean;
  categoryId: string;
  text: string;
}

/** Which personal details are allowed on the document. Nothing is exposed by default. */
export interface PersonalDetailVisibility {
  fatherName: boolean;
  motherName: boolean;
  dateOfBirth: boolean;
  nationality: boolean;
  religion: boolean;
  maritalStatus: boolean;
  bloodGroup: boolean;
  height: boolean;
  weight: boolean;
  gender: boolean;
  nationalId: boolean;
  passportNo: boolean;
  presentAddress: boolean;
  permanentAddress: boolean;
  email: boolean;
  mobile: boolean;
  altPhone: boolean;
  linkedin: boolean;
  website: boolean;
  address: boolean;
}

export type SectionId =
  | 'careerObjective'
  | 'careerInterests'
  | 'education'
  | 'experience'
  | 'skills'
  | 'languages'
  | 'training'
  | 'projects'
  | 'achievements'
  | 'strengths'
  | 'hobbies'
  | 'volunteer'
  | 'personalDetails'
  | 'references'
  | 'declaration'
  | 'signature'
  | 'custom';

export interface SectionConfig {
  id: SectionId;
  labelEn: string;
  labelBn: string;
  enabled: boolean;
  order: number;
  /** Font-size multiplier for section heading (design customisation). */
  headingScale: number;
}

/**
 * Document title block ("CURRICULUM VITAE", "RESUME", …).
 *
 * The title lives in its own model instead of ``personal.headline`` so it can be
 * styled, hidden and positioned independently, and so "no title" can collapse
 * the header completely rather than leaving an empty band.
 */
export type TitlePreset = 'cv' | 'curriculum-vitae' | 'resume' | 'professional-resume' | 'none' | 'custom';

export type TextTransform = 'none' | 'uppercase' | 'lowercase' | 'capitalize';
export type TextAlign = 'left' | 'center' | 'right' | 'justify';

/** The six built-in titles, in the order they appear in the picker. */
export const TITLE_PRESET_TEXT: Record<Exclude<TitlePreset, 'custom'>, string> = {
  cv: 'CV',
  'curriculum-vitae': 'CURRICULUM VITAE',
  resume: 'RESUME',
  'professional-resume': 'PROFESSIONAL RESUME',
  none: '',
};

export interface TitleStyle {
  visible: boolean;
  preset: TitlePreset;
  /** Used when preset === 'custom'; also the printed text for the presets. */
  text: string;
  fontFamily: string | null;
  /** Points. */
  fontSize: number;
  fontWeight: number;
  italic: boolean;
  underline: boolean;
  /** Strike-through. Useful for a heading the operator wants to cancel out. */
  strikethrough: boolean;
  color: string | null;
  transform: TextTransform;
  /** em units added between words (0 = normal). Never applied to Bengali. */
  wordSpacing: number;
  /** em units, e.g. 0.12 */
  letterSpacing: number;
  align: TextAlign;
  /** mm above / below the title. */
  spaceBeforeMm: number;
  spaceAfterMm: number;
  border: 'none' | 'thin' | 'thick' | 'double' | 'accent';
  /** mm padding inside the background box (0 = no box). */
  backgroundPaddingMm: number;
  background: 'none' | 'tint' | 'primary';
  /** Accent rule below the title. */
  accentLine: boolean;
  /** Where the title sits relative to the identity block. */
  position: 'above-name' | 'below-name' | 'below-contact';
}

/**
 * Page-length policy. `count` is a *target*: the engine may exceed it (with a
 * warning) but never truncates content to reach it.
 */
export type PageLengthMode = 'one-page' | 'two-pages' | 'automatic';
export type PageBreakAfter = SectionId[] | null;

export interface LayoutDiagnostic {
  level: 'info' | 'warning' | 'error';
  code:
    | 'PAGE_OVERFLOW'
    | 'PAGE_UNDERFLOW'
    | 'EMPTY_SECTION'
    | 'ORPHAN_HEADING_RISK'
    | 'OVERLONG_BULLET'
    | 'OVERLONG_OBJECTIVE'
    | 'DUPLICATE_SKILL'
    | 'MISSING_DATE'
    | 'ALMOST_EMPTY_LAST_PAGE'
    | 'UNBALANCED_COLUMNS'
    | 'PHOTO_TOO_LARGE';
  messageEn: string;
  messageBn: string;
  sectionId?: SectionId;
}

/** Optional per-section design override (Part 5.D). */
export interface SectionStyleOverride {
  headingColor?: string | null;
  headingAlign?: TextAlign | null;
  headingScale?: number;
  paragraphSpacing?: number;
  bulletStyle?: 'dot' | 'dash' | 'square' | 'none';
  pageBreakBefore?: boolean;
}

export interface CVData {
  personal: PersonalInfo;
  photo: PhotoState;
  careerObjective: CareerObjectiveState;
  careerInterests: CareerInterestState;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  hasExperience: boolean;
  skills: SkillEntry[];
  languages: LanguageEntry[];
  training: TrainingEntry[];
  trainingEnabled: boolean;
  projects: ProjectEntry[];
  projectsEnabled: boolean;
  achievements: AchievementEntry[];
  achievementsEnabled: boolean;
  strengths: { id: UUID; text: string }[];
  strengthsEnabled: boolean;
  hobbies: { id: UUID; text: string }[];
  hobbiesEnabled: boolean;
  volunteer: VolunteerEntry[];
  volunteerEnabled: boolean;
  personalDetails: PersonalDetailVisibility;
  personalDetailsEnabled: boolean;
  references: ReferenceEntry[];
  referencesEnabled: boolean;
  declaration: DeclarationState;
  signature: SignatureState;
  customSections: CustomSectionEntry[];
  sections: SectionConfig[];
  language: CVLanguage;
  /** Document title block — independent of the name and the headline. */
  title: TitleState;
  /** Page-length policy for this CV. */
  pageLength: PageLengthState;
  /** Optional per-section design overrides, keyed by section id. */
  sectionStyles: Partial<Record<SectionId, SectionStyleOverride>>;
}

export interface TitleState extends TitleStyle {
  /** Trimmed, resolved text the renderers print ('' when hidden). */
  resolvedText?: string;
}

/** Flattened title block produced by `resolveTitle()` for the renderers. */
export interface DocumentTitleTokens {
  visible: boolean;
  text: string;
  rawText: string;
  fontFamily: string | null;
  sizePt: number;
  weight: number;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  /** em units between words; forced to 0 for Bengali text. */
  wordSpacing: number;
  color: string | null;
  align: TextAlign;
  letterSpacing: number;
  spaceBeforeMm: number;
  spaceAfterMm: number;
  border: TitleStyle['border'];
  background: TitleStyle['background'];
  backgroundPaddingMm: number;
  accentLine: boolean;
  position: TitleStyle['position'];
  transform?: TextTransform;
}

export interface PageLengthState {
  mode: PageLengthMode;
  /** Hard ceiling the operator accepts; exceeded content is reported, never cut. */
  maxPages: number;
  /** Sections that always start on a new page. */
  breakBefore: SectionId[];
  /** Sections that never start a new page (kept with the previous block). */
  keepTogether: boolean;
}

/** Per-project design overrides — never mutates the underlying CV content. */
export interface DesignOverrides {
  paletteId: string;
  fontPairId: string;
  headingScale: number;
  bodyScale: number;
  lineHeight: number;
  sectionSpacing: number;
  marginMm: number;
  photoShape: PhotoShape;
  photoPosition: 'left' | 'right';
  headerStyle: 'banner' | 'split' | 'minimal' | 'centered' | 'band' | 'dual';
  headingStyle: 'rule' | 'bar' | 'caps' | 'boxed' | 'underline' | 'side-mark';
  showFooter: boolean;
  showPageNumbers: boolean;
  /** Optional structural overrides exposed by the design studio. */
  bodyLayout?: 'single' | 'sidebar-left' | 'sidebar-right' | 'two-col';
  entryLayout?: 'split' | 'inline' | 'stacked';
  band?: number;
  headerTint?: boolean;
  upperHeadings?: boolean;
  entryRule?: boolean;

  /* ---------------------------------------------------------- v1.1 studio */
  /** Independent page margins in mm. Falls back to `marginMm` when absent. */
  margins?: { top: number; right: number; bottom: number; left: number };
  /** Composition density — changes real layout parameters, not just cosmetics. */
  density?: 'compact' | 'balanced' | 'spacious';
  /** Colour overrides applied on top of the chosen palette. */
  colors?: Partial<Record<ColorToken, string>>;
  /** Per-role font families (CSS font stacks). Empty roles inherit the pair. */
  fontRoles?: Partial<Record<FontRole, string>>;
  /** Exact point sizes for the two largest roles. */
  nameSizePt?: number;
  titleSizePt?: number;
  /** Granular spacing multipliers (1 = template default). */
  spacing?: Partial<Record<SpacingToken, number>>;
  /** Paragraph-level defaults. */
  bodyAlign?: TextAlign;
  paragraphIndentMm?: number;
  /** Photo geometry overrides. */
  photoSizeMm?: number;
  photoBorder?: 'none' | 'thin' | 'medium' | 'thick';
  photoBorderColor?: string;
  /** Saved style preset currently applied (for "modified" indication). */
  presetId?: string | null;
}

export type ColorToken =
  | 'primary'
  | 'secondary'
  | 'accent'
  | 'heading'
  | 'text'
  | 'muted'
  | 'border'
  | 'divider'
  | 'background'
  | 'sidebar'
  | 'headerBackground'
  | 'footerBackground'
  | 'photoBorder';

export type FontRole =
  | 'name'
  | 'title'
  | 'heading'
  | 'subheading'
  | 'body'
  | 'contact'
  | 'dates'
  | 'bullets'
  | 'footer'
  | 'pageNumbers';

export type SpacingToken =
  | 'header'
  | 'nameContact'
  | 'title'
  | 'sectionHeading'
  | 'sectionGap'
  | 'paragraph'
  | 'bullet'
  | 'line'
  | 'column'
  | 'photo'
  | 'footer'
  | 'pageBreak';

/** A reusable, user-saved design preset (stored in `template_settings`). */
export interface StylePreset {
  id: UUID;
  name: string;
  baseTemplateId: string;
  design: DesignOverrides;
  createdAt: string;
}

export interface ProjectRecord {
  id: UUID;
  customerId: UUID | null;
  title: string;
  templateId: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  data: CVData;
  design: DesignOverrides;
  deletedAt: string | null;
  /** Monotonic save counter, also used for version history. */
  version?: number;
}

export interface CustomerRecord {
  id: UUID;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface ExportRecord {
  id: UUID;
  projectId: UUID;
  projectTitle: string;
  format: 'docx' | 'pdf' | 'print';
  fileName: string;
  createdAt: string;
  status: 'success' | 'failed';
  message: string;
}

export interface AppSettings {
  uiLanguage: 'bn' | 'en';
  theme: 'light' | 'dark' | 'system';
  defaultSaveLocation: string;
  defaultCvLanguage: CVLanguage;
  defaultTemplateId: string;
  defaultMarginMm: number;
  defaultFontPairId: string;
  defaultPrinter: string;
  autosaveMs: number;
  filenamePattern: string;
  backupLocation: string;
  backupFrequency: 'manual' | 'daily' | 'weekly';
  defaultDocxLocation: string;
  defaultPdfLocation: string;
  reduceMotion: boolean;
}

export interface BackupRecord {
  id: UUID;
  fileName: string;
  path: string;
  createdAt: string;
  sizeBytes: number;
  verified: boolean;
  kind: 'manual' | 'auto';
}

/** Re-export used by the workspace store for typing bridge info. */
export type PlatformInfoLike = import('@/platform/types').PlatformInfo;
