import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Building2, ExternalLink, Globe, Layers, TrendingUp } from 'lucide-react';
import companyService from '../../services/companyService';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import DownloadMenu from '../../components/common/DownloadMenu';
import Confetti from '../../components/common/Confetti';
import { getApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { exportCompaniesToExcel, exportCompaniesToPDF } from '../../utils/recordExport';
import { Hero, Kpi, Ring, cardStyle } from '../../components/dashboard/primitives';

const EMPTY_FORM = {
  name: '', industry: '', website: '', location: '',
  contactPerson: '', contactEmail: '', contactPhone: '', description: '',
};

export default function CompaniesPage() {
  const { toast } = useNotification();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState('');
  const [confetti, setConfetti] = useState(0);
  const search = useDebounce(searchInput);

  const summary = useApi(
    () => companyService.getCompanySummary({ ...(search ? { search } : {}) }),
    [search]
  );
  const { data: res, loading, error, refetch } = useApi(
    () => companyService.getCompanies({ page, limit: 12, ...(search ? { search } : {}) }),
    [page, search]
  );
  const companies = res?.data || [];
  const pagination = res?.pagination || {};
  const c = summary.data?.data || {};
  const activePct = c.total ? Math.round((c.active / c.total) * 100) : 0;

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const all = await companyService.getCompanies({
        page: 1, limit: 10000, ...(search ? { search } : {}),
      });
      const rows = all?.data || [];
      if (rows.length === 0) {
        toast.info('Nothing to export', 'No companies match the current search.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') exportCompaniesToExcel(rows, `companies-${stamp}`);
      else exportCompaniesToPDF(rows, `companies-${stamp}`);
      toast.success('Download ready', `${rows.length} company(ies) exported as ${format.toUpperCase()}.`);
      setConfetti((con) => con + 1);
    } catch (err) {
      toast.error('Export failed', getApiError(err).message);
    } finally {
      setExporting('');
    }
  };

  const openCreate = () => { setEditing(null); setForm(EMPTY_FORM); setFormOpen(true); };
  const openEdit = (co) => {
    setEditing(co);
    setForm({
      name: co.name || '', industry: co.industry || '', website: co.website || '',
      location: co.location || '', contactPerson: co.contactPerson || '',
      contactEmail: co.contactEmail || '', contactPhone: co.contactPhone || '',
      description: co.description || '',
    });
    setFormOpen(true);
  };

  const validate = () => {
    const e = {};
    const name = (form.name || '').trim();
    const website = (form.website || '').trim();
    const location = (form.location || '').trim();
    const contactPerson = (form.contactPerson || '').trim();
    const contactEmail = (form.contactEmail || '').trim();
    const contactPhone = (form.contactPhone || '').trim();

    if (!name) e.name = 'Company name is required';
    else if (name.length < 2) e.name = 'Use at least 2 characters';
    if (!location) e.location = 'Location is required';
    if (!contactPerson) e.contactPerson = 'Contact person is required';
    if (!contactEmail) e.contactEmail = 'Contact email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) e.contactEmail = 'Enter a valid contact email';
    if (!contactPhone) e.contactPhone = 'Contact phone is required';
    else if (!/^\+?[\d\s\-()]{7,15}$/.test(contactPhone)) e.contactPhone = 'Enter a valid phone number';
    if (website && !/^https?:\/\/.+\..+/.test(website)) e.website = 'Enter a valid URL (https://…)';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.warning('Check the form', 'Please fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await companyService.updateCompany(editing._id, form);
        toast.success('Company updated', `${form.name} saved.`);
      } else {
        await companyService.createCompany(form);
        toast.success('Company created', `${form.name} is now a recruiting partner.`);
      }
      setFormOpen(false);
      if (!editing) setPage(1);
      refetch();
    } catch (err) {
      toast.error('Could not save company', getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await companyService.deleteCompany(deleting._id);
      toast.info('Company removed', `${deleting.name} was deleted.`);
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error('Delete failed', getApiError(err).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const kpis = [
    { key: 'total', label: 'Total Companies', value: c.total || 0, icon: Building2, tone: 'primary' },
    { key: 'active', label: 'Active', value: c.active || 0, icon: TrendingUp, tone: 'success' },
    { key: 'web', label: 'With Website', value: c.withWebsite || 0, icon: Globe, tone: 'primary' },
    { key: 'ind', label: 'Industries', value: c.industries || 0, icon: Layers, tone: 'primary' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Confetti trigger={confetti} />

      <Hero
        eyebrow="Training & Placement Cell" compact
        title="Companies"
        subtitle="Recruiting partners hosting placement drives at your institution."
        actions={
          <>
            <DownloadMenu onDownload={handleDownload} exporting={exporting} />
            <Button icon={Plus} onClick={openCreate}>Add Company</Button>
          </>
        }
        aside={
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Ring value={activePct} size={118} stroke={13} color="var(--success)" track="rgba(255,255,255,0.25)" textColor="#fff" big />
            <div style={{ maxWidth: 170 }}>
              <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 700 }}>Active</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.45 }}>Share of partners currently marked active for engagements.</div>
            </div>
          </div>
        }
      />

      <div style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
        <Search size={16} color="var(--text-sub, #64748b)" />
        <span style={{ fontWeight: 600, fontSize: 13 }}>Search</span>
        <div className="search-box" style={{ flex: 1, minWidth: 220 }}>
          <Search size={16} />
          <input className="input" placeholder="Search companies…" value={searchInput}
            onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} aria-label="Search companies" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
        {summary.loading ? (
          kpis.map((k) => <Skeleton key={k.key} variant="card" />)
        ) : summary.error ? (
          kpis.map((k) => (
            <div key={k.key} style={{ ...cardStyle, display: 'flex', alignItems: 'center', color: 'var(--danger-text)' }}>
              <span className="small">Summary unavailable</span>
            </div>
          ))
        ) : (
          kpis.map((k) => <Kpi key={k.key} {...k} />)
        )}
      </div>

      {loading ? (
        <div className="grid-cards" style={{ marginTop: 18 }}>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="card" />)}</div>
      ) : error ? (
        <Card style={{ marginTop: 18 }}><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : companies.length === 0 ? (
        <Card style={{ marginTop: 18 }}><EmptyState icon={Building2} title="No companies yet"
          description="Add your first recruiting partner to start creating drives."
          actions={<Button icon={Plus} onClick={openCreate}>Add Company</Button>} /></Card>
      ) : (
      <>
          {/* Equal-width cards using a fixed column grid — no auto-fit size disparity */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16, marginTop: 18 }}>
            {companies.map((co) => (
              <div key={co._id}
                style={{ ...cardStyle, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .2s, box-shadow .2s, border-color .2s' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 30%, var(--border))'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; e.currentTarget.style.borderColor = ''; }}>
                {/* 3px sky-blue accent top — flat, no gradient */}
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--primary)' }} />
                <div style={{ display: 'flex', gap: 12, marginTop: 4, flex: 1 }}>
                  {/* Avatar — flat primary bg */}
                  <div className="avatar" style={{ width: 42, height: 42, borderRadius: 12, fontSize: 15, flexShrink: 0, background: 'var(--primary)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800 }}>
                    {(co.name || '?').slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                      <div className="card-title" style={{ fontSize: 14.5, lineHeight: 1.3 }}>{co.name}</div>
                      <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{co.industry || '—'}</span>
                    </div>
                    <div className="small muted mt-1">
                      {co.location && <>📍 {co.location}</>}
                      {co.contactPerson && <>{co.location ? ' · ' : ''}👤 {co.contactPerson}</>}
                    </div>
                    {/* Fixed-height description slot so all cards align */}
                    <div className="small muted mt-1" style={{ height: 34, overflow: 'hidden', lineHeight: 1.5 }}>
                      {co.description ? (co.description.length > 85 ? `${co.description.slice(0, 85)}…` : co.description) : ''}
                    </div>
                    <div className="mt-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button size="sm" variant="secondary" icon={Pencil} onClick={() => openEdit(co)}>Edit</Button>
                      {co.website && (
                        <a className="btn btn-sm btn-ghost" href={co.website} target="_blank" rel="noreferrer" style={{ gap: 5 }}>
                          <ExternalLink size={13} /> Website
                        </a>
                      )}
                      {isAdmin ? (
                        <Button size="sm" variant="ghost" icon={Trash2}
                          onClick={() => setDeleting(co)}
                          style={{ color: 'var(--danger-text)', marginLeft: 'auto' }}>Delete</Button>
                      ) : (
                        <span className="small muted" style={{ marginLeft: 'auto', alignSelf: 'center' }}>Admin only</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Pagination page={pagination.page || page} limit={pagination.limit || 12} total={pagination.total || 0} onPage={setPage} />
        </>
      )}

      <Modal
        open={formOpen} onClose={() => setFormOpen(false)} title={editing ? `Edit ${editing.name}` : 'Add Company'} size="lg"
        footer={<>
          <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
          <Button type="submit" form="company-form" loading={saving}>{editing ? 'Save Changes' : 'Create Company'}</Button>
        </>}
      >
        <form id="company-form" onSubmit={save}>
          <div className="form-grid">
            <div className="field"><label htmlFor="c-name">Company name *</label>
              <input id="c-name" className="input" required value={form.name} aria-invalid={!!errors.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Infosys" />
              {errors.name && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.name}</span>}
            </div>
            <div className="field"><label htmlFor="c-ind">Industry</label>
              <input id="c-ind" className="input" value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value })} placeholder="e.g. IT Services" /></div>
            <div className="field"><label htmlFor="c-web">Website</label>
              <input id="c-web" className="input" value={form.website} aria-invalid={!!errors.website}
                onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="https://company.com" />
              {errors.website && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.website}</span>}
            </div>
            <div className="field"><label htmlFor="c-loc">Location *</label>
              <input id="c-loc" className="input" required value={form.location} aria-invalid={!!errors.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru" />
              {errors.location && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.location}</span>}
            </div>
            <div className="field"><label htmlFor="c-cp">Contact person *</label>
              <input id="c-cp" className="input" required value={form.contactPerson} aria-invalid={!!errors.contactPerson}
                onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="e.g. Anita Rao (Campus HR)" />
              {errors.contactPerson && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.contactPerson}</span>}
            </div>
            <div className="field"><label htmlFor="c-ce">Contact email *</label>
              <input id="c-ce" type="email" className="input" required value={form.contactEmail} aria-invalid={!!errors.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="e.g. campus@company.com" />
              {errors.contactEmail && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.contactEmail}</span>}
            </div>
            <div className="field"><label htmlFor="c-phone">Contact phone *</label>
              <input id="c-phone" type="tel" className="input" required value={form.contactPhone} aria-invalid={!!errors.contactPhone}
                onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} placeholder="e.g. +91 98765 43210" />
              {errors.contactPhone && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.contactPhone}</span>}
            </div>
            <div className="field" style={{ flexBasis: '100%' }}><label htmlFor="c-desc">Description</label>
              <textarea id="c-desc" className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What does this company do? Hiring domains, profile, etc." /></div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} onConfirm={confirmDelete}
        title="Delete company?" loading={deleteLoading} confirmLabel="Delete"
        message={`${deleting?.name} will be permanently removed. Drives linked to it remain in audit records.`} />
    </div>
  );
}
