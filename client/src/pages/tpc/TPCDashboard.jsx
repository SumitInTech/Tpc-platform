import { useState, useEffect, useRef, Fragment } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Megaphone, Building2, ClipboardList, Handshake, Award, Percent,
  Settings, ShieldCheck, Lock, Eye, SlidersHorizontal, FileCheck, BarChart3,
  Plus, Send, Download, ArrowUpRight, TrendingUp, Sparkles, Radio, RefreshCw,
  IndianRupee, Activity,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Label, Sector,
} from 'recharts';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import reportService from '../../services/reportService';
import auditService from '../../services/auditService';
import applicationService from '../../services/applicationService';
import useApi from '../../hooks/useApi';
import { formatLPA, timeAgo } from '../../utils/formatters';
import { getChartTheme } from '../../utils/chartTheme';
import { Hero, Kpi, KpiGrid, GlassPanel, SectionHeader, Ring, cardStyle } from '../../components/dashboard/primitives';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const PIE_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444'];

const PIPELINE = [
  { icon: Settings, label: 'Configure' },
  { icon: ShieldCheck, label: 'Evaluate' },
  { icon: Lock, label: 'Gate' },
  { icon: Eye, label: 'Track' },
  { icon: SlidersHorizontal, label: 'Enforce' },
  { icon: FileCheck, label: 'Record' },
  { icon: BarChart3, label: 'Report' },
];

function PlacementGauge({ value, loading, sub, avg, median, highest }) {
  return (
    <div style={{ display: 'flex', gap: 22, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ position: 'relative', flex: '0 0 auto' }}>
        <Ring value={value || 0} size={150} stroke={15} color="#10B981" track="var(--border, #e2e8f0)" textColor="var(--text, #0f172a)" big />
      </div>
      <div style={{ flex: 1, minWidth: 200, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="small muted" style={{ fontWeight: 700 }}>{loading ? 'Computing…' : sub}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><IndianRupee size={15} style={{ color: '#F59E0B' }} /><div style={{ display: 'flex', flexDirection: 'column' }}><span className="small muted">Avg Package</span><strong>{loading ? '—' : formatLPA(avg)}</strong></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><IndianRupee size={15} style={{ color: '#06B6D4' }} /><div style={{ display: 'flex', flexDirection: 'column' }}><span className="small muted">Median Package</span><strong>{loading ? '—' : formatLPA(median)}</strong></div></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><IndianRupee size={15} style={{ color: '#EF4444' }} /><div style={{ display: 'flex', flexDirection: 'column' }}><span className="small muted">Highest Package</span><strong>{loading ? '—' : formatLPA(highest)}</strong></div></div>
      </div>
    </div>
  );
}

function renderActiveShape(props) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 8} startAngle={startAngle} endAngle={endAngle} fill={fill} cornerRadius={4} />
      <Sector cx={cx} cy={cy} innerRadius={outerRadius + 12} outerRadius={outerRadius + 14} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.4} />
    </g>
  );
}

export default function TPCDashboard() {
  const { resolved } = useTheme();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isAdmin = user?.role === 'ADMIN';
  const overview = useApi(() => reportService.getOverview());
  const branchWise = useApi(() => reportService.getBranchWise());
  const companyWise = useApi(() => reportService.getCompanyWise());
  const pkgDist = useApi(() => reportService.getPackageDistribution());
  const yearWise = useApi(() => reportService.getYearWise());
  const activity = useApi(
    () => (isAdmin
      ? auditService.getAuditLogs({ limit: 7 })
      : applicationService.getApplications({ limit: 6 })),
    [isAdmin]
  );

  const [activePie, setActivePie] = useState(0);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [now, setNow] = useState(Date.now());

  const refreshRef = useRef(() => {});
  refreshRef.current = () => {
    overview.refetch();
    branchWise.refetch();
    companyWise.refetch();
    pkgDist.refetch();
    yearWise.refetch();
    activity.refetch();
    setLastUpdated(new Date());
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === 'visible') refreshRef.current();
    }, 30000);
    const tick = setInterval(() => setNow(Date.now()), 5000);
    return () => { clearInterval(id); clearInterval(tick); };
  }, []);

  useEffect(() => {
    if (overview.data) setLastUpdated(new Date());
  }, [overview.data]);

  const secsAgo = lastUpdated ? Math.max(0, Math.round((now - lastUpdated.getTime()) / 1000)) : null;

  const chart = getChartTheme(resolved);
  const axis = chart.axis;
  const grid = chart.grid;
  const tooltipStyle = chart.tooltipStyle;

  const o = overview.data?.data || {};
  const pkgLabels = ['₹0–5L', '₹5–10L', '₹10–15L', '₹15–20L', '₹20L+'];
  const pkgData = (pkgDist.data?.data || []).map((d, i) => ({ name: pkgLabels[i] || `Bucket ${i}`, value: d.count }));
  const pkgTotal = pkgData.reduce((s, d) => s + d.value, 0);
  const yData = (yearWise.data?.data || []).map((y) => ({ name: y._id, placements: y.placements, avgPackage: Number((y.avgPackage || 0).toFixed(1)) }));
  const placementsSeries = yData.map((y) => y.placements);
  const pkgSeries = yData.map((y) => y.avgPackage);
  const topBranch = (branchWise.data?.data || []).slice().sort((a, b) => b.count - a.count)[0];
  const insight = topBranch
    ? `${topBranch._id} leads with ${topBranch.count} placements`
    : 'Awaiting first placement records';

  const stats = [
    { icon: Users, label: 'Total Students', value: o.totalStudents ?? 0, tone: '#6366F1', spark: placementsSeries, onClick: () => navigate('/tpc/students') },
    { icon: Megaphone, label: 'Active Drives', value: o.activeDrives ?? 0, tone: '#06B6D4', onClick: () => navigate('/tpc/drives') },
    { icon: Building2, label: 'Companies', value: o.totalCompanies ?? 0, tone: '#F59E0B', onClick: () => navigate('/tpc/companies') },
    { icon: ClipboardList, label: 'Applications', value: o.totalApplications ?? 0, tone: '#8B5CF6', spark: placementsSeries, onClick: () => navigate('/tpc/applications') },
    { icon: Handshake, label: 'Offers', value: o.totalOffers ?? 0, tone: '#EC4899', spark: placementsSeries, onClick: () => navigate('/tpc/offers') },
    { icon: Award, label: 'Placed Students', value: o.placedStudents ?? 0, tone: '#10B981', spark: placementsSeries, onClick: () => navigate('/tpc/placements') },
    { icon: IndianRupee, label: 'Avg Package', value: o.averagePackage ?? 0, format: (v) => formatLPA(v), tone: '#F59E0B', spark: pkgSeries, onClick: () => navigate('/tpc/reports') },
  ];

  const livePill = (
    <button type="button" onClick={() => refreshRef.current()} title="Click to refresh now"
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', padding: '8px 14px', borderRadius: 999, fontWeight: 700, fontSize: 12.5, color: 'var(--success-text)' }}>
      <span style={{ width: 9, height: 9, borderRadius: 999, background: '#10B981', boxShadow: '0 0 0 0 rgba(16,185,129,0.6)', animation: 'live-pulse 1.6s infinite' }} />
      Live
      <span style={{ color: 'var(--text-muted)' }}>{secsAgo == null ? 'syncing…' : secsAgo < 2 ? 'just now' : `${secsAgo}s ago`}</span>
      <RefreshCw size={13} style={{ marginLeft: 2 }} />
    </button>
  );

  const heroAside = (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      {livePill}
      <div style={{ display: 'flex', gap: 8 }}>
        <span style={{ display: 'grid', placeItems: 'center', width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', color: '#fff', boxShadow: '0 14px 28px -14px #6366F1' }}><Radio size={18} /></span>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="Placement Operations Command Center"
        subtitle="Live view of drives, applications, offers and placement outcomes — every number below is computed from auditable records."
        compact
        aside={heroAside}
        actions={
          <>
            <button className="btn-shimmer" onClick={() => navigate('/tpc/drives/new')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, color: '#fff', background: 'linear-gradient(135deg,#6366F1,#8B5CF6)' }}><Plus size={15} /> New Drive</button>
            <button onClick={() => navigate('/tpc/offers')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.14)' }}><Send size={15} /> Create Offer</button>
            <button onClick={() => navigate('/tpc/reports')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(255,255,255,0.4)', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.14)' }}><Download size={15} /> Export</button>
          </>
        }
      />

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #8B5CF6)" className="mb-3 mt-3" style={{ ...cardStyle }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, overflowX: 'auto' }}>
          {PIPELINE.map((s, i) => {
            const last = i === PIPELINE.length - 1;
            return (
              <Fragment key={s.label}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, minWidth: 70 }}>
                  <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, borderRadius: 13, color: '#fff', background: last ? 'linear-gradient(135deg,#10B981,#06B6D4)' : 'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow: last ? '0 14px 28px -14px #10B981' : '0 14px 28px -16px #6366F1', animation: last ? 'live-pulse 1.8s infinite' : 'none' }}>
                    <s.icon size={18} />
                  </span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text-sub, #64748b)', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                {i < PIPELINE.length - 1 && (
                  <span style={{ position: 'relative', flex: 1, minWidth: 24, height: 3, borderRadius: 999, background: 'var(--border, #e2e8f0)', overflow: 'hidden' }}>
                    <span style={{ position: 'absolute', top: 0, bottom: 0, width: '40%', borderRadius: 999, background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', animation: 'journey-flow 2.6s linear infinite' }} />
                  </span>
                )}
              </Fragment>
            );
          })}
        </div>
      </GlassPanel>

      {overview.error ? (
        <div style={{ ...cardStyle }}><ErrorState message={overview.error.message} onRetry={() => overview.refetch()} /></div>
      ) : (
        <>
          <GlassPanel gradient="linear-gradient(90deg, #10B981, #06B6D4)" className="mb-3" style={{ ...cardStyle }}>
            <SectionHeader icon={TrendingUp} title="Placement Health" subtitle="Overall placement rate with headline compensation metrics" tone="#10B981" />
            <PlacementGauge value={o.placementRate ?? 0} loading={overview.loading} sub={overview.loading ? '' : insight} avg={o.averagePackage} median={o.medianPackage} highest={o.highestPackage} />
          </GlassPanel>

          <div style={{ marginTop: 16 }}>
            {overview.loading ? (
              <KpiGrid>{stats.map((s) => <Skeleton key={s.label} variant="card" />)}</KpiGrid>
            ) : (
              <KpiGrid>{stats.map((s) => <Kpi key={s.label} {...s} />)}</KpiGrid>
            )}
          </div>
        </>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 18 }}>
        <GlassPanel style={{ ...cardStyle }}>
          <div className="flex-between">
            <div>
              <div className="card-title">Placement by Branch</div>
              <div className="card-sub">Placed students per branch — all recorded placement years</div>
            </div>
            <button className="chip-link" onClick={() => navigate('/tpc/students')}>View <ArrowUpRight size={13} /></button>
          </div>
          <div style={{ height: 260, marginTop: 14 }}>
            {branchWise.loading ? (
              <Skeleton variant="card" style={{ height: '100%' }} />
            ) : branchWise.error ? (
              <ErrorState message="Could not load chart." onRetry={() => branchWise.refetch()} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(branchWise.data?.data || []).map((b) => ({ name: b._id, placements: b.count }))}>
                  <defs>
                    <linearGradient id="branchGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" />
                      <stop offset="100%" stopColor="#6366F1" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                  <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                  <YAxis tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
                  <Bar dataKey="placements" fill="url(#branchGrad)" radius={[6, 6, 0, 0]} maxBarSize={44} animationDuration={900} className="chart-bar" onClick={() => navigate('/tpc/students')} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>

        <GlassPanel style={{ ...cardStyle }}>
          <div className="card-title">Package Distribution</div>
          <div className="card-sub">How accepted offers spread across package bands</div>
          <div style={{ height: 260, marginTop: 14 }}>
            {pkgDist.loading ? (
              <Skeleton variant="card" style={{ height: '100%' }} />
            ) : pkgData.length === 0 ? (
              <div className="state-box" style={{ padding: 30 }}>
                <div className="muted small">No placement records yet.</div>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pkgData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={88} paddingAngle={3}
                    activeIndex={activePie} activeShape={renderActiveShape}
                    onMouseEnter={(_, i) => setActivePie(i)}
                    onClick={() => navigate('/tpc/placements')}
                    className="chart-pie" animationDuration={900}
                  >
                    {pkgData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--surface)" strokeWidth={2} />
                    ))}
                    <Label position="center" content={({ viewBox }) => {
                      const { cx, cy } = viewBox;
                      return (
                        <g>
                          <text x={cx} y={cy - 6} textAnchor="middle" className="pie-center-num">{pkgData[activePie]?.value ?? pkgTotal}</text>
                          <text x={cx} y={cy + 14} textAnchor="middle" className="pie-center-cap">{pkgData[activePie]?.name ?? 'Total'}</text>
                        </g>
                      );
                    }} />
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 16 }}>
        <GlassPanel style={{ ...cardStyle }}>
          <div className="card-title">Company-wise Offers &amp; Packages</div>
          <div className="card-sub">Top recruiting partners by offer volume</div>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 14 }}>
            <div style={{ flex: '1 1 220px', height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(companyWise.data?.data || []).slice(0, 6).map((c) => ({ name: c._id, value: c.placements }))} layout="vertical">
                  <defs>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#6366F1" />
                      <stop offset="100%" stopColor="#06B6D4" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                  <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ ...axis, fontSize: 10.5 }} width={86} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
                  <Bar dataKey="value" name="Placements" fill="url(#compGrad)" radius={[0, 6, 6, 0]} maxBarSize={18} animationDuration={900} className="chart-bar" onClick={() => navigate('/tpc/companies')} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: '1 1 180px' }}>
              {(companyWise.data?.data || []).slice(0, 5).map((c) => (
                <div key={c._id} className="kv-row">
                  <span className="kv-k">{c._id}</span>
                  <span className="kv-v">{formatLPA(c.avgPackage)} avg · {c.placements} placed</span>
                </div>
              ))}
            </div>
          </div>
        </GlassPanel>

        <GlassPanel gradient="linear-gradient(90deg, #6366F1, #8B5CF6)" style={{ ...cardStyle }}>
          <div className="flex-between">
            <div>
              <div className="card-title">{isAdmin ? 'Recent Activity' : 'Latest Applications'}</div>
              <div className="card-sub">{isAdmin ? 'Audit trail — who did what, when' : 'Newest candidates entering the funnel'}</div>
            </div>
          </div>
          <div className="mt-2">
            {activity.loading ? (
              <>
                <Skeleton variant="row" /><Skeleton variant="row" /><Skeleton variant="row" />
              </>
            ) : isAdmin ? (
              (activity.data?.data || activity.data || []).length === 0 ? (
                <div className="state-box" style={{ padding: 30 }}>
                  <div className="muted small">No activity recorded yet.</div>
                </div>
              ) : (
                (activity.data?.data || activity.data || []).map((log) => (
                  <div key={log._id} className="kv-row">
                    <span className="kv-k" style={{ maxWidth: '55%' }}>
                      <strong style={{ color: 'var(--text)' }}>{String(log.action).replace(/_/g, ' ')}</strong>
                      <span className="small muted" style={{ display: 'block' }}>{log.entityType}</span>
                    </span>
                    <span className="small muted">{timeAgo(log.timestamp)}</span>
                  </div>
                ))
              )
            ) : (
              (activity.data?.data || []).length === 0 ? (
                <div className="state-box" style={{ padding: 30 }}>
                  <div className="muted small">No applications yet — they appear when students apply.</div>
                </div>
              ) : (
                (activity.data?.data || []).map((a) => (
                  <div key={a._id} className="kv-row">
                    <span className="kv-k" style={{ maxWidth: '60%' }}>
                      <strong style={{ color: 'var(--text)' }}>{a.studentId?.name || 'Student'}</strong>
                      <span className="small muted" style={{ display: 'block' }}>{a.driveId?.companyId?.name} · {a.driveId?.title}</span>
                    </span>
                    <Badge status={a.status} />
                  </div>
                ))
              )
            )}
          </div>
          <div className="mt-2" style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button className="chip-link" onClick={() => navigate(isAdmin ? '/tpc/audit-logs' : '/tpc/applications')}>
              {isAdmin ? 'Full audit trail' : 'All applications'} <ArrowUpRight size={13} />
            </button>
          </div>
        </GlassPanel>
      </div>

      <div className="small muted mt-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Activity size={14} /> Auto-refreshing every 30s while this tab is visible. Click the Live pill to sync now.
      </div>
    </div>
  );
}
