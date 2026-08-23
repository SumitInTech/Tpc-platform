import { useState } from 'react';
import { ClipboardList, GitBranch, CheckCircle2, Filter, TrendingUp, CheckCircle, XCircle, Activity } from 'lucide-react';
import applicationService from '../../services/applicationService';
import useApi from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import ResumeViewerModal from '../../components/common/ResumeViewerModal';
import DownloadMenu from '../../components/common/DownloadMenu';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { APPLICATION_STATUS, TRANSITIONS, APPLICATION_FLOW } from '../../constants';
import { formatDateTime } from '../../utils/formatters';
import { exportApplicationsToExcel, exportApplicationsToPDF } from '../../utils/recordExport';
import { Hero, Kpi, Segmented, SectionHeader, GlassPanel, KpiGrid, cardStyle } from '../../components/dashboard/primitives';

const STATUS_TONE = {
  APPLIED: '#06B6D4', SHORTLISTED: '#6366F1', INTERVIEW: '#F59E0B',
  SELECTED: '#10B981', REJECTED: '#EF4444', WITHDRAWN: '#94A3B8',
};

const FUNNEL_TONE = {
  APPLIED: '#94A3B8', SHORTLISTED: '#60A5FA', INTERVIEW: '#818CF8', SELECTED: '#34D399',
};

function StatusTimeline({ app }) {
  const history = app.statusHistory || [];
  const rejected = app.status === 'REJECTED' || app.status === 'WITHDRAWN';
  const currentIndex = rejected ? -1 : APPLICATION_FLOW.indexOf(app.status);

  return (
    <div className="timeline mt-2">
      {APPLICATION_FLOW.map((step, i) => {
        const entry = history.find((h) => h.status === step);
        let cls = '';
        if (rejected && i > (history.findIndex((h) => h.status === 'REJECTED') >= 0 ? 99 : APPLICATION_FLOW.length)) cls = '';
        if (!rejected) {
          if (i < currentIndex) cls = 'done';
          else if (i === currentIndex) cls = 'current';
        }
        if (entry && !cls) cls = 'done';
        if (app.status === 'SELECTED' && step === 'SELECTED') cls = 'current done';
        return (
          <div key={step} className={`timeline-step ${cls}`}>
            {i < APPLICATION_FLOW.length - 1 && <div className="timeline-line" aria-hidden />}
            <div className="timeline-marker">
              {cls === 'done' || cls === 'current done' ? <CheckCircle2 size={13} /> : <span style={{ fontSize: 11, fontWeight: 700 }}>{i + 1}</span>}
            </div>
            <div>
              <div className="timeline-label">{step}</div>
              <div className="timeline-date">
                {entry ? formatDateTime(entry.changedAt) : 'Pending'}
              </div>
              {entry?.remarks && <div className="small muted">"{entry.remarks}"</div>}
            </div>
          </div>
        );
      })}
      {(app.status === 'REJECTED' || app.status === 'WITHDRAWN') && (
        <div className="timeline-step rejected">
          <div className="timeline-marker">✕</div>
          <div>
            <div className="timeline-label">{app.status}</div>
            <div className="timeline-date">{formatDateTime(app.rejectedAt || app.updatedAt)}</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ApplicationsPage() {
  const { toast } = useNotification();
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState('');
  const [detail, setDetail] = useState(null);
  const [resumeView, setResumeView] = useState(null);
  const [transitioning, setTransitioning] = useState('');
  const [remarks, setRemarks] = useState('');
  const [exporting, setExporting] = useState('');

  const filterKey = `${page}|${status}`;
  const summary = useApi(
    () => applicationService.getApplications({ limit: 10000 }),
    []
  );
  const { data: res, loading, error, refetch } = useApi(
    () => applicationService.getApplications({ page, limit: 10, ...(status ? { status } : {}) }),
    [filterKey]
  );
  const all = summary.data?.data || [];
  const apps = res?.data || [];
  const pagination = res?.pagination || {};

  const byStatus = (st) => all.filter((a) => a.status === st).length;
  const total = all.length || 0;
  const funnel = APPLICATION_FLOW.map((st) => ({ st, n: byStatus(st) }));
  const maxFunnel = Math.max(1, ...funnel.map((f) => f.n));
  const selectedCount = byStatus('SELECTED');
  const selectionRate = total ? Math.round((selectedCount / total) * 100) : 0;

  const statusOptions = [
    { value: '', label: 'All', color: '#6366F1', count: all.length },
    ...APPLICATION_STATUS.map((s) => ({ value: s, label: s, color: STATUS_TONE[s] || '#6366F1', count: byStatus(s), dot: true })),
  ];

  const kpis = [
    { key: 'total', label: 'Applications', value: total, icon: ClipboardList, tone: '#6366F1' },
    { key: 'selected', label: 'Selected', value: byStatus('SELECTED'), icon: CheckCircle, tone: '#10B981' },
    { key: 'pipeline', label: 'In Pipeline', value: byStatus('APPLIED') + byStatus('SHORTLISTED') + byStatus('INTERVIEW'), icon: Activity, tone: '#F59E0B' },
    { key: 'rejected', label: 'Rejected', value: byStatus('REJECTED') + byStatus('WITHDRAWN'), icon: XCircle, tone: '#EF4444' },
  ];

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const allRows = await applicationService.getApplications({
        page: 1, limit: 10000, ...(status ? { status } : {}),
      });
      const rows = allRows?.data || [];
      if (rows.length === 0) {
        toast.info('Nothing to export', 'No applications match the current filter.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') exportApplicationsToExcel(rows, `applications-${stamp}`);
      else exportApplicationsToPDF(rows, `applications-${stamp}`);
      toast.success('Download ready', `${rows.length} application(s) exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error('Export failed', getApiError(err).message);
    } finally {
      setExporting('');
    }
  };

  const changeStatus = async (app, newStatus) => {
    setTransitioning(`${app._id}:${newStatus}`);
    try {
      await applicationService.updateStatus(app._id, newStatus, remarks || undefined);
      toast.success('Status updated', `Application moved to ${newStatus}.`);
      setRemarks('');
      refetch();
      summary.refetch();
      if (detail?._id === app._id) {
        const fresh = await applicationService.getApplication(app._id);
        setDetail(fresh.data);
      }
    } catch (err) {
      toast.error('Transition blocked', getApiError(err).message);
    } finally {
      setTransitioning('');
    }
  };

  const openDetail = async (id) => {
    try {
      const fresh = await applicationService.getApplication(id);
      setDetail(fresh.data);
    } catch (err) {
      toast.error('Could not load application', getApiError(err).message);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Hero
        eyebrow="Training & Placement Cell" compact
        title="Applications"
        subtitle="Move candidates through the funnel. Invalid transitions are rejected by the status machine — the backend enforces the workflow."
        actions={<DownloadMenu onDownload={handleDownload} exporting={exporting} />}
      />

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

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #8B5CF6)" className="mb-3 mt-3" style={cardStyle}>
        <SectionHeader
          icon={Filter}
          title="Recruitment Funnel"
          subtitle="Live progression from Applied → Selected. Updates instantly as you move candidates."
          tone="#6366F1"
          action={
            <span style={{ fontSize: 12, fontWeight: 700, padding: '5px 10px', borderRadius: 999, color: '#10B981', background: 'color-mix(in srgb, #10B981 15%, transparent)' }}>
              Selection rate {selectionRate}%
            </span>
          }
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {funnel.map((f) => (
            <div key={f.st} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ width: 96, fontSize: 12, fontWeight: 700, color: FUNNEL_TONE[f.st] }}>{f.st}</span>
              <div style={{ flex: 1, height: 14, background: 'var(--surface-2, #eef2f7)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${(f.n / maxFunnel) * 100}%`, height: '100%', background: FUNNEL_TONE[f.st], borderRadius: 999, transition: 'width .8s cubic-bezier(.2,.7,.3,1)' }} />
              </div>
              <span style={{ width: 34, textAlign: 'right', fontSize: 13, fontWeight: 800 }}>{f.n}</span>
            </div>
          ))}
        </div>
        <div className="small muted mt-3">
          {selectedCount} of {total} applications reached <strong style={{ color: 'var(--text)' }}>Selected</strong> — a {selectionRate}% overall selection rate.
        </div>
      </GlassPanel>

      <GlassPanel gradient="linear-gradient(90deg, #06B6D4, #6366F1)" className="mb-3" style={cardStyle}>
        <SectionHeader
          icon={Filter}
          title="Filter applications"
          subtitle="Isolate a stage to act on it faster."
          tone="#06B6D4"
          action={status ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setStatus(''); setPage(1); }}>Clear</button> : null}
        />
        <Segmented options={statusOptions} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
      </GlassPanel>

      {loading ? (
        <Card><Skeleton variant="table" rows={8} /></Card>
      ) : error ? (
        <Card><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : apps.length === 0 ? (
        <Card><EmptyState icon={ClipboardList} title="No applications found"
          description="Applications appear when students apply to published drives." /></Card>
      ) : (
        <>
          <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Drive</th><th>Eligibility Snapshot</th>
                    <th>Status</th><th>Applied</th><th>Actions</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => {
                    const nexts = TRANSITIONS[a.status] || [];
                    const snapEligible = a.eligibilitySnapshot?.eligible;
                    return (
                      <tr key={a._id}>
                        <td>
                          <div className="cell-main">{a.studentId?.name}</div>
                          <div className="cell-sub">{a.studentId?.studentId} · {a.studentId?.branch} · CGPA {a.studentId?.cgpa != null ? Number(a.studentId.cgpa).toFixed(1) : '—'}</div>
                        </td>
                        <td>
                          <div className="cell-main">{a.driveId?.title}</div>
                          <div className="cell-sub">{a.driveId?.companyId?.name || a.driveId?.companyName || ''}</div>
                        </td>
                        <td>
                          <span className="badge" style={{
                            background: snapEligible ? 'var(--success-soft)' : 'var(--danger-soft)',
                            color: snapEligible ? 'var(--success-text)' : 'var(--danger-text)',
                          }}>
                            {snapEligible ? '✓ Verified Eligible' : '—'}
                          </span>
                        </td>
                        <td><Badge status={a.status} /></td>
                        <td className="small muted">{formatDateTime(a.appliedAt)}</td>
                        <td>
                          {nexts.length === 0 ? (
                            <span className="small muted">Final state</span>
                          ) : (
                            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                              {nexts.map((n) => (
                                <button
                                  key={n}
                                  className={`btn btn-sm ${n === 'REJECTED' ? 'btn-danger' : 'btn-primary'}`}
                                  disabled={!!transitioning}
                                  onClick={() => changeStatus(a, n)}
                                >
                                  {transitioning === `${a._id}:${n}` ? '…' : n === 'REJECTED' ? 'Reject' : `→ ${n}`}
                                </button>
                              ))}
                            </div>
                          )}
                        </td>
                        <td>
                          <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => openDetail(a._id)} aria-label="View timeline" title="View timeline">
                            <GitBranch size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassPanel>
          <Pagination page={pagination.page || page} limit={pagination.limit || 10} total={pagination.total || 0} onPage={setPage} />
        </>
      )}

      <Modal open={!!detail} onClose={() => setDetail(null)} title={`Application — ${detail?.studentId?.name || ''}`}
        footer={<Button variant="secondary" onClick={() => setDetail(null)}>Close</Button>}>
        {detail && (
          <>
            <div className="kv-row"><span className="kv-k">Student</span><span className="kv-v">{detail.studentId?.name} ({detail.studentId?.studentId})</span></div>
            <div className="kv-row"><span className="kv-k">Drive</span><span className="kv-v">{detail.driveId?.title}</span></div>
            <div className="kv-row"><span className="kv-k">Current status</span><Badge status={detail.status} /></div>
            <hr className="divider" />
            <div className="card-title small">Lifecycle</div>
            <StatusTimeline app={detail} />
            {detail.eligibilitySnapshot && (
              <>
                <hr className="divider" />
                <div className="card-title small">Eligibility snapshot at apply time</div>
                <div className="small muted mt-1">
                  {detail.eligibilitySnapshot.summary || (detail.eligibilitySnapshot.eligible ? 'All rules passed.' : 'Rules failed.')}
                  {' '}· evaluated by engine on {formatDateTime(detail.appliedAt)}
                </div>
                {(detail.eligibilitySnapshot.results || []).map((r, i) => (
                  <div key={i} className={`rule-row ${r.passed ? 'passed' : 'failed'} mt-1`}>
                    <strong className="small">{r.passed ? '✓' : '✕'} {r.field}</strong>
                    <span className="small muted">&nbsp;required {Array.isArray(r.required) ? `[${r.required.join(',')}]` : r.required}, actual {String(r.actual)}</span>
                  </div>
                ))}
              </>
            )}
            {detail.resume && (
              <>
                <hr className="divider" />
                <div className="card-title small">Attached Resume</div>
                <div className="small muted mt-1">{detail.resumeName || 'Resume'}</div>
                {detail.whyThisRole && <div className="small mt-1">“{detail.whyThisRole}”</div>}
                <Button className="mt-2" onClick={() => setResumeView({ src: detail.resume, name: detail.resumeName || 'Resume' })}>View Resume</Button>
              </>
            )}
          </>
        )}
      </Modal>
      <ResumeViewerModal open={!!resumeView} onClose={() => setResumeView(null)} src={resumeView?.src} title={resumeView?.name || 'Resume'} />
    </div>
  );
}
