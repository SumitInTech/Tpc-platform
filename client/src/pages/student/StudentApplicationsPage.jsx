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
    { value: '', label: 'All', color: 'primary', count: apps.length },
    ...stages.map((s) => ({ value: s, label: labelize(s), color: 'info', count: counts[s], dot: true })),
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

      {/* ── Status stats — flat flex row, equal fixed-width boxes ── */}
      <div className="mt-3" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {appsRes.loading
          ? stages.slice(0, 4).map((s) => (
              <div key={s} style={{ flex: '1 1 120px', height: 72, borderRadius: 'var(--radius)', background: 'var(--surface-2)', border: '1px solid var(--border)' }} className="skeleton" />
            ))
          : stages.map((s) => {
              const cnt = counts[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFilter(filter === s ? '' : s)}
                  style={{
                    flex: '1 1 120px', minWidth: 110, maxWidth: 180,
                    padding: '12px 14px', borderRadius: 'var(--radius)',
                    border: `1.5px solid ${filter === s ? 'var(--primary)' : 'var(--border)'}`,
                    background: filter === s ? 'var(--primary-soft)' : 'var(--surface)',
                    textAlign: 'left', cursor: 'pointer',
                    transition: 'border-color 150ms, background 150ms',
                  }}
                >
                  <div style={{ fontSize: 22, fontWeight: 800, color: filter === s ? 'var(--primary-dark)' : 'var(--text)', lineHeight: 1 }}>{cnt}</div>
                  <div style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-muted)', marginTop: 3 }}>{labelize(s)}</div>
                </button>
              );
            })}
      </div>

      {!appsRes.loading && !appsRes.error && (
        <GlassPanel className="mb-3 mt-3" style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Filter size={16} color="var(--text-muted)" />
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
          {[1, 2, 3].map((i) => <div key={i} style={{ height: 160, borderRadius: 'var(--radius)', background: 'var(--surface-2)' }} className="skeleton" />)}
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
            <div key={a._id} onClick={() => setOpenId(a._id)}
              style={{ ...cardStyle, position: 'relative', cursor: 'pointer', overflow: 'hidden', transition: 'transform .2s ease, box-shadow .2s ease, border-color .2s ease' }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; e.currentTarget.style.borderColor = 'color-mix(in srgb, var(--primary) 30%, var(--border))'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; e.currentTarget.style.borderColor = cardStyle.border?.replace('1px solid ', ''); }}
            >
              {/* 3px sky-blue top accent — no gradient */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'var(--primary)', borderRadius: 'var(--radius) var(--radius) 0 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-soft-text)', fontWeight: 700 }}>
                  {a.driveId?.companyId?.name || 'Company'}
                </span>
                <Badge status={a.status} />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, marginTop: 10 }}>{a.driveId?.title || 'Drive'}</div>
              <div className="small muted mt-1">{a.driveId?.jobRole} · {labelize(a.driveId?.jobType)}</div>

              {a.highlightedSkills?.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
                  {a.highlightedSkills.slice(0, 5).map((s) => (
                    <span key={s} className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{s}</span>
                  ))}
                </div>
              )}

              <hr className="divider" />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <CalendarDays size={13} /> Applied {timeAgo(a.appliedAt)}
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: 'var(--primary)', fontWeight: 650 }}>
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

          <GlassPanel className="mb-3" style={{ ...cardStyle }}>
            <SectionHeader title="Status Timeline" icon={Send} subtitle="How your application is progressing" />
            <MyTimeline history={open.statusHistory} />
          </GlassPanel>

          {open.eligibilitySnapshot && (
            <GlassPanel className="mb-3" style={{ ...cardStyle }}>
              <SectionHeader title="Eligibility At Apply" icon={Sparkles} subtitle="Rules evaluated when you submitted" tone="success" />
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
