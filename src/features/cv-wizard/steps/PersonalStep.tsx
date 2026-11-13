/**
 * Step 1 — Basic personal information.
 *
 * Sensitive fields (NID, passport, religion, blood group) are collected only
 * when the operator opens the optional block, and are never published unless
 * explicitly switched on in the "Personal details" step.
 */
import React from 'react';
import { ChevronDown, ChevronRight, ShieldAlert } from 'lucide-react';
import type { CVData } from '@/types/cv';
import { Checkbox, Field, Input, Notice, Select } from '@/components/ui';
import { useLang, useT } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { isEmail, isPhone } from '@/lib/sanitize';

export const PersonalStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const tr = useT();
  const [showSensitive, setShowSensitive] = React.useState(false);
  const p = data.personal;

  const set = <K extends keyof typeof p>(key: K, value: (typeof p)[K]) => {
    update((draft) => {
      (draft.personal[key] as typeof value) = value;
    });
    // Keep the derived display name in sync when individual parts change.
    if (key === 'firstName' || key === 'middleName' || key === 'lastName') {
      update((draft) => {
        const parts = [draft.personal.firstName, draft.personal.middleName, draft.personal.lastName]
          .map((s) => s.trim())
          .filter(Boolean);
        if (parts.length > 0) draft.personal.fullName = parts.join(' ');
      }, { transient: true });
    }
  };

  const emailError = p.email && !isEmail(p.email) ? (lang === 'bn' ? 'ইমেইল ঠিকানা সঠিক নয়' : 'Enter a valid email address') : '';
  const phoneError = p.mobile && !isPhone(p.mobile) ? (lang === 'bn' ? 'মোবাইল নম্বর সঠিক নয়' : 'Enter a valid phone number') : '';

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <div className="field-grid">
        <Field label={lang === 'bn' ? 'পূর্ণ নাম' : 'Full Name'} required htmlFor="fullName" className="span-2">
          <Input
            id="fullName"
            value={p.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: মোঃ রফিকুল ইসলাম' : 'e.g. Md. Rafiqul Islam'}
            autoFocus
            maxLength={90}
          />
        </Field>
        <Field label={lang === 'bn' ? 'প্রথম নাম' : 'First Name'} optional htmlFor="firstName">
          <Input id="firstName" value={p.firstName} onChange={(e) => set('firstName', e.target.value)} maxLength={40} />
        </Field>
        <Field label={lang === 'bn' ? 'মধ্যম নাম' : 'Middle Name'} optional htmlFor="middleName">
          <Input id="middleName" value={p.middleName} onChange={(e) => set('middleName', e.target.value)} maxLength={40} />
        </Field>
        <Field label={lang === 'bn' ? 'পদবি / ট্যাগলাইন' : 'Professional Title'} optional
          hint={lang === 'bn' ? 'নামের নিচে ছোট করে দেখানো হবে' : 'Shown in small type under the name'} htmlFor="headline" className="span-2">
          <Input
            id="headline"
            value={p.headline}
            onChange={(e) => set('headline', e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: Senior Accounts Officer' : 'e.g. Senior Accounts Officer'}
            maxLength={70}
          />
        </Field>
        <Field label={lang === 'bn' ? 'পিতার নাম' : "Father's Name"} optional htmlFor="fatherName">
          <Input id="fatherName" value={p.fatherName} onChange={(e) => set('fatherName', e.target.value)} maxLength={70} />
        </Field>
        <Field label={lang === 'bn' ? 'মাতার নাম' : "Mother's Name"} optional htmlFor="motherName">
          <Input id="motherName" value={p.motherName} onChange={(e) => set('motherName', e.target.value)} maxLength={70} />
        </Field>
        <Field label={lang === 'bn' ? 'জন্ম তারিখ' : 'Date of Birth'} optional htmlFor="dob">
          <Input id="dob" type="date" value={p.dateOfBirth} onChange={(e) => set('dateOfBirth', e.target.value)} />
        </Field>
        <Field label={lang === 'bn' ? 'লিঙ্গ' : 'Gender'} optional htmlFor="gender">
          <Select id="gender" value={p.gender} onChange={(e) => set('gender', e.target.value)}>
            <option value="">{lang === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
            <option value="Male">{lang === 'bn' ? 'পুরুষ' : 'Male'}</option>
            <option value="Female">{lang === 'bn' ? 'মহিলা' : 'Female'}</option>
            <option value="Other">{lang === 'bn' ? 'অন্যান্য' : 'Other'}</option>
          </Select>
        </Field>
        <Field label={lang === 'bn' ? 'জাতীয়তা' : 'Nationality'} optional htmlFor="nationality">
          <Input id="nationality" value={p.nationality} onChange={(e) => set('nationality', e.target.value)} placeholder="Bangladeshi" maxLength={40} />
        </Field>
        <Field label={lang === 'bn' ? 'বৈবাহিক অবস্থা' : 'Marital Status'} optional htmlFor="marital">
          <Select id="marital" value={p.maritalStatus} onChange={(e) => set('maritalStatus', e.target.value)}>
            <option value="">{lang === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
            <option value="Single">{lang === 'bn' ? 'অবিবাহিত' : 'Single'}</option>
            <option value="Married">{lang === 'bn' ? 'বিবাহিত' : 'Married'}</option>
            <option value="Divorced">{lang === 'bn' ? 'বিবাহবিচ্ছেদ' : 'Divorced'}</option>
            <option value="Widowed">{lang === 'bn' ? 'বিপত্নীক/বিধবা' : 'Widowed'}</option>
          </Select>
        </Field>
      </div>

      <div className="divider" />

      <h3 style={{ margin: 0, fontSize: 'var(--fs-base)', fontWeight: 620 }}>
        {lang === 'bn' ? 'যোগাযোগ' : 'Contact'}
      </h3>
      <div className="field-grid">
        <Field label={lang === 'bn' ? 'মোবাইল নম্বর' : 'Mobile Number'} required htmlFor="mobile" error={phoneError || undefined}>
          <Input
            id="mobile"
            value={p.mobile}
            onChange={(e) => set('mobile', e.target.value)}
            placeholder="+880 1XXX XXXXXX"
            inputMode="tel"
            maxLength={24}
            invalid={!!phoneError}
          />
        </Field>
        <Field label={lang === 'bn' ? 'বিকল্প ফোন' : 'Alternative Phone'} optional htmlFor="altPhone">
          <Input id="altPhone" value={p.altPhone} onChange={(e) => set('altPhone', e.target.value)} inputMode="tel" maxLength={24} />
        </Field>
        <Field label={lang === 'bn' ? 'ইমেইল' : 'Email Address'} optional htmlFor="email" error={emailError || undefined}>
          <Input
            id="email"
            type="email"
            value={p.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="name@example.com"
            maxLength={80}
            invalid={!!emailError}
          />
        </Field>
        <Field label="LinkedIn" optional htmlFor="linkedin">
          <Input id="linkedin" value={p.linkedin} onChange={(e) => set('linkedin', e.target.value)} placeholder="linkedin.com/in/username" maxLength={120} />
        </Field>
        <Field label={lang === 'bn' ? 'বর্তমান ঠিকানা' : 'Present Address'} optional htmlFor="presentAddress">
          <Input id="presentAddress" value={p.presentAddress} onChange={(e) => set('presentAddress', e.target.value)} maxLength={160} />
        </Field>
        <Field label={lang === 'bn' ? 'স্থায়ী ঠিকানা' : 'Permanent Address'} optional htmlFor="permanentAddress">
          <Input
            id="permanentAddress"
            value={p.permanentAddress}
            onChange={(e) => set('permanentAddress', e.target.value)}
            maxLength={160}
          />
        </Field>
        <Field label={lang === 'bn' ? 'শহর' : 'City / District'} optional htmlFor="city">
          <Input id="city" value={p.city} onChange={(e) => set('city', e.target.value)} maxLength={60} />
        </Field>
        <Field label={lang === 'bn' ? 'দেশ' : 'Country'} optional htmlFor="country">
          <Input id="country" value={p.country} onChange={(e) => set('country', e.target.value)} maxLength={60} />
        </Field>
        <Field label={lang === 'bn' ? 'পোর্টফোলিও' : 'Portfolio'} optional htmlFor="portfolio">
          <Input id="portfolio" value={p.portfolio} onChange={(e) => set('portfolio', e.target.value)} placeholder="behance.net/username" maxLength={120} />
        </Field>
        <Field label={lang === 'bn' ? 'ওয়েবসাইট' : 'Website'} optional htmlFor="website">
          <Input id="website" value={p.website} onChange={(e) => set('website', e.target.value)} placeholder="example.com" maxLength={120} />
        </Field>
      </div>

      <div className="card" style={{ borderStyle: 'dashed' }}>
        <button
          className="nav-item"
          style={{ padding: 'var(--sp-3) var(--sp-4)', borderRadius: 'var(--radius-md)' }}
          onClick={() => setShowSensitive((v) => !v)}
          aria-expanded={showSensitive}
        >
          <ShieldAlert size={16} />
          <span className="nav-label" style={{ fontWeight: 560 }}>
            {lang === 'bn' ? 'সংবেদনশীল তথ্য (ঐচ্ছিক)' : 'Sensitive details (optional)'}
          </span>
          {showSensitive ? <ChevronDown size={15} style={{ marginLeft: 'auto' }} /> : <ChevronRight size={15} style={{ marginLeft: 'auto' }} />}
        </button>
        {showSensitive ? (
          <div className="card-body col" style={{ paddingTop: 0 }}>
            <Notice tone="warning">
              {lang === 'bn'
                ? 'জাতীয় পরিচয়পত্র নম্বর, পাসপোর্ট, ধর্ম ও রক্তের গ্রুপ সাধারণত CV-তে প্রয়োজন হয় না। এগুলো ডিফল্টভাবে CV-তে প্রকাশিত হবে না — পরের ধাপে আলাদা করে চালু করতে হবে।'
                : 'National ID, passport, religion and blood group are rarely needed on a CV. They are never published by default — you must enable each one explicitly in the personal-details step.'}
            </Notice>
            <div className="field-grid">
              <Field label={lang === 'bn' ? 'ধর্ম' : 'Religion'} optional htmlFor="religion">
                <Input id="religion" value={p.religion} onChange={(e) => set('religion', e.target.value)} maxLength={30} />
              </Field>
              <Field label={lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'} optional htmlFor="blood">
                <Select id="blood" value={p.bloodGroup} onChange={(e) => set('bloodGroup', e.target.value)}>
                  <option value="">{lang === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                  {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={lang === 'bn' ? 'জাতীয় পরিচয়পত্র নম্বর' : 'National ID'} optional htmlFor="nid">
                <Input id="nid" value={p.nationalId} onChange={(e) => set('nationalId', e.target.value)} maxLength={30} />
              </Field>
              <Field label={lang === 'bn' ? 'পাসপোর্ট নম্বর' : 'Passport Number'} optional htmlFor="passport">
                <Input id="passport" value={p.passportNo} onChange={(e) => set('passportNo', e.target.value)} maxLength={30} />
              </Field>
              <Field label={lang === 'bn' ? 'উচ্চতা' : 'Height'} optional htmlFor="height">
                <Input id="height" value={p.height} onChange={(e) => set('height', e.target.value)} placeholder="5'7&quot;" maxLength={20} />
              </Field>
              <Field label={lang === 'bn' ? 'ওজন' : 'Weight'} optional htmlFor="weight">
                <Input id="weight" value={p.weight} onChange={(e) => set('weight', e.target.value)} placeholder="65 kg" maxLength={20} />
              </Field>
            </div>
            <Checkbox
              checked={!!p.nationalId || !!p.passportNo}
              onChange={() => undefined}
              label={
                <span className="small muted">
                  {lang === 'bn'
                    ? 'এই তথ্যগুলো শুধু আপনার ডেটাবেসে সংরক্ষিত থাকবে। CV-তে দেখাতে চাইলে ১৫ নম্বর ধাপে “ব্যক্তিগত তথ্য” সেকশন চালু করুন।'
                    : 'These stay in your local database only. To print them, enable the “Personal details” section in step 15.'}
                </span>
              }
              disabled
            />
          </div>
        ) : null}
      </div>

      <p className="small faint" style={{ margin: 0 }}>
        {tr('wiz.saveDraft')}
      </p>
    </div>
  );
};
