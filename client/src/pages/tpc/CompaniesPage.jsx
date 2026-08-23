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
    const contactEmail = (form.contactEmail || '').trim();

    if (!name) e.name = 'Company name is required';
    else if (name.length < 2) e.name = 'Use at least 2 characters';
    if (website && !/^https?:\/\/.+\..+/.test(website)) e.website = 'Enter a valid URL (https://…)';
    if (contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail)) e.contactEmail = 'Enter a valid contact email';

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
    { key: 'total', label: 'Total Companies', value: c.total || 0, icon: Building2, tone: '#0EA5E9' },
    { key: 'active', label: 'Active', value: c.active || 0, icon: TrendingUp, tone: '#10B981' },
    { key: 'web', label: 'With Website', value: c.withWebsite || 0, icon: Globe, tone: '#8B5CF6' },
    { key: 'ind', label: 'Industries', value: c.industries || 0, icon: Layers, tone: '#F59E0B' },
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
            <Ring value={activePct} size={118} stroke={13} color="#10B981" track="rgba(255,255,255,0.25)" textColor="#fff" big />
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
          <div className="grid-cards" style={{ marginTop: 18 }}>
            {companies.map((co) => (
              <div key={co._id} style={{ ...cardStyle, position: 'relative', overflow: 'hidden', transition: 'transform .2s ease, box-shadow .2s ease' }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 22px 45px -25px rgba(14,165,233,0.6)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #0EA5E9, #6366F1)' }} />
                <div style={{ display: 'flex', gap: 13, marginTop: 4 }}>
                  <div className="avatar" style={{ width: 44, height: 44, borderRadius: 12, fontSize: 15, background: 'linear-gradient(135deg,#0EA5E9,#6366F1)' }}>
                    {(co.name || '?').slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="flex-between">
                      <div className="card-title">{co.name}</div>
                      <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{co.industry || '—'}</span>
                    </div>
                    <div className="small muted mt-1">
                      {co.location && <>📍 {co.location}</>}
                      {co.contactPerson && <>{co.location ? ' · ' : ''}👤 {co.contactPerson}</>}
                    </div>
                    <div className="small muted mt-1" style={{ minHeight: 34 }}>{co.description ? (co.description.length > 90 ? `${co.description.slice(0, 90)}…` : co.description) : ''}</div>
                    <div className="mt-2" style={{ display: 'flex', gap: 8 }}>
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
            <div className="field"><label htmlFor="c-loc">Location</label>
              <input id="c-loc" className="input" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="e.g. Bengaluru" /></div>
            <div className="field"><label htmlFor="c-cp">Contact person</label>
              <input id="c-cp" className="input" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} placeholder="e.g. Anita Rao (Campus HR)" /></div>
            <div className="field"><label htmlFor="c-ce">Contact email</label>
              <input id="c-ce" type="email" className="input" value={form.contactEmail} aria-invalid={!!errors.contactEmail}
                onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="e.g. campus@company.com" />
              {errors.contactEmail && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.contactEmail}</span>}
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label htmlFor="c-desc">Description</label>
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
