import { Link, useNavigate } from 'react-router-dom';
import {
  Briefcase, FileText, Handshake, Award, ArrowRight,
  UserCircle, Send, Star, Users, Compass, Rocket, Target, TrendingUp,
  CheckCircle2, Clock, Gift,
} from 'lucide-react';
import StatCard from '../../components/common/StatCard';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useApi from '../../hooks/useApi';
import { formatLPA, formatDate } from '../../utils/formatters';

const JOURNEY = [
  { icon: UserCircle, label: 'Profile'     },
  { icon: Send,       label: 'Applied'     },
  { icon: Star,       label: 'Shortlisted' },
  { icon: Users,      label: 'Interview'   },
  { icon: Handshake,  label: 'Offer'       },
  { icon: Award,      label: 'Placed'      },
];

/*
  CGPA Ring — the signature element on the student dashboard.
  Flat sky-blue stroke, no gradient, no colored glow.
  Animates on mount via CSS transition on stroke-dashoffset.
*/
function CgpaRing({ value, loading }) {
  const R = 50;
  const C = 2 * Math.PI * R;
  const v = Number(value) || 0;
  const pct = Math.min(1, v / 10);
  const off = C * (1 - pct);
  return (
    <div className="cgpa-ring">
      <svg viewBox="0 0 130 130">
        {/* Track */}
        <circle cx="65" cy="65" r={R} stroke="var(--border)" strokeWidth="10" fill="none" />
        {/* Progress — flat sky blue, no gradient */}
        <circle
          cx="65" cy="65" r={R}
          stroke="var(--primary)"
          strokeWidth="10"
          strokeLinecap="round"
          fill="none"
          strokeDasharray={C}
          strokeDashoffset={loading ? C : off}
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dashoffset 1.2s cubic-bezier(.25,.8,.25,1)' }}
        />
        <text x="65" y="61" textAnchor="middle" className="cgpa-num">{loading ? '' : v.toFixed(2)}</text>
        <text x="65" y="80" textAnchor="middle" className="cgpa-cap">CGPA</text>
      </svg>
    </div>
  );
}

export default function StudentDashboard() {
  const navigate = useNavigate();
  const profileRes = useApi(() => import('../../services/studentService').then((m) => m.default.getMyProfile()), []);
  const drivesRes  = useApi(() => import('../../services/driveService').then((m) => m.default.getDrives({ limit: 5 })), []);
  const appsRes    = useApi(() => import('../../services/applicationService').then((m) => m.default.getApplications({ limit: 100 })), []);
  const offersRes  = useApi(() => import('../../services/offerService').then((m) => m.default.getOffers({ limit: 20 })), []);

  const me     = profileRes.data?.data;
  const drives = drivesRes.data?.data  || [];
  const apps   = appsRes.data?.data    || [];
  const offers = offersRes.data?.data  || [];

  const shortlisted    = apps.filter((a) => ['SHORTLISTED', 'INTERVIEW', 'SELECTED'].includes(a.status)).length;
  const acceptedOffer  = offers.find((o) => o.status === 'ACCEPTED');
  const pendingOffer   = offers.find((o) => o.status === 'OFFERED');
  const interviewCount = apps.filter((a) => ['INTERVIEW', 'SELECTED'].includes(a.status)).length;
  const hasInterview   = apps.some((a)  => ['INTERVIEW', 'SELECTED'].includes(a.status));
  const hasShortlist   = apps.some((a)  => ['SHORTLISTED', 'SELECTED'].includes(a.status));

  let stage = 0;
  if (acceptedOffer)   stage = 5;
  else if (pendingOffer)   stage = 4;
  else if (hasInterview)   stage = 3;
  else if (hasShortlist)   stage = 2;
  else if (apps.length > 0) stage = 1;

  const firstName = me?.name?.split(' ')[0] || '…';

  /* Next action — plain, specific copy (no marketing speak) */
  let next = null;
  if (acceptedOffer) {
    next = { icon: Award, title: "You're placed — congratulations!", desc: `${acceptedOffer.role} at ${acceptedOffer.companyId?.name}`, to: '/student/placement-status', cta: 'View Status', tone: 'success' };
  } else if (pendingOffer) {
    next = { icon: Handshake, title: 'Pending offer waiting for your response', desc: `${pendingOffer.role} at ${pendingOffer.companyId?.name}`, to: '/student/offers', cta: 'Review Offer', tone: 'warning' };
  } else if (drives.length > 0) {
    next = { icon: Compass, title: `${drives.length} drives open right now`, desc: 'Check which ones match your eligibility', to: '/student/drives', cta: 'Explore Drives', tone: 'primary' };
  } else if (apps.length === 0) {
    next = { icon: Rocket, title: 'No applications yet', desc: 'Browse open drives and submit your first application', to: '/student/drives', cta: 'Browse Drives', tone: 'primary' };
  } else {
    next = { icon: Target, title: 'Applications in progress', desc: 'Track your status and prepare for the next round', to: '/student/applications', cta: 'View Applications', tone: 'primary' };
  }
  const NextIcon = next.icon;

  return (
    /* No .stu-aura div, no floating emoji glyphs */
    <div className="stu-dash page-enter">

      {/* ── Hero — flat white card, CGPA ring as focal point ── */}
      <div className="stu-hero">
        <div className="stu-hero-main">
          <div className="stu-greet">Welcome back,</div>
          <h1 className="stu-name">
            {firstName} <span className="stu-wave">👋</span>
          </h1>
          <div className="stu-tags">
            {me ? (
              <>
                <span className="stu-tag">{me.branch}</span>
                <span className="stu-tag">Class of {me.graduationYear}</span>
                <span className="stu-tag stu-tag-cgpa">CGPA {Number(me.cgpa).toFixed(2)}</span>
              </>
            ) : (
              <span className="stu-tag">Loading…</span>
            )}
          </div>
          <p className="stu-sub">
            Every application, shortlist, interview and offer — tracked in one place.
          </p>
        </div>
        <div className="stu-hero-ring">
          <CgpaRing value={me?.cgpa} loading={profileRes.loading} />
        </div>
      </div>

      {/* ── Placement journey stepper — the signature element ── */}
      <div className="stu-stepper" aria-label="Your placement journey">
        {JOURNEY.map((s, i) => (
          <div
            className={
              'sstep' +
              (i < stage ? ' done' : '') +
              (i === stage ? ' current' : '')
            }
            key={s.label}
          >
            <div className="sstep-dot"><s.icon size={14} /></div>
            <span className="sstep-label">{s.label}</span>
            {i < JOURNEY.length - 1 && <span className="sstep-line" />}
          </div>
        ))}
      </div>

      {/* ── KPI row ── */}
      <div className="grid-stats stu-stats stagger-in">
        <StatCard icon={Briefcase} label="Open Drives"        value={drives.length}    accent="primary" loading={drivesRes.loading}  onClick={() => navigate('/student/drives')} />
        <StatCard icon={FileText}  label="My Applications"   value={apps.length}      accent="primary" loading={appsRes.loading}    onClick={() => navigate('/student/applications')} />
        <StatCard icon={Star}      label="Shortlisted"        value={shortlisted}      accent="warning" loading={appsRes.loading}    onClick={() => navigate('/student/applications')} />
        <StatCard icon={Handshake} label="Offers"             value={offers.length}    accent="success" loading={offersRes.loading}  onClick={() => navigate('/student/offers')} />
        <StatCard icon={Users}     label="In Interview"       value={interviewCount}   accent="info"    loading={appsRes.loading}    onClick={() => navigate('/student/applications')} />
      </div>

      {/* ── Action + spotlight row ── */}
      <div className="grid-2 stu-row">
        {/* Next move */}
        <Card className="stu-next">
          <div className="card-title">Your next move</div>
          <div className="card-sub">One focused action to keep things moving.</div>
          <div className={`stu-next-body stu-next-${next.tone}`}>
            <div className="stu-next-ic"><NextIcon size={20} /></div>
            <div className="stu-next-txt">
              <strong>{next.title}</strong>
              <span className="small muted">{next.desc}</span>
            </div>
          </div>
          <Link to={next.to} className={`btn btn-sm stu-next-cta btn-${next.tone === 'primary' ? 'primary' : next.tone === 'success' ? 'success' : 'warning'}`}>
            {next.cta} <ArrowRight size={13} />
          </Link>
        </Card>

        {/* Placement spotlight — flat card, no gradient bg */}
        <Card className="stu-spot">
          {acceptedOffer ? (
            <>
              <div className="stu-spot-badge"><Gift size={13} /> Placed</div>
              <div className="stu-spot-role">{acceptedOffer.role}</div>
              <div className="stu-spot-co">at {acceptedOffer.companyId?.name}</div>
              <div className="stu-spot-pkg">{formatLPA(acceptedOffer.package, acceptedOffer.currency)}</div>
              <div className="small muted mt-1">accepted {acceptedOffer.acceptedAt ? formatDate(acceptedOffer.acceptedAt) : 'recently'}</div>
              <Link to="/student/placement-status" className="btn btn-sm btn-success stu-spot-cta">View Status</Link>
            </>
          ) : pendingOffer ? (
            <>
              <div className="stu-spot-badge warn"><Clock size={13} /> Pending Offer</div>
              <div className="stu-spot-role">{pendingOffer.role}</div>
              <div className="stu-spot-co">at {pendingOffer.companyId?.name}</div>
              <div className="stu-spot-pkg">{formatLPA(pendingOffer.package, pendingOffer.currency)}</div>
              <div className="small muted mt-1">Review and accept to confirm your placement</div>
              <Link to="/student/offers" className="btn btn-sm btn-warning stu-spot-cta">Review Offer</Link>
            </>
          ) : (
            <>
              <div className="stu-spot-badge"><TrendingUp size={13} /> Journey Stage</div>
              <div className="stu-spot-role">{JOURNEY[stage].label}</div>
              <div className="stu-spot-co">
                {stage === 0 ? 'Complete your profile, then start applying' : 'Making progress — keep going'}
              </div>
              <div className="stu-spot-pkg" style={{ fontSize: 16, color: 'var(--text-muted)' }}>
                {stage} / {JOURNEY.length - 1} milestones reached
              </div>
              <Link to="/student/drives" className="btn btn-sm btn-secondary stu-spot-cta">Browse Drives</Link>
            </>
          )}
        </Card>
      </div>

      {/* ── Open drives list ── */}
      <Card>
        <div className="flex-between mb-2">
          <div>
            <div className="card-title">Open Drives</div>
            <div className="card-sub">
              Eligibility is checked against your live academic record — open a drive for the full rule breakdown.
            </div>
          </div>
          <Link to="/student/drives" className="btn btn-secondary btn-sm">View All <ArrowRight size={13} /></Link>
        </div>

        {drivesRes.loading ? (
          <><Skeleton variant="row" /><Skeleton variant="row" /><Skeleton variant="row" /></>
        ) : drivesRes.error ? (
          <ErrorState message={drivesRes.error.message} onRetry={() => drivesRes.refetch()} />
        ) : drives.length === 0 ? (
          <EmptyState icon={Briefcase} title="No open drives right now"
            description="When the placement cell publishes new drives, they'll appear here with your live eligibility." />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {drives.map((d) => (
              <Link key={d._id} to={`/student/drives/${d._id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="card hover card-pad-sm stu-drive" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {/* Company initial chip — flat sky-blue */}
                  <div className="avatar" style={{ borderRadius: 8, fontSize: 13, width: 34, height: 34 }}>
                    {(d.companyId?.name || '?').slice(0, 1)}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 13.5 }}>{d.title}</div>
                    <div className="small muted">{d.companyId?.name} · {d.jobRole}</div>
                  </div>
                  <span className="stu-drive-pkg">{formatLPA(d.package, d.currency)}</span>
                  <span className="small muted" style={{ width: 84, textAlign: 'right', flexShrink: 0 }}>by {formatDate(d.applicationDeadline)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
