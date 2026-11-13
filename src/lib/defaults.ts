import type {
  AppSettings,
  PageLengthState,
  TitleState,
  CVData,
  CustomerRecord,
  DesignOverrides,
  PersonalDetailVisibility,
  ProjectRecord,
  SectionConfig,
  SectionId,
} from '@/types/cv';
import { TITLE_PRESET_TEXT } from '@/types/cv';

export const uid = (): string => {
  // crypto.randomUUID exists in Electron 22 / Chromium 108 and Node 16+.
  const c = globalThis.crypto as Crypto | undefined;
  if (c && typeof c.randomUUID === 'function') return c.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    const v = ch === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

export const nowIso = (): string => new Date().toISOString();

/** All document sections in their canonical order. */
export const SECTION_DEFS: { id: SectionId; labelEn: string; labelBn: string }[] = [
  { id: 'careerObjective', labelEn: 'Career Objective', labelBn: 'ক্যারিয়ার অবজেক্টিভ' },
  { id: 'careerInterests', labelEn: 'Career Interest', labelBn: 'ক্যারিয়ার আগ্রহ' },
  { id: 'education', labelEn: 'Education', labelBn: 'শিক্ষাগত যোগ্যতা' },
  { id: 'experience', labelEn: 'Work Experience', labelBn: 'কর্ম অভিজ্ঞতা' },
  { id: 'skills', labelEn: 'Skills', labelBn: 'দক্ষতা' },
  { id: 'languages', labelEn: 'Language Proficiency', labelBn: 'ভাষা দক্ষতা' },
  { id: 'training', labelEn: 'Training & Certifications', labelBn: 'প্রশিক্ষণ ও সার্টিফিকেশন' },
  { id: 'projects', labelEn: 'Projects', labelBn: 'প্রকল্প' },
  { id: 'achievements', labelEn: 'Achievements & Awards', labelBn: 'অর্জন ও পুরস্কার' },
  { id: 'strengths', labelEn: 'Strengths', labelBn: 'শক্তিশালী দিক' },
  { id: 'hobbies', labelEn: 'Hobbies & Interests', labelBn: 'শখ ও আগ্রহ' },
  { id: 'volunteer', labelEn: 'Volunteer Experience', labelBn: 'স্বেচ্ছাসেবা' },
  { id: 'personalDetails', labelEn: 'Personal Details', labelBn: 'ব্যক্তিগত তথ্য' },
  { id: 'references', labelEn: 'References', labelBn: 'রেফারেন্স' },
  { id: 'declaration', labelEn: 'Declaration', labelBn: 'ঘোষণাপত্র' },
  { id: 'signature', labelEn: 'Signature', labelBn: 'স্বাক্ষর' },
  { id: 'custom', labelEn: 'Additional Information', labelBn: 'অতিরিক্ত তথ্য' },
];

export const defaultSections = (): SectionConfig[] =>
  SECTION_DEFS.map((def, index) => ({
    id: def.id,
    labelEn: def.labelEn,
    labelBn: def.labelBn,
    // Content-bearing core sections on by default; optional ones stay off until the
    // operator explicitly enables them (Part 6 of the specification).
    enabled: ['careerObjective', 'education', 'experience', 'skills', 'languages'].includes(def.id),
    order: index,
    headingScale: 1,
  }));

export const emptyVisibility = (): PersonalDetailVisibility => ({
  fatherName: false,
  motherName: false,
  dateOfBirth: false,
  nationality: false,
  religion: false,
  maritalStatus: false,
  bloodGroup: false,
  height: false,
  weight: false,
  gender: false,
  nationalId: false,
  passportNo: false,
  presentAddress: true,
  permanentAddress: false,
  email: true,
  mobile: true,
  altPhone: false,
  linkedin: false,
  website: false,
  address: false,
});

/**
 * Default document title block.
 *
 * "CURRICULUM VITAE" is the register most Bangladeshi employers expect, so it
 * is the default *text* — but it is shown only when the operator keeps it
 * enabled, and hiding it collapses the header instead of leaving a gap.
 */
export const defaultTitle = (): TitleState => ({
  visible: true,
  preset: 'curriculum-vitae',
  text: TITLE_PRESET_TEXT['curriculum-vitae'],
  fontFamily: null,
  fontSize: 10,
  fontWeight: 600,
  italic: false,
  underline: false,
  color: null,
  transform: 'uppercase',
  letterSpacing: 0.14,
  align: 'left',
  spaceBeforeMm: 1,
  spaceAfterMm: 1.4,
  border: 'none',
  backgroundPaddingMm: 0,
  background: 'none',
  accentLine: true,
  position: 'below-name',
});

export const defaultPageLength = (): PageLengthState => ({
  mode: 'automatic',
  maxPages: 4,
  breakBefore: [],
  keepTogether: true,
});

export const createEmptyCv = (): CVData => ({
  personal: {
    fullName: '',
    firstName: '',
    middleName: '',
    lastName: '',
    fatherName: '',
    motherName: '',
    dateOfBirth: '',
    gender: '',
    nationality: '',
    religion: '',
    maritalStatus: '',
    bloodGroup: '',
    height: '',
    weight: '',
    nationalId: '',
    passportNo: '',
    presentAddress: '',
    permanentAddress: '',
    city: '',
    district: '',
    postalCode: '',
    country: 'Bangladesh',
    mobile: '',
    altPhone: '',
    email: '',
    linkedin: '',
    portfolio: '',
    website: '',
    otherLinks: [],
    headline: '',
  },
  photo: {
    dataUrl: null,
    shape: 'circle',
    zoom: 1,
    offsetX: 0,
    offsetY: 0,
    rotation: 0,
    frameSize: 30,
  },
  careerObjective: { enabled: true, categoryId: 'general', text: '' },
  careerInterests: { enabled: false, selected: [], custom: '' },
  education: [],
  experience: [],
  hasExperience: false,
  skills: [],
  languages: [],
  training: [],
  trainingEnabled: false,
  projects: [],
  projectsEnabled: false,
  achievements: [],
  achievementsEnabled: false,
  strengths: [],
  strengthsEnabled: false,
  hobbies: [],
  hobbiesEnabled: false,
  volunteer: [],
  volunteerEnabled: false,
  personalDetails: emptyVisibility(),
  personalDetailsEnabled: false,
  references: [],
  referencesEnabled: false,
  declaration: { enabled: false, text: '', language: 'en', place: '', date: '' },
  signature: { enabled: false, dataUrl: null, scale: 1, align: 'right' },
  customSections: [],
  sections: defaultSections(),
  language: 'en',
  title: defaultTitle(),
  pageLength: defaultPageLength(),
  sectionStyles: {},
});

export const defaultDesign = (templateId = 'classic-professional'): DesignOverrides => ({
  paletteId: defaultPaletteForTemplate(templateId),
  fontPairId: defaultFontForTemplate(templateId),
  headingScale: 1,
  bodyScale: 1,
  lineHeight: 1.5,
  sectionSpacing: 1,
  marginMm: 16,
  photoShape: 'circle',
  photoPosition: 'right',
  headerStyle: 'banner',
  headingStyle: 'rule',
  showFooter: false,
  showPageNumbers: false,
});

function defaultPaletteForTemplate(templateId: string): string {
  const map: Record<string, string> = {
    'traditional-corporate': 'charcoal',
    'modern-bangladesh': 'deep-green',
    'elegant-formal': 'burgundy',
    'corporate-executive': 'navy',
    'premium-business': 'muted-gold',
    'professional-manager': 'slate',
    'minimal-executive': 'monochrome',
    'ats-classic': 'black',
    'ats-modern': 'charcoal',
    'graduate-professional': 'teal',
    'fresh-career-starter': 'deep-green',
    'senior-professional': 'navy',
    'career-achievement': 'burgundy',
    'it-technology': 'teal',
    'engineering-professional': 'slate',
    'banking-finance': 'navy',
    'academic-research': 'charcoal',
    'creative-professional': 'burgundy',
    'international-resume': 'monochrome',
    'swiss-minimalist': 'monochrome',
    'scandinavian-executive': 'slate',
    'modern-editorial': 'charcoal',
    'premium-luxury': 'muted-gold',
    'global-ats-professional': 'black',
    'modern-two-column': 'navy',
    'executive-leadership-pro': 'navy',
    'compact-one-page-expert': 'teal',
    'academic-international-pro': 'charcoal',
    'contemporary-creative-portfolio': 'deep-green',
  };
  return map[templateId] ?? 'navy';
}

function defaultFontForTemplate(templateId: string): string {
  const serifTemplates = [
    'traditional-corporate',
    'elegant-formal',
    'academic-research',
    'senior-professional',
    'premium-luxury',
    'executive-leadership-pro',
    'academic-international-pro',
  ];
  return serifTemplates.includes(templateId) ? 'lora-inter' : 'inter-inter';
}

export const createProject = (patch: Partial<ProjectRecord> = {}): ProjectRecord => {
  const timestamp = nowIso();
  return {
    id: uid(),
    customerId: null,
    title: 'Untitled CV',
    templateId: 'classic-professional',
    status: 'draft',
    createdAt: timestamp,
    updatedAt: timestamp,
    data: createEmptyCv(),
    design: defaultDesign(),
    deletedAt: null,
    ...patch,
  };
};

export const createEmptyCustomer = (patch: Partial<CustomerRecord> = {}): CustomerRecord => {
  const timestamp = nowIso();
  return {
    id: uid(),
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    createdAt: timestamp,
    updatedAt: timestamp,
    deletedAt: null,
    ...patch,
  };
};

export const DEFAULT_SETTINGS: AppSettings = {
  uiLanguage: 'bn',
  theme: 'light',
  defaultSaveLocation: '',
  defaultCvLanguage: 'en',
  defaultTemplateId: 'classic-professional',
  defaultMarginMm: 16,
  defaultFontPairId: 'inter-inter',
  defaultPrinter: '',
  autosaveMs: 1200,
  filenamePattern: '{name}_{template}_{date}',
  backupLocation: '',
  backupFrequency: 'manual',
  defaultDocxLocation: '',
  defaultPdfLocation: '',
  reduceMotion: false,
};
