/**
 * Wizard step definitions — 19 steps in the order mandated by the product spec,
 * including every conditional branch (fresher mode, optional sections).
 */
import type { SectionId } from '@/types/cv';

export interface WizardStep {
  id: string;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  /** Optional steps expose a Skip button. */
  optional?: boolean;
  /** Which section this step controls (used to keep config in sync). */
  section?: SectionId;
}

export const WIZARD_STEPS: WizardStep[] = [
  {
    id: 'personal',
    titleBn: 'ব্যক্তিগত তথ্য',
    titleEn: 'Basic Personal Information',
    descBn: 'নাম, জন্মতারিখ, ঠিকানা ও যোগাযোগের তথ্য দিন। শুধু প্রয়োজনীয় তথ্যই CV-তে যাবে।',
    descEn: 'Name, date of birth, address and contact details. Only what you need appears on the CV.',
  },
  {
    id: 'photo',
    titleBn: 'প্রোফাইল ছবি',
    titleEn: 'Profile Photo',
    descBn: 'ছবি ঐচ্ছিক। না দিলে CV-তে কোনো খালি ফ্রেম থাকবে না।',
    descEn: 'The photo is optional. If omitted, no empty frame appears on the CV.',
    optional: true,
  },
  {
    id: 'objective',
    titleBn: 'ক্যারিয়ার অবজেক্টিভ',
    titleEn: 'Career Objective',
    descBn: 'প্রস্তুত টেম্পলেট থেকে বেছে নিন বা নিজের ভাষায় লিখুন।',
    descEn: 'Pick a ready-made statement or write your own.',
    section: 'careerObjective',
  },
  {
    id: 'interests',
    titleBn: 'ক্যারিয়ার আগ্রহ',
    titleEn: 'Career Interest',
    descBn: 'কোন ধরনের কাজ ও বিভাগে আগ্রহী তা উল্লেখ করুন।',
    descEn: 'Note which functions and departments interest you.',
    optional: true,
    section: 'careerInterests',
  },
  {
    id: 'education',
    titleBn: 'শিক্ষাগত যোগ্যতা',
    titleEn: 'Educational Qualifications',
    descBn: 'একাধিক ডিগ্রি যোগ করুন — সর্বশেষটি প্রথমে রাখুন।',
    descEn: 'Add every degree — most recent first.',
    section: 'education',
  },
  {
    id: 'experience',
    titleBn: 'কর্ম অভিজ্ঞতা',
    titleEn: 'Work Experience',
    descBn: 'অভিজ্ঞতা থাকলে যোগ করুন; না থাকলে ফ্রেশার হিসেবে সিভি সাজানো হবে।',
    descEn: 'Add roles if you have them; otherwise the CV is built as a fresher profile.',
    section: 'experience',
  },
  {
    id: 'skills',
    titleBn: 'দক্ষতা',
    titleEn: 'Skills',
    descBn: 'ক্যাটাগরি অনুযায়ী দক্ষতা যোগ করুন এবং দক্ষতার মাত্রা নির্ধারণ করুন।',
    descEn: 'Group skills by category and set proficiency.',
    section: 'skills',
  },
  {
    id: 'languages',
    titleBn: 'ভাষা দক্ষতা',
    titleEn: 'Language Proficiency',
    descBn: 'পড়া, লেখা, বলা ও শোনার দক্ষতা আলাদাভাবে উল্লেখ করুন।',
    descEn: 'Record reading, writing, speaking and listening separately.',
    section: 'languages',
  },
  {
    id: 'training',
    titleBn: 'প্রশিক্ষণ ও সার্টিফিকেশন',
    titleEn: 'Training & Certifications',
    descBn: 'প্রশিক্ষণ বা সার্টিফিকেট থাকলে যোগ করুন; না থাকলে সেকশন বাদ যাবে।',
    descEn: 'Add training or certificates; the section is dropped if unused.',
    optional: true,
    section: 'training',
  },
  {
    id: 'projects',
    titleBn: 'প্রকল্প',
    titleEn: 'Projects',
    descBn: 'একাডেমিক বা পেশাগত প্রকল্প — ফ্রেশারদের জন্য বিশেষভাবে উপযোগী।',
    descEn: 'Academic or professional projects — especially useful for freshers.',
    optional: true,
    section: 'projects',
  },
  {
    id: 'achievements',
    titleBn: 'অর্জন ও পুরস্কার',
    titleEn: 'Achievements & Awards',
    descBn: 'পুরস্কার, স্বীকৃতি বা উল্লেখযোগ্য অর্জন যোগ করুন।',
    descEn: 'Add awards, recognition or notable achievements.',
    optional: true,
    section: 'achievements',
  },
  {
    id: 'strengths',
    titleBn: 'শক্তিশালী দিক',
    titleEn: 'Strengths',
    descBn: 'প্রস্তাবিত তালিকা থেকে বেছে নিন বা নিজে লিখুন।',
    descEn: 'Choose from suggestions or write your own.',
    optional: true,
    section: 'strengths',
  },
  {
    id: 'hobbies',
    titleBn: 'শখ ও আগ্রহ',
    titleEn: 'Hobbies & Interests',
    descBn: 'ঐচ্ছিক — সংক্ষেপে উল্লেখ করুন।',
    descEn: 'Optional — keep it brief.',
    optional: true,
    section: 'hobbies',
  },
  {
    id: 'volunteer',
    titleBn: 'স্বেচ্ছাসেবা',
    titleEn: 'Volunteer Experience',
    descBn: 'স্বেচ্ছাসেবামূলক কাজের অভিজ্ঞতা যোগ করুন।',
    descEn: 'Add volunteer or community work.',
    optional: true,
    section: 'volunteer',
  },
  {
    id: 'details',
    titleBn: 'ব্যক্তিগত তথ্য (প্রকাশ)',
    titleEn: 'Personal Details to Publish',
    descBn: 'কোন ব্যক্তিগত তথ্য CV-তে দেখানো হবে তা আলাদা করে বেছে নিন।',
    descEn: 'Choose exactly which personal details appear on the CV.',
    optional: true,
    section: 'personalDetails',
  },
  {
    id: 'references',
    titleBn: 'রেফারেন্স',
    titleEn: 'References',
    descBn: 'রেফারেন্স দিতে চাইলে তাদের অনুমতি নিয়ে তথ্য দিন।',
    descEn: 'If you include references, add them with their consent.',
    optional: true,
    section: 'references',
  },
  {
    id: 'declaration',
    titleBn: 'ঘোষণাপত্র',
    titleEn: 'Declaration',
    descBn: 'প্রস্তুত ঘোষণাপত্র বেছে নিন বা নিজের ভাষায় লিখুন।',
    descEn: 'Pick a ready declaration or write your own.',
    optional: true,
    section: 'declaration',
  },
  {
    id: 'signature',
    titleBn: 'স্বাক্ষর',
    titleEn: 'Applicant Signature',
    descBn: 'স্বাক্ষরের ছবি আপলোড করুন — ঐচ্ছিক।',
    descEn: 'Upload a scan of your signature — optional.',
    optional: true,
    section: 'signature',
  },
  {
    id: 'additional',
    titleBn: 'অতিরিক্ত তথ্য',
    titleEn: 'Additional Information',
    descBn: 'প্রকাশনা, সেমিনার, সদস্যপদ বা নিজের তৈরি সেকশন যোগ করুন।',
    descEn: 'Add publications, seminars, memberships or your own custom sections.',
    optional: true,
    section: 'custom',
  },
];

export const TOTAL_STEPS = WIZARD_STEPS.length;
