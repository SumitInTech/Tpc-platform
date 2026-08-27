import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Briefcase, Send, CheckCircle2, Clock, PartyPopper, Sparkles,
  ArrowUpRight, ShieldAlert, ShieldCheck,
} from 'lucide-react';
import studentService from '../../services/studentService';
import applicationService from '../../services/applicationService';
import offerService from '../../services/offerService';
import useApi from '../../hooks/useApi';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import { Hero, Ring, GlassPanel, SectionHeader, cardStyle, toneOf } from '../../components/dashboard/primitives';
import { formatLPA, labelize, timeAgo } from '../../utils/formatters';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const statusTone = (s) => s === 'PLACED' ? 'success' : s === 'NOT_ELIGIBLE' ? 'warning' : s === 'BLOCKED' ? 'danger' : 'primary';

function StatTile({ icon: Icon, label, value, tone, children }) {
  const c = toneOf(tone);
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 11, minHeight: 108, boxShadow: 'var(--shadow-md)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${c}, transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{label}</span>
        <span style={{ display: 'inline-flex', padding: 5, borderRadius: 'var(--radius-sm)', color: c, background: `color-mix(in srgb, ${c} 15%, transparent)` }}><Icon size={13} /></span>
      </div>
      <div style={{ fontSize: 18, fontWeight: 800, marginTop: 5 }}>{value}</div>
      {children}
    </div>
  );
}

export default function StudentPlacementStatusPage() {
  const navigate = useNavigate();
  const profileRes = useApi(() => studentService.getMyProfile(), []);
  const appsRes = useApi(() => applicationService.getApplications({ limit: 200 }), []);
  const offersRes = useApi(() => offerService.getOffers({ limit: 100 }), []);

  const loading = profileRes.loading || appsRes.loading || offersRes.loading;

  const data = useMemo(() => {
    const profile = profileRes.data?.data || {};
    const apps = appsRes.data?.data || [];
    const offers = offersRes.data?.data || [];
    const accepted = offers.filter((o) => o.status === 'ACCEPTED');
    const pending = offers.filter((o) => o.status === 'OFFERED');
    const totalOffers = offers.length;
    const offerPct = totalOffers ? Math.round((accepted.length / totalOffers) * 100) : (profile.placementStatus === 'PLACED' ? 100 : 0);
    const shortlisted = apps.filter((a) => a.status === 'SHORTLISTED').length;
    const selected = apps.filter((a) => a.status === 'SELECTED').length;
    return { profile, apps, offers, accepted, pending, totalOffers, offerPct, shortlisted, selected };
  }, [profileRes.data, appsRes.data, offersRes.data]);

  if (loading) {
    return <div style={{ fontFamily: FONT }}><Hero eyebrow="Training & Placement Cell" title="Placement Status" compact /><div className="mt-3"><Skeleton variant="card" /><div style={{ height: 16 }} /><Skeleton variant="card" /></div></div>;
  }
  if (profileRes.error) {
    return <div style={{ ...cardStyle }}><ErrorState message={profileRes.error.message} onRetry={() => profileRes.refetch()} /></div>;
  }

  const { profile, apps, offers, accepted, pending, offerPct, shortlisted, selected } = data;

  return (
    <div style={{ fontFamily: FONT }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="Placement Status"
        subtitle="Your live journey — applications, offers, and eligibility standing, all in one view."
        compact
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(210px, 260px) 1fr', gap: 14, marginTop: 14, alignItems: 'stretch' }} className="ps-outer">
        <GlassPanel gradient={profile.placementStatus === 'PLACED' ? 'linear-gradient(90deg,#16A34A,#15803D)' : 'linear-gradient(90deg,#6366F1,#4338CA)'} style={{ ...cardStyle, padding: 12, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <SectionHeader title="Placement Standing" icon={GraduationCap} center />
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 6 }}>
            <div style={{ flexShrink: 0 }}>
              <Ring value={offerPct} size={96} stroke={10} color={toneOf(statusTone(profile.placementStatus))} textColor="var(--text, #0f172a)" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{labelize(profile.placementStatus)}</div>
              <div className="small muted">{profile.placementStatus === 'PLACED' ? 'Congratulations!' : 'In progress'}</div>
            </div>
          </div>
          <div style={{ textAlign: 'right', marginTop: 8 }}>
            {profile.careerOutcome?.company ? (
              <div>
                <div style={{ fontWeight: 800, fontSize: 13.5 }}>{profile.careerOutcome.company}</div>
                <div className="small muted">{profile.careerOutcome.role} · {formatLPA(profile.careerOutcome.package)}</div>
              </div>
            ) : (
              <div className="small muted" style={{ fontSize: 12 }}>No confirmed offer yet</div>
            )}
          </div>
        </GlassPanel>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, alignItems: 'stretch' }} className="ps-inner">
          <StatTile icon={Send} label="Applications" value={apps.length} tone="primary" />
          <StatTile icon={Sparkles} label="Shortlisted" value={shortlisted} tone="warning" />
          <StatTile icon={CheckCircle2} label="Selected" value={selected} tone="success" />
          <StatTile icon={Clock} label="Pending Offers" value={pending.length} tone="warning" />
          <StatTile icon={PartyPopper} label="Accepted Offers" value={accepted.length} tone="success" />
          <StatTile icon={profile.eligibilityRestricted ? ShieldAlert : ShieldCheck} label="Eligibility" value={profile.eligibilityRestricted ? 'Restricted' : 'Clear'} tone={profile.eligibilityRestricted ? 'danger' : 'success'}>
            <div className="small muted" style={{ marginTop: 2, fontSize: 11.5 }}>Eligible for new applications</div>
            <div style={{ marginTop: 4 }}>
              <span className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-soft-text)', fontWeight: 700, padding: '4px 9px', fontSize: 11 }}>{labelize(profile.placementStatus)}</span>
            </div>
            {profile.eligibilityRestrictedReason && <div className="small muted mt-2" style={{ fontSize: 11 }}>{profile.eligibilityRestrictedReason}</div>}
          </StatTile>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <GlassPanel gradient="linear-gradient(90deg,#6366F1,#4338CA)" style={{ ...cardStyle }}>
          <SectionHeader title="My Offers" icon={Briefcase} subtitle={`${offers.length} total`} />
          {offers.length === 0 ? (
            <div className="small muted mt-2">No offers yet. Accepted offers create placement records automatically.</div>
          ) : (
            <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
              {offers.map((o) => (
                <div key={o._id} style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <strong>{o.companyId?.name || 'Company'}</strong>
                    <Badge status={o.status} />
                  </div>
                  <div className="small muted">{o.role || o.driveId?.title} · {formatLPA(o.package, o.currency)}</div>
                  {o.applicationId && (
                    <button className="link" style={{ marginTop: 6, display: 'inline-flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                      onClick={() => navigate('/student/applications')}>
                      View application <ArrowUpRight size={13} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel gradient="linear-gradient(90deg,#16A34A,#15803D)" style={{ ...cardStyle }}>
          <SectionHeader title="Eligibility Snapshot" icon={ShieldCheck} subtitle="Standing for new applications" />
          <div style={{ marginTop: 8, display: 'grid', gap: 10 }}>
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
              <div className="small muted">Placement status</div>
              <div style={{ fontWeight: 700 }}>{labelize(profile.placementStatus)}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
              <div className="small muted">Backlogs (Total / Active)</div>
              <div style={{ fontWeight: 700 }}>{profile.backlogs ?? '—'} / {profile.activeBacklogs ?? '—'}</div>
            </div>
            <div style={{ padding: 12, borderRadius: 12, background: 'var(--surface-2)' }}>
              <div className="small muted">CGPA</div>
              <div style={{ fontWeight: 700 }}>{profile.cgpa ?? '—'}</div>
            </div>
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}
