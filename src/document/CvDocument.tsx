/**
 * The CV document renderer.
 *
 * Renders the resolved section model into A4 pages. The very same component is
 * used for (a) the live preview, (b) the print document and (c) the source HTML
 * handed to Chromium's printToPDF — guaranteeing the three outputs match.
 */
import React from 'react';
import type { CVData } from '@/types/cv';
import type { ResolvedDesign } from '@/templates/catalog';
import type { ResolvedSection } from '@/lib/sections';
import { printableSections } from '@/lib/sections';
import { formatDate } from '@/lib/sections';
import type { DocumentTokens } from '@/lib/composition';

export interface CvDocumentProps {
  data: CVData;
  design: ResolvedDesign;
  /** Bangla ordering/labels for section titles and dates. */
  language: 'bn' | 'en';
  /** Insert dashed guides where A4 pages end (editor preview only). */
  guides?: boolean;
  /** Number of pages (pass estimatePageCount result) for footer numbering. */
  pageCount?: number;
  /** Pre-resolved composition tokens (see `composeDocumentTokens`). */
  tokens?: DocumentTokens;
}

const ContactItem: React.FC<{ mark: string; children: React.ReactNode }> = ({ mark, children }) => (
  <span>
    <span className="mark" aria-hidden="true">
      {mark}
    </span>
    {children}
  </span>
);

const contactMarks = {
  phone: '☎',
  email: '✉',
  address: '⌂',
  web: '⌘',
  link: '↗',
};

function contactList(data: CVData): { mark: string; value: string }[] {
  const p = data.personal;
  const out: { mark: string; value: string }[] = [];
  if (p.mobile) out.push({ mark: contactMarks.phone, value: p.mobile });
  if (p.email) out.push({ mark: contactMarks.email, value: p.email });
  const address = [p.presentAddress, p.city, p.district, p.country].filter(Boolean).join(', ');
  if (address) out.push({ mark: contactMarks.address, value: address });
  if (p.linkedin) out.push({ mark: contactMarks.link, value: p.linkedin.replace(/^https?:\/\//, '') });
  if (p.website) out.push({ mark: contactMarks.web, value: p.website.replace(/^https?:\/\//, '') });
  if (p.portfolio && p.portfolio !== p.website) {
    out.push({ mark: contactMarks.link, value: p.portfolio.replace(/^https?:\/\//, '') });
  }
  for (const link of p.otherLinks ?? []) {
    if (link.label && link.url) out.push({ mark: contactMarks.link, value: `${link.label}: ${link.url.replace(/^https?:\/\//, '')}` });
  }
  if (p.altPhone) out.push({ mark: contactMarks.phone, value: p.altPhone });
  return out;
}

/** The document title block ("CURRICULUM VITAE" / "RESUME" / custom). */
export function TitleBlock({ tokens }: { tokens?: DocumentTokens }): React.ReactElement | null {
  const title = tokens?.title;
  // "No title" must not reserve any space at all.
  if (!title || !title.visible || !title.text) return null;
  return (
    <div className="cv-title-wrap" data-position={title.position}>
      <div className="cv-title" data-border={title.border} data-align={title.align}>
        {title.text}
      </div>
    </div>
  );
}

export function Header({
  data,
  design,
  tokens,
}: {
  data: CVData;
  design: ResolvedDesign;
  tokens?: DocumentTokens;
}): React.ReactElement {
  const p = data.personal;
  const title = tokens?.title;
  const titleAbove = title?.visible && title.position === 'above-name';
  const titleBelowName = title?.visible && title.position === 'below-name';
  const titleBelowContact = title?.visible && title.position === 'below-contact';
  const contacts = contactList(data);
  const showPhoto = !!data.photo.dataUrl && design.photoShape !== 'none' && design.template.photoSupported;
  const frame = data.photo.frameSize || 30;

  const photo = showPhoto ? (
    <div
      className="cv-photo"
      data-shape={design.photoShape}
      style={{ width: `${frame}mm`, height: `${frame}mm` }}
    >
      <img
        src={data.photo.dataUrl ?? ''}
        alt={p.fullName ? `${p.fullName} — photograph` : 'Photograph'}
        style={{
          transform: `scale(${data.photo.zoom}) rotate(${data.photo.rotation}deg)`,
          objectPosition: `${50 + data.photo.offsetX}% ${50 + data.photo.offsetY}%`,
        }}
      />
    </div>
  ) : null;

  const identity = (
    <div className="identity">
      {titleAbove ? <TitleBlock tokens={tokens} /> : null}
      <h1 className="cv-name">{p.fullName || 'Your Name'}</h1>
      {titleBelowName ? <TitleBlock tokens={tokens} /> : null}
      {p.headline ? <div className="cv-headline">{p.headline}</div> : null}
      {contacts.length > 0 ? (
        <div className="cv-contact">
          {contacts.map((c, i) => (
            <ContactItem key={`${c.mark}-${i}`} mark={c.mark}>
              {c.value}
            </ContactItem>
          ))}
        </div>
      ) : null}
      {titleBelowContact ? <TitleBlock tokens={tokens} /> : null}
    </div>
  );

  const layoutClass = `cv-header hdr-${design.headerStyle}`;
  const orderPhotoFirst = design.photoPosition === 'left';
  const children = orderPhotoFirst ? [photo, identity] : [identity, photo];

  return (
    <header className={layoutClass}>
      {children[0]}
      {children[1]}
    </header>
  );
}

function SectionHeading({ section, design }: { section: ResolvedSection; design: ResolvedDesign }) {
  return (
    <div className={`cv-section-head hd-${design.headingStyle}`}>
      <h2 className="cv-section-title">{section.title}</h2>
      <span className="rule" aria-hidden="true" />
    </div>
  );
}

function SectionBody({ section, design }: { section: ResolvedSection; design: ResolvedDesign }) {
  switch (section.kind) {
    case 'paragraph':
      return (
        <>
          {section.paragraphs.map((text, i) => (
            <p key={i} className="paragraph">
              {text}
            </p>
          ))}
        </>
      );
    case 'chips':
      return (
        <div className="chips">
          {section.chips.map((chip, i) => (
            <span key={`${chip}-${i}`} className="chip">
              {chip}
            </span>
          ))}
        </div>
      );
    case 'simple-list':
      return (
        <ul className="simple-list">
          {section.list.map((item, i) => (
            <li key={`${item}-${i}`}>{item}</li>
          ))}
        </ul>
      );
    case 'labelled-grid':
      return (
        <dl className={`labelled ${section.labelled.length <= 3 ? 'labelled-1' : ''}`}>
          {section.labelled.map((row, i) => (
            <div className="labelled-row" key={`${row.label}-${i}`}>
              <dt>{row.label}</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      );
    case 'timeline':
      return (
        <>
          {section.timeline.map((item, index) => (
            <article
              className={`entry entry-${design.entryLayout} ${design.entryRule && index > 0 ? 'entry-rule' : ''}`}
              key={item.id}
            >
              <div className="entry-top">
                {item.title ? <h3 className="entry-title">{item.title}</h3> : null}
                {item.period ? <span className="entry-period">{item.period}</span> : null}
              </div>
              {item.subtitle ? <div className="entry-sub">{item.subtitle}</div> : null}
              {item.meta ? <div className="entry-meta">{item.meta}</div> : null}
              {item.bullets.length > 0 ? (
                <ul className="entry-bullets">
                  {item.bullets.map((bullet, i) => (
                    <li key={i}>{bullet}</li>
                  ))}
                </ul>
              ) : null}
              {item.body ? <div className="entry-body">{item.body}</div> : null}
            </article>
          ))}
        </>
      );
    default:
      return null;
  }
}

function SignatureBlock({ data, language }: { data: CVData; language: 'bn' | 'en' }) {
  const { declaration, signature, personal } = data;
  const showSig = signature.enabled && signature.dataUrl;
  if (!showSig && !declaration.enabled) return null;
  const place = declaration.place;
  const date = declaration.date ? formatDate(declaration.date, language) : '';
  return (
    <>
      {declaration.enabled ? (
        <div className="declaration-meta">
          <span>
            {place ? `${language === 'bn' ? 'স্থান' : 'Place'}: ${place}` : ''}
          </span>
          <span>{date ? `${language === 'bn' ? 'তারিখ' : 'Date'}: ${date}` : ''}</span>
        </div>
      ) : null}
      {showSig ? (
        <div className="signature-block" style={{ justifyContent: signature.align === 'left' ? 'flex-start' : signature.align === 'center' ? 'center' : 'flex-end' }}>
          <div className="signature-box" style={{ textAlign: signature.align }}>
            <img
              className="signature-img"
              src={signature.dataUrl ?? ''}
              alt="Signature"
              style={{ maxWidth: `${46 * signature.scale}mm`, maxHeight: `${18 * signature.scale}mm` }}
            />
            <div className="signature-line">{personal.fullName || (language === 'bn' ? 'স্বাক্ষর' : 'Signature')}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}

/** Order sections so that signature/declaration always render last. */
function orderedForRender(sections: ResolvedSection[]): ResolvedSection[] {
  const tail = new Set(['declaration', 'signature']);
  const rest = sections.filter((s) => !tail.has(s.id));
  const last = sections.filter((s) => tail.has(s.id));
  return [...rest, ...last];
}

export function splitTailSections(sections: ResolvedSection[]) {
  return {
    body: sections.filter((s) => s.id !== 'declaration' && s.id !== 'signature'),
    tail: sections.filter((s) => s.id === 'declaration' || s.id === 'signature'),
  };
}

export function CvDocument({
  data,
  design,
  language,
  guides = false,
  pageCount = 1,
  tokens = undefined,
}: CvDocumentProps): React.ReactElement {
  const pageBreak = new Set(tokens?.pageLength.breakBefore ?? []);
  const sections = printableSections(data, { language });
  const ordered = orderedForRender(sections);
  const { tail } = splitTailSections(ordered);
  const { rail, main } = partitionForLayout(ordered.filter((s) => !tail.includes(s)), design);
  const useRail = design.bodyLayout === 'sidebar-left' || design.bodyLayout === 'sidebar-right';
  const footer = design.showFooter || design.showPageNumbers;

  const renderSections = (list: ResolvedSection[], suffix: string) =>
    list.map((section) => (
      <section
        className={`cv-section${pageBreak.has(section.id) ? ' cv-section-break' : ''}`}
        key={`${section.id}-${suffix}`}
        data-keep={tokens?.pageLength.keepTogether ? 'true' : 'false'}
      >
        <SectionHeading section={section} design={design} />
        <SectionBody section={section} design={design} />
      </section>
    ));

  const tailBlock = (
    <>
      {renderSections(tail, 'tail')}
      <SignatureBlock data={data} language={language} />
    </>
  );

  const footerEl = footer ? (
    <footer className="cv-footer">
      <span>{data.personal.fullName}</span>
      {design.showPageNumbers ? (
        <span>
          {language === 'bn' ? 'পৃষ্ঠা' : 'Page'} 1 / {pageCount}
        </span>
      ) : null}
    </footer>
  ) : null;

  if (useRail) {
    return (
      <div className="cv-paper" data-template={design.template.id} data-layout={design.bodyLayout}>
        {guides ? <span className="page-guide" aria-hidden="true" /> : null}
        <div
          className={`cv-body body-${design.bodyLayout}`}
          style={{ padding: 0, gap: 0, flexDirection: design.bodyLayout === 'sidebar-left' ? 'row' : 'row-reverse' }}
        >
          <aside className="rail">
            <RailContent data={data} design={design} language={language} sections={rail} />
          </aside>
          <div className="cv-sections-wrap">
            <Header data={data} design={design} tokens={tokens} />
            <div className="cv-sections">
              {renderSections(main, 'main')}
              {tailBlock}
            </div>
            {footerEl}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cv-paper" data-template={design.template.id} data-layout={design.bodyLayout}>
      {guides ? <span className="page-guide" aria-hidden="true" /> : null}
      <div className={`cv-body body-${design.bodyLayout}`}>
        <Header data={data} design={design} tokens={tokens} />
        {design.band > 0 ? <div className="cv-band" aria-hidden="true" /> : null}
        <div className="cv-sections">
          {renderSections(main, 'main')}
          {tailBlock}
        </div>
        {footerEl}
      </div>
    </div>
  );
}

/**
 * Sidebar rail content used by the two rail layouts. Contact facts plus the
 * short-form sections live here so the main column stays focused on
 * experience and education.
 */
function RailContent({
  data,
  design,
  language,
  sections,
}: {
  data: CVData;
  design: ResolvedDesign;
  language: 'bn' | 'en';
  sections: ResolvedSection[];
}) {
  const contacts = contactList(data);
  const showPhoto = !!data.photo.dataUrl && design.photoShape !== 'none' && design.template.photoSupported;
  return (
    <>
      {showPhoto ? (
        <div
          className="cv-photo"
          data-shape={design.photoShape === 'circle' ? 'circle' : design.photoShape === 'square' ? 'square' : 'rounded'}
          style={{ width: '38mm', height: '38mm', margin: '0 auto 5mm' }}
        >
          <img
            src={data.photo.dataUrl ?? ''}
            alt="Photograph"
            style={{
              transform: `scale(${data.photo.zoom}) rotate(${data.photo.rotation}deg)`,
              objectPosition: `${50 + data.photo.offsetX}% ${50 + data.photo.offsetY}%`,
            }}
          />
        </div>
      ) : null}
      {contacts.length > 0 ? (
        <div className="rail-block">
          <div className="rail-title">{language === 'bn' ? 'যোগাযোগ' : 'Contact'}</div>
          {contacts.map((c, i) => (
            <div className="rail-line" key={i}>
              {c.value}
            </div>
          ))}
        </div>
      ) : null}
      {sections.map((section) => (
        <div className="rail-block" key={`rail-${section.id}`}>
          <div className="rail-title">{section.title}</div>
          {section.kind === 'chips' ? (
            <div className="chips">
              {section.chips.map((chip, i) => (
                <span className="chip" key={i}>
                  {chip}
                </span>
              ))}
            </div>
          ) : section.kind === 'labelled-grid' ? (
            <div className="labelled labelled-1">
              {section.labelled.map((row, i) => (
                <div className="labelled-row" key={i}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}
            </div>
          ) : (
            <div className="rail-line">{section.paragraphs.join(' ')}</div>
          )}
        </div>
      ))}
    </>
  );
}

/** Rail layouts need main-column sections without the rail groups. */
export function partitionForLayout(
  sections: ResolvedSection[],
  design: ResolvedDesign,
): { rail: ResolvedSection[]; main: ResolvedSection[] } {
  const railGroups = new Set(['skills', 'languages', 'personalDetails', 'strengths', 'hobbies', 'careerInterests']);
  if (design.bodyLayout === 'sidebar-left' || design.bodyLayout === 'sidebar-right') {
    return {
      rail: sections.filter((s) => railGroups.has(s.id)),
      main: sections.filter((s) => !railGroups.has(s.id)),
    };
  }
  return { rail: [], main: sections };
}
