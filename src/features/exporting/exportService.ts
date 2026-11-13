/**
 * Export orchestration: DOCX, PDF and A4 printing.
 *
 * All three read the same resolved design + section model:
 *  - DOCX  → generated in-process with the `docx` library (editable, A4, Bangla)
 *  - PDF   → Electron: Chromium printToPDF (selectable/searchable text)
 *            Browser: dedicated print-to-PDF document
 *  - Print → Electron: native A4 job through the Windows spooler
 *            Browser: the OS print dialog from a self-contained document
 */
import type { ProjectRecord } from '@/types/cv';
import type { ResolvedDesign } from '@/templates/catalog';
import { buildDocx, DOCX_MIME } from '@/document/docxExport';
import { buildStandaloneHtml } from '@/document/standalone';
import { printableSections } from '@/lib/sections';
import { composeDocumentTokens } from '@/lib/composition';
import { buildLayoutReport } from '@/lib/layoutReport';
import { buildFileName } from '@/lib/sanitize';
import { getBridge, isDesktop } from '@/platform';
import { useWorkspace } from '@/store/workspace';
import { uid } from '@/lib/defaults';

export interface ExportContext {
  project: ProjectRecord;
  design: ResolvedDesign;
}

type DesktopPdfFn = (req: { html: string; suggestedName: string }) => Promise<{
  saved: boolean;
  path: string | null;
  message: string;
}>;

function baseName(project: ProjectRecord): string {
  const settings = useWorkspace.getState().settings;
  return buildFileName(settings.filenamePattern, {
    name: project.data.personal.fullName || project.title,
    template: project.templateId,
  });
}

/**
 * One composition pass shared by every exporter.
 *
 * The tokens are computed from the *saved* project data, so DOCX, PDF, print and
 * HTML cannot disagree about title mode, margins, density or alignment.
 */
function compose(project: ProjectRecord, design: ResolvedDesign) {
  const language = project.data.language === 'bn' ? 'bn' : 'en';
  const tokens = composeDocumentTokens({ data: project.data, design, overrides: project.design });
  const sections = printableSections(project.data, { language });
  // Page numbering and the page-length verdict come from the same estimator,
  // so a "1 / 2" footer can never disagree with the layout report.
  const report = buildLayoutReport(project.data, sections, tokens, {
    language,
    hasPhoto: !!project.data.photo.dataUrl,
  });
  return { language, tokens, sections, pageCount: report.pages, report };
}

function log(project: ProjectRecord, format: 'docx' | 'pdf' | 'print', fileName: string, status: 'success' | 'failed', message: string) {
  useWorkspace.getState().logExport({
    projectId: project.id,
    projectTitle: project.title,
    format,
    fileName,
    status,
    message,
  });
}

function toast(kind: 'success' | 'error' | 'warning', title: string, detail?: string) {
  useWorkspace.getState().pushToast({ kind, title, detail });
}

/* ------------------------------------------------------------------ DOCX */
export async function exportDocx({ project, design }: ExportContext): Promise<void> {
  const language = project.data.language === 'bn' ? 'bn' : 'en';
  const fileName = `${baseName(project)}.docx`;
  try {
    const bytes = await buildDocx({ data: project.data, design, title: project.title });
    const result = await getBridge().saveFile({
      suggestedName: fileName,
      bytes,
      mime: DOCX_MIME,
      filterName: 'Word Document',
      extensions: ['docx'],
    });
    if (!result.saved) {
      log(project, 'docx', fileName, 'failed', result.message || 'CANCELLED');
      if (result.message !== 'CANCELLED') toast('warning', 'DOCX was not saved', result.message);
      return;
    }
    log(project, 'docx', result.path ?? fileName, 'success', `${(bytes.length / 1024).toFixed(0)} KB`);
    toast('success', language === 'bn' ? 'DOCX সংরক্ষিত হয়েছে' : 'DOCX saved', result.path ?? fileName);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(project, 'docx', fileName, 'failed', message);
    useWorkspace.getState().repo?.logError('export.docx', message);
    toast('error', language === 'bn' ? 'DOCX তৈরি করা যায়নি' : 'DOCX export failed', message);
    throw err;
  }
}

/* ------------------------------------------------------------------- PDF */
export async function exportPdf({ project, design }: ExportContext): Promise<void> {
  const { language, tokens, pageCount } = compose(project, design);
  const fileName = `${baseName(project)}.pdf`;
  const html = buildStandaloneHtml({
    data: project.data,
    design,
    pageCount,
    title: project.title,
    tokens,
  });

  try {
    const bridge = getBridge();
    const printToPdf = (bridge as unknown as { printToPdf?: DesktopPdfFn }).printToPdf;

    // Desktop: Chromium printToPDF keeps text selectable and searchable.
    if (isDesktop() && typeof printToPdf === 'function') {
      const result = await printToPdf({ html, suggestedName: fileName });
      if (!result.saved) {
        log(project, 'pdf', fileName, 'failed', result.message);
        if (result.message !== 'CANCELLED') toast('warning', 'PDF was not saved', result.message);
        return;
      }
      log(project, 'pdf', result.path ?? fileName, 'success', 'Chromium printToPDF');
      toast('success', language === 'bn' ? 'PDF সংরক্ষিত হয়েছে' : 'PDF saved', result.path ?? fileName);
      return;
    }

    // Browser: open the self-contained A4 document where the OS "Save as PDF"
    // destination produces a real, text-based PDF.
    const printResult = await bridge.print({ html: html.replace('<body>', '<body style="margin:0">') });
    if (!printResult.printed) {
      log(project, 'pdf', fileName, 'failed', printResult.message);
      toast('error', language === 'bn' ? 'PDF তৈরি করা যায়নি' : 'PDF could not be generated', printResult.message);
      return;
    }
    log(project, 'pdf', fileName, 'success', 'Browser print-to-PDF');
    toast(
      'success',
      language === 'bn' ? 'প্রিন্ট ডায়ালগ খোলা হয়েছে' : 'Print dialog opened',
      language === 'bn'
        ? 'ডেস্কটপ অ্যাপে এক ক্লিকে সরাসরি PDF সংরক্ষণ হবে। এখানে “Save as PDF” নির্বাচন করুন।'
        : 'The desktop build saves the PDF in one click. In browser mode choose “Save as PDF”.',
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    log(project, 'pdf', fileName, 'failed', message);
    useWorkspace.getState().repo?.logError('export.pdf', message);
    toast('error', language === 'bn' ? 'PDF তৈরি করা যায়নি' : 'PDF export failed', message);
    throw err;
  }
}

/* ----------------------------------------------------------------- PRINT */
export async function printProject({ project, design }: ExportContext): Promise<void> {
  const { language, tokens, pageCount } = compose(project, design);
  const html = buildStandaloneHtml({ data: project.data, design, pageCount, title: project.title, tokens });

  try {
    const bridge = getBridge();
    const settings = useWorkspace.getState().settings;
    const result = await bridge.print({
      html,
      printer: settings.defaultPrinter || undefined,
      landscape: false,
    });
    log(project, 'print', project.title, result.printed ? 'success' : 'failed', result.message);
    if (result.printed) {
      toast(
        'success',
        language === 'bn' ? 'প্রিন্ট জব পাঠানো হয়েছে' : 'Print job sent',
        language === 'bn'
          ? 'A4 · ২১০ × ২৯৭ মিমি — পেজ সেটআপ ও কপি সংখ্যা প্রিন্টার ড্রাইভারে নির্ধারণ করুন।'
          : 'A4 · 210 × 297 mm — choose copies and colour options in the printer dialog.',
      );
    } else {
      toast('error', language === 'bn' ? 'প্রিন্ট ব্যর্থ হয়েছে' : 'Printing failed', result.message);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    useWorkspace.getState().repo?.logError('export.print', message);
    toast('error', language === 'bn' ? 'প্রিন্ট ব্যর্থ হয়েছে' : 'Printing failed', message);
    throw err;
  }
}

/** Save an HTML copy (useful for archival or opening in a browser). */
export async function exportHtml({ project, design }: ExportContext): Promise<void> {
  const { tokens, pageCount } = compose(project, design);
  const html = buildStandaloneHtml({ data: project.data, design, pageCount, title: project.title, toolbar: true, tokens });
  const result = await getBridge().saveText({
    suggestedName: `${baseName(project)}.html`,
    text: html,
    extensions: ['html'],
  });
  if (result.saved) toast('success', 'HTML saved', result.path ?? '');
}

export const exportId = uid;
