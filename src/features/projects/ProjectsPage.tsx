/**
 * All CV projects — search, filter, sort, duplicate, restore and delete.
 */
import React, { useMemo, useState } from 'react';
import {
  Copy,
  FilePlus2,
  FileText,
  Filter,
  Pencil,
  RotateCcw,
  Search,
  SortAsc,
  SortDesc,
  Trash2,
  Users,
} from 'lucide-react';
import { Badge, Button, ConfirmDialog, EmptyState, IconButton, Input, Select, SectionHeader, formatRelative, useLang, useT } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';
import { TEMPLATES } from '@/templates/catalog';
import { flushAutosave } from '@/store/workspace';

type SortKey = 'updated' | 'created' | 'name';
type FilterKey = 'all' | 'draft' | 'completed' | 'fresher' | 'experienced' | 'trash';

export const ProjectsPage: React.FC<{ trashOnly?: boolean }> = ({ trashOnly }) => {
  const { projects, deleteProject, restoreProject, purgeProject, duplicateProject, refreshLists } = useWorkspace();
  const { navigate } = useUI();
  const lang = useLang();
  const tr = useT();

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterKey>(trashOnly ? 'trash' : 'all');
  const [sort, setSort] = useState<SortKey>('updated');
  const [asc, setAsc] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmPurge, setConfirmPurge] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = projects.filter((p) => {
      if (trashOnly) return !!p.deletedAt;
      if (filter === 'all') return !p.deletedAt;
      if (filter === 'trash') return !!p.deletedAt;
      if (p.deletedAt) return false;
      if (filter === 'draft' || filter === 'completed') return p.status === filter;
      if (filter === 'fresher') return p.hasExperience === 0;
      if (filter === 'experienced') return p.hasExperience === 1;
      return true;
    });
    if (q) {
      list = list.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.fullName ?? '').toLowerCase().includes(q) ||
          (p.customerName ?? '').toLowerCase().includes(q),
      );
    }
    list = [...list].sort((a, b) => {
      if (sort === 'name') {
        const an = (a.fullName || a.title).toLowerCase();
        const bnName = (b.fullName || b.title).toLowerCase();
        return asc ? an.localeCompare(bnName) : bnName.localeCompare(an);
      }
      const av = sort === 'created' ? a.createdAt : a.updatedAt;
      const bv = sort === 'created' ? b.createdAt : b.updatedAt;
      return asc ? av.localeCompare(bv) : bv.localeCompare(av);
    });
    return list;
  }, [projects, query, filter, sort, asc, trashOnly]);

  const open = async (id: string) => {
    await flushAutosave();
    await useWorkspace.getState().openProject(id);
    navigate({ name: 'editor' });
  };

  const filters: { value: FilterKey; label: string }[] = [
    { value: 'all', label: lang === 'bn' ? 'সব' : 'All' },
    { value: 'draft', label: lang === 'bn' ? 'ড্রাফট' : 'Draft' },
    { value: 'completed', label: lang === 'bn' ? 'সম্পন্ন' : 'Completed' },
    { value: 'fresher', label: lang === 'bn' ? 'ফ্রেশার' : 'Freshers' },
    { value: 'experienced', label: lang === 'bn' ? 'অভিজ্ঞ' : 'Experienced' },
    { value: 'trash', label: lang === 'bn' ? 'ট্র্যাশ' : 'Trash' },
  ];

  return (
    <div className="page">
      <SectionHeader
        title={trashOnly ? (lang === 'bn' ? 'ট্র্যাশ' : 'Trash') : tr('proj.title')}
        subtitle={trashOnly ? (lang === 'bn' ? 'মুছে ফেলা প্রকল্প ফিরিয়ে আনা যাবে।' : 'Deleted projects can be restored.') : tr('proj.subtitle')}
        actions={
          <>
            <Button onClick={() => { refreshLists(); }} icon={<RotateCcw size={15} />} size="sm">
              {lang === 'bn' ? 'রিফ্রেশ' : 'Refresh'}
            </Button>
            <Button variant="primary" icon={<FilePlus2 size={15} />} onClick={() => navigate({ name: 'wizard', step: 0 })}>
              {tr('dash.newCv')}
            </Button>
          </>
        }
      />

      <div className="card card-pad">
        <div className="row wrap" style={{ gap: 'var(--sp-3)' }}>
          <div className="search" style={{ flex: '1 1 260px' }}>
            <Search size={15} />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={lang === 'bn' ? 'নাম, ফোন, ইমেইল বা প্রকল্প শিরোনাম…' : 'Name, phone, email or project title…'}
              aria-label={tr('common.search')}
            />
          </div>
          {!trashOnly ? (
            <div className="row" style={{ gap: 6 }}>
              <Filter size={15} className="faint" />
              {filters.map((f) => (
                <button
                  key={f.value}
                  className={`badge ${filter === f.value ? 'badge-primary' : ''}`}
                  style={{ cursor: 'pointer', padding: '6px 10px', fontSize: 'var(--fs-sm)' }}
                  onClick={() => setFilter(f.value)}
                  aria-pressed={filter === f.value}
                >
                  {f.label}
                </button>
              ))}
            </div>
          ) : null}
          <div className="row" style={{ gap: 'var(--sp-2)', marginLeft: 'auto' }}>
            <Select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} style={{ width: 170 }} aria-label="Sort by">
              <option value="updated">{lang === 'bn' ? 'সর্বশেষ পরিবর্তিত' : 'Recently modified'}</option>
              <option value="created">{lang === 'bn' ? 'তৈরির তারিখ' : 'Date created'}</option>
              <option value="name">{lang === 'bn' ? 'নাম' : 'Name'}</option>
            </Select>
            <IconButton label={asc ? 'Descending' : 'Ascending'} onClick={() => setAsc((v) => !v)}>
              {asc ? <SortAsc size={16} /> : <SortDesc size={16} />}
            </IconButton>
          </div>
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={22} />}
            title={filter === 'trash' ? (lang === 'bn' ? 'ট্র্যাশ খালি' : 'Trash is empty') : tr('proj.empty')}
            description={filter === 'trash' ? undefined : tr('proj.emptyHint')}
            action={
              filter === 'trash' ? undefined : (
                <Button variant="primary" icon={<FilePlus2 size={15} />} onClick={() => navigate({ name: 'wizard', step: 0 })}>
                  {tr('dash.newCv')}
                </Button>
              )
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'প্রকল্প' : 'Project'}</th>
                <th>{lang === 'bn' ? 'গ্রাহক' : 'Customer'}</th>
                <th>{lang === 'bn' ? 'টেমপ্লেট' : 'Template'}</th>
                <th>{lang === 'bn' ? 'অবস্থা' : 'Status'}</th>
                <th>{lang === 'bn' ? 'সর্বশেষ' : 'Updated'}</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map((project) => {
                const template = TEMPLATES.find((t) => t.id === project.templateId);
                return (
                  <tr key={project.id} onDoubleClick={() => !project.deletedAt && void open(project.id)}>
                    <td>
                      <div className="cell-main">
                        <div className="avatar">
                          {project.photoDataUrl ? (
                            <img src={project.photoDataUrl} alt="" />
                          ) : (
                            (project.fullName || project.title || '?').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="cell-title">
                          <strong>{project.fullName || project.title}</strong>
                          <span>{project.title}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      {project.customerName ? (
                        <span className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
                          <Users size={13} className="faint" /> {project.customerName}
                        </span>
                      ) : (
                        <span className="small faint">—</span>
                      )}
                    </td>
                    <td className="small muted">{template?.name ?? '—'}</td>
                    <td>
                      <div className="row" style={{ gap: 4 }}>
                        <Badge tone={project.status === 'completed' ? 'success' : 'default'}>
                          {project.status === 'completed' ? (lang === 'bn' ? 'সম্পন্ন' : 'Completed') : lang === 'bn' ? 'ড্রাফট' : 'Draft'}
                        </Badge>
                        {project.hasExperience ? <Badge tone="info">{lang === 'bn' ? 'অভিজ্ঞ' : 'Exp.'}</Badge> : <Badge>{lang === 'bn' ? 'ফ্রেশার' : 'Fresher'}</Badge>}
                      </div>
                    </td>
                    <td className="small muted">{formatRelative(project.updatedAt, lang)}</td>
                    <td className="num">
                      <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                        {project.deletedAt ? (
                          <>
                            <Button size="sm" icon={<RotateCcw size={13} />} onClick={() => void restoreProject(project.id)}>
                              {tr('common.restore')}
                            </Button>
                            <Button size="sm" variant="danger" icon={<Trash2 size={13} />} onClick={() => setConfirmPurge(project.id)}>
                              {lang === 'bn' ? 'স্থায়ী মুছুন' : 'Delete forever'}
                            </Button>
                          </>
                        ) : (
                          <>
                            <IconButton label="Edit" size="sm" onClick={() => void open(project.id)}>
                              <Pencil size={14} />
                            </IconButton>
                            <IconButton label="Duplicate" size="sm" onClick={() => void duplicateProject(project.id)}>
                              <Copy size={14} />
                            </IconButton>
                            <IconButton label="Delete" size="sm" onClick={() => setConfirmDelete(project.id)}>
                              <Trash2 size={14} />
                            </IconButton>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={!!confirmDelete}
        title={lang === 'bn' ? 'প্রকল্প ট্র্যাশে সরাবেন?' : 'Move project to trash?'}
        message={
          lang === 'bn'
            ? 'প্রকল্পটি ট্র্যাশে যাবে — পরে ফিরিয়ে আনা যাবে।'
            : 'The project moves to the trash and can be restored later.'
        }
        confirmLabel={tr('common.trash')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void deleteProject(confirmDelete);
          setConfirmDelete(null);
        }}
      />
      <ConfirmDialog
        open={!!confirmPurge}
        title={lang === 'bn' ? 'স্থায়ীভাবে মুছে ফেলবেন?' : 'Delete permanently?'}
        message={
          lang === 'bn'
            ? 'এই কাজটি ফিরিয়ে আনা যাবে না। প্রকল্পের সব তথ্য ডেটাবেস থেকে মুছে যাবে।'
            : 'This cannot be undone. Every record for this project is removed from the database.'
        }
        confirmLabel={lang === 'bn' ? 'স্থায়ী মুছুন' : 'Delete forever'}
        onCancel={() => setConfirmPurge(null)}
        onConfirm={() => {
          if (confirmPurge) void purgeProject(confirmPurge);
          setConfirmPurge(null);
        }}
      />
    </div>
  );
};
