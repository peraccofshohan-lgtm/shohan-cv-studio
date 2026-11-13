/**
 * Customer management for shop operators: a customer can own many CV projects.
 */
import React, { useMemo, useState } from 'react';
import { Copy, FilePlus2, Pencil, Phone, Plus, Search, Trash2, Users } from 'lucide-react';
import {
  Badge,
  Button,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  SectionHeader,
  Textarea,
  formatRelative,
  useLang,
  useT,
} from '@/components/ui';
import { useWorkspace } from '@/store/workspace';
import { useUI } from '@/store/ui';
import type { CustomerRecord } from '@/types/cv';
import { createEmptyCustomer } from '@/lib/defaults';

export const CustomersPage: React.FC = () => {
  const { customers, projects, saveCustomer, deleteCustomer, purgeCustomer } = useWorkspace();
  const { navigate } = useUI();
  const lang = useLang();
  const tr = useT();

  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<CustomerRecord | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? customers.filter(
          (c) =>
            c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.email.toLowerCase().includes(q),
        )
      : customers;
    return list.map((customer) => ({
      customer,
      projectCount: projects.filter((p) => p.customerId === customer.id && !p.deletedAt).length,
    }));
  }, [customers, projects, query]);

  const startNew = () => {
    setEditing(createEmptyCustomer());
    setError(null);
  };

  const submit = async () => {
    if (!editing) return;
    if (!editing.name.trim()) {
      setError(lang === 'bn' ? 'গ্রাহকের নাম আবশ্যক' : 'Customer name is required');
      return;
    }
    setBusy(true);
    try {
      await saveCustomer({ ...editing, name: editing.name.trim() });
      setEditing(null);
      useWorkspace.getState().pushToast({
        kind: 'success',
        title: lang === 'bn' ? 'গ্রাহক সংরক্ষিত হয়েছে' : 'Customer saved',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page">
      <SectionHeader
        title={tr('cust.title')}
        subtitle={tr('cust.subtitle')}
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={startNew}>
            {tr('cust.add')}
          </Button>
        }
      />

      <div className="card card-pad">
        <div className="search" style={{ maxWidth: 380 }}>
          <Search size={15} />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={lang === 'bn' ? 'নাম, ফোন বা ইমেইল দিয়ে খুঁজুন…' : 'Search by name, phone or email…'}
            aria-label={tr('common.search')}
          />
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Users size={22} />}
            title={tr('cust.empty')}
            description={
              lang === 'bn'
                ? 'একজন গ্রাহকের অধীনে একাধিক সিভি প্রকল্প রাখা যাবে — দোকানের কাজে বিশেষভাবে সহায়ক।'
                : 'One customer can own several CV projects — exactly what a service shop needs.'
            }
            action={
              <Button variant="primary" icon={<Plus size={15} />} onClick={startNew}>
                {tr('cust.add')}
              </Button>
            }
          />
        </div>
      ) : (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>{tr('cust.name')}</th>
                <th>{tr('cust.phone')}</th>
                <th>{tr('cust.email')}</th>
                <th>{tr('cust.projects')}</th>
                <th>{lang === 'bn' ? 'সর্বশেষ' : 'Updated'}</th>
                <th aria-label="actions" />
              </tr>
            </thead>
            <tbody>
              {rows.map(({ customer, projectCount }) => (
                <tr key={customer.id}>
                  <td>
                    <div className="cell-main">
                      <div className="avatar sq">{(customer.name || '?').slice(0, 2).toUpperCase()}</div>
                      <div className="cell-title">
                        <strong>{customer.name}</strong>
                        {customer.address ? <span>{customer.address}</span> : null}
                      </div>
                    </div>
                  </td>
                  <td>
                    {customer.phone ? (
                      <span className="row" style={{ gap: 6, fontSize: 'var(--fs-sm)' }}>
                        <Phone size={12} className="faint" /> {customer.phone}
                      </span>
                    ) : (
                      <span className="faint small">—</span>
                    )}
                  </td>
                  <td className="small muted">{customer.email || '—'}</td>
                  <td>
                    <Badge tone={projectCount > 0 ? 'primary' : 'default'}>{projectCount}</Badge>
                  </td>
                  <td className="small muted">{formatRelative(customer.updatedAt, lang)}</td>
                  <td className="num">
                    <div className="row" style={{ gap: 2, justifyContent: 'flex-end' }}>
                      <IconButton
                        label="New CV for this customer"
                        size="sm"
                        onClick={async () => {
                          await useWorkspace.getState().createNewProject({
                            customerId: customer.id,
                            title: `${customer.name} — CV`,
                          });
                          navigate({ name: 'wizard', step: 0 });
                        }}
                      >
                        <FilePlus2 size={14} />
                      </IconButton>
                      <IconButton label="Edit" size="sm" onClick={() => { setEditing(customer); setError(null); }}>
                        <Pencil size={14} />
                      </IconButton>
                      <IconButton label="Delete" size="sm" onClick={() => setConfirmDelete(customer.id)}>
                        <Trash2 size={14} />
                      </IconButton>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing && customers.some((c) => c.id === editing.id) ? tr('common.edit') : tr('cust.add')}
        description={lang === 'bn' ? 'গ্রাহকের তথ্য শুধু স্থানীয় ডেটাবেসে সংরক্ষিত হবে।' : 'Customer details are stored only in the local database.'}
        footer={
          <>
            <Button onClick={() => setEditing(null)} disabled={busy}>
              {tr('common.cancel')}
            </Button>
            <Button variant="primary" onClick={() => void submit()} loading={busy}>
              {tr('common.save')}
            </Button>
          </>
        }
      >
        {editing ? (
          <div className="field-grid">
            <Field label={tr('cust.name')} required className="span-2">
              <Input
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                autoFocus
                maxLength={80}
              />
            </Field>
            <Field label={tr('cust.phone')}>
              <Input
                value={editing.phone}
                onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                inputMode="tel"
                maxLength={24}
              />
            </Field>
            <Field label={tr('cust.email')}>
              <Input
                type="email"
                value={editing.email}
                onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                maxLength={80}
              />
            </Field>
            <Field label={tr('cust.address')} className="span-2">
              <Input value={editing.address} onChange={(e) => setEditing({ ...editing, address: e.target.value })} maxLength={160} />
            </Field>
            <Field label={tr('cust.notes')} optional className="span-2">
              <Textarea
                value={editing.notes}
                onChange={(e) => setEditing({ ...editing, notes: e.target.value })}
                rows={3}
                maxLength={600}
              />
            </Field>
            {error ? (
              <div className="span-2">
                <span className="field-error">{error}</span>
              </div>
            ) : null}
          </div>
        ) : null}
      </Modal>

      <ConfirmDialog
        open={!!confirmDelete}
        title={lang === 'bn' ? 'গ্রাহক মুছে ফেলবেন?' : 'Delete customer?'}
        message={
          lang === 'bn'
            ? 'গ্রাহক ট্র্যাশে যাবে। তার সিভি প্রকল্পগুলো সংরক্ষিত থাকবে।'
            : 'The customer moves to trash. Their CV projects are kept.'
        }
        confirmLabel={tr('common.delete')}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) void deleteCustomer(confirmDelete);
          setConfirmDelete(null);
        }}
      />
    </div>
  );
};
