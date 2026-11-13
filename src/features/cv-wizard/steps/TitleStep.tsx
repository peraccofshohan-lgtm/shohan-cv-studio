/**
 * Wizard step — document title and page length (Parts 1 and 2 of the spec).
 *
 * Placing these in the wizard means an operator chooses "CURRICULUM VITAE" vs
 * "RESUME" and a page target while creating the CV, not only afterwards in the
 * editor. Both panels are the same components the editor uses, so there is one
 * implementation and one behaviour.
 */
import React from 'react';
import { useWorkspace } from '@/store/workspace';
import { useLang, Badge, Notice } from '@/components/ui';
import { TitlePanel } from '@/features/editor/TitlePanel';
import { PageLengthPanel } from '@/features/editor/PageLengthPanel';
import { printableSections } from '@/lib/sections';
import { composeDocumentTokens } from '@/lib/composition';
import { buildLayoutReport } from '@/lib/layoutReport';
import { resolveDesign } from '@/templates/catalog';

export const TitleStep: React.FC = () => {
  const lang = useLang();
  const bn = (a: string, b: string) => (lang === 'bn' ? b : a);
  const current = useWorkspace((s) => s.current);

  if (!current) return null;
  const documentLanguage = current.data.language === 'bn' ? 'bn' : 'en';
  const design = resolveDesign(current.templateId, current.design);
  const tokens = composeDocumentTokens({ data: current.data, design, overrides: current.design });
  const sections = printableSections(current.data, { language: documentLanguage });
  const report = buildLayoutReport(current.data, sections, tokens, {
    language: documentLanguage,
    hasPhoto: !!current.data.photo.dataUrl,
  });

  return (
    <div className="col" style={{ gap: 'var(--sp-5)' }}>
      <div className="row" style={{ gap: 'var(--sp-2)', flexWrap: 'wrap' }}>
        <Badge tone="info">
          {bn('Estimated', 'আনুমানিক')} {report.pages} {bn(report.pages === 1 ? 'page' : 'pages', 'পৃষ্ঠা')}
        </Badge>
        <Badge tone={report.fitsTarget ? 'success' : 'warning'}>
          {bn('Target', 'লক্ষ্য')} {report.targetLabel}
        </Badge>
      </div>

      <Notice tone="info">
        {bn(
          'Choose the heading that will be printed above your name, and how long the CV should be. You can change both at any time in the editor.',
          'আপনার নামের উপরে যে শিরোনাম ছাপা হবে এবং সিভি কত পৃষ্ঠার হবে তা বেছে নিন। এডিটরে যখন খুশি বদলাতে পারবেন।',
        )}
      </Notice>

      <TitlePanel />

      <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

      <PageLengthPanel
        pages={report.pages}
        fits={report.fitsTarget}
        target={report.targetLabel}
        warnings={report.diagnostics.filter((d) => d.level !== 'info').length}
      />
    </div>
  );
};
