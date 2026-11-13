/**
 * Recommended section orderings (Part 7.2).
 *
 * Recruiters read different CVs in different orders: a fresher leads with
 * education, a director with achievements, an academic with publications. These
 * presets reorder the *existing* section config — they never add, remove or
 * rewrite content, and the operator can always reorder manually afterwards.
 */
import type { SectionConfig, SectionId } from '@/types/cv';

export type OrderPresetId = 'fresher' | 'experienced' | 'executive' | 'technical' | 'academic' | 'ats' | 'bangladesh';

export interface OrderPreset {
  id: OrderPresetId;
  nameEn: string;
  nameBn: string;
  descriptionEn: string;
  descriptionBn: string;
  /** Sections in the order they should appear. Anything unlisted keeps its place at the end. */
  order: SectionId[];
}

export const ORDER_PRESETS: OrderPreset[] = [
  {
    id: 'fresher',
    nameEn: 'Fresher / Graduate',
    nameBn: 'নতুন গ্র্যাজুয়েট',
    descriptionEn: 'Education and projects first — the reader has no work history to weigh.',
    descriptionBn: 'শিক্ষা ও প্রকল্প আগে — নিয়োগকর্তার কাছে কর্ম ইতিহাস নেই।',
    order: [
      'careerObjective',
      'careerInterests',
      'education',
      'training',
      'projects',
      'skills',
      'languages',
      'achievements',
      'strengths',
      'hobbies',
      'volunteer',
      'personalDetails',
      'references',
      'declaration',
      'signature',
      'custom',
      'experience',
    ],
  },
  {
    id: 'experienced',
    nameEn: 'Experienced professional',
    nameBn: 'অভিজ্ঞ পেশাজীবী',
    descriptionEn: 'Objective, then work history, then education — the standard corporate order.',
    descriptionBn: 'অবজেক্টিভ, তারপর কর্ম অভিজ্ঞতা, তারপর শিক্ষা — প্রচলিত কর্পোরেট ক্রম।',
    order: [
      'careerObjective',
      'experience',
      'education',
      'skills',
      'training',
      'projects',
      'achievements',
      'languages',
      'strengths',
      'volunteer',
      'personalDetails',
      'references',
      'declaration',
      'signature',
      'hobbies',
      'careerInterests',
      'custom',
    ],
  },
  {
    id: 'executive',
    nameEn: 'Executive / leadership',
    nameBn: 'এক্সিকিউটিভ / নেতৃত্ব',
    descriptionEn: 'A short profile followed by achievements before the job list.',
    descriptionBn: 'সংক্ষিপ্ত প্রোফাইল, তারপর চাকরির তালিকার আগে অর্জন।',
    order: [
      'careerObjective',
      'achievements',
      'experience',
      'education',
      'skills',
      'strengths',
      'training',
      'languages',
      'projects',
      'volunteer',
      'personalDetails',
      'references',
      'declaration',
      'signature',
      'hobbies',
      'careerInterests',
      'custom',
    ],
  },
  {
    id: 'technical',
    nameEn: 'Technical / IT',
    nameBn: 'টেকনিক্যাল / আইটি',
    descriptionEn: 'Skills and projects lead, because tooling is the first screening filter.',
    descriptionBn: 'দক্ষতা ও প্রকল্প আগে, কারণ টুলিংই প্রথম বাছাইয়ের মাপকাঠি।',
    order: [
      'careerObjective',
      'skills',
      'experience',
      'projects',
      'education',
      'training',
      'languages',
      'achievements',
      'strengths',
      'volunteer',
      'personalDetails',
      'references',
      'declaration',
      'signature',
      'hobbies',
      'careerInterests',
      'custom',
    ],
  },
  {
    id: 'academic',
    nameEn: 'Academic / research',
    nameBn: 'অ্যাকাডেমিক / গবেষণা',
    descriptionEn: 'Education, publications and research output before employment.',
    descriptionBn: 'চাকরির আগে শিক্ষা, প্রকাশনা ও গবেষণা।',
    order: [
      'careerObjective',
      'education',
      'projects',
      'achievements',
      'experience',
      'training',
      'skills',
      'languages',
      'volunteer',
      'personalDetails',
      'references',
      'declaration',
      'signature',
      'strengths',
      'hobbies',
      'careerInterests',
      'custom',
    ],
  },
  {
    id: 'ats',
    nameEn: 'ATS-optimised',
    nameBn: 'ATS-অনুকূল',
    descriptionEn: 'Only the headings a parser recognises, in the most common order.',
    descriptionBn: 'শুধু পার্সার-চেনা শিরোনাম, সবচেয়ে প্রচলিত ক্রমে।',
    order: [
      'careerObjective',
      'experience',
      'education',
      'skills',
      'training',
      'projects',
      'achievements',
      'languages',
      'references',
      'personalDetails',
      'declaration',
      'signature',
      'volunteer',
      'strengths',
      'hobbies',
      'careerInterests',
      'custom',
    ],
  },
  {
    id: 'bangladesh',
    nameEn: 'Bangladesh standard',
    nameBn: 'বাংলাদেশ স্ট্যান্ডার্ড',
    descriptionEn: 'The traditional local order: objective, education, experience, then personal details.',
    descriptionBn: 'ঐতিহ্যবাহী দেশীয় ক্রম: অবজেক্টিভ, শিক্ষা, অভিজ্ঞতা, তারপর ব্যক্তিগত তথ্য।',
    order: [
      'careerObjective',
      'education',
      'experience',
      'skills',
      'languages',
      'training',
      'projects',
      'achievements',
      'strengths',
      'personalDetails',
      'references',
      'declaration',
      'signature',
      'hobbies',
      'volunteer',
      'careerInterests',
      'custom',
    ],
  },
];

export const orderPresetById = (id: OrderPresetId): OrderPreset =>
  ORDER_PRESETS.find((p) => p.id === id) ?? ORDER_PRESETS[1];

/**
 * Apply an ordering to a section config.
 *
 * Sections listed in the preset come first in that order; anything the preset
 * does not mention keeps its previous relative position after them. No section
 * is ever dropped or enabled/disabled by this function.
 */
export function applyOrderPreset(sections: SectionConfig[], presetId: OrderPresetId): SectionConfig[] {
  const preset = orderPresetById(presetId);
  const rank = new Map<SectionId, number>(preset.order.map((id, index) => [id, index]));
  const sorted = [...sections].sort((a, b) => {
    const ra = rank.has(a.id) ? (rank.get(a.id) as number) : Number.MAX_SAFE_INTEGER;
    const rb = rank.has(b.id) ? (rank.get(b.id) as number) : Number.MAX_SAFE_INTEGER;
    if (ra !== rb) return ra - rb;
    // Unlisted sections keep their relative order.
    return a.order - b.order;
  });
  return sorted.map((section, index) => ({ ...section, order: index }));
}

/** Which preset (if any) the current ordering already matches. */
export function detectOrderPreset(sections: SectionConfig[]): OrderPresetId | null {
  const ids = [...sections].sort((a, b) => a.order - b.order).map((s) => s.id);
  for (const preset of ORDER_PRESETS) {
    const expected = [...ids].sort((a, b) => {
      const ra = preset.order.indexOf(a);
      const rb = preset.order.indexOf(b);
      return (ra === -1 ? 999 : ra) - (rb === -1 ? 999 : rb);
    });
    if (expected.join('|') === ids.join('|')) return preset.id;
  }
  return null;
}
