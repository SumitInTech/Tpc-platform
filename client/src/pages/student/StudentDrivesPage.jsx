import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase, Send, Clock, TrendingUp, MapPin, CalendarDays, Search, ArrowRight,
  CheckCircle2, Filter, Sparkles,
} from 'lucide-react';
import driveService from '../../services/driveService';
import applicationService from '../../services/applicationService';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import { Hero, Kpi, KpiGrid, GlassPanel, SectionHeader, Segmented, cardStyle } from '../../components/dashboard/primitives';
import { formatLPA, formatDate, labelize } from '../../utils/formatters';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const lift = (e) => { e.currentTarget.style.transform = 'translateY(-5px)'; e.currentTarget.style.boxShadow = '0 26px 50px -28px rgba(99,102,241,0.55)'; };
const rest = (e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; };

export default function StudentDrivesPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [filter, setFilter] = useState('');
  const search = useDebounce(searchInput);

  const drivesRes = useApi(() => driveService.getDrives({ page, limit: 9 }), [page]);
  const appsRes = useApi(() => applicationService.getApplications({ limit: 200 }), []);

  const drives = drivesRes.data?.data || [];
  const pagination = drivesRes.data?.pagination || {};

  const myApps = useMemo(() => {
    const m = {};
    (appsRes.data?.data || []).forEach((a) => { if (a.driveId?._id) m[a.driveId._id] = a; });
    return m;
  }, [appsRes.data]);

  const appliedCount = Object.keys(myApps).length;
  const closesSoon = drives.filter((d) => {
    if (myApps[d._id] || !d.applicationDeadline) return false;
    const diff = new Date(d.applicationDeadline).getTime() - Date.now();
    return diff > 0 && diff < 7 * 864e5;
  }).length;
  const avgPkg = drives.length ? drives.reduce((s, d) => s + (Number(d.package) || 0), 0) / drives.length : 0;

  const kpis = [
    { key: 'open', label: 'Open Drives', value: drives.length, icon: Briefcase, tone: '#6366F1' },
    { key: 'applied', label: 'You Applied', value: appliedCount, icon: Send, tone: '#06B6D4' },
    { key: 'soon', label: 'Closes This Week', value: closesSoon, icon: Clock, tone: '#F59E0B' },
    { key: 'pkg', label: 'Avg Package', value: avgPkg, format: (v) => formatLPA(v), icon: TrendingUp, tone: '#10B981' },
  ];

  const filtered = drives.filter((d) => {
    if (filter === 'applied' && !myApps[d._id]) return false;
    if (filter === 'available' && myApps[d._id]) return false;
    if (search) {
      const hay = `${d.companyId?.name || ''} ${d.title} ${d.jobRole}`.toLowerCase();
      if (!hay.includes(search.toLowerCase())) return false;
    }
    return true;
  });

  const segOptions = [
    { value: '', label: 'All Drives', color: '#6366F1', count: drives.length },
    { value: 'applied', label: 'Applied', color: '#06B6D4', count: appliedCount, dot: true },
    { value: 'available', label: 'Available', color: '#10B981', count: drives.length - appliedCount, dot: true },
  ];

  return (
    <div style={{ fontFamily: FONT }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="Placement Drives"
        subtitle="Live drives accepting applications. Open one to see your rule-by-rule eligibility — evaluated by the backend engine in real time."
        compact
        actions={
          <button onClick={() => navigate('/student/applications')} className="btn-shimmer"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.16)' }}>
            <Send size={15} /> My Applications
          </button>
        }
      />

      <div style={{ marginTop: 18 }}>
        {drivesRes.loading ? (
          <KpiGrid>{kpis.map((k) => <Skeleton key={k.key} variant="card" />)}</KpiGrid>
        ) : (
          <KpiGrid>{kpis.map((k) => <Kpi key={k.key} {...k} />)}</KpiGrid>
        )}
      </div>

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #06B6D4)" className="mb-3 mt-3" style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} color="var(--text-sub, #64748b)" />
        <span style={{ fontWeight: 600, fontSize: 13 }}>Filter</span>
        <Segmented options={segOptions} value={filter} onChange={setFilter} />
        <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
          <Search size={16} />
          <input className="input" placeholder="Search company or role…" value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)} aria-label="Search drives" />
        </div>
      </GlassPanel>

      {drivesRes.loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
          {[1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
      ) : drivesRes.error ? (
        <div style={{ ...cardStyle }}><ErrorState message={drivesRes.error.message} onRetry={() => drivesRes.refetch()} /></div>
      ) : filtered.length === 0 ? (
        <div style={{ ...cardStyle }}>
          <EmptyState icon={Briefcase} title={search || filter ? 'No matching drives' : 'No open drives right now'}
            description={search || filter ? 'Try a different filter or search term.' : 'Check back soon — new drives appear here the moment the placement cell publishes them.'} />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {filtered.map((d) => {
              const app = myApps[d._id];
              const closed = d.applicationDeadline && new Date(d.applicationDeadline).getTime() <= Date.now();
              return (
                <div
                  key={d._id}
                  onClick={() => navigate(`/student/drives/${d._id}`)}
                  onMouseEnter={lift} onMouseLeave={rest}
                  style={{ ...cardStyle, position: 'relative', overflow: 'hidden', cursor: 'pointer', transition: 'transform .2s ease, box-shadow .2s ease' }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #6366F1, #8B5CF6)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <span className="badge" style={{ background: 'color-mix(in srgb, #6366F1 15%, transparent)', color: '#4338CA', fontWeight: 700 }}>
                      {d.companyId?.name || 'Company'}
                    </span>
                    {app ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: 'var(--info-text)' }}>
                        <CheckCircle2 size={13} /> Applied
                      </span>
                    ) : closed ? (
                      <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)' }}>Closed</span>
                    ) : null}
                  </div>

                  <div style={{ fontWeight: 800, fontSize: 16, marginTop: 10 }}>{d.title}</div>
                  <div className="small muted mt-1">{d.jobRole} · {labelize(d.jobType)}</div>

                  <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'center', marginTop: 12 }}>
                    <strong style={{ color: 'var(--success-text)', fontSize: 15 }}>{formatLPA(d.package, d.currency)}</strong>
                    <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <MapPin size={13} /> {d.location || 'On campus'}
                    </span>
                  </div>

                  <hr className="divider" />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <CalendarDays size={13} /> {closed ? 'Closed' : `Apply by ${formatDate(d.applicationDeadline)}`}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#6366F1', fontWeight: 700, fontSize: 13 }}>
                      Open <ArrowRight size={14} />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <Pagination page={pagination.page || page} limit={pagination.limit || 9} total={pagination.total || 0} onPage={setPage} />
        </>
      )}
    </div>
  );
}
