import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, CalendarDays, IndianRupee, ArrowLeft, PartyPopper,
  CheckCircle2, XCircle, Clock, Sparkles, ShieldAlert, Ban,
  Loader2, Lock, Info, ArrowRight, ShieldCheck, Check, RefreshCw,
} from 'lucide-react';
import driveService from '../../services/driveService';
import applicationService from '../../services/applicationService';
import studentService from '../../services/studentService';
import offerService from '../../services/offerService';
import useApi from '../../hooks/useApi';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import { Hero, Kpi, TextKpi, KpiGrid, Ring, GlassPanel, SectionHeader, cardStyle } from '../../components/dashboard/primitives';
import ResumeApplyModal from '../../components/drives/ResumeApplyModal';
import { APPLICATION_FLOW } from '../../constants';
import { formatLPA, formatDate, labelize } from '../../utils/formatters';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

function policyMessage(decision, ctx) {
  switch (decision.policyType) {
    case 'MAX_ACCEPTED_OFFERS':
      return {
        title: 'Maximum Accepted Offers Reached',
        detail: ctx.acceptedCompany
          ? `You've already accepted an offer from ${ctx.acceptedCompany}${ctx.acceptedPackage ? ` (${formatLPA(ctx.acceptedPackage)})` : ''}. The portal permits only ${decision.allowedValue} accepted offer at a time.`
          : `You currently hold ${decision.currentValue} accepted offer(s); the limit is ${decision.allowedValue}.`,
        action: ctx.acceptedCompany
          ? `Withdraw your ${ctx.acceptedCompany} offer from “My Offers” to free a slot, then re-evaluate here.`
          : `Reduce your accepted offers to within the limit, then try again.`,
      };
    case 'PLACED_STUDENT_RESTRICTION':
      return {
        title: 'Placed Student Restriction',
        detail: ctx.acceptedCompany
          ? `You already hold a placement at ${ctx.acceptedCompany}. Once placed, TNP policy locks you out of further applications and offers.`
          : `You already have a placement record, so further applications are restricted.`,
        action: `You're all set with your current role — or reach out to the TNP officer if this looks wrong.`,
      };
    default:
      return { title: decision.policy, detail: decision.reason, action: '' };
  }
}

function EligibilityEngine({ result, profile, offers, onReevaluate, navigate }) {
  const elig = result?.eligibility;
  const policy = result?.policyCheck;
  const [busy, setBusy] = useState(false);
  if (!elig) return null;

  const handleReeval = async () => {
    setBusy(true);
    try { await onReevaluate(); } finally { setBusy(false); }
  };

  const policyBlocked = policy && policy.allowed === false;
  const state = policyBlocked ? 'blocked' : elig.eligible ? 'pass' : 'rules';

  const acceptedOffer = (offers || []).find((o) => o.status === 'ACCEPTED');
  const ctx = {
    acceptedCompany: acceptedOffer?.companyId?.name,
    acceptedPackage: acceptedOffer?.package,
  };

  const V = {
    pass: { bg: 'linear-gradient(135deg,#ECFDF5,#DCFCE7)', fg: '#15803D', Icon: ShieldCheck, pulse: 'ee-pulse-ok', label: 'Clear to Apply' },
    rules: { bg: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', fg: '#B91C1C', Icon: ShieldAlert, pulse: 'ee-pulse', label: "Doesn't Match Criteria" },
    blocked: { bg: 'linear-gradient(135deg,#FEF2F2,#FEE2E2)', fg: '#B91C1C', Icon: Lock, pulse: 'ee-pulse', label: 'Application Locked' },
  }[state];

  const headline = state === 'pass' ? "You're Clear to Apply" : state === 'rules' ? "You Missed Some Criteria" : 'Application Locked by Policy';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ position: 'relative', borderRadius: 16, padding: '16px 18px', background: V.bg, overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div className={`ee-icon ${V.pulse}`} style={{ width: 52, height: 52, flexShrink: 0, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.65)', color: V.fg }}>
            <V.Icon size={26} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: V.fg, lineHeight: 1.25 }}>{headline}</div>
            <div style={{ fontSize: 12.5, color: V.fg, opacity: 0.85, marginTop: 2 }}>
              {state === 'pass' ? 'All rules and policies passed for this drive.' : state === 'rules' ? 'A few eligibility rules did not pass — see below.' : 'TNP policy is preventing this application.'}
            </div>
          </div>
        </div>
      </div>

      {state === 'blocked' && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 14, background: 'var(--surface-2)', borderLeft: `3px solid ${V.fg}` }}>
          <Info size={18} color={V.fg} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, lineHeight: 1.55 }}>
            <div style={{ fontWeight: 700, marginBottom: 2 }}>From the Placement Cell</div>
            {policyBlocked && (policy.decisions || []).filter((d) => !d.allowed).map((d, i) => (
              <div key={i} style={{ color: 'var(--text-muted)' }}>{policyMessage(d, ctx).detail}</div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700, marginBottom: 8 }}>What We Checked</div>
        <div style={{ position: 'relative', paddingLeft: 6 }}>
          {(elig.results || []).map((r, i) => {
            const last = i === (elig.results.length - 1);
            return (
              <div key={i} style={{ position: 'relative', paddingLeft: 26, paddingBottom: last ? 0 : 12 }}>
                {!last && <span style={{ position: 'absolute', left: 9, top: 18, bottom: -2, width: 2, background: 'var(--border)' }} />}
                <span style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: 999, background: r.passed ? 'var(--success-text)' : 'var(--danger-text)', boxShadow: '0 0 0 3px var(--surface)' }} />
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{labelize(r.field)}</div>
                <div className="small muted">{r.reason}</div>
              </div>
            );
          })}
        </div>
      </div>

      {state === 'blocked' && (policy.decisions || []).filter((d) => !d.allowed).length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="small muted" style={{ textTransform: 'uppercase', letterSpacing: 0.6, fontWeight: 700 }}>Why & What You Can Do</div>
          {(policy.decisions || []).filter((d) => !d.allowed).map((d, i) => {
            const m = policyMessage(d, ctx);
            return (
              <div key={i} style={{ borderRadius: 14, border: '1px solid var(--border)', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'var(--surface-2)', fontWeight: 800, fontSize: 13.5 }}>
                  <Ban size={15} color="var(--danger-text)" /> {m.title}
                </div>
                <div style={{ padding: '11px 12px' }}>
                  <div className="small muted" style={{ lineHeight: 1.55, marginBottom: 8 }}>{m.detail}</div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12.5, fontWeight: 700, color: 'var(--primary-soft-text)', background: 'var(--primary-soft)', padding: '8px 11px', borderRadius: 10 }}>
                    <ArrowRight size={14} /> {m.action}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          onClick={handleReeval}
          disabled={busy}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--primary-soft)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          style={{ flex: 1, minWidth: 130, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: '1px solid var(--primary)', cursor: 'pointer', padding: '11px 14px', borderRadius: 11, fontWeight: 800, fontSize: 13, color: 'var(--primary-soft-text)', background: 'transparent', transition: 'background .15s ease', opacity: busy ? 0.7 : 1 }}
        >
          {busy ? <Loader2 size={15} className="spinner" /> : <RefreshCw size={15} />} {busy ? 'Re-evaluating…' : 'Re-evaluate'}
        </button>
        {state === 'blocked' && (
          <button onClick={() => navigate('/student/offers')} style={{ flex: 1, minWidth: 130, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6, border: 'none', cursor: 'pointer', padding: '11px 14px', borderRadius: 11, fontWeight: 800, fontSize: 13, color: '#fff', background: 'linear-gradient(90deg,#6366F1,#8B5CF6)' }}>
            <ArrowRight size={14} /> My Offers
          </button>
        )}
      </div>
    </div>
  );
}

function Fact({ icon: Icon, label }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 15px', borderRadius: 999, background: 'var(--surface-2)', fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>
      <Icon size={15} color="var(--primary)" /> {label}
    </span>
  );
}

function ApplicationTracker({ application, onView }) {
  const curIdx = APPLICATION_FLOW.indexOf((application.status || 'APPLIED').toUpperCase());
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--success-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-text)' }}>
          <CheckCircle2 size={22} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: 17, lineHeight: 1.2 }}>Application Tracker</div>
          <div className="small muted">Live progress for this drive</div>
        </div>
      </div>

      <div style={{ position: 'relative', paddingLeft: 4, marginBottom: 16 }}>
        {APPLICATION_FLOW.map((stage, i) => {
          const done = i < curIdx;
          const current = i === curIdx && curIdx >= 0;
          const fg = done || current ? 'var(--success-text)' : 'var(--text-muted)';
          return (
            <div key={stage} style={{ position: 'relative', paddingLeft: 34, paddingBottom: i === APPLICATION_FLOW.length - 1 ? 0 : 18 }}>
              {i < APPLICATION_FLOW.length - 1 && (
                <span style={{ position: 'absolute', left: 11, top: 22, bottom: -2, width: 3, background: done ? 'var(--success-text)' : 'var(--border)' }} />
              )}
              <span style={{ position: 'absolute', left: 2, top: 2, width: 20, height: 20, borderRadius: 999, background: done ? 'var(--success-text)' : 'var(--surface)', border: `2px solid ${done || current ? 'var(--success-text)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done && <Check size={12} color="#fff" />}
                {current && <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--success-text)' }} />}
              </span>
              <div style={{ fontWeight: current ? 800 : 600, fontSize: 14.5, color: fg }}>{labelize(stage)}</div>
              {current && <div className="small muted">Current stage</div>}
            </div>
          );
        })}
      </div>

      <div className="small muted" style={{ marginBottom: 14 }}>
        Applied on {formatDate(application.createdAt || application.appliedAt)}
      </div>
      <button onClick={onView} className="btn" style={{ width: '100%', padding: '13px 16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
        View Full Application <ArrowRight size={15} />
      </button>
    </div>
  );
}

export default function StudentDriveDetailPage() {
  const { id: driveId } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [checkingElig, setCheckingElig] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const driveRes = useApi(() => driveService.getDrive(driveId), [driveId]);
  const eligRes = useApi(() => driveService.getMyEligibility(driveId), [driveId], { immediate: false });
  const appsRes = useApi(() => applicationService.getApplications({ limit: 200 }), []);
  const profileRes = useApi(() => studentService.getMyProfile(), []);
  const offersRes = useApi(() => offerService.getOffers(), []);

  const drive = driveRes.data?.data;
  const eligibility = eligRes.data?.data;
  const profile = profileRes.data?.data;
  const offers = offersRes.data?.data || [];

  const acceptedOffer = offers.find((o) => o.status === 'ACCEPTED');
  const acceptedCompany = acceptedOffer?.companyId?.name;
  const acceptedPackage = acceptedOffer?.package;

  const evaluated = !!eligibility?.eligibility;
  const blocked = evaluated && eligibility.policyCheck?.allowed === false;
  const ineligible = evaluated && !eligibility.eligibility.eligible;
  const applyBlocked = blocked || ineligible;

  const myApplication = (appsRes.data?.data || []).find((a) => a.driveId?._id === driveId);
  const closed = drive?.applicationDeadline && new Date(drive.applicationDeadline).getTime() <= Date.now();
  const canApply = !myApplication && !closed;

  async function submitApply(payload) {
    setSubmitting(true);
    try {
      await applicationService.applyToDrive(driveId, payload);
      setModalOpen(false);
      driveRes.refetch();
      appsRes.refetch();
      eligRes.refetch();
    } finally {
      setSubmitting(false);
    }
  }

  // Apply gates on a fresh eligibility check: pass → open the apply modal, fail → keep it locked.
  async function handleApply() {
    setCheckingElig(true);
    try {
      const res = await driveService.getMyEligibility(driveId);
      const elig = res?.data;
      if (elig?.eligibility) {
        eligRes.setData(res);
        if (elig.policyCheck?.allowed === false || !elig.eligibility.eligible) {
          return; // not eligible — do not open the apply page
        }
      }
      setModalOpen(true);
    } catch {
      eligRes.refetch();
    } finally {
      setCheckingElig(false);
    }
  }

  const DEADLINE = drive?.applicationDeadline ? new Date(drive.applicationDeadline).getTime() : null;
  const DRIVE = drive?.driveDate ? new Date(drive.driveDate).getTime() : null;
  const now = Date.now();
  const span = DEADLINE && DRIVE ? DEADLINE - DRIVE : (DEADLINE ? 14 * 864e5 : null);
  const remaining = DEADLINE ? DEADLINE - now : null;
  const remainingPct = span && remaining != null ? Math.max(0, Math.min(100, (remaining / span) * 100)) : 0;
  const phase = closed ? 'closed' : remainingPct < 25 ? 'ending' : 'open';
  const ringTone = phase === 'closed' ? '#94A3B8' : phase === 'ending' ? '#F59E0B' : '#10B981';

  let countdown = '—';
  if (DEADLINE) {
    const diff = DEADLINE - now;
    if (diff <= 0) countdown = 'Closed';
    else {
      const d = Math.floor(diff / 864e5);
      const h = Math.floor((diff % 864e5) / 36e5);
      const m = Math.floor((diff % 36e5) / 6e4);
      countdown = d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`;
    }
  }

  if (driveRes.loading) {
    return (
      <div className="dd-detail" style={{ fontFamily: FONT }}>
        <Hero eyebrow="Training & Placement Cell" title="Loading drive…" compact />
        <div className="mt-3"><Skeleton variant="card" /><div style={{ height: 16 }} /><Skeleton variant="card" /></div>
      </div>
    );
  }
  if (driveRes.error) {
    return <div className="dd-detail" style={{ ...cardStyle }}><ErrorState message={driveRes.error.message} onRetry={() => driveRes.refetch()} /></div>;
  }

  const company = drive.companyId?.name || 'Company';
  const initial = company.slice(0, 1).toUpperCase();

  return (
    <div className="dd-detail" style={{ fontFamily: FONT }}>
      <div style={{ position: 'relative', zIndex: 1 }}>
        <button
          onClick={() => navigate('/student/drives')}
          onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--primary)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border)'; }}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 10, border: '1px solid var(--border)', cursor: 'pointer', padding: '8px 14px', borderRadius: 999, fontWeight: 700, fontSize: 13, color: 'var(--text)', background: 'transparent', transition: 'background .15s, border-color .15s' }}
        >
          <ArrowLeft size={16} /> All Drives
        </button>

        <Hero
          eyebrow={`${company} · ${labelize(drive.jobType)}`}
          title={drive.title}
          subtitle={drive.jobRole}
          compact
          aside={
            <div style={{ width: 60, height: 60, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.18)', fontWeight: 800, fontSize: 24, color: '#fff', border: '1px solid rgba(255,255,255,0.3)' }}>
              {initial}
            </div>
          }
          actions={
            myApplication ? (
              <button onClick={() => navigate('/student/applications')} className="btn" style={{ background: 'rgba(255,255,255,0.18)', color: '#fff', border: '1px solid rgba(255,255,255,0.35)', padding: '9px 16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                <CheckCircle2 size={14} /> Applied — View
              </button>
            ) : closed ? (
              <span className="badge" style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', padding: '9px 14px', border: '1px solid rgba(255,255,255,0.3)' }}>Applications Closed</span>
            ) : null
          }
        />
      </div>

      {/* Main content grid */}
      <div style={{ flex: 1, minHeight: 0, display: 'grid', gridTemplateColumns: 'minmax(0,1.55fr) minmax(320px, 0.95fr)', gap: 12, marginTop: 12, position: 'relative', zIndex: 1 }} className="dd-grid">

        {/* Left column — application window */}
        <div className="dd-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassPanel style={{ ...cardStyle, padding: 22 }}>
            <div className="lp-grid">
              <div className="lp-window">
                <SectionHeader title="Application Window" icon={Clock} subtitle={closed ? 'Closed' : phase === 'ending' ? 'Closing soon — act fast' : 'Time remaining'} tone={phase === 'closed' ? 'muted' : 'primary'} />
                <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 6 }}>
                  <div style={{ flexShrink: 0 }}>
                    <Ring value={remainingPct} size={148} stroke={13} color={ringTone} track="var(--border)" textColor="var(--text)" />
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.05 }}>{countdown}</div>
                    <div className="small muted" style={{ marginTop: 2 }}>{closed ? 'Applications closed' : phase === 'ending' ? 'Closing soon' : 'Open for applications'}</div>
                    <div className="small muted">Closes {formatDate(drive.applicationDeadline)}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <Fact icon={IndianRupee} label={formatLPA(drive.package, drive.currency)} />
                  <Fact icon={MapPin} label={drive.location || 'On campus'} />
                  <Fact icon={CalendarDays} label={formatDate(drive.driveDate)} />
                </div>
              </div>

              <div className="lp-action">
                {myApplication ? (
                  <ApplicationTracker application={myApplication} onView={() => navigate('/student/applications')} />
                ) : closed ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Applications for this drive are now closed.</div>
                ) : applyBlocked ? (
                  <div style={{ textAlign: 'center' }}>
                    <Lock size={28} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                    <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>{blocked ? "You can't apply right now" : "You don't meet the criteria"}</div>
                    <div className="small muted" style={{ marginBottom: 10 }}>{blocked ? 'TNP policy is blocking this application.' : 'You missed one or more eligibility rules.'}</div>
                    <button onClick={() => eligRes.refetch()} className="btn btn-secondary" style={{ width: '100%' }}>Re-check Eligibility</button>
                  </div>
                ) : (
                  <button
                    disabled={submitting || checkingElig}
                    onClick={handleApply}
                    className="btn btn-primary"
                    style={{ width: '100%', padding: '14px 22px', fontWeight: 800, fontSize: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {checkingElig ? <Loader2 size={17} className="spinner" /> : <PartyPopper size={17} />} {checkingElig ? 'Checking Eligibility…' : 'Apply Now'}
                  </button>
                )}
              </div>
            </div>
          </GlassPanel>
        </div>

        {/* Right column — eligibility engine */}
        <div className="dd-scroll" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <GlassPanel style={{ ...cardStyle, padding: 14 }}>
            <SectionHeader title="Eligibility Engine" icon={Sparkles} subtitle="Evaluated against your live profile" tone="primary" />
            {eligRes.loading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, justifyContent: 'center' }}>
                <Loader2 size={18} className="spinner" /> <span className="small muted">Evaluating…</span>
              </div>
            ) : eligibility?.eligibility ? (
              <EligibilityEngine result={eligibility} profile={profile} offers={offers} onReevaluate={() => eligRes.refetch()} navigate={navigate} />
            ) : (
              <div style={{ textAlign: 'center' }}>
                <p className="small muted" style={{ marginBottom: 12 }}>Run a live check against your CGPA, branch, backlogs and active offers.</p>
                <button
                  onClick={() => eligRes.refetch()}
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '12px 20px', fontWeight: 800, fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  <Sparkles size={16} /> Evaluate My Eligibility
                </button>
              </div>
            )}
          </GlassPanel>
        </div>
      </div>

      {modalOpen && (
        <ResumeApplyModal
          open
          drive={drive}
          student={profile}
          onClose={() => setModalOpen(false)}
          onSubmitted={submitApply}
        />
      )}
    </div>
  );
}
