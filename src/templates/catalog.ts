/**
 * Template catalogue — 30 premium A4 CV designs.
 *
 * Every template has its own structural identity: header composition, body
 * grid, section-heading treatment, entry layout, typography pair and palette.
 * Colours alone never differentiate two templates.
 */
import type { DesignOverrides, PhotoShape } from '@/types/cv';

export interface Palette {
  id: string;
  name: string;
  nameBn: string;
  /** Primary ink used for name + headings/rules. */
  primary: string;
  /** Secondary accent used for bands and small marks. */
  accent: string;
  /** Tinted background panel (header band / sidebar). */
  tint: string;
  /** Body text. */
  text: string;
  /** Muted text for meta lines. */
  muted: string;
  /** Text that sits on the primary colour. */
  onPrimary: string;
  /** Optional sidebar background. */
  sidebar: string;
  /* Optional tokens introduced with the v1.1 colour engine. Palettes that do
     not declare them inherit `primary` / `text` / `#ffffff` at resolve time. */
  heading?: string;
  border?: string;
  divider?: string;
  background?: string;
  headerBackground?: string;
  footerBackground?: string;
  photoBorder?: string;
}

export const PALETTES: Palette[] = [
  {
    id: 'navy',
    name: 'Navy Blue',
    nameBn: 'নেভি ব্লু',
    primary: '#14395e',
    accent: '#b4894a',
    tint: '#eaf0f7',
    text: '#1b232c',
    muted: '#5b6572',
    onPrimary: '#ffffff',
    sidebar: '#14395e',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    nameBn: 'চারকোল',
    primary: '#2c333b',
    accent: '#8a939d',
    tint: '#f0f2f4',
    text: '#1d2329',
    muted: '#5f6873',
    onPrimary: '#ffffff',
    sidebar: '#2c333b',
  },
  {
    id: 'black',
    name: 'Black & White',
    nameBn: 'কালো ও সাদা',
    primary: '#111418',
    accent: '#555d66',
    tint: '#f4f5f6',
    text: '#111418',
    muted: '#59616a',
    onPrimary: '#ffffff',
    sidebar: '#111418',
  },
  {
    id: 'deep-green',
    name: 'Deep Green',
    nameBn: 'গাঢ় সবুজ',
    primary: '#1c5140',
    accent: '#b98f4e',
    tint: '#e9f1ee',
    text: '#1a2421',
    muted: '#566360',
    onPrimary: '#ffffff',
    sidebar: '#1c5140',
  },
  {
    id: 'burgundy',
    name: 'Burgundy',
    nameBn: 'বারগান্ডি',
    primary: '#6d2231',
    accent: '#b98a52',
    tint: '#f6ebed',
    text: '#241a1d',
    muted: '#665a5e',
    onPrimary: '#ffffff',
    sidebar: '#6d2231',
  },
  {
    id: 'slate',
    name: 'Slate Grey',
    nameBn: 'স্লেট গ্রে',
    primary: '#3d4c5c',
    accent: '#7c8b9a',
    tint: '#eef1f4',
    text: '#1e252d',
    muted: '#5d6874',
    onPrimary: '#ffffff',
    sidebar: '#3d4c5c',
  },
  {
    id: 'teal',
    name: 'Teal',
    nameBn: 'টিল',
    primary: '#185c63',
    accent: '#b98f4e',
    tint: '#e8f1f1',
    text: '#172526',
    muted: '#536363',
    onPrimary: '#ffffff',
    sidebar: '#185c63',
  },
  {
    id: 'muted-gold',
    name: 'Muted Gold',
    nameBn: 'মিউটেড গোল্ড',
    primary: '#6b5a34',
    accent: '#a98f57',
    tint: '#f7f3e9',
    text: '#241f14',
    muted: '#665f4e',
    onPrimary: '#ffffff',
    sidebar: '#4a3f24',
  },
  {
    id: 'monochrome',
    name: 'Minimal Monochrome',
    nameBn: 'মনোক্রোম',
    primary: '#23282e',
    accent: '#9aa3ac',
    tint: '#f5f6f7',
    text: '#23282e',
    muted: '#626b74',
    onPrimary: '#ffffff',
    sidebar: '#f1f3f5',
  },
];

export const paletteById = (id: string): Palette => PALETTES.find((p) => p.id === id) ?? PALETTES[0];

export interface FontPair {
  id: string;
  name: string;
  nameBn: string;
  display: string; // font-family stack for the name/headings
  body: string;
  /** Baseline adjustment for Bengali glyph metrics. */
  bengaliOk: boolean;
}

export const FONT_PAIRS: FontPair[] = [
  {
    id: 'inter-inter',
    name: 'Inter / Inter',
    nameBn: 'ইন্টার',
    display: "'Inter', 'Noto Sans Bengali', sans-serif",
    body: "'Inter', 'Noto Sans Bengali', sans-serif",
    bengaliOk: true,
  },
  {
    id: 'lora-inter',
    name: 'Lora / Inter',
    nameBn: 'লোরা + ইন্টার',
    display: "'Lora', 'Noto Serif Bengali', serif",
    body: "'Inter', 'Noto Sans Bengali', sans-serif",
    bengaliOk: true,
  },
  {
    id: 'inter-lora',
    name: 'Inter / Lora',
    nameBn: 'ইন্টার + লোরা',
    display: "'Inter', 'Noto Sans Bengali', sans-serif",
    body: "'Lora', 'Noto Serif Bengali', serif",
    bengaliOk: true,
  },
  {
    id: 'notobn-inter',
    name: 'Noto Bengali / Inter',
    nameBn: 'নোটো বাংলা + ইন্টার',
    display: "'Noto Sans Bengali', 'Inter', sans-serif",
    body: "'Inter', 'Noto Sans Bengali', sans-serif",
    bengaliOk: true,
  },
];

export const fontPairById = (id: string): FontPair => FONT_PAIRS.find((f) => f.id === id) ?? FONT_PAIRS[0];

export type TemplateCategory =
  | 'Classic Bangladesh'
  | 'Corporate & Executive'
  | 'ATS-Friendly'
  | 'Fresher & Graduate'
  | 'Experienced Professional'
  | 'Technical'
  | 'Specialized';

export type HeaderLayout = 'banner' | 'split' | 'centered' | 'minimal' | 'band' | 'dual';
export type BodyLayout = 'single' | 'sidebar-left' | 'sidebar-right' | 'two-col';
export type HeadingLayout = 'rule' | 'bar' | 'caps' | 'boxed' | 'underline' | 'side-mark';
export type EntryLayout = 'split' | 'inline' | 'stacked';

export interface TemplateDefinition {
  id: string;
  name: string;
  nameBn: string;
  category: TemplateCategory;
  description: string;
  descriptionBn: string;
  atsFriendly: boolean;
  photoSupported: boolean;
  /** Structural signature of the design. */
  layout: {
    header: HeaderLayout;
    body: BodyLayout;
    heading: HeadingLayout;
    entry: EntryLayout;
    /** Thickness (mm) of decorative bands; 0 disables them. */
    band: number;
    /** Show a coloured header block behind the name. */
    headerTint: boolean;
    /** Uppercase section headings. */
    upperHeadings: boolean;
    /** Divider between entries. */
    entryRule: boolean;
    photoShape: PhotoShape;
    /** Side the portrait sits on; asymmetric identities default to the right. */
    photo?: 'left' | 'right';
  };
  paletteId: string;
  fontPairId: string;
  defaults: Partial<DesignOverrides>;
}

const T = (
  id: string,
  name: string,
  nameBn: string,
  category: TemplateCategory,
  description: string,
  descriptionBn: string,
  paletteId: string,
  fontPairId: string,
  layout: Partial<TemplateDefinition['layout']>,
  extra: Partial<TemplateDefinition> = {},
): TemplateDefinition => ({
  id,
  name,
  nameBn,
  category,
  description,
  descriptionBn,
  atsFriendly: category === 'ATS-Friendly',
  photoSupported: true,
  paletteId,
  fontPairId,
  layout: {
    header: 'banner',
    body: 'single',
    heading: 'rule',
    entry: 'split',
    band: 0,
    headerTint: false,
    upperHeadings: true,
    entryRule: false,
    photoShape: 'circle',
    ...layout,
  },
  defaults: {},
  ...extra,
});

export const TEMPLATES: TemplateDefinition[] = [
  // ---------------------------------------------------- Classic Bangladesh
  T(
    'classic-professional',
    'Classic Professional',
    'ক্লাসিক প্রফেশনাল',
    'Classic Bangladesh',
    'Timeless single-column layout with a ruled header and clear section rules. The safest all-round choice for any Bangladeshi employer.',
    'ঐতিহ্যবাহী এক কলামের লেআউট, রুলড হেডার ও স্পষ্ট সেকশন বিভাজন। যেকোনো বাংলাদেশি নিয়োগকর্তার জন্য নিরাপদ পছন্দ।',
    'navy',
    'inter-inter',
    { header: 'split', heading: 'rule', entry: 'split', band: 0, upperHeadings: true },
  ),
  T(
    'traditional-corporate',
    'Traditional Corporate',
    'ট্র্যাডিশনাল কর্পোরেট',
    'Classic Bangladesh',
    'Serif typography, centred name block and a fine double rule — the formal register preferred by banks and government offices.',
    'সেরিফ টাইপোগ্রাফি, কেন্দ্রীভূত নাম ও সূক্ষ্ম ডাবল রুল — ব্যাংক ও সরকারি অফিসে প্রচলিত আনুষ্ঠানিক রূপ।',
    'charcoal',
    'lora-inter',
    { header: 'centered', heading: 'caps', entry: 'inline', band: 1.2, upperHeadings: true, entryRule: false, photo: 'left' },
  ),
  T(
    'modern-bangladesh',
    'Modern Bangladesh',
    'মডার্ন বাংলাদেশ',
    'Classic Bangladesh',
    'Warm deep-green accent band, left-aligned identity block and generous baseline grid. Modern yet entirely local in feel.',
    'গাঢ় সবুজ অ্যাকসেন্ট ব্যান্ড, বাম-সারিবদ্ধ পরিচিতি ও প্রশস্ত লাইন-স্পেসিং। আধুনিক অথচ সম্পূর্ণ দেশীয়।',
    'deep-green',
    'notobn-inter',
    { header: 'banner', heading: 'bar', entry: 'split', band: 3.2, headerTint: true, upperHeadings: true },
  ),
  T(
    'elegant-formal',
    'Elegant Formal',
    'এলিগ্যান্ট ফর্মাল',
    'Classic Bangladesh',
    'Burgundy side rule, serif headings and airy spacing for a poised, letterpress-inspired document.',
    'বারগান্ডি সাইড রুল, সেরিফ শিরোনাম ও খোলামেলা স্পেসিং — লেটারপ্রেস-অনুপ্রাণিত মার্জিত ডকুমেন্ট।',
    'burgundy',
    'lora-inter',
    { header: 'minimal', heading: 'side-mark', entry: 'split', band: 0, upperHeadings: false, photo: 'left' },
  ),

  // ------------------------------------------------- Corporate & Executive
  T(
    'corporate-executive',
    'Corporate Executive',
    'কর্পোরেট এক্সিকিউটিভ',
    'Corporate & Executive',
    'Full-width navy header panel carrying name, title and contact, followed by a disciplined single-column body.',
    'নেভি রঙের পূর্ণ-প্রস্থ হেডার প্যানেলে নাম, পদবি ও যোগাযোগ; এরপর সুশৃঙ্খল এক কলামের বডি।',
    'navy',
    'inter-inter',
    { header: 'band', heading: 'bar', entry: 'split', band: 0, headerTint: true, upperHeadings: true, photoShape: 'square' },
  ),
  T(
    'premium-business',
    'Premium Business',
    'প্রিমিয়াম বিজনেস',
    'Corporate & Executive',
    'Muted-gold hairline frames, asymmetric two-column body with a narrow facts column — a boardroom-ready composition.',
    'মিউটেড গোল্ড হেয়ারলাইন, অসম দুই-কলাম বডি ও সংকীর্ণ তথ্য কলাম — বোর্ডরুম-উপযোগী বিন্যাস।',
    'muted-gold',
    'lora-inter',
    { header: 'dual', heading: 'underline', entry: 'split', band: 0, body: 'two-col', upperHeadings: true, entryRule: true },
  ),
  T(
    'professional-manager',
    'Professional Manager',
    'প্রফেশনাল ম্যানেজার',
    'Corporate & Executive',
    'Tinted left sidebar for contact and skills, wide content column for experience — reads fast during shortlisting.',
    'যোগাযোগ ও দক্ষতার জন্য হালকা বাম সাইডবার, অভিজ্ঞতার জন্য প্রশস্ত কলাম — দ্রুত স্ক্রিনিংয়ের উপযোগী।',
    'slate',
    'inter-inter',
    { header: 'split', heading: 'caps', entry: 'inline', body: 'sidebar-left', band: 0, upperHeadings: true, photoShape: 'rounded', photo: 'left' },
  ),
  T(
    'minimal-executive',
    'Minimal Executive',
    'মিনিমাল এক্সিকিউটিভ',
    'Corporate & Executive',
    'Extreme whitespace discipline: hairline rules, small caps and nothing else competing for attention.',
    'সর্বোচ্চ হোয়াইটস্পেস শৃঙ্খলা: হেয়ারলাইন রুল, স্মল ক্যাপস — মনোযোগ নষ্ট করার মতো কিছু নেই।',
    'monochrome',
    'inter-inter',
    { header: 'minimal', heading: 'caps', entry: 'stacked', band: 0, upperHeadings: true, entryRule: true },
  ),

  // ------------------------------------------------------- ATS-Friendly
  T(
    'ats-classic',
    'ATS Classic',
    'এটিএস ক্লাসিক',
    'ATS-Friendly',
    'Pure single-column, standard headings, no graphics or tables — parsed reliably by applicant tracking systems.',
    'সম্পূর্ণ এক কলাম, প্রমিত শিরোনাম, কোনো গ্রাফিক্স বা টেবিল নেই — অ্যাপ্লিক্যান্ট ট্র্যাকিং সিস্টেমে নির্ভরযোগ্যভাবে পার্স হয়।',
    'black',
    'inter-inter',
    { header: 'minimal', heading: 'caps', entry: 'inline', band: 0, upperHeadings: true, photoShape: 'none' },
    { photoSupported: false },
  ),
  T(
    'ats-modern',
    'ATS Modern',
    'এটিএস মডার্ন',
    'ATS-Friendly',
    'ATS-safe structure with a restrained charcoal heading bar and better rhythm than a plain text dump.',
    'এটিএস-নিরাপদ কাঠামো, সংযত চারকোল হেডিং বার ও সাধারণ টেক্সটের চেয়ে উন্নত রিদম।',
    'charcoal',
    'inter-inter',
    { header: 'split', heading: 'bar', entry: 'split', band: 0, upperHeadings: true, photoShape: 'none' },
    { photoSupported: false },
  ),

  // -------------------------------------------------- Fresher & Graduate
  T(
    'graduate-professional',
    'Graduate Professional',
    'গ্র্যাজুয়েট প্রফেশনাল',
    'Fresher & Graduate',
    'Education-first ordering with a friendly teal header — designed for fresh graduates with limited work history.',
    'শিক্ষাকে প্রথমে রাখা, বন্ধুত্বপূর্ণ টিল হেডার — সীমিত কর্মঅভিজ্ঞতার নতুন গ্র্যাজুয়েটদের জন্য।',
    'teal',
    'inter-inter',
    { header: 'banner', heading: 'rule', entry: 'split', band: 2, headerTint: true, upperHeadings: true },
  ),
  T(
    'fresh-career-starter',
    'Fresh Career Starter',
    'ফ্রেশ ক্যারিয়ার স্টার্টার',
    'Fresher & Graduate',
    'Compact two-column top block for objective and skills, giving a light CV a confident, structured profile.',
    'অবজেক্টিভ ও দক্ষতার জন্য সংক্ষিপ্ত দুই-কলাম ব্লক — হালকা সিভিকে আত্মবিশ্বাসী কাঠামো দেয়।',
    'deep-green',
    'notobn-inter',
    { header: 'split', heading: 'bar', entry: 'split', band: 0, body: 'two-col', upperHeadings: true, photoShape: 'rounded' },
  ),

  // --------------------------------------------- Experienced Professional
  T(
    'senior-professional',
    'Senior Professional',
    'সিনিয়র প্রফেশনাল',
    'Experienced Professional',
    'Achievement-led entries with a right-hand period column and a serif name — built for 10+ year careers.',
    'অর্জন-কেন্দ্রিক এন্ট্রি, ডানদিকে সময়কাল কলাম ও সেরিফ নাম — ১০+ বছরের ক্যারিয়ারের জন্য।',
    'navy',
    'lora-inter',
    { header: 'split', heading: 'rule', entry: 'split', band: 0, upperHeadings: true, entryRule: true },
  ),
  T(
    'career-achievement',
    'Career Achievement',
    'ক্যারিয়ার অ্যাচিভমেন্ট',
    'Experienced Professional',
    'Timeline-style left rail with burgundy markers, emphasising progression across roles.',
    'বারগান্ডি মার্কারসহ টাইমলাইন-ধাঁচের বাম রেল, পদোন্নতির ধারা তুলে ধরে।',
    'burgundy',
    'inter-lora',
    { header: 'minimal', heading: 'side-mark', entry: 'stacked', band: 0, body: 'single', upperHeadings: false, entryRule: false },
  ),

  // ----------------------------------------------------------- Technical
  T(
    'it-technology',
    'IT & Technology',
    'আইটি ও টেকনোলজি',
    'Technical',
    'Monospaced meta lines, skill matrix grouped by category and a dark left rail — engineering-credible.',
    'মনোস্পেসড মেটা লাইন, ক্যাটাগরি অনুযায়ী দক্ষতা ম্যাট্রিক্স ও গাঢ় বাম রেল — ইঞ্জিনিয়ারিং-উপযোগী।',
    'teal',
    'inter-inter',
    { header: 'band', heading: 'bar', entry: 'split', band: 0, body: 'sidebar-left', headerTint: true, upperHeadings: true, photoShape: 'square' },
  ),
  T(
    'engineering-professional',
    'Engineering Professional',
    'ইঞ্জিনিয়ারিং প্রফেশনাল',
    'Technical',
    'Rule-framed page, numbered sections and projects given equal weight to employment — classic engineering register.',
    'রুল-ফ্রেম পৃষ্ঠা, নম্বরযুক্ত সেকশন ও চাকরির সমান গুরুত্বে প্রকল্প — ক্লাসিক ইঞ্জিনিয়ারিং রীতি।',
    'slate',
    'lora-inter',
    { header: 'centered', heading: 'boxed', entry: 'split', band: 0, upperHeadings: true, entryRule: true },
  ),

  // ---------------------------------------------------------- Specialized
  T(
    'banking-finance',
    'Banking & Finance',
    'ব্যাংকিং ও ফাইন্যান্স',
    'Specialized',
    'Conservative navy header, personal-details table and a formal declaration block — the standard bank application shape.',
    'রক্ষণশীল নেভি হেডার, ব্যক্তিগত তথ্যের টেবিল ও আনুষ্ঠানিক ঘোষণাপত্র — ব্যাংক আবেদনের প্রচলিত রূপ।',
    'navy',
    'inter-inter',
    { header: 'banner', heading: 'underline', entry: 'split', band: 2.4, headerTint: true, upperHeadings: true, photoShape: 'square' },
  ),
  T(
    'academic-research',
    'Academic & Research',
    'একাডেমিক ও রিসার্চ',
    'Specialized',
    'Serif body, wide measure and publication-friendly custom sections for faculty and research applications.',
    'সেরিফ বডি, প্রশস্ত মেজার ও প্রকাশনার উপযোগী কাস্টম সেকশন — শিক্ষক ও গবেষক আবেদনের জন্য।',
    'charcoal',
    'lora-inter',
    { header: 'centered', heading: 'rule', entry: 'inline', band: 0, upperHeadings: false, entryRule: true, photo: 'left' },
  ),
  T(
    'creative-professional',
    'Creative Professional',
    'ক্রিয়েটিভ প্রফেশনাল',
    'Specialized',
    'Full-height burgundy right rail with a rotated name plate — expressive without sacrificing legibility.',
    'পূর্ণ-উচ্চতার বারগান্ডি ডান রেল ও রোটেটেড নেম প্লেট — পাঠযোগ্যতা না হারিয়ে প্রকাশশীল।',
    'burgundy',
    'lora-inter',
    { header: 'dual', heading: 'caps', entry: 'stacked', band: 0, body: 'sidebar-right', upperHeadings: true, photoShape: 'circle' },
  ),
  T(
    'international-resume',
    'International Resume',
    'ইন্টারন্যাশনাল রেজুমে',
    'Specialized',
    'US/UK-style resume: no personal data, no photo, metric-driven bullets and a scannable single column.',
    'ইউএস/ইউকে-ধাঁচের রেজুমে: ব্যক্তিগত তথ্য নেই, ছবি নেই, মেট্রিক-ভিত্তিক বুলেট ও সহজে স্ক্যানযোগ্য এক কলাম।',
    'monochrome',
    'inter-inter',
    { header: 'minimal', heading: 'caps', entry: 'split', band: 0, upperHeadings: true, entryRule: false, photoShape: 'none' },
    { photoSupported: false },
  ),

  // =====================================================================
  // v1.1 — ten premium designs. Each one differs structurally (header
  // composition, body grid, heading treatment, entry rhythm, palette and
  // type pair), never by colour alone.
  // =====================================================================

  // 21 — Swiss Minimalist: strict flush-left grid, one hairline, no decoration.
  T(
    'swiss-minimalist',
    'Swiss Minimalist',
    'সুইস মিনিমালিস্ট',
    'Specialized',
    'International typographic style: flush-left grid, one hairline rule, generous leading and zero decoration.',
    'আন্তর্জাতিক টাইপোগ্রাফিক ধারা: বাম-সংলগ্ন গ্রিড, একটি সরু রেখা, প্রশস্ত লাইন-স্পেসিং ও কোনো সাজসজ্জা নেই।',
    'monochrome',
    'inter-inter',
    { header: 'minimal', heading: 'caps', entry: 'split', band: 0, upperHeadings: false, entryRule: false, photoShape: 'square', photo: 'right' },
  ),
  // 22 — Scandinavian Executive: airy, restrained, lots of white space.
  T(
    'scandinavian-executive',
    'Scandinavian Executive',
    'স্ক্যান্ডিনেভিয়ান এক্সিকিউটিভ',
    'Corporate & Executive',
    'Quiet Nordic composition: airy whitespace, dusty blue accent, small caps headings and softly spaced entries.',
    'শান্ত নর্ডিক কম্পোজিশন: খোলামেলা স্পেসিং, ধূসর-নীল অ্যাকসেন্ট, স্মল ক্যাপস শিরোনাম ও নরম এন্ট্রি ফাঁক।',
    'slate',
    'inter-lora',
    { header: 'split', heading: 'underline', entry: 'stacked', band: 0, upperHeadings: true, entryRule: false, photoShape: 'circle', photo: 'left' },
  ),
  // 23 — Modern Editorial: strong display headings over a two-column grid.
  T(
    'modern-editorial',
    'Modern Editorial',
    'মডার্ন এডিটোরিয়াল',
    'Specialized',
    'Magazine-inspired: oversized serif headings, two balanced columns and an editorial header block.',
    'ম্যাগাজিন-অনুপ্রাণিত: বড় সেরিফ শিরোনাম, দুটি ভারসাম্যপূর্ণ কলাম ও সম্পাদকীয় ধাঁচের হেডার।',
    'charcoal',
    'lora-inter',
    { header: 'dual', heading: 'bar', entry: 'stacked', band: 1.4, body: 'two-col', upperHeadings: false, entryRule: false, photoShape: 'rounded' },
  ),
  // 24 — Premium Luxury: muted gold, thin rules, letter-spaced capitals.
  T(
    'premium-luxury',
    'Premium Luxury',
    'প্রিমিয়াম লাক্সারি',
    'Specialized',
    'Understated luxury: muted gold hairlines, letter-spaced capitals, centred identity and restrained spacing.',
    'সংযত বিলাসিতা: ম্লান সোনালি সরু রেখা, অক্ষর-ফাঁকা বড় হাতের অক্ষর, কেন্দ্রীভূত পরিচিতি ও নিয়ন্ত্রিত স্পেসিং।',
    'muted-gold',
    'lora-inter',
    { header: 'centered', heading: 'caps', entry: 'inline', band: 0, upperHeadings: true, entryRule: false, photoShape: 'circle', photo: 'right' },
  ),
  // 25 — Global ATS Professional: plainest possible, maximum parsing safety.
  T(
    'global-ats-professional',
    'Global ATS Professional',
    'গ্লোবাল ATS প্রফেশনাল',
    'ATS-Friendly',
    'Maximum parsing safety: one column, standard headings, no colour blocks, no photo and no decorative glyphs.',
    'সর্বোচ্চ পার্সিং নিরাপত্তা: এক কলাম, প্রচলিত শিরোনাম, রঙিন ব্লক নেই, ছবি নেই, সাজসজ্জার প্রতীক নেই।',
    'black',
    'inter-inter',
    { header: 'minimal', heading: 'underline', entry: 'stacked', band: 0, upperHeadings: true, entryRule: false, photoShape: 'none' },
    { photoSupported: false },
  ),
  // 26 — Modern Two-Column Professional: narrow rail for facts, wide body.
  T(
    'modern-two-column',
    'Modern Two-Column Professional',
    'মডার্ন টু-কলাম প্রফেশনাল',
    'Experienced Professional',
    'Compact left rail holds contact, skills and languages while the wide column carries the career story.',
    'সংক্ষিপ্ত বাম রেলে যোগাযোগ, দক্ষতা ও ভাষা; প্রশস্ত কলামে কর্মজীবনের পূর্ণ বিবরণ।',
    'navy',
    'inter-inter',
    { header: 'split', heading: 'rule', entry: 'split', band: 0, body: 'sidebar-left', upperHeadings: true, entryRule: false, photoShape: 'rounded' },
  ),
  // 27 — Executive Leadership Pro: authoritative band header, senior register.
  T(
    'executive-leadership-pro',
    'Executive Leadership Pro',
    'এক্সিকিউটিভ লিডারশিপ প্রো',
    'Corporate & Executive',
    'For directors and senior managers: a solid leadership band, serif headings and achievement-led entries.',
    'পরিচালক ও ঊর্ধ্বতন ব্যবস্থাপকদের জন্য: গাঢ় লিডারশিপ ব্যান্ড, সেরিফ শিরোনাম ও অর্জন-কেন্দ্রিক এন্ট্রি।',
    'navy',
    'lora-inter',
    { header: 'band', heading: 'underline', entry: 'split', band: 0, upperHeadings: true, entryRule: true, photoShape: 'square', photo: 'left' },
  ),
  // 28 — Compact One-Page Expert: dense but readable single-sheet layout.
  T(
    'compact-one-page-expert',
    'Compact One-Page Expert',
    'কম্প্যাক্ট ওয়ান-পেজ এক্সপার্ট',
    'Experienced Professional',
    'Engineered for a single sheet: tight rhythm, inline dates, compact chips — dense without becoming unreadable.',
    'এক পৃষ্ঠার জন্য নির্মিত: নিবিড় ছন্দ, এক লাইনের তারিখ, সংক্ষিপ্ত চিপ — পাঠযোগ্যতা না হারিয়ে ঘনসন্নিবিষ্ট।',
    'teal',
    'inter-inter',
    { header: 'minimal', heading: 'bar', entry: 'inline', band: 0, upperHeadings: true, entryRule: false, photoShape: 'circle' },
  ),
  // 29 — Academic International Pro: publication-friendly, long-form entries.
  T(
    'academic-international-pro',
    'Academic International Pro',
    'অ্যাকাডেমিক ইন্টারন্যাশনাল প্রো',
    'Specialized',
    'Built for research and teaching profiles: long-form entries, serif body text, publication-ready headings.',
    'গবেষণা ও শিক্ষকতার প্রোফাইলের জন্য: বিস্তৃত এন্ট্রি, সেরিফ মূল লেখা ও প্রকাশনার উপযোগী শিরোনাম।',
    'charcoal',
    'lora-inter',
    { header: 'centered', heading: 'rule', entry: 'stacked', band: 0, upperHeadings: true, entryRule: false, photoShape: 'square', photo: 'right' },
  ),
  // 30 — Contemporary Creative Portfolio: expressive rail + portfolio emphasis.
  T(
    'contemporary-creative-portfolio',
    'Contemporary Creative Portfolio',
    'কনটেম্পোরারি ক্রিয়েটিভ পোর্টফোলিও',
    'Specialized',
    'Portfolio-first creative layout with a tinted right rail, bold heading bars and room for project highlights.',
    'পোর্টফোলিও-কেন্দ্রিক ক্রিয়েটিভ লেআউট: হালকা রঙিন ডান রেল, স্পষ্ট শিরোনাম বার ও প্রকল্পের বিবরণের জায়গা।',
    'deep-green',
    'inter-lora',
    { header: 'banner', heading: 'boxed', entry: 'stacked', band: 2.4, body: 'sidebar-right', headerTint: true, upperHeadings: false, entryRule: false, photoShape: 'rounded' },
  ),
];

export const templateById = (id: string): TemplateDefinition =>
  TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];

export const templateCategories = (): TemplateCategory[] =>
  Array.from(new Set(TEMPLATES.map((t) => t.category))) as TemplateCategory[];

/** Full design tokens for a template, merged with the project's overrides. */
export interface ResolvedDesign {
  template: TemplateDefinition;
  palette: Palette;
  fontPair: FontPair;
  heading: string;
  headingScale: number;
  bodyScale: number;
  lineHeight: number;
  sectionSpacing: number;
  marginMm: number;
  photoShape: PhotoShape;
  photoPosition: 'left' | 'right';
  headerStyle: HeaderLayout;
  headingStyle: HeadingLayout;
  showFooter: boolean;
  showPageNumbers: boolean;
  bodyLayout: BodyLayout;
  entryLayout: EntryLayout;
  band: number;
  headerTint: boolean;
  upperHeadings: boolean;
  entryRule: boolean;
}

export function resolveDesign(templateId: string, overrides: Partial<DesignOverrides> = {}): ResolvedDesign {
  const template = templateById(templateId);
  const palette = paletteById(overrides.paletteId ?? template.paletteId);
  const fontPair = fontPairById(overrides.fontPairId ?? template.fontPairId);
  const layout = template.layout;
  return {
    template,
    palette,
    fontPair,
    heading: fontPair.display,
    headingScale: overrides.headingScale ?? 1,
    bodyScale: overrides.bodyScale ?? 1,
    lineHeight: overrides.lineHeight ?? 1.5,
    sectionSpacing: overrides.sectionSpacing ?? 1,
    marginMm: overrides.marginMm ?? 16,
    photoShape: overrides.photoShape ?? layout.photoShape,
    photoPosition: overrides.photoPosition ?? layout.photo ?? 'right',
    headerStyle: overrides.headerStyle ?? layout.header,
    headingStyle: overrides.headingStyle ?? layout.heading,
    showFooter: overrides.showFooter ?? false,
    showPageNumbers: overrides.showPageNumbers ?? false,
    bodyLayout: overrides.bodyLayout ?? layout.body,
    entryLayout: overrides.entryLayout ?? layout.entry,
    band: overrides.band ?? layout.band,
    headerTint: overrides.headerTint ?? layout.headerTint,
    upperHeadings: overrides.upperHeadings ?? layout.upperHeadings,
    entryRule: overrides.entryRule ?? layout.entryRule,
  };
}
