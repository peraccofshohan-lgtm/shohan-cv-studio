/**
 * Export history — every DOCX, PDF and print job is recorded with its outcome.
 */
import React, { useMemo, useState } from 'react';
import { Archive, FileDown, FileText, Printer, RefreshCw, Search, Trash2 } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Input,
  SectionHeader,
  formatRelative,
  useLang,
  useT,
} from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { getBridge, isDesktop } from '@/platform';

export const ExportsPage: React.FC = () => {
  const { exports, refreshLists, repo } = useWorkspace();
  const lang = useLang();
  const tr = useT();
  const navigate = useUI((s) => s.navigate);
  const [query, setQuery] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? exports.filter((e) => e.projectTitle.toLowerCase().includes(q) || e.fileName.toLowerCase().includes(q)) : exports;
  }, [exports, query]);

  const counts = useMemo(
    () => ({
      docx: exports.filter((e) => e.format === 'docx').length,
      pdf: exports.filter((e) => e.format === 'pdf').length,
      print: exports.filter((e) => e.format === 'print').length,
    }),
    [exports],
  );

  return (
    <div className="page">
      <SectionHeader
        title={tr('nav.exports')}
        subtitle={lang === 'bn' ? 'প্রতিটি DOCX, PDF ও প্রিন্ট কাজের রেকর্ড — সফল বা ব্যর্থ।' : 'A record of every DOCX, PDF and print job — successful or failed.'}
        actions={
          <>
            <Button size="sm" icon={<RefreshCw size={14} />} onClick={() => refreshLists()}>
              {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
            </Button>
            <Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={() => setConfirmClear(true)} disabled={exports.length === 0}>
              {lang === 'bn' ? 'ইতিহাস মুছুন' : 'Clear history'}
            </Button>
          </>
        }
      />

      <div className="grid grid-3">
        <Metric icon={<FileText size={16} />} label="DOCX" value={counts.docx} />
        <Metric icon={<FileDown size={16} />} label="PDF" value={counts.pdf} />
        <Metric icon={<Printer size={16} />} label={lang === 'bn' ? 'প্রিন্ট' : 'Print'} value={counts.print} />
      </div>

      <div className="card card-pad">
        <div className="search" style={{ maxWidth: 380 }}>
          <Search size={15} />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={lang === 'bn' ? 'প্রকল্প বা ফাইলনেম খুঁজুন…' : 'Search project or file name…'} aria-label={tr('common.search')} />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Archive size={22} />}
            title={lang === 'bn' ? 'কোনো এক্সপোর্ট রেকর্ড নেই' : 'No export records yet'}
            description={lang === 'bn' ? 'এডিটিং স্টুডিও থেকে DOCX, PDF বা প্রিন্ট করলে সেগুলো এখানে দেখা যাবে।' : 'Exports and print jobs from the editing studio appear here.'}
            action={
              <Button variant="primary" onClick={() => navigate({ name: 'editor' })}>
                {tr('editor.title')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'ধরন' : 'Format'}</th>
                <th>{lang === 'bn' ? 'প্রকল্প' : 'Project'}</th>
                <th>{lang === 'bn' ? 'ফাইল' : 'File'}</th>
                <th>{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th>{lang === 'bn' ? 'সময়' : 'When'}</th>
                <th aria-label="open" />
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <Badge tone={row.format === 'pdf' ? 'danger' : row.format === 'docx' ? 'info' : 'primary'}>
                      {row.format.toUpperCase()}
                    </Badge>
                  </td>
                  <td className="truncate" style={{ maxWidth: 220 }}>
                    {row.projectTitle}
                  </td>
                  <td className="mono small truncate" style={{ maxWidth: 280 }} title={row.fileName}>
                    {row.fileName}
                  </td>
                  <td>
                    <Badge tone={row.status === 'success' ? 'success' : 'danger'}>{row.status}</Badge>
                  </td>
                  <td className="small muted">{formatRelative(row.createdAt, lang)}</td>
                  <td className="num">
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                      {isDesktop() && row.status === 'success' && row.format !== 'print' ? (
                        <Button size="sm" variant="ghost" onClick={() => void getBridge().revealPath(row.fileName)}>
                          {lang === 'bn' ? 'খুলুন' : 'Reveal'}
                        </Button>
                      ) : null}
                      <Button
                        size="sm"
                        onClick={async () => {
                          await useWorkspace.getState().openProject(row.projectId);
                          navigate({ name: 'editor' });
                        }}
                      >
                        {lang === 'bn' ? 'প্রকল্প' : 'Open'}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={confirmClear}
        title={lang === 'bn' ? 'এক্সপোর্ট ইতিহাস মুছবেন?' : 'Clear export history?'}
        message={lang === 'bn' ? 'শুধু রেকর্ড মুছে যাবে — কোনো সিভি বা ফাইল মুছবে না।' : 'Only the record list is cleared — no CVs or files are deleted.'}
        confirmLabel={lang === 'bn' ? 'মুছুন' : 'Clear'}
        onCancel={() => setConfirmClear(false)}
        onConfirm={() => {
          repo?.clearExports();
          refreshLists();
          setConfirmClear(false);
        }}
      />
    </div>
  );
};

const Metric: React.FC<{ icon: React.ReactNode; label: string; value: number }> = ({ icon, label, value }) => (
  <div className="card card-pad row between">
    <div className="row" style={{ gap: 'var(--sp-2)' }}>
      <Badge tone="primary">{icon}</Badge>
      <span className="small muted">{label}</span>
    </div>
    <span style={{ fontSize: 'var(--fs-lg)', fontWeight: 650 }}>{value}</span>
  </div>
);
