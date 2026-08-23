import { useState } from 'react';
import { Handshake, ShieldCheck, IndianRupee, CheckCircle2, XCircle, TrendingUp, Filter, Undo2, ShieldAlert } from 'lucide-react';
import offerService from '../../services/offerService';
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
import DownloadMenu from '../../components/common/DownloadMenu';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { formatLPA, formatDate, formatDateTime } from '../../utils/formatters';
import { exportOffersToExcel, exportOffersToPDF } from '../../utils/recordExport';
import { Hero, Kpi, Segmented, SectionHeader, GlassPanel, KpiGrid, cardStyle } from '../../components/dashboard/primitives';

const OFFER_TONE = { OFFERED: '#06B6D4', ACCEPTED: '#10B981', DECLINED: '#EF4444', WITHDRAWN: '#94A3B8' };
const OFFER_STATUSES = ['OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN'];

function PolicyResult({ decision }) {
  if (!decision) return null;
  const blocked = decision.blockedBy?.length > 0;
  return (
    <div className={`policy-decision mt-3 ${blocked ? 'blocked' : 'allowed'}`}>
      <strong>{blocked ? '🔴 POLICY CHECK FAILED — OFFER WILL BE BLOCKED' : '🟢 POLICY CHECK PASSED'}</strong>
      <div className="small mt-1" style={{ fontWeight: 550 }}>{decision.summary}</div>
      {(decision.decisions || []).map((d) => (
        <div key={d.policy + d.policyType} className="small mt-1" style={{ color: d.allowed ? 'var(--success-text)' : 'var(--danger-text)' }}>
          • <strong>{d.policy}</strong>: {d.reason} (current: {String(d.currentValue)}, allowed: {String(d.allowedValue)})
        </div>
      ))}
    </div>
  );
}

export default function OffersPage() {
  const { toast } = useNotification();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState('');
  const [packageLPA, setPackageLPA] = useState('');
  const [policyDecision, setPolicyDecision] = useState(null);
  const [checkingPolicy, setCheckingPolicy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [exporting, setExporting] = useState('');

  const summary = useApi(
    () => offerService.getOffers({ limit: 10000 }),
    []
  );
  const { data: res, loading, error, refetch } = useApi(
    () => offerService.getOffers({ page, limit: 10, ...(statusFilter ? { status: statusFilter } : {}) }),
    [page, statusFilter]
  );
  const all = summary.data?.data || [];
  const offers = res?.data || [];
  const pagination = res?.pagination || {};

  const byStatus = (st) => all.filter((o) => o.status === st).length;
  const total = all.length || 0;
  const offeredAppIds = new Set(
    all.filter((o) => ['OFFERED', 'ACCEPTED'].includes(o.status) && o.applicationId)
      .map((o) => o.applicationId.toString())
  );
  const secured = all.filter((o) => o.status === 'ACCEPTED').reduce((a, o) => a + (Number(o.package) || 0), 0);

  const statusOptions = [
    { value: '', label: 'All', color: '#6366F1', count: all.length },
    ...OFFER_STATUSES.map((s) => ({ value: s, label: s, color: OFFER_TONE[s], count: byStatus(s), dot: true })),
  ];

  const kpis = [
    { key: 'total', label: 'Offers', value: total, icon: Handshake, tone: '#6366F1' },
    { key: 'accepted', label: 'Accepted', value: byStatus('ACCEPTED'), icon: CheckCircle2, tone: '#10B981' },
    { key: 'declined', label: 'Declined', value: byStatus('DECLINED') + byStatus('WITHDRAWN'), icon: XCircle, tone: '#EF4444' },
    { key: 'secured', label: 'Secured Value', value: secured, icon: IndianRupee, tone: '#F59E0B', format: (v) => `₹${Number(v).toLocaleString('en-IN')} LPA` },
  ];

  // SELECTED applications are the only valid source of offers
  const selectedAppsRes = useApi(() => applicationService.getApplications({ limit: 100, status: 'SELECTED' }), []);

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const allRows = await offerService.getOffers({
        page: 1, limit: 10000, ...(statusFilter ? { status: statusFilter } : {}),
      });
      const rows = allRows?.data || [];
      if (rows.length === 0) {
        toast.info('Nothing to export', 'No offers match the current filter.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') exportOffersToExcel(rows, `offers-${stamp}`);
      else exportOffersToPDF(rows, `offers-${stamp}`);
      toast.success('Download ready', `${rows.length} offer(s) exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error('Export failed', getApiError(err).message);
    } finally {
      setExporting('');
    }
  };

  const openCreate = () => {
    setSelectedApp('');
    setPackageLPA('');
    setPolicyDecision(null);
    setCreateOpen(true);
  };

  const pickApplication = (appId) => {
    setSelectedApp(appId);
    setPolicyDecision(null);
    const app = (selectedAppsRes.data?.data || []).find((a) => a._id === appId);
    if (app?.driveId?.package) setPackageLPA(String(app.driveId.package));
  };

  const runPolicyCheck = async () => {
    const app = (selectedAppsRes.data?.data || []).find((a) => a._id === selectedApp);
    if (!app || !app.studentId?._id) return;
    setCheckingPolicy(true);
    setPolicyDecision(null);
    try {
      const res2 = await offerService.evaluatePolicy({
        studentId: app.studentId._id,
        action: 'RECEIVE_OFFER',
        context: { drivePackage: Number(packageLPA) || 0 },
      });
      setPolicyDecision(res2.data);
    } catch (err) {
      toast.error('Policy evaluation failed', getApiError(err).message);
    } finally {
      setCheckingPolicy(false);
    }
  };

  const createOffer = async () => {
    const app = (selectedAppsRes.data?.data || []).find((a) => a._id === selectedApp);
    if (!app) return;
    setCreating(true);
    try {
      await offerService.createOffer({
        applicationId: app._id,
        role: app.driveId?.jobRole || app.driveId?.title,
        package: Number(packageLPA),
        currency: 'INR',
      });
      toast.success('Offer created', `${app.studentId?.name} has received an offer.`);
      setCreateOpen(false);
      refetch();
      summary.refetch();
    } catch (err) {
      toast.error('Offer blocked', getApiError(err).message);
    } finally {
      setCreating(false);
    }
  };

  const [pending, setPending] = useState(null);
  const [pendingLoading, setPendingLoading] = useState(false);

  const askWithdraw = (o) => setPending({ mode: 'withdraw', offer: o });
  const askRevoke = (o) => setPending({ mode: 'revoke', offer: o });

  const confirmPending = async () => {
    const o = pending.offer;
    setPendingLoading(true);
    try {
      if (pending.mode === 'withdraw') {
        await offerService.withdrawOffer(o._id);
        toast.success('Offer withdrawn', 'The mistaken offer was cancelled.');
      } else {
        await offerService.revokeOffer(o._id);
        toast.success('Offer revoked', 'Placement record reversed and student status reset.');
      }
      refetch();
      summary.refetch();
    } catch (err) {
      toast.error(pending.mode === 'withdraw' ? 'Could not withdraw' : 'Could not revoke', getApiError(err).message);
    } finally {
      setPendingLoading(false);
      setPending(null);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Hero
        eyebrow="Training & Placement Cell" compact
        title="Offers"
        subtitle="Every offer is guarded by institutional policy. The pre-check below is informational — the backend re-evaluates at creation and again at acceptance."
        actions={
          <>
            <DownloadMenu onDownload={handleDownload} exporting={exporting} />
            <Button onClick={openCreate}>Create Offer</Button>
          </>
        }
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

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #06B6D4)" className="mb-3 mt-3" style={cardStyle}>
        <SectionHeader
          icon={Filter}
          title="Filter offers"
          subtitle="Break down by offer state."
          tone="#6366F1"
          action={statusFilter ? <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setStatusFilter(''); setPage(1); }}>Clear</button> : null}
        />
        <Segmented options={statusOptions} value={statusFilter} onChange={(v) => { setStatusFilter(v); setPage(1); }} />
      </GlassPanel>

      {loading ? (
        <Card><Skeleton variant="table" rows={6} /></Card>
      ) : error ? (
        <Card><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : offers.length === 0 ? (
        <Card><EmptyState icon={Handshake} title="No offers yet"
          description="Create an offer for a SELECTED candidate to begin the offer workflow."
          actions={<Button onClick={openCreate}>Create Offer</Button>} /></Card>
      ) : (
        <>
          <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Company / Role</th><th>Package</th>
                    <th>Offer Date</th><th>Status</th><th>Policy Snapshot</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {offers.map((o) => {
                    const blocked = o.policyDecisionSnapshot && !o.policyDecisionSnapshot.allowed;
                    return (
                      <tr key={o._id}>
                        <td>
                          <div className="cell-main">{o.studentId?.name}</div>
                          <div className="cell-sub">{o.studentId?.studentId}</div>
                        </td>
                        <td>
                          <div className="cell-main">{o.companyId?.name}</div>
                          <div className="cell-sub">{o.role}{o.driveId ? ` · ${o.driveId.title}` : ''}</div>
                        </td>
                        <td><strong style={{ color: 'var(--success-text)' }}>{formatLPA(o.package, o.currency)}</strong></td>
                        <td className="small muted">{formatDate(o.offerDate)}</td>
                        <td><Badge status={o.status} /></td>
                        <td>
                          {!o.policyDecisionSnapshot ? (
                            <span className="small muted">—</span>
                          ) : (
                            <span className="badge" title={JSON.stringify(o.policyDecisionSnapshot.summary)}
                              style={{
                                background: blocked ? 'var(--danger-soft)' : 'var(--success-soft)',
                                color: blocked ? 'var(--danger-text)' : 'var(--success-text)',
                              }}>
                              {blocked ? '⚠ Flagged' : '✓ Passed'}
                            </span>
                          )}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {o.status === 'OFFERED' && (
                              <button className="btn btn-sm btn-ghost" onClick={() => askWithdraw(o)}>Withdraw</button>
                            )}
                            {o.status === 'ACCEPTED' && (
                              <button className="btn btn-sm btn-danger" onClick={() => askRevoke(o)}>Revoke</button>
                            )}
                          </div>
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

      <Modal open={createOpen} onClose={() => setCreateOpen(false)} title="Create Offer"
        footer={
          <>
            <Button variant="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button variant="primary" icon={Handshake} loading={creating}
              disabled={!policyDecision || !policyDecision.allowed}
              onClick={createOffer}>
              Create Offer
            </Button>
          </>
        }>
        <div className="field">
          <label htmlFor="of-app">SELECTED candidate *</label>
            <select id="of-app" className="input" value={selectedApp} onChange={(e) => pickApplication(e.target.value)}>
              <option value="">Choose an application…</option>
              {(selectedAppsRes.data?.data || []).map((a) => {
                const dup = offeredAppIds.has(a._id);
                return (
                  <option key={a._id} value={a._id} disabled={dup}>
                    {a.studentId?.name} — {a.driveId?.title} ({a.studentId?.branch}){dup ? ' · offer exists' : ''}
                  </option>
                );
              })}
            </select>
            {(selectedAppsRes.data?.data || []).length === 0 && !selectedAppsRes.loading && (
              <span className="hint">No candidates in SELECTED state. Move an application through the funnel first.</span>
            )}
            {selectedApp && offeredAppIds.has(selectedApp) && (
              <span className="small" style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
                This candidate already has an active offer for this company and role — a duplicate cannot be created.
              </span>
            )}
        </div>

        <div className="field mt-3">
          <label htmlFor="of-pkg">Package (LPA) *</label>
          <input id="of-pkg" type="number" step="0.5" min="0" className="input"
            value={packageLPA} onChange={(e) => { setPackageLPA(e.target.value); setPolicyDecision(null); }} />
        </div>

        <Button variant="secondary" icon={ShieldCheck} block className="mt-3"
          disabled={!selectedApp || checkingPolicy || !packageLPA}
          loading={checkingPolicy}
          onClick={runPolicyCheck}>
          Run Policy Pre-Check
        </Button>

        {checkingPolicy && <Skeleton variant="row" />}

        <PolicyResult decision={policyDecision} />

        {policyDecision && !policyDecision.allowed && (
          <p className="small mt-2" style={{ color: 'var(--danger-text)', fontWeight: 600 }}>
            The Create button stays disabled. The backend would reject this offer anyway — policies are enforced, not decorative.
          </p>
        )}
      </Modal>

      <ConfirmActionModal
        open={!!pending}
        title={pending?.mode === 'revoke' ? 'Revoke accepted offer?' : 'Withdraw offer?'}
        message={pending ? (
          pending.mode === 'revoke'
            ? `Revoke the accepted offer for ${pending.offer.studentId?.name}? This removes the placement record and resets their placed status. It is recorded in the audit log.`
            : `Withdraw the offer for ${pending.offer.studentId?.name}? No placement record exists yet, so nothing else is affected.`
        ) : ''}
        confirmLabel={pending?.mode === 'revoke' ? 'Revoke Offer' : 'Withdraw Offer'}
        tone={pending?.mode === 'revoke' ? '#EF4444' : '#F59E0B'}
        gradient={pending?.mode === 'revoke' ? 'linear-gradient(135deg, #EF4444, #DB2777 55%, #7C3AED)' : 'linear-gradient(135deg, #F59E0B, #F97316 55%, #EC4899)'}
        icon={pending?.mode === 'revoke' ? ShieldAlert : Undo2}
        loading={pendingLoading}
        onConfirm={confirmPending}
        onCancel={() => !pendingLoading && setPending(null)}
      />
    </div>
  );
}
