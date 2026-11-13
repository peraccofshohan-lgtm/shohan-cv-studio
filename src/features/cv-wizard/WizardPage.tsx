/**
 * CV creation wizard — 19 guided steps with progress, skip, autosave and a
 * live A4 preview that updates as the operator types.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import { ArrowLeft, ArrowRight, Check, CircleDashed, Eye, FileCheck2, LayoutTemplate, Save } from 'lucide-react';
import { Badge, Button, Notice, ProgressBar, useLang, useT } from '@/components/ui';
import { useUI } from '@/store/ui';
import { useWorkspace } from '@/store/workspace';
import { TOTAL_STEPS, WIZARD_STEPS } from './steps';
import { PersonalStep } from './steps/PersonalStep';
import { PhotoStep } from './steps/PhotoStep';
import {
  AchievementsStep,
  AdditionalStep,
  DeclarationStep,
  EducationStep,
  ExperienceStep,
  HobbiesStep,
  InterestsStep,
  LanguagesStep,
  ObjectiveStep,
  PersonalDetailsStep,
  ProjectsStep,
  ReferencesStep,
  SignatureStep,
  SkillsStep,
  StrengthsStep,
  TrainingStep,
  VolunteerStep,
} from './steps/ContentSteps';
import { CvDocument } from '@/document/CvDocument';
import { buildDocumentCss } from '@/document/styles';
import { resolveDesign } from '@/templates/catalog';
import { embeddedFontCss } from '@/assets/fonts';
import { printableSections } from '@/lib/sections';

export const WizardPage: React.FC<{ step: number }> = ({ step }) => {
  const { current, createNewProject, saveNow, dirty } = useWorkspace();
  const { navigate, language, setWizardStep } = useUI();
  const tr = useT();
  const scrollRef = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  const safeStep = Math.max(0, Math.min(TOTAL_STEPS - 1, step));
  const definition = WIZARD_STEPS[safeStep];

  // Create a working project the first time the wizard is opened.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    if (!current) void createNewProject({ title: 'Untitled CV' });
  }, [current, createNewProject]);

  useEffect(() => {
    setWizardStep(safeStep);
    scrollRef.current?.scrollTo({ top: 0 });
  }, [safeStep, setWizardStep]);

  const data = current?.data;
  const design = useMemo(
    () => (current ? resolveDesign(current.templateId, current.design) : resolveDesign('classic-professional', {})),
    [current],
  );
  const css = useMemo(
    () => buildDocumentCss({ design, fontCss: embeddedFontCss(), mode: 'screen' }),
    [design],
  );

  const completeness = useMemo(() => {
    if (!data) return 0;
    const checks = [
      !!data.personal.fullName.trim(),
      !!data.personal.mobile.trim() || !!data.personal.email.trim(),
      !!data.careerObjective.text.trim(),
      data.education.some((e) => e.degree.trim() && e.institution.trim()),
      !data.hasExperience || data.experience.some((e) => e.jobTitle.trim() && e.company.trim()),
      data.skills.length > 0,
      data.languages.length > 0,
    ];
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  }, [data]);

  const go = (next: number) => {
    const target = Math.max(0, Math.min(TOTAL_STEPS - 1, next));
    navigate({ name: 'wizard', step: target });
  };

  const finish = async () => {
    await saveNow();
    navigate({ name: 'gallery' });
  };

  const renderStep = () => {
    if (!data) return null;
    switch (definition.id) {
      case 'personal':
        return <PersonalStep />;
      case 'photo':
        return <PhotoStep />;
      case 'objective':
        return <ObjectiveStep />;
      case 'interests':
        return <InterestsStep />;
      case 'education':
        return <EducationStep />;
      case 'experience':
        return <ExperienceStep />;
      case 'skills':
        return <SkillsStep />;
      case 'languages':
        return <LanguagesStep />;
      case 'training':
        return <TrainingStep />;
      case 'projects':
        return <ProjectsStep />;
      case 'achievements':
        return <AchievementsStep />;
      case 'strengths':
        return <StrengthsStep />;
      case 'hobbies':
        return <HobbiesStep />;
      case 'volunteer':
        return <VolunteerStep />;
      case 'details':
        return <PersonalDetailsStep />;
      case 'references':
        return <ReferencesStep />;
      case 'declaration':
        return <DeclarationStep />;
      case 'signature':
        return <SignatureStep />;
      case 'additional':
        return <AdditionalStep />;
      default:
        return null;
    }
  };

  const sectionCount = data ? printableSections(data, { language }).length : 0;

  return (
    <div className="wizard">
      <style>{`${css}
      .wizard { display: grid; grid-template-columns: 264px minmax(0,1fr) minmax(340px, 36%); height: 100%; min-height: 0; background: var(--bg); }
      .wizard-steps { background: var(--bg-elevated); border-right: 1px solid var(--border); overflow-y: auto; padding: var(--sp-4) var(--sp-3); display: flex; flex-direction: column; gap: 2px; }
      .wizard-form { overflow-y: auto; padding: var(--sp-5) var(--sp-6); }
      .wizard-preview { background: var(--bg-sunken); border-left: 1px solid var(--border); overflow: auto; padding: var(--sp-4); }
      .wizard-step-item { display: flex; align-items: center; gap: 10px; width: 100%; padding: 7px 9px; border: 0; border-radius: var(--radius-sm); background: transparent; color: var(--text-muted); font: inherit; font-size: var(--fs-sm); text-align: left; cursor: pointer; }
      .wizard-step-item:hover { background: var(--bg-hover); color: var(--text); }
      .wizard-step-item[data-active='true'] { background: var(--primary-soft); color: var(--primary); font-weight: 600; }
      .wizard-step-item[data-done='true'] .wizard-step-dot { background: var(--success); border-color: var(--success); color: #fff; }
      .wizard-step-dot { width: 19px; height: 19px; flex: 0 0 19px; border-radius: 50%; border: 1.5px solid var(--border-strong); display: grid; place-items: center; font-size: 9.5px; font-weight: 700; color: var(--text-faint); background: var(--bg-elevated); }
      .wizard-step-item[data-active='true'] .wizard-step-dot { border-color: var(--primary); background: var(--primary); color: var(--primary-contrast); }
      .wizard-step-label { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .wizard-preview .cv-paper { transform-origin: top center; box-shadow: 0 6px 20px rgba(16,30,50,.14); }
      @media (max-width: 1280px) { .wizard { grid-template-columns: 220px minmax(0,1fr); } .wizard-preview { display: none; } }
    `}</style>

      <aside className="wizard-steps" aria-label={tr('wiz.title')}>
        <div style={{ padding: '0 9px var(--sp-3)' }}>
          <div className="row between" style={{ marginBottom: 8 }}>
            <span className="small" style={{ fontWeight: 620 }}>
              {tr('wiz.title')}
            </span>
            <Badge tone="primary">
              {safeStep + 1}/{TOTAL_STEPS}
            </Badge>
          </div>
          <ProgressBar value={((safeStep + 1) / TOTAL_STEPS) * 100} label="Wizard progress" />
        </div>
        {WIZARD_STEPS.map((item, index) => (
          <button
            key={item.id}
            className="wizard-step-item"
            data-active={index === safeStep}
            data-done={index < safeStep}
            onClick={() => go(index)}
            aria-current={index === safeStep ? 'step' : undefined}
          >
            <span className="wizard-step-dot">
              {index < safeStep ? <Check size={11} /> : index === safeStep ? <CircleDashed size={10} /> : index + 1}
            </span>
            <span className="wizard-step-label">{language === 'bn' ? item.titleBn : item.titleEn}</span>
          </button>
        ))}
      </aside>

      <section className="wizard-form" ref={scrollRef}>
        <div style={{ maxWidth: 760 }}>
          <div className="col" style={{ gap: 'var(--sp-2)', marginBottom: 'var(--sp-5)' }}>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <Badge tone="primary">
                {tr('wiz.step')} {safeStep + 1} {tr('wiz.of')} {TOTAL_STEPS}
              </Badge>
              {definition.optional ? <Badge>{tr('common.optional')}</Badge> : <Badge tone="warning">{tr('common.required')}</Badge>}
            </div>
            <h2 style={{ margin: 0, fontSize: 'var(--fs-xl)', fontWeight: 650, letterSpacing: '-0.015em' }}>
              {language === 'bn' ? definition.titleBn : definition.titleEn}
            </h2>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 'var(--fs-sm)', maxWidth: '62ch', lineHeight: 1.6 }}>
              {language === 'bn' ? definition.descBn : definition.descEn}
            </p>
          </div>

          {!current ? (
            <Notice tone="info">{tr('common.loading')}</Notice>
          ) : (
            <>
              {safeStep === 0 ? (
                <div className="card card-pad" style={{ marginBottom: 'var(--sp-4)' }}>
                  <div className="field-grid">
                    <div className="field">
                      <label className="field-label" htmlFor="projectTitle">
                        {language === 'bn' ? 'প্রকল্পের নাম' : 'Project name'}
                      </label>
                      <input
                        id="projectTitle"
                        className="input"
                        value={current.title}
                        onChange={(e) => useWorkspace.getState().setTitle(e.target.value)}
                        placeholder={language === 'bn' ? 'যেমন: রফিক — ব্যাংক জব সিভি' : 'e.g. Rafiq — Bank job CV'}
                        maxLength={80}
                      />
                      <span className="field-hint">
                        {language === 'bn'
                          ? 'এই নামটি শুধু আপনার তালিকায় দেখানোর জন্য — CV-তে মুদ্রণ হবে না।'
                          : 'Only used in your project list — it is not printed on the CV.'}
                      </span>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="cvLanguage">
                        {language === 'bn' ? 'CV-এর ভাষা' : 'CV language'}
                      </label>
                      <select
                        id="cvLanguage"
                        className="select"
                        value={current.data.language}
                        onChange={(e) =>
                          useWorkspace.getState().updateData((draft) => {
                            draft.language = e.target.value as typeof draft.language;
                          })
                        }
                      >
                        <option value="en">English</option>
                        <option value="bn">বাংলা</option>
                        <option value="mixed">Bangla + English</option>
                      </select>
                      <span className="field-hint">
                        {language === 'bn'
                          ? 'শিরোনাম ও তারিখ এই ভাষায় মুদ্রিত হবে।'
                          : 'Section headings and dates are printed in this language.'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : null}

              {renderStep()}
            </>
          )}

          <div
            className="row between"
            style={{
              marginTop: 'var(--sp-6)',
              paddingTop: 'var(--sp-4)',
              borderTop: '1px solid var(--border)',
              gap: 'var(--sp-3)',
              flexWrap: 'wrap',
            }}
          >
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              <Button icon={<ArrowLeft size={15} />} onClick={() => go(safeStep - 1)} disabled={safeStep === 0}>
                {tr('common.back')}
              </Button>
              <Button icon={<Save size={15} />} onClick={() => void saveNow()} variant="ghost">
                {tr('wiz.saveDraft')}
                {dirty ? ' •' : ''}
              </Button>
            </div>
            <div className="row" style={{ gap: 'var(--sp-2)' }}>
              {definition.optional ? (
                <Button variant="ghost" onClick={() => go(safeStep + 1)}>
                  {tr('common.skip')}
                </Button>
              ) : null}
              {safeStep === TOTAL_STEPS - 1 ? (
                <Button variant="primary" icon={<FileCheck2 size={15} />} onClick={() => void finish()}>
                  {tr('wiz.chooseTemplate')}
                </Button>
              ) : (
                <Button variant="primary" icon={<ArrowRight size={15} />} onClick={() => go(safeStep + 1)}>
                  {tr('common.next')}
                </Button>
              )}
            </div>
          </div>

          <div className="row" style={{ marginTop: 'var(--sp-4)', gap: 'var(--sp-3)', flexWrap: 'wrap' }}>
            <span className="small faint">
              {language === 'bn' ? 'সম্পূর্ণতা' : 'Completeness'} {completeness}% · {sectionCount}{' '}
              {language === 'bn' ? 'সেকশন প্রস্তুত' : 'sections ready'}
            </span>
            <span className="spacer" />
            <Button size="sm" variant="ghost" icon={<LayoutTemplate size={14} />} onClick={() => void finish()}>
              {tr('wiz.chooseTemplate')}
            </Button>
          </div>
        </div>
      </section>

      <aside className="wizard-preview" aria-label="Live preview">
        <div className="row between" style={{ marginBottom: 'var(--sp-3)' }}>
          <span className="small" style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={14} /> {tr('common.preview')} · A4
          </span>
          <Badge>{design.template.name}</Badge>
        </div>
        {current ? (
          <div
            style={{
              transform: 'scale(var(--wiz-zoom, 0.78))',
              transformOrigin: 'top left',
              width: 'calc(210mm * var(--wiz-zoom, 0.78))',
              height: 'calc(297mm * var(--wiz-zoom, 0.78) * 1.02)',
            }}
          >
            <CvDocument data={current.data} design={design} language={language} />
          </div>
        ) : null}
      </aside>
    </div>
  );
};
