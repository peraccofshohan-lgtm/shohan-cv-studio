/**
 * UI localisation (Bangla primary, English secondary).
 * Document section titles live in lib/sections.ts and are localised separately.
 */
export type UILanguage = 'bn' | 'en';

type Dict = Record<string, { bn: string; en: string }>;

export const STRINGS: Dict = {
  appName: { bn: 'শোহান সিভি স্টুডিও', en: 'SHOHAN CV STUDIO' },
  tagline: { bn: 'পেশাদার সিভি তৈরির সম্পূর্ণ অফলাইন স্টুডিও', en: 'Complete offline professional CV studio' },

  // nav
  'nav.dashboard': { bn: 'ড্যাশবোর্ড', en: 'Dashboard' },
  'nav.newCv': { bn: 'নতুন সিভি', en: 'Create New CV' },
  'nav.projects': { bn: 'সব সিভি প্রকল্প', en: 'All CV Projects' },
  'nav.customers': { bn: 'গ্রাহক', en: 'Customers' },
  'nav.templates': { bn: 'টেমপ্লেট', en: 'Templates' },
  'nav.drafts': { bn: 'সংরক্ষিত ড্রাফট', en: 'Saved Drafts' },
  'nav.exports': { bn: 'এক্সপোর্ট ইতিহাস', en: 'Export History' },
  'nav.backup': { bn: 'ব্যাকআপ ও রিস্টোর', en: 'Backup & Restore' },
  'nav.settings': { bn: 'সেটিংস', en: 'Settings' },
  'nav.help': { bn: 'সহায়তা ও পরিচিতি', en: 'Help & About' },
  'nav.workspace': { bn: 'কর্মক্ষেত্র', en: 'Workspace' },
  'nav.library': { bn: 'লাইব্রেরি', en: 'Library' },
  'nav.system': { bn: 'সিস্টেম', en: 'System' },

  // common
  'common.save': { bn: 'সংরক্ষণ', en: 'Save' },
  'common.saved': { bn: 'সংরক্ষিত', en: 'Saved' },
  'common.saving': { bn: 'সংরক্ষণ হচ্ছে…', en: 'Saving…' },
  'common.cancel': { bn: 'বাতিল', en: 'Cancel' },
  'common.delete': { bn: 'মুছুন', en: 'Delete' },
  'common.edit': { bn: 'সম্পাদনা', en: 'Edit' },
  'common.close': { bn: 'বন্ধ', en: 'Close' },
  'common.back': { bn: 'পূর্ববর্তী', en: 'Back' },
  'common.next': { bn: 'পরবর্তী', en: 'Next' },
  'common.skip': { bn: 'এড়িয়ে যান', en: 'Skip' },
  'common.finish': { bn: 'সম্পন্ন', en: 'Finish' },
  'common.add': { bn: 'যোগ করুন', en: 'Add' },
  'common.remove': { bn: 'সরান', en: 'Remove' },
  'common.search': { bn: 'খুঁজুন', en: 'Search' },
  'common.optional': { bn: 'ঐচ্ছিক', en: 'Optional' },
  'common.required': { bn: 'আবশ্যক', en: 'Required' },
  'common.yes': { bn: 'হ্যাঁ', en: 'Yes' },
  'common.no': { bn: 'না', en: 'No' },
  'common.preview': { bn: 'প্রিভিউ', en: 'Preview' },
  'common.print': { bn: 'প্রিন্ট', en: 'Print' },
  'common.export': { bn: 'এক্সপোর্ট', en: 'Export' },
  'common.docSave': { bn: 'DOCX সংরক্ষণ', en: 'Save as DOCX' },
  'common.pdfSave': { bn: 'PDF সংরক্ষণ', en: 'Save as PDF' },
  'common.undo': { bn: 'আনডু', en: 'Undo' },
  'common.redo': { bn: 'রিডু', en: 'Redo' },
  'common.reset': { bn: 'রিসেট', en: 'Reset' },
  'common.duplicate': { bn: 'কপি করুন', en: 'Duplicate' },
  'common.trash': { bn: 'ট্র্যাশ', en: 'Trash' },
  'common.restore': { bn: 'ফিরিয়ে আনুন', en: 'Restore' },
  'common.none': { bn: 'কিছু নেই', en: 'None' },
  'common.loading': { bn: 'লোড হচ্ছে…', en: 'Loading…' },
  'common.confirm': { bn: 'নিশ্চিত করুন', en: 'Confirm' },

  // dashboard
  'dash.welcome': { bn: 'স্বাগতম', en: 'Welcome' },
  'dash.subtitle': {
    bn: 'আজকের কাজ শুরু করুন — নতুন সিভি তৈরি করুন বা সংরক্ষিত প্রকল্প থেকে চালিয়ে যান।',
    en: 'Start today’s work — create a new CV or continue from a saved project.',
  },
  'dash.newCv': { bn: 'নতুন সিভি তৈরি করুন', en: 'Create New CV' },
  'dash.totalCv': { bn: 'মোট সিভি', en: 'Total CVs' },
  'dash.todayCv': { bn: 'আজকের সিভি', en: 'Today’s CVs' },
  'dash.customers': { bn: 'গ্রাহক', en: 'Customers' },
  'dash.templates': { bn: 'টেমপ্লেট', en: 'Templates' },
  'dash.recentProjects': { bn: 'সাম্প্রতিক প্রকল্প', en: 'Recent projects' },
  'dash.recentCustomers': { bn: 'সাম্প্রতিক গ্রাহক', en: 'Recent customers' },
  'dash.quickActions': { bn: 'দ্রুত কাজ', en: 'Quick actions' },
  'dash.backupStatus': { bn: 'ব্যাকআপ অবস্থা', en: 'Backup status' },

  // projects
  'proj.title': { bn: 'সব সিভি প্রকল্প', en: 'All CV projects' },
  'proj.subtitle': {
    bn: 'সব প্রকল্প এক জায়গায় — খুঁজুন, ফিল্টার করুন, ডুপ্লিকেট করুন বা এক্সপোর্ট করুন।',
    en: 'Every project in one place — search, filter, duplicate or export.',
  },
  'proj.empty': { bn: 'এখনো কোনো সিভি প্রকল্প নেই', en: 'No CV projects yet' },
  'proj.emptyHint': {
    bn: 'প্রথম সিভি তৈরি করতে “নতুন সিভি” বাটনে ক্লিক করুন। সব তথ্য আপনার কম্পিউটারেই সংরক্ষিত থাকবে।',
    en: 'Click “Create New CV” to make your first one. Everything is stored on this computer only.',
  },

  // customers
  'cust.title': { bn: 'গ্রাহক ব্যবস্থাপনা', en: 'Customer management' },
  'cust.subtitle': {
    bn: 'দোকানের প্রতিটি গ্রাহকের তথ্য ও তাদের সিভি প্রকল্প এক জায়গায় রাখুন।',
    en: 'Keep every shop customer and their CV projects together.',
  },
  'cust.add': { bn: 'নতুন গ্রাহক', en: 'Add customer' },
  'cust.name': { bn: 'নাম', en: 'Name' },
  'cust.phone': { bn: 'মোবাইল', en: 'Phone' },
  'cust.email': { bn: 'ইমেইল', en: 'Email' },
  'cust.address': { bn: 'ঠিকানা', en: 'Address' },
  'cust.notes': { bn: 'নোট', en: 'Notes' },
  'cust.projects': { bn: 'সিভি প্রকল্প', en: 'CV projects' },
  'cust.empty': { bn: 'এখনো কোনো গ্রাহক যোগ করা হয়নি', en: 'No customers added yet' },

  // templates
  'tpl.title': { bn: 'টেমপ্লেট গ্যালারি', en: 'Template gallery' },
  'tpl.subtitle': {
    bn: '২০টি পেশাদার A4 ডিজাইন — প্রতিটির নিজস্ব লেআউট, টাইপোগ্রাফি ও রঙের পরিচয়।',
    en: '20 professional A4 designs — each with its own layout, typography and colour identity.',
  },
  'tpl.select': { bn: 'এই টেমপ্লেট বেছে নিন', en: 'Use this template' },
  'tpl.selected': { bn: 'নির্বাচিত', en: 'Selected' },
  'tpl.atsFriendly': { bn: 'ATS-বান্ধব', en: 'ATS-friendly' },
  'tpl.photoSupported': { bn: 'ছবি সমর্থিত', en: 'Photo supported' },
  'tpl.noPhoto': { bn: 'ছবি ছাড়া', en: 'No photo' },

  // editor
  'editor.title': { bn: 'সিভি এডিটিং স্টুডিও', en: 'CV editing studio' },
  'editor.sections': { bn: 'সেকশন', en: 'Sections' },
  'editor.design': { bn: 'ডিজাইন', en: 'Design' },
  'editor.content': { bn: 'কনটেন্ট', en: 'Content' },
  'editor.pages': { bn: 'পৃষ্ঠা', en: 'pages' },
  'editor.zoom': { bn: 'জুম', en: 'Zoom' },
  'editor.saveState': { bn: 'স্বয়ংক্রিয় সংরক্ষণ চালু', en: 'Autosave on' },

  // wizard
  'wiz.title': { bn: 'সিভি তৈরির উইজার্ড', en: 'CV creation wizard' },
  'wiz.step': { bn: 'ধাপ', en: 'Step' },
  'wiz.of': { bn: '/', en: 'of' },
  'wiz.saveDraft': { bn: 'ড্রাফট সংরক্ষণ', en: 'Save draft' },
  'wiz.chooseTemplate': { bn: 'টেমপ্লেট নির্বাচন করুন', en: 'Choose a template' },
  'wiz.openStudio': { bn: 'এডিটিং স্টুডিওতে যান', en: 'Open editing studio' },

  // settings
  'settings.title': { bn: 'সেটিংস', en: 'Settings' },
  'settings.general': { bn: 'সাধারণ', en: 'General' },
  'settings.defaults': { bn: 'সিভি ডিফল্ট', en: 'CV defaults' },
  'settings.printing': { bn: 'প্রিন্টিং', en: 'Printing' },
  'settings.export': { bn: 'এক্সপোর্ট', en: 'Export' },
  'settings.backup': { bn: 'ব্যাকআপ', en: 'Backup' },
  'settings.privacy': { bn: 'প্রাইভেসি', en: 'Privacy' },
  'settings.about': { bn: 'পরিচিতি', en: 'About' },

  // backup
  'backup.title': { bn: 'ব্যাকআপ ও রিস্টোর', en: 'Backup & Restore' },
  'backup.create': { bn: 'ব্যাকআপ তৈরি করুন', en: 'Create backup' },
  'backup.restore': { bn: 'ব্যাকআপ থেকে রিস্টোর', en: 'Restore from backup' },
  'backup.subtitle': {
    bn: 'সম্পূর্ণ ডেটাবেস, ছবি ও স্বাক্ষর এক ফাইলে সংরক্ষণ করে অন্য কম্পিউটারে নেওয়া যাবে।',
    en: 'Pack the entire database, photos and signatures into one file you can move to another computer.',
  },

  // status
  'status.offline': { bn: 'সম্পূর্ণ অফলাইন', en: 'Fully offline' },
  'status.version': { bn: 'সংস্করণ', en: 'Version' },
  'status.desktop': { bn: 'ডেস্কটপ অ্যাপ', en: 'Desktop app' },
  'status.browser': { bn: 'ব্রাউজার মোড', en: 'Browser mode' },
};

export function t(key: string, language: UILanguage): string {
  const entry = STRINGS[key];
  if (!entry) return key;
  return entry[language] ?? entry.en;
}
