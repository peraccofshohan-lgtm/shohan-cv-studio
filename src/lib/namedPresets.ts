/**
 * Named style presets (Part 9).
 *
 * Ten ready-made looks expressed **only** as `DesignOverrides` on top of a base
 * template. They are data, not new templates: applying one sets the base
 * template id and layers these tokens on it, which is exactly what the existing
 * preset machinery does for a user-saved preset. Nothing here can overwrite a
 * template definition or touch CV content.
 *
 * Every preset is A4-safe by construction: it changes palette, fonts, density,
 * margins, header/heading treatment and photo frame — never geometry that could
 * push a heading away from its body text.
 */
import type { DesignOverrides } from '@/types/cv';

export interface NamedPreset {
  id: string;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  /** Built-in template the look starts from. Never modified. */
  baseTemplateId: string;
  design: Partial<DesignOverrides>;
}

export const NAMED_PRESETS: NamedPreset[] = [
  {
    id: 'named-corner-office',
    nameEn: 'Corner Office',
    nameBn: 'কর্নার অফিস',
    descriptionEn: 'Navy and gold, wide margins, boxed headings — for senior corporate roles.',
    descriptionBn: 'নেভি ও গোল্ড, প্রশস্ত মার্জিন, বক্সড শিরোনাম — ঊর্ধ্বতন কর্পোরেট পদে।',
    baseTemplateId: 'corporate-executive',
    design: {
      paletteId: 'navy',
      fontPairId: 'inter-lora',
      density: 'spacious',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      headingStyle: 'boxed',
      headerStyle: 'split',
      upperHeadings: true,
      entryRule: true,
      showFooter: true,
      showPageNumbers: true,
      bodyAlign: 'justify',
    },
  },
  {
    id: 'named-bank-teller',
    nameEn: 'Bank Standard',
    nameBn: 'ব্যাংক স্ট্যান্ডার্ড',
    descriptionEn: 'The conventional Bangladesh bank CV: single column, personal details, declaration space.',
    descriptionBn: 'বাংলাদেশের প্রচলিত ব্যাংক CV: এক কলাম, ব্যক্তিগত তথ্য, ঘোষণাপত্রের জায়গা।',
    baseTemplateId: 'modern-bangladesh',
    design: {
      paletteId: 'deep-green',
      fontPairId: 'notobn-inter',
      density: 'balanced',
      margins: { top: 16, right: 16, bottom: 16, left: 16 },
      headingStyle: 'rule',
      headerStyle: 'centered',
      upperHeadings: true,
      showFooter: false,
      bodyAlign: 'justify',
    },
  },
  {
    id: 'named-ats-plain',
    nameEn: 'Parser Plain',
    nameBn: 'পার্সার প্লেইন',
    descriptionEn: 'No photo frame, no rules, black on white — the safest structure for automated screening.',
    descriptionBn: 'ফটো ফ্রেম নেই, রুল নেই, সাদায় কালো — স্বয়ংক্রিয় বাছাইয়ের নিরাপদ কাঠামো।',
    baseTemplateId: 'ats-classic',
    design: {
      paletteId: 'black',
      fontPairId: 'inter-lora',
      density: 'compact',
      margins: { top: 18, right: 18, bottom: 18, left: 18 },
      headingStyle: 'caps',
      headerStyle: 'minimal',
      band: 0,
      headerTint: false,
      entryRule: false,
      showFooter: false,
      bodyAlign: 'left',
    },
  },
  {
    id: 'named-academic-archive',
    nameEn: 'Academic Archive',
    nameBn: 'অ্যাকাডেমিক আর্কাইভ',
    descriptionEn: 'Serif throughout, generous leading, side-marked headings — for research and teaching.',
    descriptionBn: 'সর্বত্র সেরিফ, প্রশস্ত লাইন-স্পেসিং, সাইড-মার্ক শিরোনাম — গবেষণা ও শিক্ষকতার জন্য।',
    baseTemplateId: 'academic-research',
    design: {
      paletteId: 'charcoal',
      fontPairId: 'lora-inter',
      density: 'spacious',
      margins: { top: 22, right: 20, bottom: 22, left: 20 },
      headingStyle: 'side-mark',
      headerStyle: 'minimal',
      upperHeadings: false,
      showFooter: true,
      showPageNumbers: true,
      bodyAlign: 'justify',
    },
  },
  {
    id: 'named-tech-brief',
    nameEn: 'Tech Brief',
    nameBn: 'টেক ব্রিফ',
    descriptionEn: 'Compact, sidebar facts, bar headings — skills and projects up front.',
    descriptionBn: 'সংকুচিত, সাইডবার তথ্য, বার শিরোনাম — দক্ষতা ও প্রকল্প সামনে।',
    baseTemplateId: 'it-technology',
    design: {
      paletteId: 'teal',
      fontPairId: 'inter-lora',
      density: 'compact',
      margins: { top: 14, right: 14, bottom: 14, left: 14 },
      headingStyle: 'bar',
      bodyLayout: 'sidebar-left',
      headerStyle: 'split',
      upperHeadings: true,
      entryRule: false,
      showFooter: true,
    },
  },
  {
    id: 'named-fresh-graduate',
    nameEn: 'First Interview',
    nameBn: 'প্রথম ইন্টারভিউ',
    descriptionEn: 'Bright, balanced and uncluttered — education and projects lead.',
    descriptionBn: 'উজ্জ্বল, ভারসাম্যপূর্ণ ও পরিচ্ছন্ন — শিক্ষা ও প্রকল্প আগে।',
    baseTemplateId: 'graduate-professional',
    design: {
      paletteId: 'teal',
      fontPairId: 'notobn-inter',
      density: 'balanced',
      margins: { top: 16, right: 18, bottom: 16, left: 18 },
      headingStyle: 'underline',
      headerStyle: 'banner',
      upperHeadings: true,
      showFooter: false,
      bodyAlign: 'left',
    },
  },
  {
    id: 'named-swiss-grid',
    nameEn: 'Swiss Grid',
    nameBn: 'সুইস গ্রিড',
    descriptionEn: 'Monochrome, two columns, tight rhythm — neutral and typographic.',
    descriptionBn: 'একরঙা, দুই কলাম, ঘন ছন্দ — নিরপেক্ষ ও টাইপোগ্রাফিক।',
    baseTemplateId: 'swiss-minimalist',
    design: {
      paletteId: 'monochrome',
      fontPairId: 'inter-lora',
      density: 'compact',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
      headingStyle: 'rule',
      bodyLayout: 'two-col',
      headerStyle: 'minimal',
      upperHeadings: true,
      entryRule: false,
      showFooter: true,
    },
  },
  {
    id: 'named-burgundy-formal',
    nameEn: 'Burgundy Formal',
    nameBn: 'বারগান্ডি ফরমাল',
    descriptionEn: 'Deep burgundy, centred header, underlined headings — formal and warm.',
    descriptionBn: 'গাঢ় বারগান্ডি, কেন্দ্রীভূত হেডার, আন্ডারলাইন শিরোনাম — আনুষ্ঠানিক ও উষ্ণ।',
    baseTemplateId: 'elegant-formal',
    design: {
      paletteId: 'burgundy',
      fontPairId: 'lora-inter',
      density: 'balanced',
      margins: { top: 18, right: 18, bottom: 18, left: 18 },
      headingStyle: 'underline',
      headerStyle: 'centered',
      upperHeadings: true,
      entryRule: true,
      showFooter: true,
      bodyAlign: 'justify',
    },
  },
  {
    id: 'named-creative-editorial',
    nameEn: 'Editorial',
    nameBn: 'এডিটোরিয়াল',
    descriptionEn: 'Large name, accent bar, tinted chips — for design, media and marketing roles.',
    descriptionBn: 'বড় নাম, অ্যাকসেন্ট বার, টিন্টেড চিপ — ডিজাইন, মিডিয়া ও মার্কেটিং পদে।',
    baseTemplateId: 'modern-editorial',
    design: {
      paletteId: 'burgundy',
      fontPairId: 'lora-inter',
      density: 'balanced',
      margins: { top: 16, right: 20, bottom: 16, left: 20 },
      headingStyle: 'bar',
      headerStyle: 'band',
      band: 6,
      headerTint: true,
      upperHeadings: false,
      showFooter: false,
    },
  },
  {
    id: 'named-one-page-tight',
    nameEn: 'One Page Tight',
    nameBn: 'এক পৃষ্ঠা টাইট',
    descriptionEn: 'Smallest legal type, tightest rhythm — for fitting a long career on one sheet.',
    descriptionBn: 'সর্বনিম্ন বৈধ টাইপ, ঘনতম ছন্দ — দীর্ঘ ক্যারিয়ার এক পাতায়।',
    baseTemplateId: 'compact-one-page-expert',
    design: {
      paletteId: 'slate',
      fontPairId: 'inter-lora',
      density: 'compact',
      margins: { top: 12, right: 14, bottom: 12, left: 14 },
      headingStyle: 'rule',
      headerStyle: 'split',
      upperHeadings: true,
      entryRule: false,
      showFooter: false,
      bodyAlign: 'justify',
    },
  },
];

export const namedPresetById = (id: string): NamedPreset | undefined =>
  NAMED_PRESETS.find((p) => p.id === id);
