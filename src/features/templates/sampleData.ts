/**
 * Preview sample data.
 *
 * Used ONLY for template thumbnails and the empty-gallery preview. It is never
 * merged into a real project — real CVs start completely empty so nothing is
 * ever invented on a customer's behalf.
 */
import type { CVData } from '@/types/cv';
import { createEmptyCv, uid } from '@/lib/defaults';

export function buildSampleCv(language: 'bn' | 'en' = 'en'): CVData {
  const cv = createEmptyCv();
  const isBn = language === 'bn';
  cv.language = language;
  cv.personal = {
    ...cv.personal,
    fullName: isBn ? 'মোঃ রফিকুল ইসলাম' : 'Md. Rafiqul Islam',
    headline: isBn ? 'সিনিয়র অ্যাকাউন্টস অফিসার' : 'Senior Accounts Officer',
    mobile: '+880 1711 234 567',
    email: 'rafiq.islam@example.com',
    presentAddress: isBn ? 'ধানমন্ডি, ঢাকা ১২০৯' : 'Dhanmondi, Dhaka 1209',
    city: 'Dhaka',
    country: 'Bangladesh',
    linkedin: 'linkedin.com/in/rafiqislam',
  };
  cv.careerObjective = {
    enabled: true,
    categoryId: 'accounting-finance',
    text: isBn
      ? 'হিসাবরক্ষণ ও ফাইন্যান্স বিভাগে এমন একটি পদে কাজ করতে চাই, যেখানে নির্ভুলতা, সততা ও আর্থিক রেকর্ড সম্পর্কিত জ্ঞান স্বচ্ছ প্রতিবেদন এবং কার্যকর আর্থিক নিয়ন্ত্রণে সহায়তা করবে।'
      : 'To work in an accounting and finance role where precision, integrity and sound knowledge of financial records can support transparent reporting and effective financial control.',
  };
  cv.education = [
    {
      id: uid(),
      degree: isBn ? 'এম.কম (হিসাববিজ্ঞান)' : 'M.Com in Accounting',
      group: 'Accounting',
      institution: isBn ? 'ঢাকা বিশ্ববিদ্যালয়' : 'University of Dhaka',
      board: 'University of Dhaka',
      passingYear: '2017',
      result: '',
      gpa: '3.62',
      scale: '4.00',
      division: '',
      location: 'Dhaka',
      additionalInfo: '',
      currentlyStudying: false,
    },
    {
      id: uid(),
      degree: isBn ? 'বি.কম (সম্মান)' : 'B.Com (Hons.)',
      group: 'Accounting',
      institution: isBn ? 'জগন্নাথ বিশ্ববিদ্যালয়' : 'Jagannath University',
      board: 'National University',
      passingYear: '2015',
      result: '',
      gpa: '3.48',
      scale: '4.00',
      division: '',
      location: 'Dhaka',
      additionalInfo: '',
      currentlyStudying: false,
    },
  ];
  cv.hasExperience = true;
  cv.experience = [
    {
      id: uid(),
      industry: 'Manufacturing',
      company: isBn ? 'মেঘনা গ্রুপ অব ইন্ডাস্ট্রিজ' : 'Meghna Group of Industries',
      jobTitle: isBn ? 'সিনিয়র অ্যাকাউন্টস অফিসার' : 'Senior Accounts Officer',
      employmentType: 'Full-time',
      location: 'Dhaka',
      startDate: '2019-03',
      endDate: '',
      currentlyWorking: true,
      responsibilities: [
        isBn ? 'দৈনিক লেজার ও ব্যাংক সমন্বয় রক্ষণাবেক্ষণ।' : 'Maintain daily ledger entries and bank reconciliation.',
        isBn ? 'মাসিক আর্থিক বিবরণী প্রস্তুত ও ব্যবস্থাপনাকে অবহিতকরণ।' : 'Prepare monthly financial statements and report to management.',
        isBn ? 'ভ্যাট ও ট্যাক্স রিটার্ন সংক্রান্ত ডকুমেন্টেশন।' : 'Handle VAT and tax return documentation.',
      ],
      achievements: [
        isBn ? 'সমন্বয় প্রক্রিয়ার সময় ২০% হ্রাস।' : 'Reduced reconciliation turnaround time by 20%.',
      ],
      projects: '',
      tools: 'Tally ERP 9, MS Excel, SAP FI',
      additionalDetails: '',
    },
    {
      id: uid(),
      industry: 'Trading',
      company: isBn ? 'প্যাসিফিক ট্রেডার্স' : 'Pacific Traders',
      jobTitle: isBn ? 'অ্যাকাউন্টস এসিস্ট্যান্ট' : 'Accounts Assistant',
      employmentType: 'Full-time',
      location: 'Dhaka',
      startDate: '2017-06',
      endDate: '2019-02',
      currentlyWorking: false,
      responsibilities: [
        isBn ? 'ক্যাশ বুক ও পেটি ক্যাশ পরিচালনা।' : 'Managed the cash book and petty cash.',
        isBn ? 'সাপ্লায়ার ইনভয়েস যাচাই ও এন্ট্রি।' : 'Verified and entered supplier invoices.',
      ],
      achievements: [],
      projects: '',
      tools: 'QuickBooks',
      additionalDetails: '',
    },
  ];
  cv.skills = [
    { id: uid(), name: 'Tally ERP 9', category: 'Software Skills', level: 'advanced' },
    { id: uid(), name: 'MS Excel (Advanced)', category: 'Software Skills', level: 'expert' },
    { id: uid(), name: 'Financial Reporting', category: 'Technical Skills', level: 'advanced' },
    { id: uid(), name: 'VAT & Tax Compliance', category: 'Technical Skills', level: 'intermediate' },
    { id: uid(), name: 'Team Coordination', category: 'Management Skills', level: 'advanced' },
    { id: uid(), name: 'Written Communication', category: 'Communication Skills', level: 'advanced' },
  ];
  cv.languages = [
    { id: uid(), name: isBn ? 'বাংলা' : 'Bangla', reading: 'native', writing: 'native', speaking: 'native', listening: 'native', overall: 'native' },
    { id: uid(), name: 'English', reading: 'fluent', writing: 'fluent', speaking: 'fluent', listening: 'fluent', overall: 'fluent' },
  ];
  cv.trainingEnabled = true;
  cv.training = [
    {
      id: uid(),
      title: isBn ? 'অ্যাডভান্সড এক্সেল ফর ফাইন্যান্স' : 'Advanced Excel for Finance',
      institution: 'BASIS Institute of Technology',
      issuingOrganization: 'BIT',
      completionDate: '2021-08',
      duration: '3 months',
      certificateId: 'BIT-2021-4471',
      description: '',
      skillsLearned: 'Pivot tables, financial modelling',
    },
  ];
  cv.sections = cv.sections.map((s) =>
    s.id === 'training' || s.id === 'careerObjective' ? { ...s, enabled: true } : s,
  );
  return cv;
}
