/**
 * Saved drafts — projects that are still in progress.
 */
import React from 'react';
import { FileText } from 'lucide-react';
import { Button, EmptyState, SectionHeader, formatRelative, useLang, useT } from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';

export const DraftsPage: React.FC = () => {
  const { projects } = useWorkspace();
  const lang = useLang();
  const tr = useT();
  const drafts = projects.filter((p) => !p.deletedAt && p.status === 'draft');

  return (
    <div className="page">
      <SectionHeader
        title={tr('nav.drafts')}
        subtitle={
          lang === 'bn'
            ? 'অসম্পূর্ণ প্রকল্পগুলো এখানে থাকে। প্রতিটি ধাপ স্বয়ংক্রিয়ভাবে সংরক্ষিত হয়।'
            : 'Unfinished projects live here. Every step is saved automatically.'
        }
      />
      {drafts.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<FileText size={22} />}
            title={lang === 'bn' ? 'কোনো ড্রাফট নেই' : 'No drafts'}
            description={lang === 'bn' ? 'নতুন সিভি শুরু করলে অসম্পূর্ণ প্রকল্প এখানে দেখা যাবে।' : 'Drafts appear here as soon as you start a new CV.'}
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{lang === 'bn' ? 'প্রকল্প' : 'Project'}</th>
                <th>{lang === 'bn' ? 'সর্বশেষ' : 'Updated'}</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {drafts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="cell-title">
                      <strong>{p.fullName || p.title}</strong>
                      <span>{p.title}</span>
                    </div>
                  </td>
                  <td className="small muted">{formatRelative(p.updatedAt, lang)}</td>
                  <td className="num">
                    <Button
                      size="sm"
                      onClick={async () => {
                        await useWorkspace.getState().openProject(p.id);
                        useUI.getState().navigate({ name: 'editor' });
                      }}
                    >
                      {lang === 'bn' ? 'চালিয়ে যান' : 'Continue'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
