/**
 * Content steps 3–19. Each step writes only to its own slice of the CV model and
 * keeps the section visibility configuration in sync.
 */
import React, { useMemo, useState } from 'react';
import {
  Award,
  BookOpenCheck,
  Briefcase,
  Check,
  FolderKanban,
  GraduationCap,
  Heart,
  Languages as LanguagesIcon,
  Lightbulb,
  PenLine,
  Plus,
  Sparkles,
  Trash2,
  UserCheck,
  Users2,
  Wand2,
} from 'lucide-react';
import type {
  AchievementEntry,
  CustomSectionEntry,
  EducationEntry,
  ExperienceEntry,
  LanguageEntry,
  LanguageProficiency,
  ProjectEntry,
  ProficiencyLevel,
  ReferenceEntry,
  TrainingEntry,
  VolunteerEntry,
} from '@/types/cv';
import {
  Badge,
  Button,
  Checkbox,
  Field,
  IconButton,
  Input,
  Notice,
  Select,
  Switch,
  SwitchRow,
  Textarea,
  useLang,
  useT,
} from '@/components/ui';
import { BulletEditor, EntryEditor } from '../EntryEditor';
import { useWorkspace } from '@/store/workspace';
import { uid } from '@/lib/defaults';
import {
  CAREER_INTEREST_SUGGESTIONS,
  DECLARATION_PRESETS,
  HOBBY_SUGGESTIONS,
  OBJECTIVE_CATEGORIES,
  SKILL_CATEGORIES,
  STRENGTH_SUGGESTIONS,
  objectiveCategoryById,
} from '@/content/objectives';
import { getBridge } from '@/platform';

/* ------------------------------------------------------------------ utils */
function useSectionToggle() {
  const update = useWorkspace((s) => s.updateData);
  return (sectionId: string, enabled: boolean) =>
    update((draft) => {
      const section = draft.sections.find((s) => s.id === sectionId);
      if (section) section.enabled = enabled;
    });
}

const bn = (lang: 'bn' | 'en', bangla: string, english: string) => (lang === 'bn' ? bangla : english);

const PROFICIENCY_LEVELS: { value: ProficiencyLevel; bn: string; en: string }[] = [
  { value: 'beginner', bn: 'প্রাথমিক', en: 'Beginner' },
  { value: 'intermediate', bn: 'মধ্যম', en: 'Intermediate' },
  { value: 'advanced', bn: 'উন্নত', en: 'Advanced' },
  { value: 'expert', bn: 'দক্ষ', en: 'Expert' },
];

const LANGUAGE_LEVELS: { value: LanguageProficiency; bn: string; en: string }[] = [
  { value: 'basic', bn: 'মৌলিক', en: 'Basic' },
  { value: 'conversational', bn: 'কথোপকথন', en: 'Conversational' },
  { value: 'intermediate', bn: 'মধ্যম', en: 'Intermediate' },
  { value: 'fluent', bn: 'সাবলীল', en: 'Fluent' },
  { value: 'native', bn: 'মাতৃভাষা', en: 'Native' },
];

/* ------------------------------------------------------- 3. Objective */
export const ObjectiveStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const tr = useT();
  const [categoryId, setCategoryId] = useState(data.careerObjective.categoryId || 'general');
  const category = objectiveCategoryById(categoryId);

  const applyPreset = (text: string) =>
    update((draft) => {
      draft.careerObjective.text = text;
      draft.careerObjective.categoryId = categoryId;
      draft.careerObjective.enabled = true;
    });

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <SwitchRow
        title={bn(lang, 'এই সেকশনটি CV-তে দেখাও', 'Show this section on the CV')}
        description={bn(lang, 'বন্ধ করলে CV-তে কোনো খালি শিরোনাম থাকবে না', 'When off, no empty heading appears anywhere')}
        checked={data.careerObjective.enabled}
        onChange={(next) =>
          update((draft) => {
            draft.careerObjective.enabled = next;
          })
        }
      />

      <Field label={bn(lang, 'ক্যাটাগরি', 'Category')}>
        <Select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
          {OBJECTIVE_CATEGORIES.map((c) => (
            <option key={c.id} value={c.id}>
              {lang === 'bn' ? c.labelBn : c.labelEn}
            </option>
          ))}
        </Select>
      </Field>

      <div className="col" style={{ gap: 'var(--sp-2)' }}>
        <span className="field-label">{bn(lang, 'প্রস্তুত টেমপ্লেট', 'Ready-made statements')}</span>
        {category.presets.map((preset) => {
          const active = data.careerObjective.text.trim() === preset.text.trim();
          return (
            <button
              key={preset.id}
              className="card card-pad"
              onClick={() => applyPreset(preset.text)}
              style={{
                textAlign: 'left',
                cursor: 'pointer',
                borderColor: active ? 'var(--primary)' : 'var(--border)',
                background: active ? 'var(--primary-soft)' : 'var(--bg-elevated)',
                font: 'inherit',
                color: 'inherit',
              }}
              aria-pressed={active}
            >
              <div className="row between" style={{ marginBottom: 6 }}>
                <span style={{ fontSize: 'var(--fs-xs)', fontWeight: 600, color: 'var(--text-muted)' }}>{preset.label}</span>
                {active ? (
                  <Badge tone="primary" icon={<Check size={11} />}>
                    {bn(lang, 'নির্বাচিত', 'Selected')}
                  </Badge>
                ) : (
                  <Badge tone="default">{bn(lang, 'প্রয়োগ করুন', 'Apply')}</Badge>
                )}
              </div>
              <p style={{ margin: 0, fontSize: 'var(--fs-sm)', lineHeight: 1.6, color: 'var(--text)' }}>{preset.text}</p>
            </button>
          );
        })}
      </div>

      <Field
        label={bn(lang, 'অবজেক্টিভ (সম্পাদনযোগ্য)', 'Objective (editable)')}
        hint={bn(
          lang,
          'প্রস্তুত টেমপ্লেট ব্যবহার করলেও নিজের ভাষায় সম্পাদনা করুন। কোনো অর্জন বা অভিজ্ঞতা নিজে থেকে যোগ করা হবে না।',
          'Edit freely even after choosing a preset. Nothing is invented on your behalf.',
        )}
      >
        <Textarea
          value={data.careerObjective.text}
          rows={5}
          maxLength={900}
          onChange={(e) =>
            update((draft) => {
              draft.careerObjective.text = e.target.value;
            })
          }
          placeholder={bn(lang, 'এখানে আপনার ক্যারিয়ার অবজেক্টিভ লিখুন…', 'Write your career objective here…')}
        />
      </Field>
      <div className="row between">
        <span className="small faint">
          {data.careerObjective.text.trim().split(/\s+/).filter(Boolean).length} {bn(lang, 'শব্দ', 'words')}
        </span>
        <Button
          size="sm"
          icon={<Wand2 size={14} />}
          onClick={() => applyPreset(category.presets[0].text)}
          variant="outline"
        >
          {bn(lang, 'প্রথম টেমপ্লেটে ফিরুন', 'Reset to first preset')}
        </Button>
      </div>
      <p className="small faint" style={{ margin: 0 }}>
        {tr('wiz.saveDraft')}
      </p>
    </div>
  );
};

/* ------------------------------------------------------- 4. Interests */
export const InterestsStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();

  const toggle = (item: string) =>
    update((draft) => {
      const set = new Set(draft.careerInterests.selected);
      if (set.has(item)) set.delete(item);
      else set.add(item);
      draft.careerInterests.selected = Array.from(set);
      draft.careerInterests.enabled = true;
    });

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <SwitchRow
        title={bn(lang, 'ক্যারিয়ার আগ্রহ সেকশন দেখাও', 'Show career interest')}
        checked={data.careerInterests.enabled}
        onChange={(next) =>
          update((draft) => {
            draft.careerInterests.enabled = next;
          })
        }
      />
      {CAREER_INTEREST_SUGGESTIONS.map((group) => (
        <div key={group.id} className="col" style={{ gap: 'var(--sp-2)' }}>
          <span className="field-label">{lang === 'bn' ? group.labelBn : group.labelEn}</span>
          <div className="row wrap" style={{ gap: 6 }}>
            {group.items.map((item) => {
              const active = data.careerInterests.selected.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggle(item)}
                  className={`badge ${active ? 'badge-primary' : ''}`}
                  style={{
                    cursor: 'pointer',
                    padding: '6px 11px',
                    fontSize: 'var(--fs-sm)',
                    background: active ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                    border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                    color: active ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: active ? 600 : 500,
                  }}
                  aria-pressed={active}
                >
                  {active ? <Check size={12} /> : <Plus size={12} />}
                  {item}
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <Field label={bn(lang, 'নিজের লেখা (কমা দিয়ে আলাদা করুন)', 'Your own entries (comma separated)')}>
        <Input
          value={data.careerInterests.custom}
          onChange={(e) =>
            update((draft) => {
              draft.careerInterests.custom = e.target.value;
              draft.careerInterests.enabled = true;
            })
          }
          placeholder={bn(lang, 'যেমন: Supply Chain, Public Relations', 'e.g. Supply Chain, Public Relations')}
        />
      </Field>
    </div>
  );
};

/* ------------------------------------------------------- 5. Education */
export const EducationStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();

  const create = (): EducationEntry => ({
    id: uid(),
    degree: '',
    group: '',
    institution: '',
    board: '',
    passingYear: '',
    result: '',
    gpa: '',
    scale: '4.00',
    division: '',
    location: '',
    additionalInfo: '',
    currentlyStudying: false,
  });

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <Notice tone="info">
        {bn(
          lang,
          'একাডেমিক তথ্য ছাড়াও সিভি তৈরি করা যাবে, তবে নিয়োগকর্তারা সাধারণত শিক্ষাগত যোগ্যতা প্রত্যাশা করেন। সর্বশেষ ডিগ্রি সবার আগে রাখুন।',
          'A CV can be generated without education, but employers expect it. Put the most recent degree first.',
        )}
      </Notice>
      <EntryEditor<EducationEntry>
        items={data.education}
        onChange={(next) =>
          update((draft) => {
            draft.education = next;
          })
        }
        create={create}
        addLabel={bn(lang, 'শিক্ষা যোগ করুন', 'Add education')}
        emptyLabel={bn(lang, 'এখনো কোনো শিক্ষাগত তথ্য যোগ করা হয়নি', 'No education added yet')}
        emptyHint={bn(lang, '“শিক্ষা যোগ করুন” চাপুন', 'Press “Add education” to begin')}
        renderSummary={(item) => ({ title: item.degree || bn(lang, 'নতুন ডিগ্রি', 'New degree'), subtitle: item.institution })}
        renderForm={(item, patch) => (
          <div className="field-grid">
            <Field label={bn(lang, 'ডিগ্রি / পরীক্ষা', 'Degree / Examination')} required>
              <Input value={item.degree} onChange={(e) => patch({ degree: e.target.value })} placeholder="B.Sc in CSE / HSC" />
            </Field>
            <Field label={bn(lang, 'গ্রুপ / বিষয়', 'Group / Subject')} optional>
              <Input value={item.group} onChange={(e) => patch({ group: e.target.value })} placeholder="Science / Accounting" />
            </Field>
            <Field label={bn(lang, 'প্রতিষ্ঠানের নাম', 'Institution Name')} required>
              <Input value={item.institution} onChange={(e) => patch({ institution: e.target.value })} />
            </Field>
            <Field label={bn(lang, 'বোর্ড / বিশ্ববিদ্যালয়', 'Board / University')} optional>
              <Input value={item.board} onChange={(e) => patch({ board: e.target.value })} />
            </Field>
            <Field label={bn(lang, 'পাসের সাল', 'Passing Year')} optional>
              <Input value={item.passingYear} onChange={(e) => patch({ passingYear: e.target.value })} placeholder="2021" maxLength={10} />
            </Field>
            <Field label={bn(lang, 'ফলাফল (GPA)', 'Result (GPA)')} optional>
              <Input value={item.gpa} onChange={(e) => patch({ gpa: e.target.value })} placeholder="3.65" maxLength={10} />
            </Field>
            <Field label={bn(lang, 'স্কেল', 'Scale')} optional>
              <Input value={item.scale} onChange={(e) => patch({ scale: e.target.value })} placeholder="4.00" maxLength={10} />
            </Field>
            <Field label={bn(lang, 'বিভাগ / ক্লাস', 'Division / Class')} optional>
              <Input value={item.division} onChange={(e) => patch({ division: e.target.value })} placeholder="First Class" />
            </Field>
            <Field label={bn(lang, 'অবস্থান', 'Location')} optional>
              <Input value={item.location} onChange={(e) => patch({ location: e.target.value })} />
            </Field>
            <Field label={bn(lang, 'অতিরিক্ত তথ্য', 'Additional Information')} optional className="span-2">
              <Input value={item.additionalInfo} onChange={(e) => patch({ additionalInfo: e.target.value })} />
            </Field>
            <Checkbox
              checked={item.currentlyStudying}
              onChange={(next) => patch({ currentlyStudying: next })}
              label={bn(lang, 'বর্তমানে অধ্যয়নরত', 'Currently studying')}
            />
          </div>
        )}
      />
    </div>
  );
};

/* ------------------------------------------------------ 6. Experience */
export const ExperienceStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  const create = (): ExperienceEntry => ({
    id: uid(),
    industry: '',
    company: '',
    jobTitle: '',
    employmentType: 'Full-time',
    location: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    responsibilities: [''],
    achievements: [],
    projects: '',
    tools: '',
    additionalDetails: '',
  });

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <div className="card card-pad col" style={{ gap: 'var(--sp-3)' }}>
        <span className="field-label">{bn(lang, 'আপনার কোনো কর্ম অভিজ্ঞতা আছে কি?', 'Do you have any work experience?')}</span>
        <div className="row" style={{ gap: 'var(--sp-3)' }}>
          <button
            className={`btn ${data.hasExperience ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              update((draft) => {
                draft.hasExperience = true;
              });
              toggle('experience', true);
            }}
            aria-pressed={data.hasExperience}
          >
            <Briefcase size={15} /> {bn(lang, 'হ্যাঁ, আছে', 'Yes')}
          </button>
          <button
            className={`btn ${!data.hasExperience ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => {
              update((draft) => {
                draft.hasExperience = false;
              });
              toggle('experience', false);
            }}
            aria-pressed={!data.hasExperience}
          >
            {bn(lang, 'না, ফ্রেশার', 'No, fresher')}
          </button>
        </div>
      </div>

      {!data.hasExperience ? (
        <Notice tone="info">
          {bn(
            lang,
            'ফ্রেশার হিসেবে চিহ্নিত হয়েছে। কর্ম অভিজ্ঞতা সেকশন সম্পূর্ণ বাদ যাবে — কোনো খালি শিরোনাম থাকবে না। ইন্টার্নশিপ, একাডেমিক প্রকল্প, দক্ষতা ও স্বেচ্ছাসেবা যোগ করে CV শক্তিশালী করুন।',
            'Marked as a fresher. The work-experience section is dropped entirely — no empty heading. Strengthen the CV with internships, academic projects, skills and volunteering.',
          )}
        </Notice>
      ) : (
        <EntryEditor<ExperienceEntry>
          items={data.experience}
          onChange={(next) =>
            update((draft) => {
              draft.experience = next;
            })
          }
          create={create}
          addLabel={bn(lang, 'অভিজ্ঞতা যোগ করুন', 'Add experience')}
          emptyLabel={bn(lang, 'এখনো কোনো অভিজ্ঞতা যোগ করা হয়নি', 'No experience added yet')}
          renderSummary={(item) => ({ title: item.jobTitle || bn(lang, 'নতুন পদ', 'New role'), subtitle: item.company })}
          renderForm={(item, patch) => (
            <div className="field-grid">
              <Field label={bn(lang, 'পদবি', 'Job Title')} required>
                <Input value={item.jobTitle} onChange={(e) => patch({ jobTitle: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'প্রতিষ্ঠানের নাম', 'Company Name')} required>
                <Input value={item.company} onChange={(e) => patch({ company: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'ইন্ডাস্ট্রি', 'Industry')} optional>
                <Input value={item.industry} onChange={(e) => patch({ industry: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'চাকরির ধরন', 'Employment Type')} optional>
                <Select value={item.employmentType} onChange={(e) => patch({ employmentType: e.target.value })}>
                  {['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance', 'Volunteer'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label={bn(lang, 'কর্মস্থলের স্থান', 'Job Location')} optional>
                <Input value={item.location} onChange={(e) => patch({ location: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'শুরুর তারিখ', 'Start Date')} optional>
                <Input type="month" value={item.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'শেষ তারিখ', 'End Date')} optional>
                <Input
                  type="month"
                  value={item.endDate}
                  onChange={(e) => patch({ endDate: e.target.value })}
                  disabled={item.currentlyWorking}
                />
              </Field>
              <div style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 8 }}>
                <Checkbox
                  checked={item.currentlyWorking}
                  onChange={(next) => patch({ currentlyWorking: next, endDate: next ? '' : item.endDate })}
                  label={bn(lang, 'বর্তমানে কর্মরত', 'Currently working')}
                />
              </div>
              <div className="span-2">
                <BulletEditor
                  label={bn(lang, 'দায়িত্ব ও কাজ', 'Responsibilities & duties')}
                  values={item.responsibilities}
                  onChange={(next) => patch({ responsibilities: next })}
                  placeholder={bn(lang, 'যেমন: দৈনিক লেজার ও ব্যাংক সমন্বয় রক্ষণাবেক্ষণ', 'e.g. Maintained the daily ledger and bank reconciliation')}
                />
              </div>
              <div className="span-2">
                <BulletEditor
                  label={bn(lang, 'অর্জন', 'Achievements')}
                  values={item.achievements}
                  onChange={(next) => patch({ achievements: next })}
                  placeholder={bn(lang, 'পরিমাপযোগ্য অর্জন লিখুন', 'Describe a measurable achievement')}
                />
              </div>
              <Field label={bn(lang, 'প্রকল্প', 'Projects')} optional className="span-2">
                <Input value={item.projects} onChange={(e) => patch({ projects: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'ব্যবহৃত টুলস / প্রযুক্তি', 'Tools & technologies')} optional className="span-2">
                <Input value={item.tools} onChange={(e) => patch({ tools: e.target.value })} placeholder="Tally ERP, MS Excel, SAP" />
              </Field>
            </div>
          )}
        />
      )}
    </div>
  );
};

/* ---------------------------------------------------------- 7. Skills */
export const SkillsStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const [name, setName] = useState('');
  const [category, setCategory] = useState(SKILL_CATEGORIES[0]);
  const [level, setLevel] = useState<ProficiencyLevel>('intermediate');

  const add = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // Skills are only ever added by the operator — never auto-generated.
    if (data.skills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())) return;
    update((draft) => {
      draft.skills.push({ id: uid(), name: trimmed, category, level });
    });
    setName('');
  };

  const grouped = useMemo(() => {
    const map = new Map<string, typeof data.skills>();
    for (const skill of data.skills) {
      const list = map.get(skill.category) ?? [];
      list.push(skill);
      map.set(skill.category, list);
    }
    return Array.from(map.entries());
  }, [data.skills]);

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <div className="card card-pad col" style={{ gap: 'var(--sp-3)' }}>
        <div className="field-grid-3">
          <Field label={bn(lang, 'দক্ষতার নাম', 'Skill name')} required>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && add()}
              placeholder={bn(lang, 'যেমন: Tally ERP', 'e.g. Tally ERP')}
              maxLength={50}
            />
          </Field>
          <Field label={bn(lang, 'ক্যাটাগরি', 'Category')}>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              {SKILL_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={bn(lang, 'দক্ষতার মাত্রা', 'Proficiency')}>
            <Select value={level} onChange={(e) => setLevel(e.target.value as ProficiencyLevel)}>
              {PROFICIENCY_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {lang === 'bn' ? l.bn : l.en}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <div>
          <Button variant="primary" icon={<Plus size={15} />} onClick={add} disabled={!name.trim()}>
            {bn(lang, 'দক্ষতা যোগ করুন', 'Add skill')}
          </Button>
        </div>
      </div>

      {grouped.length === 0 ? (
        <Notice tone="info">
          {bn(lang, 'এখনো কোনো দক্ষতা যোগ করা হয়নি।', 'No skills added yet.')}
        </Notice>
      ) : (
        grouped.map(([groupName, items]) => (
          <div key={groupName} className="card">
            <div className="card-header">
              <h3>{groupName}</h3>
              <Badge tone="primary">{items.length}</Badge>
            </div>
            <div className="card-body col" style={{ gap: 'var(--sp-2)' }}>
              {items.map((skill) => (
                <div key={skill.id} className="row" style={{ gap: 'var(--sp-2)' }}>
                  <Input
                    value={skill.name}
                    onChange={(e) =>
                      update((draft) => {
                        const target = draft.skills.find((s) => s.id === skill.id);
                        if (target) target.name = e.target.value;
                      })
                    }
                    style={{ flex: 1 }}
                    aria-label="Skill name"
                  />
                  <Select
                    value={skill.level}
                    onChange={(e) =>
                      update((draft) => {
                        const target = draft.skills.find((s) => s.id === skill.id);
                        if (target) target.level = e.target.value as ProficiencyLevel;
                      })
                    }
                    style={{ width: 150 }}
                    aria-label="Proficiency"
                  >
                    {PROFICIENCY_LEVELS.map((l) => (
                      <option key={l.value} value={l.value}>
                        {lang === 'bn' ? l.bn : l.en}
                      </option>
                    ))}
                  </Select>
                  <IconButton
                    label="Delete skill"
                    size="sm"
                    onClick={() =>
                      update((draft) => {
                        draft.skills = draft.skills.filter((s) => s.id !== skill.id);
                      })
                    }
                  >
                    <Trash2 size={14} />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

/* ------------------------------------------------------- 8. Languages */
export const LanguagesStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();

  const create = (): LanguageEntry => ({
    id: uid(),
    name: '',
    reading: 'intermediate',
    writing: 'intermediate',
    speaking: 'intermediate',
    listening: 'intermediate',
    overall: 'intermediate',
  });

  return (
    <EntryEditor<LanguageEntry>
      items={data.languages}
      onChange={(next) =>
        update((draft) => {
          draft.languages = next;
        })
      }
      create={create}
      addLabel={bn(lang, 'ভাষা যোগ করুন', 'Add language')}
      emptyLabel={bn(lang, 'এখনো কোনো ভাষা যোগ করা হয়নি', 'No languages added yet')}
      renderSummary={(item) => ({ title: item.name || bn(lang, 'নতুন ভাষা', 'New language'), subtitle: item.overall })}
      renderForm={(item, patch) => (
        <div className="field-grid">
          <Field label={bn(lang, 'ভাষার নাম', 'Language')} required>
            <Input value={item.name} onChange={(e) => patch({ name: e.target.value })} placeholder="Bangla / English / Hindi" />
          </Field>
          <Field label={bn(lang, 'সামগ্রিক দক্ষতা', 'Overall proficiency')}>
            <Select value={item.overall} onChange={(e) => patch({ overall: e.target.value as LanguageProficiency })}>
              {LANGUAGE_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>
                  {lang === 'bn' ? l.bn : l.en}
                </option>
              ))}
            </Select>
          </Field>
          {(['reading', 'writing', 'speaking', 'listening'] as const).map((skill) => (
            <Field
              key={skill}
              label={
                skill === 'reading'
                  ? bn(lang, 'পড়া', 'Reading')
                  : skill === 'writing'
                    ? bn(lang, 'লেখা', 'Writing')
                    : skill === 'speaking'
                      ? bn(lang, 'বলা', 'Speaking')
                      : bn(lang, 'শোনা', 'Listening')
              }
            >
              <Select value={item[skill]} onChange={(e) => patch({ [skill]: e.target.value } as Partial<LanguageEntry>)}>
                {LANGUAGE_LEVELS.map((l) => (
                  <option key={l.value} value={l.value}>
                    {lang === 'bn' ? l.bn : l.en}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
        </div>
      )}
    />
  );
};

/* -------------------------------------------------------- 9. Training */
export const TrainingStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  const create = (): TrainingEntry => ({
    id: uid(),
    title: '',
    institution: '',
    issuingOrganization: '',
    completionDate: '',
    duration: '',
    certificateId: '',
    description: '',
    skillsLearned: '',
  });

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'প্রশিক্ষণ ও সার্টিফিকেশন অন্তর্ভুক্ত করুন', 'Include training & certifications')}
        description={bn(lang, 'না বললে সেকশনটি সম্পূর্ণ বাদ যাবে', 'If off, the section is dropped entirely')}
        checked={data.trainingEnabled}
        onChange={(next) => {
          update((draft) => {
            draft.trainingEnabled = next;
          });
          toggle('training', next);
        }}
      />
      {data.trainingEnabled ? (
        <EntryEditor<TrainingEntry>
          items={data.training}
          onChange={(next) =>
            update((draft) => {
              draft.training = next;
            })
          }
          create={create}
          addLabel={bn(lang, 'প্রশিক্ষণ যোগ করুন', 'Add training')}
          emptyLabel={bn(lang, 'কোনো প্রশিক্ষণ যোগ করা হয়নি', 'No training added')}
          renderSummary={(item) => ({ title: item.title || bn(lang, 'নতুন প্রশিক্ষণ', 'New training'), subtitle: item.institution })}
          renderForm={(item, patch) => (
            <div className="field-grid">
              <Field label={bn(lang, 'প্রশিক্ষণ / সার্টিফিকেটের নাম', 'Training / certification name')} required className="span-2">
                <Input value={item.title} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'প্রতিষ্ঠান', 'Institution')} optional>
                <Input value={item.institution} onChange={(e) => patch({ institution: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'সার্টিফিকেট প্রদানকারী', 'Issuing organisation')} optional>
                <Input value={item.issuingOrganization} onChange={(e) => patch({ issuingOrganization: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'সম্পন্ন করার তারিখ', 'Completion date')} optional>
                <Input type="month" value={item.completionDate} onChange={(e) => patch({ completionDate: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'সময়কাল', 'Duration')} optional>
                <Input value={item.duration} onChange={(e) => patch({ duration: e.target.value })} placeholder="3 months" />
              </Field>
              <Field label={bn(lang, 'সার্টিফিকেট আইডি', 'Certificate ID')} optional>
                <Input value={item.certificateId} onChange={(e) => patch({ certificateId: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'অর্জিত দক্ষতা', 'Skills learned')} optional>
                <Input value={item.skillsLearned} onChange={(e) => patch({ skillsLearned: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'বিবরণ', 'Description')} optional className="span-2">
                <Textarea value={item.description} onChange={(e) => patch({ description: e.target.value })} rows={3} />
              </Field>
            </div>
          )}
        />
      ) : null}
    </div>
  );
};

/* -------------------------------------------------------- 10. Projects */
export const ProjectsStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  const create = (): ProjectEntry => ({
    id: uid(),
    name: '',
    description: '',
    role: '',
    technologies: '',
    startDate: '',
    endDate: '',
    url: '',
    contributions: [],
    outcome: '',
  });

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'প্রকল্প সেকশন অন্তর্ভুক্ত করুন', 'Include projects')}
        description={bn(lang, 'ফ্রেশারদের জন্য বিশেষভাবে উপযোগী', 'Particularly valuable for freshers')}
        checked={data.projectsEnabled}
        onChange={(next) => {
          update((draft) => {
            draft.projectsEnabled = next;
          });
          toggle('projects', next);
        }}
      />
      {data.projectsEnabled ? (
        <EntryEditor<ProjectEntry>
          items={data.projects}
          onChange={(next) =>
            update((draft) => {
              draft.projects = next;
            })
          }
          create={create}
          addLabel={bn(lang, 'প্রকল্প যোগ করুন', 'Add project')}
          emptyLabel={bn(lang, 'কোনো প্রকল্প যোগ করা হয়নি', 'No projects added')}
          renderSummary={(item) => ({ title: item.name || bn(lang, 'নতুন প্রকল্প', 'New project'), subtitle: item.role })}
          renderForm={(item, patch) => (
            <div className="field-grid">
              <Field label={bn(lang, 'প্রকল্পের নাম', 'Project name')} required className="span-2">
                <Input value={item.name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'আপনার ভূমিকা', 'Your role')} optional>
                <Input value={item.role} onChange={(e) => patch({ role: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'প্রযুক্তি', 'Technologies')} optional>
                <Input value={item.technologies} onChange={(e) => patch({ technologies: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'শুরুর তারিখ', 'Start date')} optional>
                <Input type="month" value={item.startDate} onChange={(e) => patch({ startDate: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'শেষ তারিখ', 'End date')} optional>
                <Input type="month" value={item.endDate} onChange={(e) => patch({ endDate: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'প্রকল্পের লিংক', 'Project URL')} optional className="span-2">
                <Input value={item.url} onChange={(e) => patch({ url: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'বিবরণ', 'Description')} optional className="span-2">
                <Textarea value={item.description} onChange={(e) => patch({ description: e.target.value })} rows={3} />
              </Field>
              <div className="span-2">
                <BulletEditor
                  label={bn(lang, 'মূল অবদান', 'Key contributions')}
                  values={item.contributions}
                  onChange={(next) => patch({ contributions: next })}
                />
              </div>
              <Field label={bn(lang, 'ফলাফল', 'Outcome')} optional className="span-2">
                <Input value={item.outcome} onChange={(e) => patch({ outcome: e.target.value })} />
              </Field>
            </div>
          )}
        />
      ) : null}
    </div>
  );
};

/* ---------------------------------------------------- 11. Achievements */
export const AchievementsStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  const create = (): AchievementEntry => ({ id: uid(), title: '', awardName: '', organization: '', date: '', description: '' });

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'অর্জন ও পুরস্কার অন্তর্ভুক্ত করুন', 'Include achievements & awards')}
        checked={data.achievementsEnabled}
        onChange={(next) => {
          update((draft) => {
            draft.achievementsEnabled = next;
          });
          toggle('achievements', next);
        }}
      />
      {data.achievementsEnabled ? (
        <EntryEditor<AchievementEntry>
          items={data.achievements}
          onChange={(next) =>
            update((draft) => {
              draft.achievements = next;
            })
          }
          create={create}
          addLabel={bn(lang, 'অর্জন যোগ করুন', 'Add achievement')}
          emptyLabel={bn(lang, 'কোনো অর্জন যোগ করা হয়নি', 'No achievements added')}
          renderSummary={(item) => ({ title: item.title || item.awardName || bn(lang, 'নতুন অর্জন', 'New achievement'), subtitle: item.organization })}
          renderForm={(item, patch) => (
            <div className="field-grid">
              <Field label={bn(lang, 'অর্জনের শিরোনাম', 'Achievement title')} required>
                <Input value={item.title} onChange={(e) => patch({ title: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'পুরস্কারের নাম', 'Award name')} optional>
                <Input value={item.awardName} onChange={(e) => patch({ awardName: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'প্রতিষ্ঠান', 'Organisation')} optional>
                <Input value={item.organization} onChange={(e) => patch({ organization: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'তারিখ', 'Date')} optional>
                <Input type="month" value={item.date} onChange={(e) => patch({ date: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'বিবরণ', 'Description')} optional className="span-2">
                <Textarea value={item.description} onChange={(e) => patch({ description: e.target.value })} rows={3} />
              </Field>
            </div>
          )}
        />
      ) : null}
    </div>
  );
};

/* --------------------------------------------- 12–14. Simple chip lists */
const ChipListStep: React.FC<{
  title: string;
  description: string;
  suggestions: string[];
  enabled: boolean;
  onToggle: (next: boolean) => void;
  items: { id: string; text: string }[];
  onItems: (next: { id: string; text: string }[]) => void;
  icon: React.ReactNode;
}> = ({ title, description, suggestions, enabled, onToggle, items, onItems, icon }) => {
  const lang = useLang();
  const [draft, setDraft] = useState('');
  const has = (value: string) => items.some((i) => i.text.toLowerCase() === value.toLowerCase());

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow title={title} description={description} checked={enabled} onChange={onToggle} />
      {enabled ? (
        <>
          <div className="col" style={{ gap: 'var(--sp-2)' }}>
            <span className="field-label">{bn(lang, 'প্রস্তাবিত', 'Suggestions')}</span>
            <div className="row wrap" style={{ gap: 6 }}>
              {suggestions.map((suggestion) => {
                const active = has(suggestion);
                return (
                  <button
                    key={suggestion}
                    type="button"
                    className={`badge ${active ? 'badge-primary' : ''}`}
                    style={{
                      cursor: 'pointer',
                      padding: '6px 11px',
                      fontSize: 'var(--fs-sm)',
                      background: active ? 'var(--primary-soft)' : 'var(--bg-subtle)',
                      border: `1px solid ${active ? 'var(--primary)' : 'var(--border)'}`,
                      color: active ? 'var(--primary)' : 'var(--text-muted)',
                    }}
                    onClick={() =>
                      onItems(
                        active
                          ? items.filter((i) => i.text.toLowerCase() !== suggestion.toLowerCase())
                          : [...items, { id: uid(), text: suggestion }],
                      )
                    }
                    aria-pressed={active}
                  >
                    {active ? <Check size={12} /> : <Plus size={12} />}
                    {suggestion}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="row" style={{ gap: 'var(--sp-2)' }}>
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={bn(lang, 'নিজে লিখুন…', 'Type your own…')}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && draft.trim()) {
                  onItems([...items, { id: uid(), text: draft.trim() }]);
                  setDraft('');
                }
              }}
              maxLength={60}
            />
            <Button
              onClick={() => {
                if (draft.trim()) {
                  onItems([...items, { id: uid(), text: draft.trim() }]);
                  setDraft('');
                }
              }}
              icon={<Plus size={14} />}
            >
              {bn(lang, 'যোগ করুন', 'Add')}
            </Button>
          </div>

          {items.length > 0 ? (
            <div className="row wrap" style={{ gap: 6 }}>
              {items.map((item) => (
                <span
                  key={item.id}
                  className="badge badge-primary"
                  style={{ padding: '7px 10px', fontSize: 'var(--fs-sm)', gap: 7 }}
                >
                  {item.text}
                  <button
                    onClick={() => onItems(items.filter((i) => i.id !== item.id))}
                    aria-label={`Remove ${item.text}`}
                    style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, color: 'inherit', display: 'flex' }}
                  >
                    <Trash2 size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : (
            <span className="small faint">
              {bn(lang, 'কিছু নির্বাচন করা হয়নি — এই সেকশনটি CV-তে যাবে না।', 'Nothing selected — this section will not appear.')}
            </span>
          )}
        </>
      ) : null}
      <span style={{ display: 'none' }}>{icon}</span>
    </div>
  );
};

export const StrengthsStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();
  return (
    <ChipListStep
      title={bn(lang, 'শক্তিশালী দিক যোগ করুন', 'Include strengths')}
      description={bn(lang, 'আপনার অনুমতি ছাড়া কোনো শক্তি স্বয়ংক্রিয়ভাবে যোগ হবে না', 'Nothing is added without your explicit choice')}
      suggestions={STRENGTH_SUGGESTIONS}
      enabled={data.strengthsEnabled}
      onToggle={(next) => {
        update((draft) => {
          draft.strengthsEnabled = next;
        });
        toggle('strengths', next);
      }}
      items={data.strengths}
      onItems={(next) =>
        update((draft) => {
          draft.strengths = next;
        })
      }
      icon={<Sparkles size={16} />}
    />
  );
};

export const HobbiesStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();
  return (
    <ChipListStep
      title={bn(lang, 'শখ ও আগ্রহ যোগ করুন', 'Include hobbies & interests')}
      description={bn(lang, 'সংক্ষেপে রাখুন — ৩–৫টি যথেষ্ট', 'Keep it short — three to five is plenty')}
      suggestions={HOBBY_SUGGESTIONS}
      enabled={data.hobbiesEnabled}
      onToggle={(next) => {
        update((draft) => {
          draft.hobbiesEnabled = next;
        });
        toggle('hobbies', next);
      }}
      items={data.hobbies}
      onItems={(next) =>
        update((draft) => {
          draft.hobbies = next;
        })
      }
      icon={<Heart size={16} />}
    />
  );
};

/* ------------------------------------------------- 14. Volunteer */
export const VolunteerStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  const create = (): VolunteerEntry => ({ id: uid(), organization: '', role: '', duration: '', responsibilities: [''], achievements: '' });

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'স্বেচ্ছাসেবার অভিজ্ঞতা অন্তর্ভুক্ত করুন', 'Include volunteer experience')}
        checked={data.volunteerEnabled}
        onChange={(next) => {
          update((draft) => {
            draft.volunteerEnabled = next;
          });
          toggle('volunteer', next);
        }}
      />
      {data.volunteerEnabled ? (
        <EntryEditor<VolunteerEntry>
          items={data.volunteer}
          onChange={(next) =>
            update((draft) => {
              draft.volunteer = next;
            })
          }
          create={create}
          addLabel={bn(lang, 'স্বেচ্ছাসেবা যোগ করুন', 'Add volunteer experience')}
          emptyLabel={bn(lang, 'কোনো স্বেচ্ছাসেবা যোগ করা হয়নি', 'No volunteer experience added')}
          renderSummary={(item) => ({ title: item.role || item.organization || bn(lang, 'নতুন', 'New'), subtitle: item.organization })}
          renderForm={(item, patch) => (
            <div className="field-grid">
              <Field label={bn(lang, 'প্রতিষ্ঠান', 'Organisation')} required>
                <Input value={item.organization} onChange={(e) => patch({ organization: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'ভূমিকা', 'Role')} optional>
                <Input value={item.role} onChange={(e) => patch({ role: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'সময়কাল', 'Duration')} optional>
                <Input value={item.duration} onChange={(e) => patch({ duration: e.target.value })} placeholder="2020 – 2021" />
              </Field>
              <Field label={bn(lang, 'অর্জন', 'Achievements')} optional>
                <Input value={item.achievements} onChange={(e) => patch({ achievements: e.target.value })} />
              </Field>
              <div className="span-2">
                <BulletEditor
                  label={bn(lang, 'দায়িত্ব', 'Responsibilities')}
                  values={item.responsibilities}
                  onChange={(next) => patch({ responsibilities: next })}
                />
              </div>
            </div>
          )}
        />
      ) : null}
    </div>
  );
};

/* --------------------------------------------- 15. Personal details */
export const PersonalDetailsStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const tr = useT();
  const toggle = useSectionToggle();

  const rows: { key: keyof typeof data.personalDetails; label: string; value: string }[] = useMemo(
    () => [
      { key: 'fatherName', label: bn(lang, 'পিতার নাম', "Father's name"), value: data.personal.fatherName },
      { key: 'motherName', label: bn(lang, 'মাতার নাম', "Mother's name"), value: data.personal.motherName },
      { key: 'dateOfBirth', label: bn(lang, 'জন্ম তারিখ', 'Date of birth'), value: data.personal.dateOfBirth },
      { key: 'gender', label: bn(lang, 'লিঙ্গ', 'Gender'), value: data.personal.gender },
      { key: 'nationality', label: bn(lang, 'জাতীয়তা', 'Nationality'), value: data.personal.nationality },
      { key: 'religion', label: bn(lang, 'ধর্ম', 'Religion'), value: data.personal.religion },
      { key: 'maritalStatus', label: bn(lang, 'বৈবাহিক অবস্থা', 'Marital status'), value: data.personal.maritalStatus },
      { key: 'bloodGroup', label: bn(lang, 'রক্তের গ্রুপ', 'Blood group'), value: data.personal.bloodGroup },
      { key: 'height', label: bn(lang, 'উচ্চতা', 'Height'), value: data.personal.height },
      { key: 'weight', label: bn(lang, 'ওজন', 'Weight'), value: data.personal.weight },
      { key: 'nationalId', label: bn(lang, 'জাতীয় পরিচয়পত্র', 'National ID'), value: data.personal.nationalId },
      { key: 'passportNo', label: bn(lang, 'পাসপোর্ট নম্বর', 'Passport number'), value: data.personal.passportNo },
      { key: 'presentAddress', label: bn(lang, 'বর্তমান ঠিকানা', 'Present address'), value: data.personal.presentAddress },
      { key: 'permanentAddress', label: bn(lang, 'স্থায়ী ঠিকানা', 'Permanent address'), value: data.personal.permanentAddress },
      { key: 'mobile', label: bn(lang, 'মোবাইল', 'Mobile'), value: data.personal.mobile },
      { key: 'altPhone', label: bn(lang, 'বিকল্প ফোন', 'Alternative phone'), value: data.personal.altPhone },
      { key: 'email', label: bn(lang, 'ইমেইল', 'Email'), value: data.personal.email },
      { key: 'linkedin', label: 'LinkedIn', value: data.personal.linkedin },
      { key: 'website', label: bn(lang, 'ওয়েবসাইট', 'Website'), value: data.personal.website },
    ],
    [data.personal, lang],
  );

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, '“ব্যক্তিগত তথ্য” সেকশন CV-তে দেখাও', 'Show a “Personal details” section')}
        description={bn(lang, 'শুধু নিচে চালু করা তথ্যগুলোই মুদ্রিত হবে', 'Only the rows you switch on below will be printed')}
        checked={data.personalDetailsEnabled}
        onChange={(next) => {
          update((draft) => {
            draft.personalDetailsEnabled = next;
          });
          toggle('personalDetails', next);
        }}
      />
      <Notice tone="info">
        {bn(
          lang,
          'যে তথ্যগুলো CV-তে দেওয়া প্রয়োজন নেই সেগুলো বন্ধ রাখুন। ধর্ম, রক্তের গ্রুপ, জাতীয় পরিচয়পত্র ও পাসপোর্ট সাধারণত প্রয়োজন হয় না।',
          'Leave anything unnecessary switched off. Religion, blood group, national ID and passport are rarely needed.',
        )}
      </Notice>
      <div className="card">
        <div className="card-header">
          <h3>{bn(lang, 'প্রকাশযোগ্য তথ্য', 'Publishable details')}</h3>
          <Badge tone="primary">
            {Object.values(data.personalDetails).filter(Boolean).length} / {rows.length}
          </Badge>
        </div>
        <div className="card-body col" style={{ gap: 2 }}>
          {rows.map((row) => (
            <div
              key={String(row.key)}
              className="row between"
              style={{
                gap: 'var(--sp-4)',
                padding: '9px 0',
                borderBottom: '1px solid var(--border)',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 'var(--fs-sm)', fontWeight: 560 }}>{row.label}</div>
                <div className="small faint truncate" style={{ maxWidth: 420 }}>
                  {row.value || bn(lang, '— খালি —', '— empty —')}
                </div>
              </div>
              <Switch
                checked={data.personalDetails[row.key]}
                onChange={(next) =>
                  update((draft) => {
                    draft.personalDetails[row.key] = next;
                  })
                }
                disabled={!row.value}
              />
            </div>
          ))}
        </div>
      </div>
      <p className="small faint" style={{ margin: 0 }}>
        {tr('wiz.saveDraft')}
      </p>
    </div>
  );
};

/* ------------------------------------------------- 16. References */
export const ReferencesStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();
  const pushToast = useWorkspace((s) => s.pushToast);

  const create = (): ReferenceEntry => ({
    id: uid(),
    name: '',
    designation: '',
    organization: '',
    relationship: '',
    phone: '',
    email: '',
    address: '',
    referenceType: 'Professional',
    additionalDetails: '',
    signatureDataUrl: null,
    consentGiven: false,
  });

  const attachSignature = async (id: string) => {
    const result = await getBridge().openImage();
    if (result.cancelled || !result.dataUrl) return;
    update((draft) => {
      const target = draft.references.find((r) => r.id === id);
      if (target) target.signatureDataUrl = result.dataUrl;
    });
    pushToast({ kind: 'success', title: bn(lang, 'স্বাক্ষর সংযুক্ত হয়েছে', 'Signature attached') });
  };

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'রেফারেন্স অন্তর্ভুক্ত করুন', 'Include references')}
        description={bn(lang, 'প্রতিটি রেফারেন্সের অনুমতি নিয়ে তথ্য দিন', 'Add each reference only with their consent')}
        checked={data.referencesEnabled}
        onChange={(next) => {
          update((draft) => {
            draft.referencesEnabled = next;
          });
          toggle('references', next);
        }}
      />
      {data.referencesEnabled ? (
        <EntryEditor<ReferenceEntry>
          items={data.references}
          onChange={(next) =>
            update((draft) => {
              draft.references = next;
            })
          }
          create={create}
          addLabel={bn(lang, 'রেফারেন্স যোগ করুন', 'Add reference')}
          emptyLabel={bn(lang, 'কোনো রেফারেন্স যোগ করা হয়নি', 'No references added')}
          renderSummary={(item) => ({ title: item.name || bn(lang, 'নতুন রেফারেন্স', 'New reference'), subtitle: item.organization })}
          renderForm={(item, patch) => (
            <div className="field-grid">
              <Field label={bn(lang, 'নাম', 'Reference name')} required>
                <Input value={item.name} onChange={(e) => patch({ name: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'পদবি', 'Designation')} optional>
                <Input value={item.designation} onChange={(e) => patch({ designation: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'প্রতিষ্ঠান', 'Organisation')} optional>
                <Input value={item.organization} onChange={(e) => patch({ organization: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'সম্পর্ক', 'Relationship')} optional>
                <Input value={item.relationship} onChange={(e) => patch({ relationship: e.target.value })} placeholder="Former supervisor" />
              </Field>
              <Field label={bn(lang, 'ফোন', 'Phone')} optional>
                <Input value={item.phone} onChange={(e) => patch({ phone: e.target.value })} inputMode="tel" />
              </Field>
              <Field label={bn(lang, 'ইমেইল', 'Email')} optional>
                <Input value={item.email} onChange={(e) => patch({ email: e.target.value })} type="email" />
              </Field>
              <Field label={bn(lang, 'রেফারেন্সের ধরন', 'Reference type')} optional>
                <Select value={item.referenceType} onChange={(e) => patch({ referenceType: e.target.value })}>
                  <option value="Professional">Professional</option>
                  <option value="Academic">Academic</option>
                  <option value="Personal">Personal</option>
                </Select>
              </Field>
              <Field label={bn(lang, 'ঠিকানা', 'Address')} optional>
                <Input value={item.address} onChange={(e) => patch({ address: e.target.value })} />
              </Field>
              <Field label={bn(lang, 'অতিরিক্ত তথ্য', 'Additional details')} optional className="span-2">
                <Input value={item.additionalDetails} onChange={(e) => patch({ additionalDetails: e.target.value })} />
              </Field>
              <div className="span-2 row wrap" style={{ gap: 'var(--sp-4)' }}>
                <Checkbox
                  checked={item.consentGiven}
                  onChange={(next) => patch({ consentGiven: next })}
                  label={bn(lang, 'রেফারেন্সদাতা তথ্য প্রকাশে সম্মত', 'The reference has consented to share these details')}
                />
                <Button size="sm" icon={<PenLine size={13} />} onClick={() => void attachSignature(item.id)}>
                  {item.signatureDataUrl
                    ? bn(lang, 'স্বাক্ষর পরিবর্তন', 'Replace signature')
                    : bn(lang, 'স্বাক্ষর সংযুক্ত করুন', 'Attach signature')}
                </Button>
                {item.signatureDataUrl ? (
                  <img src={item.signatureDataUrl} alt="Reference signature" style={{ height: 32, objectFit: 'contain' }} />
                ) : null}
              </div>
            </div>
          )}
        />
      ) : null}
    </div>
  );
};

/* ------------------------------------------------- 17. Declaration */
export const DeclarationStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'ঘোষণাপত্র অন্তর্ভুক্ত করুন', 'Include a declaration')}
        checked={data.declaration.enabled}
        onChange={(next) => {
          update((draft) => {
            draft.declaration.enabled = next;
          });
          toggle('declaration', next);
        }}
      />
      {data.declaration.enabled ? (
        <>
          <div className="col" style={{ gap: 'var(--sp-2)' }}>
            <span className="field-label">{bn(lang, 'প্রস্তুত ঘোষণাপত্র', 'Ready declarations')}</span>
            {DECLARATION_PRESETS.map((preset) => (
              <button
                key={preset.id}
                className="card card-pad"
                style={{ textAlign: 'left', cursor: 'pointer', font: 'inherit', color: 'inherit' }}
                onClick={() =>
                  update((draft) => {
                    draft.declaration.text = preset.text;
                    draft.declaration.language = preset.language;
                  })
                }
              >
                <div className="row between" style={{ marginBottom: 6 }}>
                  <span className="small" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    {preset.label}
                  </span>
                  <Badge>{preset.language === 'bn' ? 'বাংলা' : 'English'}</Badge>
                </div>
                <p style={{ margin: 0, fontSize: 'var(--fs-sm)', lineHeight: 1.6 }}>{preset.text}</p>
              </button>
            ))}
          </div>
          <Field label={bn(lang, 'ঘোষণাপত্র (সম্পাদনযোগ্য)', 'Declaration (editable)')}>
            <Textarea
              rows={4}
              value={data.declaration.text}
              onChange={(e) =>
                update((draft) => {
                  draft.declaration.text = e.target.value;
                })
              }
            />
          </Field>
          <div className="field-grid">
            <Field label={bn(lang, 'স্থান', 'Place')} optional>
              <Input
                value={data.declaration.place}
                onChange={(e) =>
                  update((draft) => {
                    draft.declaration.place = e.target.value;
                  })
                }
                placeholder="Dhaka"
              />
            </Field>
            <Field label={bn(lang, 'তারিখ', 'Date')} optional>
              <Input
                type="date"
                value={data.declaration.date}
                onChange={(e) =>
                  update((draft) => {
                    draft.declaration.date = e.target.value;
                  })
                }
              />
            </Field>
          </div>
        </>
      ) : null}
    </div>
  );
};

/* --------------------------------------------------- 18. Signature */
export const SignatureStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();
  const pushToast = useWorkspace((s) => s.pushToast);

  const upload = async () => {
    const result = await getBridge().openImage();
    if (result.cancelled) return;
    if (!result.dataUrl) {
      pushToast({ kind: 'error', title: bn(lang, 'ছবি পড়া যায়নি', 'Could not read the image') });
      return;
    }
    update((draft) => {
      draft.signature.dataUrl = result.dataUrl;
      draft.signature.enabled = true;
    });
    toggle('signature', true);
  };

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <SwitchRow
        title={bn(lang, 'স্বাক্ষর অন্তর্ভুক্ত করুন', 'Include your signature')}
        description={bn(lang, 'কোনো কৃত্রিম স্বাক্ষর তৈরি করা হয় না — শুধু আপনার আপলোড করা ছবি ব্যবহৃত হবে', 'No signature is ever generated — only the image you upload is used')}
        checked={data.signature.enabled}
        onChange={(next) => {
          update((draft) => {
            draft.signature.enabled = next;
          });
          toggle('signature', next);
        }}
      />
      {data.signature.enabled ? (
        <div className="grid" style={{ gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.3fr)', gap: 'var(--sp-5)' }}>
          <div className="col" style={{ gap: 'var(--sp-3)' }}>
            <div
              className="card"
              style={{ minHeight: 150, display: 'grid', placeItems: 'center', background: 'var(--bg-subtle)' }}
            >
              {data.signature.dataUrl ? (
                <img
                  src={data.signature.dataUrl}
                  alt="Signature preview"
                  style={{ maxWidth: '80%', maxHeight: 110, objectFit: 'contain' }}
                />
              ) : (
                <span className="small muted">{bn(lang, 'স্বাক্ষরের ছবি নেই', 'No signature image yet')}</span>
              )}
            </div>
            <Button icon={<PenLine size={15} />} onClick={upload} block variant="primary">
              {data.signature.dataUrl ? bn(lang, 'স্বাক্ষর পরিবর্তন', 'Replace signature') : bn(lang, 'স্বাক্ষর আপলোড', 'Upload signature')}
            </Button>
            {data.signature.dataUrl ? (
              <Button
                variant="danger"
                icon={<Trash2 size={14} />}
                onClick={() =>
                  update((draft) => {
                    draft.signature.dataUrl = null;
                    draft.signature.enabled = false;
                  })
                }
                block
              >
                {bn(lang, 'স্বাক্ষর সরান', 'Remove signature')}
              </Button>
            ) : null}
          </div>
          <div className="col" style={{ gap: 'var(--sp-4)' }}>
            <Field label={bn(lang, 'আকার', 'Size')}>
              <div className="input-row">
                <input
                  type="range"
                  min={0.6}
                  max={1.8}
                  step={0.05}
                  value={data.signature.scale}
                  onChange={(e) =>
                    update((draft) => {
                      draft.signature.scale = Number(e.target.value);
                    })
                  }
                  style={{ flex: 1, accentColor: 'var(--primary)' }}
                  aria-label="Signature size"
                />
                <span className="small mono faint">{data.signature.scale.toFixed(2)}×</span>
              </div>
            </Field>
            <Field label={bn(lang, 'অবস্থান', 'Alignment')}>
              <Select
                value={data.signature.align}
                onChange={(e) =>
                  update((draft) => {
                    draft.signature.align = e.target.value as 'left' | 'center' | 'right';
                  })
                }
              >
                <option value="left">{bn(lang, 'বাম', 'Left')}</option>
                <option value="center">{bn(lang, 'মধ্য', 'Centre')}</option>
                <option value="right">{bn(lang, 'ডান', 'Right')}</option>
              </Select>
            </Field>
          </div>
        </div>
      ) : null}
    </div>
  );
};

/* --------------------------------------------- 19. Additional info */
export const AdditionalStep: React.FC = () => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const toggle = useSectionToggle();

  const presets = [
    'Publications',
    'Research',
    'Internship',
    'Professional Membership',
    'Licenses',
    'Seminars',
    'Workshops',
    'Conferences',
    'Extracurricular Activities',
  ];

  const addSection = (title: string) => {
    const section: CustomSectionEntry = {
      id: uid(),
      title,
      items: [{ id: uid(), heading: '', subheading: '', period: '', body: '' }],
      enabled: true,
    };
    update((draft) => {
      draft.customSections.push(section);
    });
    toggle('custom', true);
  };

  return (
    <div className="col" style={{ gap: 'var(--sp-4)' }}>
      <div className="card card-pad col" style={{ gap: 'var(--sp-3)' }}>
        <span className="field-label">{bn(lang, 'প্রস্তুত সেকশন যোগ করুন', 'Add a prepared section')}</span>
        <div className="row wrap" style={{ gap: 6 }}>
          {presets.map((preset) => (
            <button
              key={preset}
              className="badge"
              style={{ cursor: 'pointer', padding: '6px 11px', fontSize: 'var(--fs-sm)' }}
              onClick={() => addSection(preset)}
            >
              <Plus size={12} /> {preset}
            </button>
          ))}
          <button
            className="badge badge-primary"
            style={{ cursor: 'pointer', padding: '6px 11px', fontSize: 'var(--fs-sm)' }}
            onClick={() => addSection(bn(lang, 'কাস্টম সেকশন', 'Custom section'))}
          >
            <Plus size={12} /> {bn(lang, 'নিজের সেকশন', 'Custom section')}
          </button>
        </div>
      </div>

      {data.customSections.length === 0 ? (
        <Notice tone="info">
          {bn(lang, 'কোনো অতিরিক্ত সেকশন যোগ করা হয়নি — CV-তে কিছুই দেখানো হবে না।', 'No additional sections yet — nothing extra will appear on the CV.')}
        </Notice>
      ) : null}

      {data.customSections.map((section) => (
        <div className="card" key={section.id}>
          <div className="card-header">
            <Input
              value={section.title}
              onChange={(e) =>
                update((draft) => {
                  const target = draft.customSections.find((c) => c.id === section.id);
                  if (target) target.title = e.target.value;
                })
              }
              style={{ maxWidth: 320, fontWeight: 600 }}
              aria-label="Section title"
            />
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <Switch
                checked={section.enabled}
                onChange={(next) =>
                  update((draft) => {
                    const target = draft.customSections.find((c) => c.id === section.id);
                    if (target) target.enabled = next;
                  })
                }
              />
              <IconButton
                label="Delete section"
                size="sm"
                onClick={() =>
                  update((draft) => {
                    draft.customSections = draft.customSections.filter((c) => c.id !== section.id);
                  })
                }
              >
                <Trash2 size={14} />
              </IconButton>
            </div>
          </div>
          <div className="card-body col" style={{ gap: 'var(--sp-3)' }}>
            {section.items.map((item, index) => (
              <div key={item.id} className="card card-pad" style={{ background: 'var(--bg-subtle)' }}>
                <div className="field-grid">
                  <Field label={bn(lang, 'শিরোনাম', 'Heading')}>
                    <Input
                      value={item.heading}
                      onChange={(e) =>
                        update((draft) => {
                          const target = draft.customSections.find((c) => c.id === section.id);
                          if (target) target.items[index].heading = e.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label={bn(lang, 'উপ-শিরোনাম', 'Subheading')} optional>
                    <Input
                      value={item.subheading}
                      onChange={(e) =>
                        update((draft) => {
                          const target = draft.customSections.find((c) => c.id === section.id);
                          if (target) target.items[index].subheading = e.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label={bn(lang, 'সময়কাল / তারিখ', 'Period / date')} optional>
                    <Input
                      value={item.period}
                      onChange={(e) =>
                        update((draft) => {
                          const target = draft.customSections.find((c) => c.id === section.id);
                          if (target) target.items[index].period = e.target.value;
                        })
                      }
                    />
                  </Field>
                  <Field label={bn(lang, 'বিবরণ', 'Description')} optional className="span-2">
                    <Textarea
                      rows={2}
                      value={item.body}
                      onChange={(e) =>
                        update((draft) => {
                          const target = draft.customSections.find((c) => c.id === section.id);
                          if (target) target.items[index].body = e.target.value;
                        })
                      }
                    />
                  </Field>
                </div>
                <div className="row end" style={{ marginTop: 8 }}>
                  <Button
                    size="sm"
                    variant="danger"
                    icon={<Trash2 size={13} />}
                    onClick={() =>
                      update((draft) => {
                        const target = draft.customSections.find((c) => c.id === section.id);
                        if (target && target.items.length > 1) target.items.splice(index, 1);
                      })
                    }
                  >
                    {bn(lang, 'সরান', 'Remove')}
                  </Button>
                </div>
              </div>
            ))}
            <div>
              <Button
                size="sm"
                icon={<Plus size={13} />}
                onClick={() =>
                  update((draft) => {
                    const target = draft.customSections.find((c) => c.id === section.id);
                    target?.items.push({ id: uid(), heading: '', subheading: '', period: '', body: '' });
                  })
                }
              >
                {bn(lang, 'আইটেম যোগ করুন', 'Add item')}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const stepIcons = {
  objective: <Lightbulb size={16} />,
  education: <GraduationCap size={16} />,
  experience: <Briefcase size={16} />,
  skills: <BookOpenCheck size={16} />,
  languages: <LanguagesIcon size={16} />,
  training: <Award size={16} />,
  projects: <FolderKanban size={16} />,
  achievements: <Award size={16} />,
  strengths: <Sparkles size={16} />,
  hobbies: <Heart size={16} />,
  volunteer: <Users2 size={16} />,
  details: <UserCheck size={16} />,
  references: <Users2 size={16} />,
  declaration: <PenLine size={16} />,
  signature: <PenLine size={16} />,
  additional: <Plus size={16} />,
};
