/**
 * Reports panel — layout diagnostics, ATS suitability and the quality checklist
 * (Parts 3 and 7.4–7.6).
 *
 * Everything here is advisory. Nothing blocks an export: the operator is told
 * what a recruiter or an ATS parser would likely notice, and decides.
 */
import React, { useMemo } from 'react';
import type { CVData, LayoutDiagnostic } from '@/types/cv';
import { useWorkspace } from '@/store/workspace';
import { useLang, Badge, Notice } from '@/components/ui';
import { PanelSection } from '@/components/studioControls';
import { printableSections } from '@/lib/sections';
import { type LayoutReport } from '@/lib/layoutReport';
import { analyseAts } from '@/lib/atsCheck';

const levelTone = (level: LayoutDiagnostic['level']): 'info' | 'warning' | 'danger' =>
  level === 'error' ? 'danger' : level === 'warning' ? 'warning' : 'info';

export const ReportsPanel: React.FC<{ report: LayoutReport; data: CVData; templateName: string }> = ({
  report,
  data,
  templateName,
}) => {
  const lang = useLang();
  const bn = (a: string, b: string) => (lang === 'bn' ? b : a);
  const design = useWorkspace((s) => s.current?.design);
  const ats = useMemo(
    () => analyseAts(data, printableSections(data, { language: data.language === 'bn' ? 'bn' : 'en' }), templateName),
    [data, templateName],
  );

  const warnings = report.diagnostics.filter((d) => d.level === 'warning').length;
  const qualityFailures = ats.checks.filter((c) => c.status === 'fail').length;

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <PanelSection
        title={bn('Layout diagnostics', 'লেআউট ডায়াগনস্টিকস')}
        description={bn(
          'Measured against the real A4 text box, page margins and typography for this CV.',
          'এই সিভির প্রকৃত A4 টেক্সট এরিয়া, মার্জিন ও টাইপোগ্রাফি অনুযায়ী পরিমাপ করা হয়েছে।',
        )}
      >
        <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <Badge tone="info">
            {report.estimate.contentMm} / {report.estimate.pageHeightMm} mm
          </Badge>
          <Badge tone={report.fitsTarget ? 'success' : 'warning'}>
            {report.pages} {bn(report.pages === 1 ? 'page' : 'pages', 'পৃষ্ঠা')}
          </Badge>
          <Badge tone="default">
            {bn('Last page', 'শেষ পৃষ্ঠা')} {Math.round(report.estimate.lastPageFill * 100)}%
          </Badge>
        </div>
        {report.diagnostics.length === 0 ? (
          <Notice tone="success">
            {bn('No layout problems detected.', 'কোনো লেআউট সমস্যা পাওয়া যায়নি।')}
          </Notice>
        ) : (
          <div className="col" style={{ gap: 'var(--sp-2)' }}>
            {report.diagnostics.map((d, i) => (
              <div
                key={`${d.code}-${i}`}
                className={`notice ${levelTone(d.level)}`}
                style={{ alignItems: 'flex-start' }}
              >
                <div>
                  <strong style={{ fontSize: 'var(--fs-xs)', display: 'block', marginBottom: 2 }}>{d.code}</strong>
                  <span style={{ fontSize: 'var(--fs-xs)', lineHeight: 1.55 }}>
                    {lang === 'bn' ? d.messageBn : d.messageEn}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </PanelSection>

      <PanelSection
        title={bn('ATS suitability', 'ATS উপযোগিতা')}
        description={bn(
          'An offline check of how a parsing system will read this document. No template can guarantee acceptance by every ATS.',
          'এই ডকুমেন্ট একটি পার্সিং সিস্টেম কীভাবে পড়বে তার অফলাইন পরীক্ষা। কোনো টেমপ্লেট সব ATS-এ গৃহীত হওয়ার নিশ্চয়তা দেয় না।',
        )}
      >
        <div className="row" style={{ gap: 'var(--sp-2)', alignItems: 'center' }}>
          <Badge tone={ats.score >= 80 ? 'success' : ats.score >= 55 ? 'warning' : 'danger'}>
            {ats.score}/100
          </Badge>
          <span style={{ fontSize: 'var(--fs-xs)', color: 'var(--text-muted)' }}>
            {lang === 'bn' ? ats.verdictBn : ats.verdictEn}
          </span>
        </div>
        <div className="col" style={{ gap: 4 }}>
          {ats.checks.map((check) => (
            <div key={check.id} className="row" style={{ gap: 6, alignItems: 'flex-start', fontSize: 'var(--fs-xs)' }}>
              <span
                aria-hidden="true"
                style={{
                  flex: '0 0 14px',
                  fontWeight: 700,
                  color:
                    check.status === 'pass'
                      ? 'var(--success)'
                      : check.status === 'warn'
                        ? 'var(--warning)'
                        : 'var(--danger)',
                }}
              >
                {check.status === 'pass' ? '✓' : check.status === 'warn' ? '!' : '✕'}
              </span>
              <span style={{ lineHeight: 1.5 }}>
                <strong>{lang === 'bn' ? check.labelBn : check.labelEn}</strong>
                {' — '}
                <span style={{ color: 'var(--text-muted)' }}>
                  {lang === 'bn' ? check.detailBn : check.detailEn}
                </span>
              </span>
            </div>
          ))}
        </div>
        <p style={{ margin: 0, fontSize: 'var(--fs-2xs)', color: 'var(--text-muted)', lineHeight: 1.5 }}>
          {bn(
            'Tip: for maximum compatibility use an ATS-friendly template, a single column, standard section names and no photo.',
            'পরামর্শ: সর্বোচ্চ সামঞ্জস্যের জন্য ATS-বান্ধব টেমপ্লেট, এক কলাম, প্রচলিত সেকশন নাম এবং ছবি ছাড়া সিভি ব্যবহার করুন।',
          )}
        </p>
      </PanelSection>

      <PanelSection
        title={bn('Quality checklist', 'মান যাচাই তালিকা')}
        defaultOpen={false}
        description={bn(
          `${qualityFailures} item(s) need attention. These are warnings, not blockers.`,
          `${qualityFailures}টি বিষয়ে নজর দেওয়া দরকার। এগুলো সতর্কতা, বাধা নয়।`,
        )}
      >
        <div className="col" style={{ gap: 4 }}>
          {ats.quality.map((item) => (
            <div key={item.id} className="row" style={{ gap: 6, fontSize: 'var(--fs-xs)' }}>
              <span aria-hidden="true" style={{ flex: '0 0 14px', color: item.ok ? 'var(--success)' : 'var(--warning)' }}>
                {item.ok ? '✓' : '○'}
              </span>
              <span style={{ color: item.ok ? 'var(--text)' : 'var(--text-muted)' }}>
                {lang === 'bn' ? item.labelBn : item.labelEn}
              </span>
            </div>
          ))}
        </div>
        <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
          <Badge tone={warnings === 0 ? 'success' : 'warning'}>
            {bn('Layout warnings', 'লেআউট সতর্কতা')}: {warnings}
          </Badge>
          <Badge tone="default">
            {bn('Density', 'ডেনসিটি')}: {design?.density ?? 'balanced'}
          </Badge>
        </div>
      </PanelSection>
    </div>
  );
};
