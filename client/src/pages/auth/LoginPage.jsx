import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap, Mail, LockKeyhole, LogIn, Eye, EyeOff,
  ArrowRight, Check, Sparkles, TrendingUp, Building2,
  ShieldCheck, Settings,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getApiError } from '../../services/api';
import Button from '../../components/common/Button';

const DEMO_ACCOUNTS = [
  { label: 'TPC Officer', email: 'officer@tpcflow.local', password: 'Officer@123' },
  { label: 'Admin', email: 'admin@tpcflow.local', password: 'Admin@123' },
  { label: 'Rahul (Eligible)', email: 'rahul@tpcflow.local', password: 'Student@123' },
  { label: 'Priya (Not Eligible)', email: 'priya@tpcflow.local', password: 'Student@123' },
];

// Orbiting letters = top recruiters our students get hired at.
const ORBIT_COMPANIES = [
  { l: 'G', n: 'Google' },
  { l: 'A', n: 'Amazon' },
  { l: 'S', n: 'Samsung' },
  { l: 'U', n: 'Uber' },
  { l: 'M', n: 'Microsoft' },
  { l: 'I', n: 'Infosys' },
  { l: 'T', n: 'TCS' },
  { l: 'N', n: 'Nvidia' },
];

const ROLE_PERSONAS = [
  { icon: GraduationCap, label: 'Student' },
  { icon: ShieldCheck, label: 'TPC Officer' },
  { icon: Settings, label: 'Admin' },
];

const WELCOME_LINES = [
  'Sign in to your TPC Flow workspace',
  'Track drives, live eligibility & offers',
  'Your placement journey continues here',
  'Where careers take off',
];
const JOURNEY = [
  { icon: Sparkles, label: 'Apply' },
  { icon: TrendingUp, label: 'Shortlist' },
  { icon: Building2, label: 'Interview' },
  { icon: GraduationCap, label: 'Offer' },
  { icon: Check, label: 'Placed' },
];
const HERO_STATS = [
  { v: '94%', l: 'Placement Rate' },
  { v: '500+', l: 'Offers Rolled Out' },
  { v: '210', l: 'Partner Companies' },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [tick, setTick] = useState(0);

  const ROLE_THEME = [
    { c1: '#22C55E', c2: '#10B981' }, // Student — green
    { c1: '#6366F1', c2: '#8B5CF6' }, // TPC Officer — indigo/violet
    { c1: '#EC4899', c2: '#F43F5E' }, // Admin — pink/rose
  ];
  const getActiveRole = (em) => {
    const e = (em || '').toLowerCase();
    if (e.includes('admin')) return 2;
    if (e.includes('officer')) return 1;
    return 0;
  };
  const activeRole = getActiveRole(email);
  const theme = ROLE_THEME[activeRole];

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1000), 2400);
    return () => clearInterval(id);
  }, []);

  const company = ORBIT_COMPANIES[tick % ORBIT_COMPANIES.length];
  const welcomeLine = WELCOME_LINES[tick % WELCOME_LINES.length];

  const doLogin = async (em, pw) => {
    setError('');
    setLoading(true);
    try {
      const u = await login(em || email, pw || password);
      navigate(u.role === 'STUDENT' ? '/student/dashboard' : '/tpc/dashboard', { replace: true });
    } catch (e) {
      const err = getApiError(e);
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-hero">
        <div className="hero-grid-overlay" />

        <div className="hero-top">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="brand-logo" style={{ width: 44, height: 44 }}>
              <GraduationCap size={24} />
            </div>
            <div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>TPC Flow</div>
              <div style={{ fontSize: 12, color: '#A5B4FC', fontWeight: 600 }}>Training &amp; Placement Cell</div>
            </div>
          </div>
          <span className="hero-pill"><span className="hero-pill-dot" /> Live Placement Pulse</span>
        </div>

        <div className="hero-stage">
          <div className="orbit" aria-hidden>
            <div className="orbit-ring orbit-ring-1" />
            <div className="orbit-ring orbit-ring-2" />
            <div className="orbit-spin">
              {ORBIT_COMPANIES.map((c, i) => (
                <span key={c.l + i} className="orbit-chip" title={c.n} style={{ '--i': i, '--n': ORBIT_COMPANIES.length }}>
                  {c.l}
                </span>
              ))}
            </div>
            <div className="orbit-core">
              <GraduationCap size={34} />
              <span className="orbit-core-badge"><Check size={13} strokeWidth={3} /></span>
            </div>
            <div className="orbit-caption">Hiring at <strong>{company.n}</strong></div>
          </div>

          <div className="hero-headline">
            <h1>
              Where careers
              <br />
              <span className="hl-accent">take&nbsp;off.</span>
            </h1>
            <p className="hero-sub">One unified platform for drives, live eligibility &amp; offers.</p>

            <div className="hero-stats">
              {HERO_STATS.map((s) => (
                <div key={s.l} className="hstat">
                  <div className="hstat-v">{s.v}</div>
                  <div className="hstat-l">{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="hero-journey" aria-hidden>
          <div className="journey-track">
            {JOURNEY.map((s, i) => (
              <div key={s.label} className="journey-node" style={{ '--i': i }}>
                <span className="journey-dot"><s.icon size={15} /></span>
                <span className="journey-label">{s.label}</span>
              </div>
            ))}
            <span className="journey-flow" />
          </div>
        </div>
      </div>

      <div className="login-form-side" style={{ '--role1': theme.c1, '--role2': theme.c2 }}>
        <div className="form-mesh" aria-hidden />
        <div className="form-blobs" aria-hidden>
          <span className="form-blob form-blob-1" />
          <span className="form-blob form-blob-2" />
          <span className="form-ring form-ring-1" />
          <span className="form-ring form-ring-2" />
        </div>
        <div className="form-deco" aria-hidden>
          <span className="form-glyph g1"><GraduationCap size={30} /></span>
          <span className="form-glyph g2"><Building2 size={24} /></span>
          <span className="form-glyph g3"><TrendingUp size={24} /></span>
          <span className="form-glyph g4"><Sparkles size={20} /></span>
        </div>
        <div className="login-card">
          <div className="role-switch" style={{ '--i': String(activeRole) }} role="status" aria-label={'Signing in as ' + ROLE_PERSONAS[activeRole].label}>
            <span className="role-switch-thumb" />
            {ROLE_PERSONAS.map((r, i) => (
              <div
                key={r.label}
                className={'role-opt' + (i === activeRole ? ' active' : '')}
                style={i === activeRole ? { animation: 'pill-pop 0.45s ease' } : undefined}
              >
                <span className="role-opt-icon"><r.icon size={15} /></span>
                <span className="role-opt-label">{r.label}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div className="brand-logo" style={{ width: 40, height: 40 }}>
              <GraduationCap size={20} />
            </div>
            <div>
              <div className="welcome-title">Welcome back</div>
              <div className="welcome-sub" key={welcomeLine}>{welcomeLine}</div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              doLogin();
            }}
          >
            <div className="field mb-3">
              <label htmlFor="email">Email address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="email"
                  type="email"
                  className="input"
                  style={{ paddingLeft: 38 }}
                  placeholder="you@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="field mb-3">
              <label htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <LockKeyhole size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  className="input"
                  style={{ paddingLeft: 38, paddingRight: 42 }}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? 'Hide password' : 'Show password'}
                  style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', display: 'grid', placeItems: 'center', padding: 6 }}
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="policy-decision blocked mb-3" role="alert" style={{ background: 'var(--danger-soft)' }}>
                <strong style={{ fontSize: 13 }}>Sign-in failed</strong>
                <div className="small mt-1">{error}</div>
              </div>
            )}

            <Button type="submit" block loading={loading} icon={LogIn}>
              Sign In
            </Button>
          </form>

          <hr className="divider" />

          <div className="small muted mb-2" style={{ fontWeight: 650, letterSpacing: '0.03em' }}>
            Explore a demo workspace
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button
                key={acc.email}
                type="button"
                className="demo-cred-btn"
                onClick={() => {
                  setEmail(acc.email);
                  setPassword(acc.password);
                  doLogin(acc.email, acc.password);
                }}
                disabled={loading}
              >
                <span>{acc.label}</span>
                <ArrowRight size={14} style={{ color: 'var(--primary)' }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
