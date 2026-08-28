import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Mail, LockKeyhole, LogIn, Eye, EyeOff,
  ArrowRight, GraduationCap, ShieldCheck, Settings,
  Send, Star, Users, Handshake, Award, UserCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getApiError } from "../../services/api";
import Button from "../../components/common/Button";

const DEMO_ACCOUNTS = [
  { label: "TPC Officer", email: "officer@tpcflow.local", password: "Officer@123" },
  { label: "Admin", email: "admin@tpcflow.local", password: "Admin@123" },
  { label: "Rahul (Eligible)", email: "rahul@tpcflow.local", password: "Student@123" },
  { label: "Priya (Not Eligible)", email: "priya@tpcflow.local", password: "Student@123" },
];

const ROLE_PERSONAS = [
  { icon: GraduationCap, label: "Student" },
  { icon: ShieldCheck, label: "TPC Officer" },
  { icon: Settings, label: "Admin" },
];

const JOURNEY = [
  { icon: UserCircle, label: "Profile" },
  { icon: Send, label: "Applied" },
  { icon: Star, label: "Shortlisted" },
  { icon: Users, label: "Interview" },
  { icon: Handshake, label: "Offer" },
  { icon: Award, label: "Placed" },
];

const WELCOME_LINES = [
  "Sign in to your TPC Flow workspace",
  "Track drives, eligibility and offers",
  "Your placement journey continues here",
];

const ORBIT_CHIPS = [
  { char: "G", company: "Google" },
  { char: "A", company: "Amazon" },
  { char: "S", company: "Samsung" },
  { char: "U", company: "Uber" },
  { char: "M", company: "Microsoft" },
  { char: "I", company: "Infosys" },
  { char: "T", company: "TCS" },
];

const STATS = [
  { v: "94%",  l: "Placement rate" },
  { v: "500+", l: "Offers this year" },
  { v: "210",  l: "Partner companies" },
];

// All characters ride one smooth orbit ring, ~172px from center (well clear of the logo + label).
const ORBIT_RING = 172;

// 15s orbit = smooth, clearly visible motion without being distracting
const DUR = 15000;

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [tick, setTick] = useState(0);
  const [hiringIdx, setHiringIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((t) => (t + 1) % 1000), 2800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setHiringIdx((i) => (i + 1) % ORBIT_CHIPS.length), 2200);
    return () => clearInterval(id);
  }, []);

  const welcomeLine = WELCOME_LINES[tick % WELCOME_LINES.length];

  const getActiveRole = (em) => {
    const e = (em || "").toLowerCase();
    if (e.includes("admin")) return 2;
    if (e.includes("officer")) return 1;
    return 0;
  };
  const activeRole = getActiveRole(email);

  const doLogin = async (em, pw) => {
    setError("");
    setLoading(true);
    try {
      const u = await login(em || email, pw || password);
      navigate(u.role === "STUDENT" ? "/student/dashboard" : "/tpc/dashboard", { replace: true });
    } catch (e) {
      const err = getApiError(e);
      setError(err.message);
      setLoading(false);
    }
  };

// Total canvas size: orbit ring (172) + room for a 46px chip + margin
  const CANVAS = 208;

  return (
    <div className="login-page">

      {/* ── LEFT PANEL ── */}
      <div className="login-hero">

        {/* Brand row */}
        <div className="hero-top">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/tnp-logo.png" alt="TPC Flow"
              style={{ width: 40, height: 40, objectFit: "contain", borderRadius: 10, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 19, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>TPC Flow</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.72)", fontWeight: 500 }}>Training and Placement Cell</div>
            </div>
          </div>
          <span className="hero-pill"><span className="hero-pill-dot" />Live Placement Pulse</span>
        </div>

        {/* ── ORBIT — fills available space, perfectly centered ── */}
        <div className="orbit-stage">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>

            {/* Orbit canvas */}
            <div style={{ position: "relative", width: CANVAS * 2, height: CANVAS * 2, flexShrink: 0 }}>

{/* Outermost faint ring */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: (ORBIT_RING + 26) * 2, height: (ORBIT_RING + 26) * 2,
                marginTop: -(ORBIT_RING + 26), marginLeft: -(ORBIT_RING + 26),
                borderRadius: "50%",
                border: "1px dashed rgba(255,255,255,0.10)",
              }} />

              {/* Main orbit track ring — characters travel along this */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: ORBIT_RING * 2, height: ORBIT_RING * 2,
                marginTop: -ORBIT_RING, marginLeft: -ORBIT_RING,
                borderRadius: "50%",
                border: "1.5px dashed rgba(255,255,255,0.30)",
              }} />

              {/* Small inner ring (decorative, slow counter-spin) */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                width: 110, height: 110,
                marginTop: -55, marginLeft: -55,
                borderRadius: "50%",
                border: "1px solid rgba(255,255,255,0.14)",
                animation: "orbit-ccw 14s linear infinite",
              }} />

{/* ── CHIP GROUP — each chip orbits on the single ring ── */}
              {ORBIT_CHIPS.map((chip, i) => {
                const r = ORBIT_RING;
                const angleDeg = (i / ORBIT_CHIPS.length) * 360;
                const delay = `${-(angleDeg / 360) * DUR}ms`;
                return (
                  <div key={chip.char} style={{
                    position: "absolute",
                    top: "50%", left: "50%",
                    width: 0, height: 0,
                    zIndex: 3,
                    transformOrigin: "0 0",
                    animation: `orbit-cw ${DUR}ms linear infinite`,
                    animationDelay: delay,
                  }}>
                    {/* Static spacer pushes the bubble out to its ring radius (translate is NOT animated) */}
                    <div style={{
                      position: "absolute", left: 0, top: 0,
                      width: 0, height: 0,
                      transform: `translate(${r}px, 0)`,
                    }}>
                      {/* Letter bubble — centered with margins so its transform is free for counter-rotation */}
                      <div style={{
                        position: "absolute", left: 0, top: 0,
                        width: 46, height: 46,
                        marginLeft: -23, marginTop: -23,
                        borderRadius: "50%",
                        background: "rgba(255,255,255,0.08)",
                        border: "1.5px solid rgba(255,255,255,0.75)",
                        boxShadow: "0 4px 14px rgba(2,64,115,0.25)",
                        color: "#fff",
                        textShadow: "0 1px 3px rgba(2,64,115,0.35)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontWeight: 800, fontSize: 17, letterSpacing: "-0.01em",
                        animation: `orbit-ccw ${DUR}ms linear infinite`,
                        animationDelay: delay,
                        flexShrink: 0,
                      }}>
                        {chip.char}
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* ── CENTER: frosted disc + tnp-logo + cycling company ── */}
              <div style={{
                position: "absolute",
                top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
zIndex: 2,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
              }}>
                {/* Frosted disc */}
                <div style={{
                  width: 88, height: 88, borderRadius: "50%",
                  background: "rgba(255,255,255,0.22)",
                  backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)",
                  border: "2px solid rgba(255,255,255,0.46)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 0 12px rgba(255,255,255,0.06), 0 0 0 26px rgba(255,255,255,0.03)",
                  flexShrink: 0,
                }}>
                  <img src="/tnp-logo.png" alt="TPC Flow"
                    style={{ width: 54, height: 54, objectFit: "contain", borderRadius: 8 }} />
                </div>

                {/* Cycling "Hiring at ___" */}
                <div key={hiringIdx} style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                  animation: "fade-swap 0.38s ease both",
                }}>
                  <div style={{
                    fontSize: 9.5, fontWeight: 700, letterSpacing: "0.12em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.58)",
                  }}>Hiring at</div>
                  <div style={{
                    fontSize: 18, fontWeight: 800, color: "#fff",
                    letterSpacing: "-0.01em", whiteSpace: "nowrap",
                  }}>
                    {ORBIT_CHIPS[hiringIdx].company}
                  </div>
                </div>
              </div>
            </div>

{/* ── STATS ROW — 3 equal boxes below orbit, lifted up off the journey strip ── */}
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
              width: "100%",
              maxWidth: CANVAS * 2,
              marginBottom: 26,
            }}>
              {STATS.map((s) => (
                <div key={s.l} style={{
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.20)",
                  borderRadius: 12,
                  padding: "14px 12px",
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  textAlign: "center",
                }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1 }}>
                    {s.v}
                  </div>
                  <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.72)", fontWeight: 500, lineHeight: 1.3 }}>
                    {s.l}
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

        {/* ── Journey strip at bottom ── */}
        <div className="hero-journey" aria-label="Placement journey" style={{ flexShrink: 0 }}>
          <div style={{
            fontSize: 10.5, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.58)", marginBottom: 10,
          }}>
            Student Journey
          </div>
          <div className="journey-track">
            {JOURNEY.map((s) => (
              <div key={s.label} className="journey-node">
                <span className="journey-dot"><s.icon size={15} /></span>
                <span className="journey-label">{s.label}</span>
              </div>
            ))}
            <span className="journey-flow" aria-hidden />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — clean white form ── */}
      <div className="login-form-side">
        <div className="login-card">

          {/* Role indicator */}
          <div className="role-switch" style={{ "--i": String(activeRole) }}
            role="status" aria-label={`Signing in as ${ROLE_PERSONAS[activeRole].label}`}>
            <span className="role-switch-thumb" />
            {ROLE_PERSONAS.map((r, i) => (
              <div key={r.label} className={`role-opt${i === activeRole ? " active" : ""}`}>
                <span className="role-opt-icon"><r.icon size={14} /></span>
                <span className="role-opt-label">{r.label}</span>
              </div>
            ))}
          </div>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <img src="/tnp-logo.png" alt="TPC Flow"
              style={{ width: 38, height: 38, objectFit: "contain", borderRadius: 9, flexShrink: 0, border: "1px solid var(--border)" }} />
            <div>
              <div className="welcome-title">Welcome back</div>
              <div className="welcome-sub" key={welcomeLine}>{welcomeLine}</div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={(e) => { e.preventDefault(); doLogin(); }}>
            <div className="field mb-3">
              <label htmlFor="login-email">Email address</label>
              <div style={{ position: "relative" }}>
                <Mail size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input id="login-email" type="email" className="input" style={{ paddingLeft: 34 }}
                  placeholder="you@institution.edu" value={email}
                  onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
              </div>
            </div>

            <div className="field mb-3">
              <label htmlFor="login-password">Password</label>
              <div style={{ position: "relative" }}>
                <LockKeyhole size={15} style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", pointerEvents: "none" }} />
                <input id="login-password" type={showPass ? "text" : "password"} className="input"
                  style={{ paddingLeft: 34, paddingRight: 40 }} placeholder="••••••••"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass((s) => !s)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                  style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "var(--text-muted)", display: "grid", placeItems: "center", padding: 5, cursor: "pointer" }}>
                  {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="policy-decision blocked mb-3" role="alert">
                <strong style={{ fontSize: 13 }}>Sign-in failed</strong>
                <div className="small mt-1">{error}</div>
              </div>
            )}

            <Button type="submit" block loading={loading} icon={LogIn}>Sign In</Button>
          </form>

          <hr className="divider" />

          <div className="small muted mb-2" style={{ fontWeight: 600, letterSpacing: "0.02em" }}>
            Explore a demo workspace
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
            {DEMO_ACCOUNTS.map((acc) => (
              <button key={acc.email} type="button" className="demo-cred-btn"
                onClick={() => { setEmail(acc.email); setPassword(acc.password); doLogin(acc.email, acc.password); }}
                disabled={loading}>
                <span>{acc.label}</span>
                <ArrowRight size={13} style={{ color: "var(--primary)" }} />
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}
