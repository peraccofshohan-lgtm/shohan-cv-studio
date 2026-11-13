/**
 * Career objective library.
 *
 * Every preset is a genuine, general-purpose statement. None of them invent
 * experience, qualifications, employers, metrics or certifications — the
 * operator must supply any specific claim themselves.
 */

export interface ObjectivePreset {
  id: string;
  label: string;
  text: string;
}

export interface ObjectiveCategory {
  id: string;
  labelEn: string;
  labelBn: string;
  presets: ObjectivePreset[];
}

export const OBJECTIVE_CATEGORIES: ObjectiveCategory[] = [
  {
    id: 'general',
    labelEn: 'General Career Objective',
    labelBn: 'সাধারণ ক্যারিয়ার অবজেক্টিভ',
    presets: [
      {
        id: 'general-1',
        label: 'General – growth focused',
        text: 'To build a long-term career in a reputed organisation where my academic background, sincerity and willingness to learn can contribute to the organisation’s growth while developing my own professional competence.',
      },
      {
        id: 'general-2',
        label: 'General – contribution focused',
        text: 'Seeking a responsible position that allows me to apply my knowledge and skills effectively, contribute to organisational objectives, and continue developing professionally in a demanding work environment.',
      },
      {
        id: 'general-bn-1',
        label: 'সাধারণ – প্রবৃদ্ধি কেন্দ্রিক',
        text: 'একটি প্রতিষ্ঠিত প্রতিষ্ঠানে দীর্ঘমেয়াদি ক্যারিয়ার গড়তে চাই, যেখানে আমার শিক্ষাগত যোগ্যতা, আন্তরিকতা ও শেখার আগ্রহ প্রতিষ্ঠানের অগ্রগতিতে ভূমিকা রাখার পাশাপাশি আমার পেশাগত দক্ষতা বিকাশে সহায়ক হবে।',
      },
    ],
  },
  {
    id: 'fresh-graduate',
    labelEn: 'Fresh Graduate',
    labelBn: 'ফ্রেশ গ্র্যাজুয়েট',
    presets: [
      {
        id: 'fg-1',
        label: 'Entry level – learning oriented',
        text: 'A motivated fresh graduate seeking an entry-level position where I can apply my academic knowledge, develop practical professional skills and grow with the organisation through consistent effort and dedication.',
      },
      {
        id: 'fg-2',
        label: 'Entry level – skill application',
        text: 'To begin my professional career in an organisation that values potential and initiative, where I can translate my academic training into practical results and contribute to team objectives from the outset.',
      },
      {
        id: 'fg-bn-1',
        label: 'এন্ট্রি লেভেল – শেখা ও বিকাশ',
        text: 'সদ্য স্নাতক হিসেবে এমন একটি প্রতিষ্ঠানে এন্ট্রি লেভেলের পদে যোগ দিতে চাই, যেখানে আমার অর্জিত জ্ঞান কাজে লাগিয়ে পেশাগত দক্ষতা অর্জন ও প্রতিষ্ঠানের লক্ষ্য অর্জনে ধারাবাহিক অবদান রাখতে পারব।',
      },
    ],
  },
  {
    id: 'banking',
    labelEn: 'Banking',
    labelBn: 'ব্যাংকিং',
    presets: [
      {
        id: 'bank-1',
        label: 'Banking – customer service',
        text: 'To establish a professional career in the banking sector where accuracy, customer service orientation and a strong sense of responsibility can contribute to branch performance and client satisfaction.',
      },
      {
        id: 'bank-2',
        label: 'Banking – operations',
        text: 'Seeking a position in banking operations where my attention to detail, numerical accuracy and commitment to regulatory compliance can support efficient and reliable customer service delivery.',
      },
      {
        id: 'bank-bn-1',
        label: 'ব্যাংকিং – গ্রাহকসেবা',
        text: 'ব্যাংকিং খাতে একটি পেশাগত ক্যারিয়ার গড়তে চাই, যেখানে নির্ভুলতা, গ্রাহকসেবার মানসিকতা ও দায়িত্ববোধ শাখার কর্মদক্ষতা এবং গ্রাহক সন্তুষ্টি অর্জনে সহায়ক হবে।',
      },
    ],
  },
  {
    id: 'accounting-finance',
    labelEn: 'Accounting & Finance',
    labelBn: 'হিসাবরক্ষণ ও ফাইন্যান্স',
    presets: [
      {
        id: 'acc-1',
        label: 'Accounting – accuracy focused',
        text: 'To work in an accounting and finance role where precision, integrity and sound knowledge of financial records can support transparent reporting and effective financial control.',
      },
      {
        id: 'acc-2',
        label: 'Finance – analysis focused',
        text: 'Seeking a position in finance where analytical ability and careful documentation can contribute to accurate budgeting, reporting and informed management decisions.',
      },
      {
        id: 'acc-bn-1',
        label: 'হিসাবরক্ষণ – নির্ভুলতা',
        text: 'হিসাবরক্ষণ ও ফাইন্যান্স বিভাগে এমন একটি পদে কাজ করতে চাই, যেখানে নির্ভুলতা, সততা ও আর্থিক রেকর্ড সম্পর্কিত জ্ঞান স্বচ্ছ প্রতিবেদন এবং কার্যকর আর্থিক নিয়ন্ত্রণে সহায়তা করবে।',
      },
    ],
  },
  {
    id: 'sales-marketing',
    labelEn: 'Sales & Marketing',
    labelBn: 'সেলস ও মার্কেটিং',
    presets: [
      {
        id: 'sales-1',
        label: 'Sales – relationship building',
        text: 'To build a career in sales where communication ability, customer relationship skills and a results-oriented approach can contribute to sustainable revenue growth.',
      },
      {
        id: 'mkt-1',
        label: 'Marketing – brand support',
        text: 'Seeking a marketing position where creativity, market awareness and disciplined execution can support brand visibility and measurable campaign outcomes.',
      },
      {
        id: 'sales-bn-1',
        label: 'সেলস – সম্পর্ক নির্মাণ',
        text: 'সেলস খাতে ক্যারিয়ার গড়তে চাই, যেখানে যোগাযোগ দক্ষতা, গ্রাহকের সঙ্গে সুসম্পর্ক এবং ফলাফলমুখী মানসিকতা টেকসই বিক্রয় প্রবৃদ্ধিতে অবদান রাখতে পারবে।',
      },
    ],
  },
  {
    id: 'it',
    labelEn: 'IT & Computer',
    labelBn: 'আইটি ও কম্পিউটার',
    presets: [
      {
        id: 'it-1',
        label: 'IT support',
        text: 'To work in an IT support role where troubleshooting ability, patience and clear communication can keep systems reliable and users productive.',
      },
      {
        id: 'it-2',
        label: 'Software development',
        text: 'Seeking a software development position where structured problem solving, attention to detail and continuous learning can contribute to maintainable, well-tested solutions.',
      },
      {
        id: 'it-bn-1',
        label: 'আইটি সাপোর্ট',
        text: 'আইটি সাপোর্ট পদে কাজ করতে চাই, যেখানে সমস্যা সমাধানের দক্ষতা, ধৈর্য ও স্পষ্ট যোগাযোগ ব্যবস্থাকে নির্ভরযোগ্য এবং ব্যবহারকারীদের কর্মদক্ষ রাখতে সহায়তা করবে।',
      },
    ],
  },
  {
    id: 'engineering',
    labelEn: 'Engineering',
    labelBn: 'ইঞ্জিনিয়ারিং',
    presets: [
      {
        id: 'eng-1',
        label: 'Engineering – technical',
        text: 'To apply engineering knowledge and analytical skills in a technically demanding environment where safety, quality and continuous improvement are valued.',
      },
      {
        id: 'eng-2',
        label: 'Engineering – project delivery',
        text: 'Seeking an engineering role where disciplined planning, precise documentation and teamwork can support reliable project delivery within budget and schedule.',
      },
      {
        id: 'eng-bn-1',
        label: 'ইঞ্জিনিয়ারিং – টেকনিক্যাল',
        text: 'এমন একটি কারিগরি পরিবেশে ইঞ্জিনিয়ারিং জ্ঞান ও বিশ্লেষণী দক্ষতা প্রয়োগ করতে চাই, যেখানে নিরাপত্তা, গুণমান ও ধারাবাহিক উন্নয়নকে গুরুত্ব দেওয়া হয়।',
      },
    ],
  },
  {
    id: 'teaching',
    labelEn: 'Teaching',
    labelBn: 'শিক্ষকতা',
    presets: [
      {
        id: 'teach-1',
        label: 'Teaching – student centred',
        text: 'To contribute to education as a teacher who maintains clear academic standards, supports students as individuals and continues developing subject expertise.',
      },
      {
        id: 'teach-2',
        label: 'Teaching – institution building',
        text: 'Seeking a teaching position where subject knowledge, classroom discipline and cooperative engagement with colleagues can strengthen institutional quality.',
      },
    ],
  },
  {
    id: 'administration',
    labelEn: 'Administration',
    labelBn: 'প্রশাসন',
    presets: [
      {
        id: 'admin-1',
        label: 'Administration – coordination',
        text: 'To take responsibility for administrative coordination where organisation, accuracy and professional communication can keep office operations running smoothly.',
      },
      {
        id: 'admin-2',
        label: 'Administration – documentation',
        text: 'Seeking an administrative role where record-keeping discipline, confidentiality and reliable follow-through are essential to daily operations.',
      },
      {
        id: 'admin-bn-1',
        label: 'প্রশাসন – সমন্বয়',
        text: 'প্রশাসনিক সমন্বয়ের দায়িত্ব নিতে চাই, যেখানে সংগঠন দক্ষতা, নির্ভুলতা ও পেশাদার যোগাযোগ অফিসের প্রতিদিনের কার্যক্রম সুষ্ঠুভাবে পরিচালনায় সহায়ক হবে।',
      },
    ],
  },
  {
    id: 'customer-service',
    labelEn: 'Customer Service',
    labelBn: 'কাস্টমার সার্ভিস',
    presets: [
      {
        id: 'cs-1',
        label: 'Customer service – resolution',
        text: 'To deliver dependable customer service where empathy, clear communication and prompt problem resolution build long-term customer trust.',
      },
      {
        id: 'cs-2',
        label: 'Customer service – retail',
        text: 'Seeking a customer-facing role where patience, product knowledge and consistent service standards support both customer satisfaction and sales.',
      },
    ],
  },
  {
    id: 'hr',
    labelEn: 'Human Resources',
    labelBn: 'হিউম্যান রিসোর্স',
    presets: [
      {
        id: 'hr-1',
        label: 'HR – recruitment support',
        text: 'To build a career in human resources where fair process, careful documentation and clear communication support recruitment and employee welfare.',
      },
      {
        id: 'hr-2',
        label: 'HR – administration',
        text: 'Seeking an HR position where confidentiality, organisational ability and genuine interest in people contribute to a positive workplace.',
      },
    ],
  },
  {
    id: 'international',
    labelEn: 'International / Global',
    labelBn: 'আন্তর্জাতিক',
    presets: [
      {
        id: 'intl-1',
        label: 'International – professional',
        text: 'Seeking an international position where cross-cultural adaptability, professional communication and a strong work ethic can add measurable value to a diverse team.',
      },
      {
        id: 'intl-2',
        label: 'International – technical',
        text: 'To contribute technical competence and reliable execution within an international organisation that values accountability, collaboration and continuous improvement.',
      },
    ],
  },
];

export const objectiveCategoryById = (id: string): ObjectiveCategory =>
  OBJECTIVE_CATEGORIES.find((c) => c.id === id) ?? OBJECTIVE_CATEGORIES[0];

export const CAREER_INTEREST_SUGGESTIONS: { id: string; labelEn: string; labelBn: string; items: string[] }[] = [
  { id: 'banking', labelEn: 'Banking', labelBn: 'ব্যাংকিং', items: ['Retail Banking', 'Corporate Banking', 'Cash Management', 'Credit Administration', 'Foreign Exchange'] },
  { id: 'finance', labelEn: 'Finance', labelBn: 'ফাইন্যান্স', items: ['Financial Reporting', 'Budgeting', 'Audit & Compliance', 'Treasury', 'Taxation'] },
  { id: 'it', labelEn: 'IT', labelBn: 'আইটি', items: ['Software Development', 'IT Support', 'Network Administration', 'Database Management', 'Quality Assurance'] },
  { id: 'administration', labelEn: 'Administration', labelBn: 'প্রশাসন', items: ['Office Administration', 'Procurement', 'Record Management', 'Logistics Coordination'] },
  { id: 'sales', labelEn: 'Sales', labelBn: 'সেলস', items: ['Direct Sales', 'Corporate Sales', 'Retail Sales', 'Key Account Management'] },
  { id: 'marketing', labelEn: 'Marketing', labelBn: 'মার্কেটিং', items: ['Brand Management', 'Digital Marketing', 'Market Research', 'Public Relations'] },
  { id: 'education', labelEn: 'Education', labelBn: 'শিক্ষা', items: ['Teaching', 'Academic Coordination', 'Curriculum Development', 'Student Counselling'] },
  { id: 'engineering', labelEn: 'Engineering', labelBn: 'ইঞ্জিনিয়ারিং', items: ['Production Engineering', 'Maintenance Engineering', 'Quality Control', 'Project Engineering'] },
  { id: 'customer-support', labelEn: 'Customer Support', labelBn: 'কাস্টমার সাপোর্ট', items: ['Customer Care', 'Call Centre Operations', 'Client Relationship', 'After-sales Service'] },
  { id: 'hr', labelEn: 'Human Resources', labelBn: 'হিউম্যান রিসোর্স', items: ['Recruitment', 'Training & Development', 'Payroll Administration', 'Employee Relations'] },
  { id: 'operations', labelEn: 'Operations', labelBn: 'অপারেশনস', items: ['Supply Chain', 'Warehouse Management', 'Production Planning', 'Process Improvement'] },
  { id: 'ngo', labelEn: 'Development / NGO', labelBn: 'উন্নয়ন / এনজিও', items: ['Project Coordination', 'Field Operations', 'Monitoring & Evaluation', 'Community Mobilisation'] },
];

export const STRENGTH_SUGGESTIONS = [
  'Problem Solving',
  'Teamwork',
  'Leadership',
  'Time Management',
  'Adaptability',
  'Communication',
  'Critical Thinking',
  'Quick Learning',
  'Responsibility',
  'Attention to Detail',
];

export const HOBBY_SUGGESTIONS = [
  'Reading',
  'Traveling',
  'Sports',
  'Volunteering',
  'Technology',
  'Writing',
  'Photography',
  'Research',
  'Music',
  'Creative Activities',
];

export const SKILL_CATEGORIES = [
  'Technical Skills',
  'Computer Skills',
  'Communication Skills',
  'Management Skills',
  'Leadership Skills',
  'Administrative Skills',
  'Software Skills',
  'Industry-specific Skills',
  'Other Skills',
];

export const DECLARATION_PRESETS = [
  {
    id: 'en-standard',
    language: 'en' as const,
    label: 'English — standard',
    text: 'I hereby declare that the information furnished above is true and correct to the best of my knowledge and belief. I understand that any false statement may lead to disqualification.',
  },
  {
    id: 'en-brief',
    language: 'en' as const,
    label: 'English — brief',
    text: 'I declare that all statements made in this curriculum vitae are true and complete to the best of my knowledge.',
  },
  {
    id: 'bn-standard',
    language: 'bn' as const,
    label: 'বাংলা — প্রমিত',
    text: 'আমি এতদ্বারা ঘোষণা করছি যে, উপরে প্রদত্ত তথ্যসমূহ আমার জ্ঞান ও বিশ্বাস অনুযায়ী সত্য ও সঠিক। কোনো তথ্য মিথ্যা প্রমাণিত হলে কর্তৃপক্ষ যে কোনো ব্যবস্থা গ্রহণ করতে পারবে।',
  },
  {
    id: 'bn-brief',
    language: 'bn' as const,
    label: 'বাংলা — সংক্ষিপ্ত',
    text: 'আমি ঘোষণা করছি যে, এই জীবনবৃত্তান্তে প্রদত্ত সকল তথ্য আমার জানামতে সত্য ও সম্পূর্ণ।',
  },
];
