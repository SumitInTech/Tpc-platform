import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Megaphone, MapPin, CalendarDays, Search, ShieldCheck, TrendingUp, Filter, Building2, X, Layers } from 'lucide-react';
import driveService from '../../services/driveService';
import companyService from '../../services/companyService';
import useApi from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import Button from '../../components/common/Button';
import DownloadMenu from '../../components/common/DownloadMenu';
import Confetti from '../../components/common/Confetti';
import { DRIVE_STATUS } from '../../constants';
import { formatLPA, formatDate, labelize } from '../../utils/formatters';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { exportDrivesToExcel, exportDrivesToPDF } from '../../utils/recordExport';
import { Hero, Kpi, Ring, Segmented, SectionHeader, GlassPanel, KpiGrid, cardStyle } from '../../components/dashboard/primitives';

const STATUS_META = {
  PUBLISHED: { color: 'success', label: 'Published' },
  DRAFT: { color: 'warning', label: 'Draft' },
  CLOSED: { color: 'primary', label: 'Closed' },
  COMPLETED: { color: 'info', label: 'Completed' },
  CANCELLED: { color: 'danger', label: 'Cancelled' },
};

export default function DrivesPage() {
  const { toast } = useNotification();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [exporting, setExporting] = useState('');
  const [confetti, setConfetti] = useState(0);

  const filterKey = `${status}|${companyId}`;
  const summary = useApi(
    () => driveService.getDriveSummary({ ...(status ? { status } : {}), ...(companyId ? { company: companyId } : {}) }),
    [filterKey]
  );
  const companiesRes = useApi(() => companyService.getCompanies({ limit: 100 }), []);
  const { data: res, loading, error, refetch } = useApi(
    () => driveService.getDrives({ page, limit: 9, ...(status ? { status } : {}), ...(companyId ? { company: companyId } : {}) }),
    [page, status, companyId]
  );
  const drives = res?.data || [];
  const pagination = res?.pagination || {};
  const s = summary.data?.data || {};
  const publishedPct = s.total ? Math.round((s.published / s.total) * 100) : 0;

  const statusOptions = [
    { value: '', label: 'All', color: 'primary', count: s.total },
    ...DRIVE_STATUS.map((st) => ({
      value: st,
      label: STATUS_META[st]?.label || labelize(st),
      color: STATUS_META[st]?.color || 'primary',
      count: s[st?.toLowerCase()] ?? 0,
      dot: true,
    })),
  ];

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const all = await driveService.getDrives({
        page: 1, limit: 10000,
        ...(status ? { status } : {}),
        ...(companyId ? { company: companyId } : {}),
      });
      const rows = all?.data || [];
      if (rows.length === 0) {
        toast.info('Nothing to export', 'No drives match the current filters.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') exportDrivesToExcel(rows, `drives-${stamp}`);
      else exportDrivesToPDF(rows, `drives-${stamp}`);
      toast.success('Download ready', `${rows.length} drive(s) exported as ${format.toUpperCase()}.`);
      setConfetti((c) => c + 1);
    } catch (err) {
      toast.error('Export failed', getApiError(err).message);
    } finally {
      setExporting('');
    }
  };

  const kpis = [
    { key: 'total', label: 'Total Drives', value: s.total || 0, icon: Megaphone, tone: 'primary' },
    { key: 'published', label: 'Published', value: s.published || 0, icon: TrendingUp, tone: 'success' },
    { key: 'draft', label: 'Draft', value: s.draft || 0, icon: CalendarDays, tone: 'warning' },
    { key: 'closed', label: 'Closed / Done', value: (s.closed || 0) + (s.completed || 0), icon: ShieldCheck, tone: 'primary' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Confetti trigger={confetti} />

      <Hero
        eyebrow="Training & Placement Cell" compact
        title="Placement Drives"
        subtitle="Each drive carries its own eligibility rules, evaluated consistently by the backend for every student, every time."
        actions={
          <>
            <DownloadMenu onDownload={handleDownload} exporting={exporting} />
            <Link to="/tpc/drives/create" className="btn btn-primary" style={{ textDecoration: 'none' }}>
              <Plus size={16} /> Create Drive
            </Link>
          </>
        }
        aside={
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Ring value={publishedPct} size={118} stroke={13} color="var(--success)" track="rgba(255,255,255,0.25)" textColor="#fff" big />
            <div style={{ maxWidth: 170 }}>
              <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 700 }}>Published</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.45 }}>Share of drives currently live and open to applications.</div>
            </div>
          </div>
        }
      />

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #4338CA)" style={{ marginTop: 18 }}>
        <SectionHeader
          icon={Filter}
          title="Refine drives"
          subtitle="Slice the pipeline by status or recruiting partner."
          tone="primary"
          action={(status || companyId) && (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setStatus(''); setCompanyId(''); setPage(1); }}>
              <X size={13} /> Clear
            </button>
          )}
        />
        <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 420px', minWidth: 280 }}>
            <Segmented options={statusOptions} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', minWidth: 240 }}>
            <Building2 size={16} color="var(--text-sub, #64748b)" />
            <select className="input" value={companyId} onChange={(e) => { setCompanyId(e.target.value); setPage(1); }} aria-label="Filter by company" style={{ minWidth: 200 }}>
              <option value="">All Companies</option>
              {(companiesRes.data?.data || []).map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
        </div>
        <div className="small muted" style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Layers size={13} /> Showing <strong style={{ color: 'var(--text)' }}>&nbsp;{pagination.total || drives.length}&nbsp;</strong> drive(s) for the current view.
        </div>
      </GlassPanel>

      <div style={{ marginTop: 18 }}>
        {summary.loading ? (
          <KpiGrid>{kpis.map((k) => <Skeleton key={k.key} variant="card" />)}</KpiGrid>
        ) : summary.error ? (
          <KpiGrid>{kpis.map((k) => (
            <div key={k.key} style={{ ...cardStyle, display: 'flex', alignItems: 'center', color: 'var(--danger-text)' }}>
              <span className="small">Summary unavailable</span>
            </div>
          ))}</KpiGrid>
        ) : (
          <KpiGrid>{kpis.map((k) => <Kpi key={k.key} {...k} />)}</KpiGrid>
        )}
      </div>

      {loading ? (
        <div className="grid-cards" style={{ marginTop: 18 }}>{[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}</div>
      ) : error ? (
        <Card style={{ marginTop: 18 }}><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : drives.length === 0 ? (
        <Card style={{ marginTop: 18 }}>
          <EmptyState icon={Megaphone} title="No drives found"
            description="Create a drive, configure its eligibility rules and publish it to open applications."
            actions={<Link to="/tpc/drives/create" className="btn btn-primary"><Plus size={16} /> Create Drive</Link>} />
        </Card>
      ) : (
        <>
          <div className="grid-cards" style={{ marginTop: 18 }}>
            {drives.map((d) => {
              const ruleCount = d.eligibilityRules?.rules?.length || 0;
              const meta = STATUS_META[d.status] || { color: 'primary' };
              return (
                <Link key={d._id} to={`/tpc/drives/${d._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <div style={{ ...cardStyle, position: 'relative', overflow: 'hidden', height: '100%', transition: 'transform .2s ease, box-shadow .2s ease' }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-6px)'; e.currentTarget.style.boxShadow = '0 26px 50px -26px rgba(99,102,241,0.65)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; }}>
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${meta.color}, color-mix(in srgb, ${meta.color} 45%, #1F2937))` }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                      <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-soft-text)' }}>
                        {d.companyId?.name || 'Company'}
                      </span>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700, color: meta.color }}>
                        <span style={{ width: 8, height: 8, borderRadius: 999, background: meta.color, boxShadow: `0 0 0 3px ${meta.color}22` }} />
                        {meta.label}
                      </span>
                    </div>
                    <div className="card-title" style={{ fontSize: 16, marginTop: 12 }}>{d.title}</div>
                    <div className="small muted mt-1">{d.jobRole} · {labelize(d.jobType)}</div>

                    <div className="mt-3" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
                      <strong style={{ color: 'var(--success-text)', fontSize: 16 }}>{formatLPA(d.package, d.currency)}</strong>
                      <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={13} /> {d.location || 'On campus'}
                      </span>
                    </div>

                    <hr className="divider" />

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                        <ShieldCheck size={14} color={meta.color} /> {ruleCount === 0 ? 'No rules configured' : `${ruleCount} eligibility rule${ruleCount > 1 ? 's' : ''}`}
                      </span>
                      <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                        <CalendarDays size={13} /> {formatDate(d.applicationDeadline)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <Pagination page={pagination.page || page} limit={pagination.limit || 9} total={pagination.total || 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}
