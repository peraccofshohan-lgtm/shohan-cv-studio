/**
 * Content editor inside the studio: edits the same CV model as the wizard so
 * the operator can refine copy without walking the whole wizard again.
 */
import React from 'react';
import { Plus } from 'lucide-react';
import { Button, Field, Input, Textarea, useLang } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import type { SectionId } from '@/types/cv';
import { BulletEditor } from '@/features/cv-wizard/EntryEditor';

export const ContentPanel: React.FC<{ section: SectionId | 'personal' }> = ({ section }) => {
  const data = useWorkspace((s) => s.current!.data);
  const update = useWorkspace((s) => s.updateData);
  const lang = useLang();
  const bn = (b: string, e: string) => (lang === 'bn' ? b : e);

  if (section === 'personal') {
    return (
      <div className="col" style={{ gap: 'var(--sp-3)' }}>
        <span className="small" style={{ fontWeight: 620 }}>
          {bn('ব্যক্তিগত তথ্য', 'Personal information')}
        </span>
        <Field label={bn('পূর্ণ নাম', 'Full name')}>
          <Input
            value={data.personal.fullName}
            onChange={(e) =>
              update((draft) => {
                draft.personal.fullName = e.target.value;
              })
            }
          />
        </Field>
        <Field label={bn('পদবি', 'Professional title')}>
          <Input
            value={data.personal.headline}
            onChange={(e) =>
              update((draft) => {
                draft.personal.headline = e.target.value;
              })
            }
          />
        </Field>
        <Field label={bn('মোবাইল', 'Mobile')}>
          <Input
            value={data.personal.mobile}
            onChange={(e) =>
              update((draft) => {
                draft.personal.mobile = e.target.value;
              })
            }
          />
        </Field>
        <Field label={bn('ইমেইল', 'Email')}>
          <Input
            value={data.personal.email}
            onChange={(e) =>
              update((draft) => {
                draft.personal.email = e.target.value;
              })
            }
          />
        </Field>
        <Field label={bn('বর্তমান ঠিকানা', 'Present address')}>
          <Input
            value={data.personal.presentAddress}
            onChange={(e) =>
              update((draft) => {
                draft.personal.presentAddress = e.target.value;
              })
            }
          />
        </Field>
        <Field label="LinkedIn">
          <Input
            value={data.personal.linkedin}
            onChange={(e) =>
              update((draft) => {
                draft.personal.linkedin = e.target.value;
              })
            }
          />
        </Field>
      </div>
    );
  }

  switch (section) {
    case 'careerObjective':
      return (
        <div className="col" style={{ gap: 'var(--sp-3)' }}>
          <span className="small" style={{ fontWeight: 620 }}>
            {bn('ক্যারিয়ার অবজেক্টিভ', 'Career objective')}
          </span>
          <Textarea
            rows={8}
            value={data.careerObjective.text}
            onChange={(e) =>
              update((draft) => {
                draft.careerObjective.text = e.target.value;
              })
            }
          />
        </div>
      );
    case 'careerInterests':
      return (
        <div className="col" style={{ gap: 'var(--sp-3)' }}>
          <span className="small" style={{ fontWeight: 620 }}>
            {bn('ক্যারিয়ার আগ্রহ', 'Career interests')}
          </span>
          <Textarea
            rows={4}
            value={data.careerInterests.selected.join(', ')}
            onChange={(e) =>
              update((draft) => {
                draft.careerInterests.selected = e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean);
              })
            }
          />
          <span className="field-hint">{bn('কমা দিয়ে আলাদা করুন', 'Separate with commas')}</span>
        </div>
      );
    case 'education':
      return (
        <div className="col" style={{ gap: 'var(--sp-3)' }}>
          {data.education.map((item) => (
            <div key={item.id} className="card card-pad col" style={{ gap: 'var(--sp-2)' }}>
              <Field label={bn('ডিগ্রি', 'Degree')}>
                <Input
                  value={item.degree}
                  onChange={(e) =>
                    update((draft) => {
                      const t = draft.education.find((x) => x.id === item.id);
                      if (t) t.degree = e.target.value;
                    })
                  }
                />
              </Field>
              <Field label={bn('প্রতিষ্ঠান', 'Institution')}>
                <Input
                  value={item.institution}
                  onChange={(e) =>
                    update((draft) => {
                      const t = draft.education.find((x) => x.id === item.id);
                      if (t) t.institution = e.target.value;
                    })
                  }
                />
              </Field>
              <div className="field-grid">
                <Field label={bn('পাসের সাল', 'Year')}>
                  <Input
                    value={item.passingYear}
                    onChange={(e) =>
                      update((draft) => {
                        const t = draft.education.find((x) => x.id === item.id);
                        if (t) t.passingYear = e.target.value;
                      })
                    }
                  />
                </Field>
                <Field label="GPA">
                  <Input
                    value={item.gpa}
                    onChange={(e) =>
                      update((draft) => {
                        const t = draft.education.find((x) => x.id === item.id);
                        if (t) t.gpa = e.target.value;
                      })
                    }
                  />
                </Field>
              </div>
            </div>
          ))}
          <Button
            size="sm"
            icon={<Plus size={13} />}
            onClick={() => useWorkspace.getState().updateData(() => undefined)}
          >
            {bn('উইজার্ডে সম্পাদনা করুন', 'Edit in wizard')}
          </Button>
        </div>
      );
    case 'experience':
      return (
        <div className="col" style={{ gap: 'var(--sp-3)' }}>
          {data.experience.map((item) => (
            <div key={item.id} className="card card-pad col" style={{ gap: 'var(--sp-2)' }}>
              <Field label={bn('পদবি', 'Job title')}>
                <Input
                  value={item.jobTitle}
                  onChange={(e) =>
                    update((draft) => {
                      const t = draft.experience.find((x) => x.id === item.id);
                      if (t) t.jobTitle = e.target.value;
                    })
                  }
                />
              </Field>
              <Field label={bn('প্রতিষ্ঠান', 'Company')}>
                <Input
                  value={item.company}
                  onChange={(e) =>
                    update((draft) => {
                      const t = draft.experience.find((x) => x.id === item.id);
                      if (t) t.company = e.target.value;
                    })
                  }
                />
              </Field>
              <BulletEditor
                label={bn('দায়িত্ব', 'Responsibilities')}
                values={item.responsibilities}
                onChange={(next) =>
                  update((draft) => {
                    const t = draft.experience.find((x) => x.id === item.id);
                    if (t) t.responsibilities = next;
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    case 'skills':
      return (
        <div className="col" style={{ gap: 'var(--sp-2)' }}>
          {data.skills.map((skill) => (
            <div key={skill.id} className="row" style={{ gap: 6 }}>
              <Input
                value={skill.name}
                onChange={(e) =>
                  update((draft) => {
                    const t = draft.skills.find((x) => x.id === skill.id);
                    if (t) t.name = e.target.value;
                  })
                }
                style={{ flex: 1 }}
              />
              <Input
                value={skill.category}
                onChange={(e) =>
                  update((draft) => {
                    const t = draft.skills.find((x) => x.id === skill.id);
                    if (t) t.category = e.target.value;
                  })
                }
                style={{ width: 120 }}
              />
            </div>
          ))}
        </div>
      );
    case 'languages':
      return (
        <div className="col" style={{ gap: 'var(--sp-2)' }}>
          {data.languages.map((item) => (
            <div key={item.id} className="row" style={{ gap: 6 }}>
              <Input
                value={item.name}
                onChange={(e) =>
                  update((draft) => {
                    const t = draft.languages.find((x) => x.id === item.id);
                    if (t) t.name = e.target.value;
                  })
                }
              />
            </div>
          ))}
        </div>
      );
    default:
      return (
        <div className="notice info">
          <div>
            {bn(
              'এই সেকশনের সম্পূর্ণ সম্পাদনা উইজার্ডে উপলব্ধ। এখানে সেকশনটি চালু/বন্ধ ও ক্রম পরিবর্তন করতে পারবেন।',
              'Full editing for this section is available in the wizard. Here you can toggle visibility and reorder it.',
            )}
          </div>
        </div>
      );
  }
};
