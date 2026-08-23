import { useState, useMemo } from 'react';
import {
  Users, Award, Percent, Handshake, TrendingUp, ArrowUpRight, BarChart3,
  Download, Sparkles, Filter, GraduationCap,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, ComposedChart, Area, Line, RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';
import Card from '../../components/common/Card';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import Confetti from '../../components/common/Confetti';
import { useTheme } from '../../context/ThemeContext';
import { useNotification } from '../../context/NotificationContext';
import reportService from '../../services/reportService';
import useApi from '../../hooks/useApi';
import useCountUp from '../../hooks/useCountUp';
import { formatLPA } from '../../utils/formatters';
import { getChartTheme } from '../../utils/chartTheme';
import { BRANCHES } from '../../constants';

const PIE_COLORS = ['#6366F1', '#8B5CF6', '#06B6D4', '#F59E0B', '#10B981', '#EF4444', '#EC4899'];
const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function AnimatedNumber({ value, format = (v) => Math.round(v).toLocaleString('en-IN'), duration = 1000 }) {
  const v = useCountUp(value, duration);
  return <>{format(v)}</>;
}

function Ring({ value, size = 120, stroke = 12, color = '#10B981', track = 'rgba(255,255,255,0.25)', textColor = '#fff', big = false }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.min(100, Math.max(0, value)) / 100);
  return (
    <svg width={size} height={size} style={{ display: 'block' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={track} strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={c} strokeDashoffset={off} strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 1.1s cubic-bezier(.2,.7,.3,1)' }}
      />
      <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={big ? 26 : 18} fontWeight={800} fill={textColor}>
        {Math.round(value)}%
      </text>
    </svg>
  );
}

function Sparkline({ data, color = '#6366F1' }) {
  if (!data || data.length === 0) return <div style={{ height: 36 }} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 130;
  const h = 36;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1 || 1)) * w;
    const y = h - ((d - min) / range) * (h - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  const areaPts = `0,${h} ${pts} ${w},${h}`;
  const gid = `sl-${color.replace('#', '')}`;
  return (
    <svg width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPts} fill={`url(#${gid})`} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function Kpi({ label, value, format, icon: Icon, tone, spark, ring }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface, #fff)', border: '1px solid var(--border, #e2e8f0)', borderRadius: 16, padding: 16, boxShadow: '0 12px 30px -22px rgba(0,0,0,0.45)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: `linear-gradient(90deg, ${tone}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'var(--text-sub, #64748b)', fontWeight: 600 }}>{label}</span>
        <span style={{ display: 'inline-flex', padding: 7, borderRadius: 10, color: tone, background: `color-mix(in srgb, ${tone} 15%, transparent)` }}>
          <Icon size={16} />
        </span>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, margin: '10px 0 4px', color: 'var(--text, #0f172a)', fontFamily: FONT }}>
        <AnimatedNumber value={value} format={format} />
      </div>
      <div style={{ height: 38, display: 'flex', alignItems: 'center' }}>
        {ring != null
          ? <Ring value={ring} size={38} stroke={5} color={tone} track="var(--border, #e2e8f0)" textColor="var(--text, #0f172a)" />
          : <Sparkline data={spark} color={tone} />}
      </div>
    </div>
  );
}

function Funnel({ stages }) {
  const max = Math.max(...stages.map((s) => s.value), 1);
  const colors = ['#6366F1', '#8B5CF6', '#06B6D4', '#10B981'];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 10 }}>
      {stages.map((s, i) => {
        const w = Math.max(10, (s.value / max) * 100);
        return (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 120, fontSize: 12, color: 'var(--text-sub, #64748b)', textAlign: 'right' }}>{s.label}</div>
            <div style={{ flex: 1, background: 'var(--surface-2, #f1f5f9)', borderRadius: 10, overflow: 'hidden', height: 34 }}>
              <div
                style={{
                  width: `${w}%`, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                  paddingRight: 12, color: '#fff', fontWeight: 700, fontSize: 13,
                  background: `linear-gradient(90deg, ${colors[i % colors.length]}, ${colors[(i + 1) % colors.length]})`,
                  transition: 'width 1s ease', borderRadius: 10, fontFamily: FONT,
                }}
              >
                {s.value}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ChartShell({ loading, error, empty, onRetry, emptyText, height = 290, children }) {
  if (loading) return <Skeleton variant="card" style={{ height }} />;
  if (error) return <ErrorState message={error.message} onRetry={onRetry} />;
  if (empty) return <EmptyState title="No data" description={emptyText} />;
  return <div style={{ height, marginTop: 12 }}>{children}</div>;
}

const cardStyle = {
  background: 'var(--surface, #fff)',
  border: '1px solid var(--border, #e2e8f0)',
  borderRadius: 16,
  padding: 18,
  boxShadow: '0 12px 30px -22px rgba(0,0,0,0.45)',
};

export default function ReportsPage() {
  const { resolved } = useTheme();
  const { toast } = useNotification();
  const [exporting, setExporting] = useState(false);
  const [exportingGO, setExportingGO] = useState(false);
  const [confetti, setConfetti] = useState(0);
  const [branch, setBranch] = useState('');
  const [academicYear, setAcademicYear] = useState('');
  const chart = getChartTheme(resolved);
  const axis = chart.axis;
  const grid = chart.grid;
  const tooltipStyle = chart.tooltipStyle;

  const filterKey = `${branch}|${academicYear}`;
  const filters = useMemo(() => {
    const f = {};
    if (branch) f.branch = branch;
    if (academicYear) f.academicYear = academicYear;
    return f;
  }, [branch, academicYear]);

  const overview = useApi(() => reportService.getOverview());
  const branchWise = useApi(() => reportService.getBranchWise(filters), [filterKey]);
  const companyWise = useApi(() => reportService.getCompanyWise(filters), [filterKey]);
  const pkgDist = useApi(() => reportService.getPackageDistribution(filters), [filterKey]);
  const yearWise = useApi(() => reportService.getYearWise(filters), [filterKey]);
  const yearOptions = useApi(() => reportService.getYearWise());
  const nirfGO = useApi(() => reportService.getNIRFGO());

  const o = overview.data?.data || {};
  const pkgLabels = ['₹0–5L', '₹5–10L', '₹10–15L', '₹15–20L', '₹20L+'];
  const pkgData = (pkgDist.data?.data || []).map((d, i) => ({ name: pkgLabels[i] || `Bucket ${i + 1}`, value: d.count }));
  const yData = (yearWise.data?.data || []).map((y) => ({ name: y._id, placements: y.placements, avgPackage: Number((y.avgPackage || 0).toFixed(1)) }));
  const placementsSeries = yData.map((y) => y.placements);
  const pkgSeries = yData.map((y) => y.avgPackage);
  const branchData = (branchWise.data?.data || []).map((b) => ({ name: b._id, placements: b.count }));
  const companyData = (companyWise.data?.data || []).slice(0, 8).map((c) => ({ name: c._id, placements: c.placements, avg: Number((c.avgPackage || 0).toFixed(1)) }));

  const go = nirfGO.data?.data || {};
  const known = (go.studentsPlaced || 0) + (go.higherStudies || 0) + (go.entrepreneurs || 0) + (go.phd || 0);
  const readiness = go.graduatingStudents ? Math.round((known / go.graduatingStudents) * 100) : 0;
  const rate = Number(o.placementRate || 0);

  const doExport = async () => {
    setExporting(true);
    try {
      await reportService.exportReport({}, 'placement-records.csv');
      toast.success('Export ready', 'placement-records.csv has been downloaded.');
      setConfetti((c) => c + 1);
    } catch {
      toast.error('Export failed', 'Could not generate the CSV export.');
    } finally {
      setExporting(false);
    }
  };

  const doExportNIRFGO = async () => {
    setExportingGO(true);
    try {
      await reportService.exportNIRFGO({}, 'nirf-go.csv');
      toast.success('NIRF GO export ready', 'nirf-go.csv has been downloaded.');
      setConfetti((c) => c + 1);
    } catch {
      toast.error('Export failed', 'Could not generate the NIRF GO export.');
    } finally {
      setExportingGO(false);
    }
  };

  const kpis = [
    { key: 'total', label: 'Total Students', value: o.totalStudents || 0, format: (v) => Math.round(v).toLocaleString('en-IN'), icon: Users, tone: '#6366F1', spark: placementsSeries },
    { key: 'placed', label: 'Placed Students', value: o.placedStudents || 0, format: (v) => Math.round(v).toLocaleString('en-IN'), icon: Award, tone: '#10B981', spark: placementsSeries },
    { key: 'rate', label: 'Placement Rate', value: rate, format: (v) => `${v.toFixed(1)}%`, icon: Percent, tone: '#06B6D4', spark: placementsSeries },
    { key: 'offers', label: 'Total Offers', value: o.totalOffers || 0, format: (v) => Math.round(v).toLocaleString('en-IN'), icon: Handshake, tone: '#8B5CF6', spark: placementsSeries },
    { key: 'avg', label: 'Average Package', value: o.averagePackage || 0, format: (v) => formatLPA(v), icon: TrendingUp, tone: '#F59E0B', spark: pkgSeries },
    { key: 'median', label: 'Median Package', value: o.medianPackage || 0, format: (v) => formatLPA(v), icon: Percent, tone: '#06B6D4', spark: pkgSeries },
    { key: 'high', label: 'Highest Package', value: o.highestPackage || 0, format: (v) => formatLPA(v), icon: ArrowUpRight, tone: '#EF4444', spark: pkgSeries },
  ];

  const funnel = [
    { label: 'Total Students', value: o.totalStudents || 0 },
    { label: 'Offers Made', value: o.totalOffers || 0 },
    { label: 'Offers Accepted', value: o.acceptedOffers || 0 },
    { label: 'Placed', value: o.placedStudents || 0 },
  ];

  return (
    <div style={{ fontFamily: FONT }}>
      <Confetti trigger={confetti} />

      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 20, padding: '26px 28px', color: '#fff', background: 'linear-gradient(120deg, #4f46e5, #7c3aed 45%, #0ea5e9)', boxShadow: '0 24px 55px -28px rgba(79,70,229,0.75)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 18% 18%, rgba(255,255,255,0.28), transparent 42%), radial-gradient(circle at 82% 0%, rgba(255,255,255,0.18), transparent 38%)' }} />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ minWidth: 280 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.9 }}>
              <Sparkles size={18} />
              <span style={{ letterSpacing: 1, fontSize: 12, textTransform: 'uppercase', fontWeight: 700 }}>Training &amp; Placement Cell</span>
            </div>
            <h1 style={{ margin: '8px 0 4px', fontSize: 30, fontWeight: 800, fontFamily: FONT }}>NIRF-Oriented Reporting</h1>
            <p style={{ margin: 0, maxWidth: 560, opacity: 0.92, fontSize: 14, lineHeight: 1.5 }}>
              Aggregated live from auditable placement records via MongoDB pipelines. Structured for NIRF-style reporting — not an official NIRF submission unless verified against the current specification.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 18 }}>
              <Button icon={Download} variant="secondary" loading={exporting} onClick={doExport}>Export CSV</Button>
              <Button icon={GraduationCap} variant="primary" loading={exportingGO} onClick={doExportNIRFGO}>Export NIRF GO</Button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 18, alignItems: 'center' }}>
            <Ring value={readiness} size={132} stroke={13} color="#fff" track="rgba(255,255,255,0.25)" textColor="#fff" big />
            <div style={{ maxWidth: 180 }}>
              <div style={{ fontSize: 13, opacity: 0.9, fontWeight: 700 }}>NIRF Readiness</div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, lineHeight: 1.45 }}>Tag student career outcomes to raise this score toward a submission-ready report.</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', marginTop: 18 }}>
        <Filter size={16} color="var(--text-sub, #64748b)" />
        <span style={{ fontWeight: 600, fontSize: 13 }}>Filters (apply to charts)</span>
        <select className="input" value={branch} onChange={(e) => setBranch(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All branches</option>
          {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
        </select>
        <select className="input" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} style={{ maxWidth: 180 }}>
          <option value="">All academic years</option>
          {(yearOptions.data?.data || []).map((y) => <option key={y._id} value={y._id}>{y._id}</option>)}
        </select>
        {(branch || academicYear) && (
          <Button variant="secondary" size="sm" onClick={() => { setBranch(''); setAcademicYear(''); }}>Clear</Button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginTop: 18 }}>
        {kpis.map((k) => <Kpi key={k.key} {...k} />)}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 16 }}>
        <div style={cardStyle}>
          <div className="card-title">Placement Funnel</div>
          <div className="card-sub">Students → offers → placement</div>
          <Funnel stages={funnel} />
        </div>
        <div style={cardStyle}>
          <div className="card-title">Placement Health</div>
          <div className="card-sub">Overall placement rate</div>
          <div style={{ height: 250, marginTop: 8, position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="62%" outerRadius="100%" data={[{ name: 'Rate', value: rate, fill: 'url(#healthGrad)' }]} startAngle={90} endAngle={-270}>
                <defs>
                  <linearGradient id="healthGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar background dataKey="value" cornerRadius={14} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ fontSize: 30, fontWeight: 800, color: 'var(--text, #0f172a)', fontFamily: FONT }}>
                <AnimatedNumber value={rate} format={(v) => `${v.toFixed(1)}%`} />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-sub, #64748b)' }}>of students placed</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 16 }}>
        <div style={cardStyle}>
          <div className="card-title">Branch-wise Placement</div>
          <div className="card-sub">Placement count per branch</div>
          <ChartShell loading={branchWise.loading} error={branchWise.error} empty={branchData.length === 0} onRetry={() => branchWise.refetch()} emptyText="No placement records match the current filters.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={branchData} margin={{ left: 8, right: 20 }}>
                <defs>
                  <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={64} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
                <Bar dataKey="placements" radius={[0, 6, 6, 0]} fill="url(#branchGrad)" maxBarSize={34} />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>

        <div style={cardStyle}>
          <div className="card-title">Package Distribution</div>
          <div className="card-sub">Accepted offers across salary bands</div>
          <ChartShell loading={pkgDist.loading} error={pkgDist.error} empty={pkgData.length === 0} onRetry={() => pkgDist.refetch()} emptyText="No offers accepted yet.">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pkgData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={92} paddingAngle={3}>
                  {pkgData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="var(--surface, #fff)" strokeWidth={2} />)}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} />
                <Legend wrapperStyle={chart.legend} />
              </PieChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 16, marginTop: 16 }}>
        <div style={cardStyle}>
          <div className="card-title">Year-wise Placement Trend</div>
          <div className="card-sub">Placements vs. average package</div>
          <ChartShell loading={yearWise.loading} error={yearWise.error} empty={yData.length === 0} onRetry={() => yearWise.refetch()} emptyText="No academic years recorded.">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={yData}>
                <defs>
                  <linearGradient id="avgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="branchGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#6366F1" />
                    <stop offset="100%" stopColor="#8B5CF6" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} vertical={false} />
                <XAxis dataKey="name" tick={axis} axisLine={false} tickLine={false} />
                <YAxis yAxisId="l" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis yAxisId="r" orientation="right" tick={axis} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} />
                <Legend wrapperStyle={chart.legend} />
                <Bar yAxisId="l" dataKey="placements" name="Placements" fill="url(#branchGrad)" radius={[6, 6, 0, 0]} maxBarSize={42} />
                <Area yAxisId="r" type="monotone" dataKey="avgPackage" name="Avg LPA" stroke="#10B981" strokeWidth={2.5} fill="url(#avgGrad)" />
              </ComposedChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>

        <div style={cardStyle}>
          <div className="card-title">Top Companies</div>
          <div className="card-sub">Where your students are placed</div>
          <ChartShell loading={companyWise.loading} error={companyWise.error} empty={companyData.length === 0} onRetry={() => companyWise.refetch()} emptyText="No placements recorded.">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart layout="vertical" data={companyData} margin={{ left: 8, right: 20 }}>
                <defs>
                  <linearGradient id="companyGrad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#0ea5e9" />
                    <stop offset="100%" stopColor="#6366F1" />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={grid} horizontal={false} />
                <XAxis type="number" tick={axis} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="name" tick={axis} axisLine={false} tickLine={false} width={90} />
                <Tooltip contentStyle={tooltipStyle} labelStyle={chart.tooltipLabelStyle} itemStyle={chart.tooltipItemStyle} cursor={{ fill: 'color-mix(in srgb, var(--primary) 8%, transparent)' }} />
                <Bar dataKey="placements" radius={[0, 6, 6, 0]} fill="url(#companyGrad)" maxBarSize={26} />
              </BarChart>
            </ResponsiveContainer>
          </ChartShell>
        </div>
      </div>

      <div style={{ ...cardStyle, marginTop: 16 }}>
        <div className="card-title">NIRF Graduation Outcomes (GO) — Portal-Ready</div>
        <div className="card-sub">
          Mirrors the official NIRF GO data-collection table. Use “Export NIRF GO” to download a CSV that maps 1:1 to the NIRF portal. Verify against the current nirfindia.org specification before submission.
        </div>
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          {nirfGO.loading ? (
            <Skeleton variant="card" style={{ height: 180 }} />
          ) : nirfGO.error ? (
            <ErrorState message={nirfGO.error.message} onRetry={() => nirfGO.refetch()} />
          ) : (
            (() => {
              const rows = [
                ['Number of students graduating', go.graduatingStudents ?? 0],
                ['Number of students placed', go.studentsPlaced ?? 0],
                ['Median salary of placed graduates (INR)', go.medianSalaryINR ?? 0],
                ['Median salary of placed graduates (LPA)', go.medianSalaryLPA ?? 0],
                ['Number of students opted for higher studies', go.higherStudies ?? 0],
                ['Number of students entrepreneurial / self-employed', go.entrepreneurs ?? 0],
                ['Number of students pursuing PhD', go.phd ?? 0],
                ['Number of students seeking employment', go.seekingEmployment ?? 0],
              ];
              return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
                  <thead>
                    <tr style={{ background: 'var(--surface-2, #f1f5f9)', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border, #e2e8f0)' }}>Graduation Outcome Metric</th>
                      <th style={{ padding: '10px 12px', borderBottom: '1px solid var(--border, #e2e8f0)', textAlign: 'right' }}>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map(([label, value]) => (
                      <tr key={label}>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border, #e2e8f0)' }}>{label}</td>
                        <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border, #e2e8f0)', textAlign: 'right', fontWeight: 600 }}>{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              );
            })()
          )}
        </div>
      </div>
    </div>
  );
}
