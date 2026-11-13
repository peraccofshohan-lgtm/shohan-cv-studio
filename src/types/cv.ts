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
