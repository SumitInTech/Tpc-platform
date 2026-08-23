import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, ChevronDown, X, Sparkles, Building2, MapPin, CalendarDays, CheckCircle2,
  Send, Search, ArrowUpRight, ListChecks, Filter, XCircle,
} from 'lucide-react';
import applicationService from '../../services/applicationService';
import useApi from '../../hooks/useApi';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Hero, Kpi, KpiGrid, GlassPanel, SectionHeader, Segmented, cardStyle } from '../../components/dashboard/primitives';
import { formatLPA, formatDate, labelize, timeAgo } from '../../utils/formatters';
import { APPLICATION_FLOW } from '../../constants';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function EligibilitySnapshotView({ result }) {
  if (!result) return null;
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        {result.eligible ? (
          <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', padding: '6px 12px' }}><CheckCircle2 size={15} /> Eligible</span>
        ) : (
          <span className="badge" style={{ background: 'var(--danger-bg)', color: 'var(--danger-text)', padding: '6px 12px' }}><XCircle size={15} /> Not Eligible</span>
        )}
        <span className="small muted">{result.rules?.length || 0} checks</span>
      </div>
      {(result.rules || []).map((r, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', borderRadius: 10, background: 'var(--surface-2)', marginBottom: 8 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{r.label}</div>
            <div className="small muted">{r.detail}</div>
          </div>
          {r.pass ? <CheckCircle2 size={18} color="var(--success-text)" /> : <XCircle size={18} color="var(--danger-text)" />}
        </div>
      ))}
    </div>
  );
}

function MyTimeline({ history }) {
  if (!history?.length) return <div className="small muted">No status updates yet.</div>;
  return (
    <ul className="timeline-list">
      {history.map((h, i) => (
        <li key={i} className={i === 0 ? 'is-latest' : ''}>
          <span className="dot" />
          <div>
            <div style={{ fontWeight: 700 }}>{labelize(h.status)}</div>
            <div className="small muted">{h.note || 'Status updated'}{h.changedAt ? ` · ${timeAgo(h.changedAt)}` : ''}</div>
          </div>
        </li>
      ))}
    </ul>
  );
}

const lift = (e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 46px -26px rgba(99,102,241,0.5)'; };
const rest = (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; };

export default function StudentApplicationsPage() {
  const navigate = useNavigate();
  const [openId, setOpenId] = useState(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const appsRes = useApi(() => applicationService.getApplications({ limit: 200 }), []);
  const apps = appsRes.data?.data || [];

  const counts = useMemo(() => {
    const c = {};
    APPLICATION_FLOW.forEach((s) => (c[s] = 0));
    apps.forEach((a) => { if (c[a.status] !== undefined) c[a.status] += 1; });
    return c;
  }, [apps]);
  const selectedCount = apps.filter((a) => a.status === 'SELECTED').length;

  const filtered = apps.filter((a) => {
    if (filter && a.status !== filter) return false;
    if (search) {
      const hay = `${a.driveId?.companyId?.name || ''} ${a.driveId?.title || ''}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const stages = APPLICATION_FLOW;
  const segOptions = [
    { value: '', label: 'All', color: '#6366F1', count: apps.length },
    ...stages.map((s) => ({ value: s, label: labelize(s), color: 'var(--info-text)', count: counts[s], dot: true })),
  ];

  const open = apps.find((a) => a._id === openId);

  return (
    <div style={{ fontFamily: FONT }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="My Applications"
        subtitle="Every drive you have applied to, with its live status and the eligibility snapshot captured at the moment you applied."
        compact
      />

      <div className="mt-3">
        {appsRes.loading ? (
          <KpiGrid>{stages.slice(0, 4).map((s) => <Skeleton key={s} variant="card" />)}</KpiGrid>
        ) : (
          <KpiGrid>
            {stages.map((s) => (
              <Kpi key={s} label={labelize(s)} value={counts[s]} icon={ListChecks} tone="var(--info-text)" />
            ))}
            <Kpi label="Selected" value={selectedCount} icon={CheckCircle2} tone="var(--success-text)" />
          </KpiGrid>
        )}
      </div>

      {!appsRes.loading && !appsRes.error && (
        <GlassPanel gradient="linear-gradient(90deg, #6366F1, #8B5CF6)" className="mb-3 mt-3" style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--text-sub, #64748b)" />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Stage</span>
          <Segmented options={segOptions} value={filter} onChange={setFilter} />
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} />
            <input className="input" placeholder="Search company…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search applications" />
          </div>
        </GlassPanel>
      )}

      {appsRes.loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : appsRes.error ? (
        <div style={{ ...cardStyle }}><ErrorState message={appsRes.error.message} onRetry={() => appsRes.refetch()} /></div>
      ) : apps.length === 0 ? (
        <div style={{ ...cardStyle }}>
          <EmptyState icon={FileText} title="No applications yet"
            description="When you apply to a drive, it will show up here with a live status tracker." />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle }}>
          <EmptyState icon={FileText} title="No matches" description="Adjust the stage filter or search to see more." />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((a) => (
            <div key={a._id} onClick={() => setOpenId(a._id)} onMouseEnter={lift} onMouseLeave={rest}
              style={{ ...cardStyle, position: 'relative', cursor: 'pointer', overflow: 'hidden', transition: 'transform .2s ease, box-shadow .2s ease' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366F1, #06B6D4)' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span className="badge" style={{ background: 'color-mix(in srgb, #6366F1 15%, transparent)', color: '#4338CA', fontWeight: 700 }}>
                  {a.driveId?.companyId?.name || 'Company'}
                </span>
                <Badge status={a.status} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 10 }}>{a.driveId?.title || 'Drive'}</div>
              <div className="small muted mt-1">{a.driveId?.jobRole} · {labelize(a.driveId?.jobType)}</div>

              {a.highlightedSkills?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {a.highlightedSkills.slice(0, 5).map((s) => (
                    <span key={s} className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-sub)' }}>{s}</span>
                  ))}
                </div>
              )}

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CalendarDays size={13} /> Applied {timeAgo(a.appliedAt)}
                </span>
                <span className="link" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  View <ArrowUpRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {open && (
        <Modal open onClose={() => setOpenId(null)} size="lg" title={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} /> {open.driveId?.companyId?.name || 'Company'}
          </span>
        }>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center', marginBottom: 6 }}>
            <strong style={{ fontSize: 18 }}>{open.driveId?.title}</strong>
            <Badge status={open.status} />
          </div>
          <div className="small muted" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 14 }}>
            <span><MapPin size={13} style={{ verticalAlign: '-2px' }} /> {open.driveId?.location || 'On campus'}</span>
            <span>{formatLPA(open.driveId?.package, open.driveId?.currency)}</span>
            <span>Applied {formatDate(open.appliedAt)}</span>
          </div>

          <GlassPanel gradient="linear-gradient(90deg,#6366F1,#06B6D4)" className="mb-3" style={{ ...cardStyle }}>
            <SectionHeader title="Status Timeline" icon={Send} subtitle="How your application is progressing" />
            <MyTimeline history={open.statusHistory} />
          </GlassPanel>

          {open.eligibilitySnapshot && (
            <GlassPanel gradient="linear-gradient(90deg,#10B981,#06B6D4)" className="mb-3" style={{ ...cardStyle }}>
              <SectionHeader title="Eligibility At Apply" icon={Sparkles} subtitle="Rules evaluated when you submitted" />
              <EligibilitySnapshotView result={open.eligibilitySnapshot} />
            </GlassPanel>
          )}

          {open.resumeName && (
            <div className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <FileText size={14} /> Resume: {open.resumeName}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}
