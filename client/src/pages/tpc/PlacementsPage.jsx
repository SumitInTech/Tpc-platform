import { useState } from 'react';
import { Award, Search, Filter, Users, CheckCircle2, IndianRupee, TrendingUp } from 'lucide-react';
import placementService from '../../services/placementService';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import DownloadMenu from '../../components/common/DownloadMenu';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { PLACEMENT_STATUS } from '../../constants';
import { formatLPA, formatDate } from '../../utils/formatters';
import { exportPlacementsToExcel, exportPlacementsToPDF } from '../../utils/recordExport';
import { Hero, Kpi, Segmented, SectionHeader, GlassPanel, KpiGrid, cardStyle } from '../../components/dashboard/primitives';

const PLACEMENT_TONE = { PLACED: '#10B981', JOINING_PENDING: '#F59E0B', JOINED: '#06B6D4', WITHDRAWN: '#EF4444' };
const PAGE_SIZE = 10;

const matchesFilters = (r, search, branch, status) => {
  if (search && !`${r.studentId?.name} ${r.studentId?.studentId}`.toLowerCase().includes(search.toLowerCase())) return false;
  if (branch && r.branch !== branch) return false;
  if (status && r.status !== status) return false;
  return true;
};

export default function PlacementsPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('');
  const [exporting, setExporting] = useState('');
  const { toast } = useNotification();
  const search = useDebounce(searchInput);

  const summary = useApi(() => placementService.getPlacements({ limit: 10000 }), []);
  const allRecords = summary.data?.data || [];
  const branches = [...new Set(allRecords.map((r) => r.branch))].filter(Boolean);

  const records = allRecords.filter((r) => matchesFilters(r, search, branch, status));
  const total = records.length;
  const joined = records.filter((r) => r.status === 'JOINED').length;
  const joiningPending = records.filter((r) => r.status === 'JOINING_PENDING').length;
  const totalValue = records.reduce((a, r) => a + (Number(r.package) || 0), 0);
  const avgValue = records.length ? totalValue / records.length : 0;

  const pageItems = records.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const loading = summary.loading;
  const error = summary.error;

  const branchOptions = [
    { value: '', label: 'All Branches', color: '#6366F1', count: allRecords.length },
    ...branches.map((b) => ({ value: b, label: b, color: '#06B6D4', count: allRecords.filter((r) => r.branch === b).length, dot: true })),
  ];
  const statusOptions = [
    { value: '', label: 'All', color: '#6366F1', count: allRecords.length },
    ...PLACEMENT_STATUS.map((s) => ({ value: s, label: s, color: PLACEMENT_TONE[s] || '#6366F1', count: allRecords.filter((r) => r.status === s).length, dot: true })),
  ];

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const rows = allRecords.filter((r) => matchesFilters(r, search, branch, status));
      if (rows.length === 0) {
        toast.info('Nothing to export', 'No placement records match the current filters.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') exportPlacementsToExcel(rows, `placement-records-${stamp}`);
      else exportPlacementsToPDF(rows, `placement-records-${stamp}`);
      toast.success('Download ready', `${rows.length} record(s) exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error('Export failed', getApiError(err).message);
    } finally {
      setExporting('');
    }
  };

  const kpis = [
    { key: 'total', label: 'Records', value: total, icon: Users, tone: '#6366F1' },
    { key: 'joined', label: 'Joined', value: joined, icon: CheckCircle2, tone: '#06B6D4' },
    { key: 'pending', label: 'Joining Pending', value: joiningPending, icon: TrendingUp, tone: '#F59E0B' },
    { key: 'value', label: 'Total Value', value: totalValue, icon: IndianRupee, tone: '#10B981', format: (v) => `₹${Number(v).toLocaleString('en-IN')} LPA` },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Hero
        eyebrow="Training & Placement Cell" compact
        title="Placement Records"
        subtitle="Created automatically when offers are accepted — never hand-entered. Each row is traceable back to its offer, application, drive and policy decision."
        actions={<DownloadMenu onDownload={handleDownload} exporting={exporting} />}
      />

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <KpiGrid>{kpis.map((k) => <Skeleton key={k.key} variant="card" />)}</KpiGrid>
        ) : error ? (
          <KpiGrid>{kpis.map((k) => (
            <div key={k.key} style={{ ...cardStyle, display: 'flex', alignItems: 'center', color: 'var(--danger-text)' }}>
              <span className="small">Summary unavailable</span>
            </div>
          ))}</KpiGrid>
        ) : (
          <KpiGrid>{kpis.map((k) => <Kpi key={k.key} {...k} />)}</KpiGrid>
        )}
      </div>

      <GlassPanel gradient="linear-gradient(90deg, #10B981, #06B6D4)" className="mb-3 mt-3" style={cardStyle}>
        <SectionHeader
          icon={Filter}
          title="Find records"
          subtitle="Search a student or slice by branch and status."
          tone="#10B981"
          action={search || branch || status ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setSearchInput(''); setBranch(''); setStatus(''); setPage(1); }}>Clear</button> : null}
        />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 260px', minWidth: 220, display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-2, #eef2f7)', borderRadius: 12, padding: '10px 12px' }}>
            <Search size={16} color="var(--text-sub, #64748b)" />
            <input className="input" style={{ border: 'none', background: 'transparent', padding: 0 }} placeholder="Search student…"
              value={searchInput} onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} aria-label="Search placement records" />
          </div>
          <div style={{ flex: '1 1 280px', minWidth: 240 }}>
            <Segmented options={branchOptions} value={branch} onChange={(v) => { setBranch(v); setPage(1); }} />
          </div>
          <div style={{ flex: '1 1 280px', minWidth: 240 }}>
            <Segmented options={statusOptions} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          </div>
        </div>
      </GlassPanel>

      {loading ? (
        <Card><Skeleton variant="table" rows={7} /></Card>
      ) : error ? (
        <Card><ErrorState message={error.message} onRetry={() => summary.refetch && summary.refetch()} /></Card>
      ) : records.length === 0 ? (
        <Card><EmptyState icon={Award} title="No placement records"
          description="Records appear automatically once students accept offers. Run the demo workflow to see one created live." /></Card>
      ) : (
        <>
          <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Company</th><th>Package</th><th>Offer</th>
                    <th>Status</th><th>Academic Year</th><th>Placement Date</th>
                  </tr>
                </thead>
                <tbody>
                  {pageItems.map((r) => (
                    <tr key={r._id}>
                      <td>
                        <div className="cell-main">{r.studentId?.name}</div>
                        <div className="cell-sub">{r.studentId?.studentId} · {r.branch}</div>
                      </td>
                      <td>{r.companyId?.name}</td>
                      <td><strong style={{ color: 'var(--success-text)' }}>{formatLPA(r.package, r.currency)}</strong></td>
                      <td className="small muted">{String(r.offerId?._id || r.offerId || '').slice(-8)}</td>
                      <td><Badge status={r.status} /></td>
                      <td>{r.academicYear}</td>
                      <td className="small muted">{formatDate(r.placementDate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
          <Pagination page={page} limit={PAGE_SIZE} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
