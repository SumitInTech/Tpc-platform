import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Mail, Phone, Hash, GraduationCap, Building2, CalendarDays, BadgeCheck,
  Pencil, Plus, X, Save, Briefcase, Sparkles, PartyPopper, AlertTriangle,
} from 'lucide-react';
import studentService from '../../services/studentService';
import useApi from '../../hooks/useApi';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import { Hero, Kpi, TextKpi, KpiGrid, GlassPanel, SectionHeader, cardStyle } from '../../components/dashboard/primitives';
import { formatLPA, labelize } from '../../utils/formatters';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";

const graduateYearOptions = [];
const currentYear = new Date().getFullYear();
for (let y = currentYear - 1; y <= currentYear + 4; y += 1) graduateYearOptions.push(y);

const branchOptions = [
  'CSE', 'CSE-AI', 'CSE-DS', 'ECE', 'EEE', 'MECH', 'CIVIL', 'IT', 'AIML', 'IOT', 'CSBS', 'OTHER',
];

const emptyForm = {
  phone: '', branch: '', department: '', batch: '', graduationYear: '', backlogs: '', activeBacklogs: '',
};

const statusTone = (s) => s === 'PLACED' ? 'success' : s === 'NOT_ELIGIBLE' ? 'warning' : s === 'BLOCKED' ? 'danger' : 'primary';

export default function StudentProfilePage() {
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(emptyForm);
  const [customBranch, setCustomBranch] = useState('');
  const [editErrors, setEditErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [skills, setSkills] = useState([]);
  const [skillInput, setSkillInput] = useState('');
  const [savingSkills, setSavingSkills] = useState(false);

  const profileRes = useApi(async () => {
    const res = await studentService.getMyProfile();
    const p = res.data?.data || res.data;
    setSkills(p.skills || []);
    return res;
  }, []);

  const profile = profileRes.data?.data;

  function handleEditOpen() {
    setEditErrors({});
    setSaveError(null);
    const b = profile?.branch || '';
    const isOther = b && !branchOptions.includes(b);
    setEditForm({
      phone: profile?.phone || '',
      branch: isOther ? 'OTHER' : b,
      department: profile?.department || '',
      batch: profile?.batch || '',
      graduationYear: profile?.graduationYear || '',
      backlogs: profile?.backlogs ?? '',
      activeBacklogs: profile?.activeBacklogs ?? '',
    });
    setCustomBranch(isOther ? b : '');
    setEditOpen(true);
  }

  function handleEditChange(e) {
    const { name, value } = e.target;
    setEditForm((f) => ({ ...f, [name]: value }));
    if (editErrors[name]) setEditErrors((er) => ({ ...er, [name]: undefined }));
  }

  function validateEdit() {
    const errors = {};
    if (!editForm.phone || !editForm.phone.trim()) errors.phone = 'Phone is required';
    else if (!/^[+\d][\d\s-]{6,19}$/.test(editForm.phone)) errors.phone = 'Enter a valid phone number';
    if (editForm.branch === 'OTHER') {
      if (!customBranch.trim()) errors.branch = 'Please specify your branch';
    } else if (!editForm.branch) {
      errors.branch = 'Branch is required';
    }
    if (!editForm.department || !editForm.department.trim()) errors.department = 'Department is required';
    if (!editForm.batch || !editForm.batch.trim()) errors.batch = 'Batch is required';
    if (!editForm.graduationYear) errors.graduationYear = 'Graduation year is required';
    else if (Number(editForm.graduationYear) < 2000 || Number(editForm.graduationYear) > 2100) errors.graduationYear = 'Invalid year';
    if (editForm.backlogs === '' || editForm.backlogs == null) errors.backlogs = 'Required';
    else if (Number(editForm.backlogs) < 0) errors.backlogs = 'Cannot be negative';
    if (editForm.activeBacklogs === '' || editForm.activeBacklogs == null) errors.activeBacklogs = 'Required';
    else if (Number(editForm.activeBacklogs) < 0) errors.activeBacklogs = 'Cannot be negative';
    if (editForm.backlogs !== '' && editForm.activeBacklogs !== '' && Number(editForm.activeBacklogs) > Number(editForm.backlogs)) {
      errors.activeBacklogs = 'Cannot exceed total backlogs';
    }
    return errors;
  }

  async function handleEditSave() {
    const errors = validateEdit();
    if (Object.keys(errors).length) { setEditErrors(errors); return; }
    setSaving(true);
    setSaveError(null);
    try {
      await studentService.updateMyProfile({
        phone: editForm.phone || undefined,
        branch: (editForm.branch === 'OTHER' ? customBranch.trim() : editForm.branch) || undefined,
        department: editForm.department || undefined,
        batch: editForm.batch || undefined,
        graduationYear: editForm.graduationYear ? Number(editForm.graduationYear) : undefined,
        backlogs: editForm.backlogs !== '' ? Number(editForm.backlogs) : undefined,
        activeBacklogs: editForm.activeBacklogs !== '' ? Number(editForm.activeBacklogs) : undefined,
      });
      setEditOpen(false);
      profileRes.refetch();
    } catch (err) {
      setSaveError(err.response?.data?.message || err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleSkillAdd() {
    const v = skillInput.trim();
    if (!v) return;
    if (skills.some((s) => s.toLowerCase() === v.toLowerCase())) { setSkillInput(''); return; }
    if (skills.length >= 40) return;
    setSkills((prev) => [...prev, v]);
    setSkillInput('');
  }

  function handleSkillRemove(s) { setSkills((prev) => prev.filter((x) => x !== s)); }

  async function handleSkillsSave() {
    const v = skillInput.trim();
    let finalSkills = skills;
    if (v && !skills.some((s) => s.toLowerCase() === v.toLowerCase()) && skills.length < 40) {
      finalSkills = [...skills, v];
      setSkills(finalSkills);
    }
    setSavingSkills(true);
    try {
      await studentService.updateMyProfile({ skills: finalSkills });
      setSkillInput('');
      profileRes.refetch();
    } finally {
      setSavingSkills(false);
    }
  }

  if (profileRes.loading) {
    return <div style={{ fontFamily: FONT }}><Hero eyebrow="Training & Placement Cell" title="My Profile" compact /><div className="mt-3"><Skeleton variant="card" /><div style={{ height: 16 }} /><Skeleton variant="card" /></div></div>;
  }
  if (profileRes.error) {
    return <div style={{ ...cardStyle }}><ErrorState message={profileRes.error.message} onRetry={() => profileRes.refetch()} /></div>;
  }

  return (
    <div style={{ fontFamily: FONT }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="My Profile"
        subtitle={`Welcome, ${profile?.name || 'student'} — your placement identity, academic record, and tech stack.`}
        compact
        actions={
          <button onClick={handleEditOpen} className="btn-shimmer" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, color: '#fff', background: 'rgba(255,255,255,0.18)' }}>
            <Pencil size={15} /> Edit Details
          </button>
        }
      />

      <div className="mt-3">
        <KpiGrid>
          <Kpi label="CGPA" value={profile?.cgpa ?? 0} icon={GraduationCap} tone="primary" />
          <TextKpi label="Placement Status" value={labelize(profile?.placementStatus)} icon={BadgeCheck} tone={statusTone(profile?.placementStatus)} />
          <Kpi label="Accepted Offers" value={profile?.acceptedOffersCount || 0} icon={PartyPopper} tone="success" />
          <Kpi label="Highest Package" value={profile?.highestAcceptedPackage || 0} format={(v) => formatLPA(v)} icon={Briefcase} tone="primary" />
        </KpiGrid>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, marginTop: 16, alignItems: 'start' }}>
        <GlassPanel gradient="linear-gradient(90deg,#6366F1,#4338CA)" style={{ ...cardStyle }}>
          <SectionHeader title="Academic Record" icon={GraduationCap} />
          <div style={{ display: 'grid', gap: 10, marginTop: 6 }}>
            <Row icon={Hash} label="Student ID" value={profile?.studentId || '—'} />
            <Row icon={Building2} label="Branch" value={profile?.branch ? labelize(profile.branch) : '—'} />
            <Row icon={GraduationCap} label="Department" value={profile?.department || '—'} />
            <Row icon={CalendarDays} label="Batch / Grad Year" value={`${profile?.batch || '—'} · ${profile?.graduationYear || '—'}`} />
            <Row icon={AlertTriangle} label="Backlogs (Total / Active)" value={`${profile?.backlogs ?? '—'} / ${profile?.activeBacklogs ?? '—'}`} />
            <Row icon={Mail} label="Email" value={profile?.email || '—'} />
            <Row icon={Phone} label="Phone" value={profile?.phone || 'Not added'} />
          </div>
        </GlassPanel>

        <GlassPanel gradient="linear-gradient(90deg,#16A34A,#15803D)" style={{ ...cardStyle }}>
          <SectionHeader title="Placement Snapshot" icon={BadgeCheck} />
          {profile?.careerOutcome?.company ? (
            <div style={{ marginTop: 6 }}>
              <div style={{ fontWeight: 800, fontSize: 18 }}>{profile.careerOutcome.company}</div>
              <div className="small muted">{profile.careerOutcome.role} · {formatLPA(profile.careerOutcome.package)}</div>
              <span className="badge" style={{ background: 'var(--success-bg)', color: 'var(--success-text)', marginTop: 10, display: 'inline-block' }}>
                <CheckCircle2 size={14} /> Placed
              </span>
            </div>
          ) : profile?.placementStatus === 'PLACED' ? (
            <div className="small muted" style={{ marginTop: 6 }}>Placed — offer details pending.</div>
          ) : (
            <div className="small muted" style={{ marginTop: 6 }}>
              Not placed yet. Keep applying — your applications and eligibility updates appear live.
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <button onClick={() => navigate('/student/placement-status')} className="btn" style={{ width: '100%' }}>View Placement Status</button>
          </div>
        </GlassPanel>
      </div>

      <GlassPanel gradient="linear-gradient(90deg,#6366F1,#4338CA)" className="mt-3" style={{ ...cardStyle }}>
        <SectionHeader title="Tech Stack" icon={Sparkles} subtitle="Yours to edit — highlighted when you apply to a drive" />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, margin: '12px 0' }}>
          {skills.length === 0 && <span className="small muted">No skills added yet.</span>}
          {skills.map((s) => (
            <span key={s} className="badge" style={{ background: 'var(--primary-soft)', color: 'var(--primary-soft-text)', fontWeight: 700, padding: '6px 10px', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {s}
              <button onClick={() => handleSkillRemove(s)} aria-label={`Remove ${s}`} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'inline-flex', padding: 0 }}><X size={13} /></button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: 1, minWidth: 200 }}>
            <Plus size={16} />
            <input className="input" placeholder="Add a skill and press Enter…" value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSkillAdd(); } }} aria-label="Add skill" />
          </div>
          <button onClick={handleSkillAdd} className="btn" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border, #e2e8f0)', cursor: 'pointer', padding: '10px 18px', borderRadius: 10, fontWeight: 800, color: 'var(--text)' }}>
            <Plus size={15} /> Add
          </button>
          <button onClick={handleSkillsSave} disabled={savingSkills} className="btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', padding: '10px 18px', borderRadius: 10, fontWeight: 800, color: '#fff', background: 'var(--primary)' }}>
            <Save size={15} /> {savingSkills ? 'Saving…' : 'Save Stack'}
          </button>
        </div>
      </GlassPanel>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} size="lg" title="Edit Academic Details">
        {saveError && <div className="alert alert-danger" style={{ marginBottom: 12 }}>{saveError}</div>}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }} className="edit-grid">
          <Field label="Phone *" name="phone" value={editForm.phone} onChange={handleEditChange} error={editErrors.phone} placeholder="+91…" full />
          <Field label="Branch *" name="branch" type="select" options={branchOptions} value={editForm.branch} onChange={handleEditChange} error={editForm.branch === 'OTHER' ? undefined : editErrors.branch} />
          {editForm.branch === 'OTHER' && (
            <label style={{ display: 'block', gridColumn: '1 / -1' }}>
              <span className="small muted">Specify your branch *</span>
              <input className="input" value={customBranch} onChange={(e) => { setCustomBranch(e.target.value); if (editErrors.branch) setEditErrors((er) => ({ ...er, branch: undefined })); }} placeholder="e.g. Artificial Intelligence" style={{ width: '100%', marginTop: 4 }} />
              {editErrors.branch && <div className="small" style={{ color: 'var(--danger-text)', marginTop: 2 }}>{editErrors.branch}</div>}
            </label>
          )}
          <Field label="Department *" name="department" value={editForm.department} onChange={handleEditChange} error={editErrors.department} />
          <Field label="Batch *" name="batch" value={editForm.batch} onChange={handleEditChange} error={editErrors.batch} placeholder="2023-27" />
          <Field label="Graduation Year *" name="graduationYear" type="select" options={graduateYearOptions} value={editForm.graduationYear} onChange={handleEditChange} error={editErrors.graduationYear} />
          <Field label="Backlogs (Total) *" name="backlogs" type="number" value={editForm.backlogs} onChange={handleEditChange} error={editErrors.backlogs} />
          <Field label="Active Backlogs *" name="activeBacklogs" type="number" value={editForm.activeBacklogs} onChange={handleEditChange} error={editErrors.activeBacklogs} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
          <button
            onClick={() => setEditOpen(false)}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--surface-2, #eef2f7)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid var(--border, #e2e8f0)', cursor: 'pointer', padding: '10px 18px', borderRadius: 10, fontWeight: 800, fontSize: 14, color: 'var(--text, #0f172a)', background: 'transparent', transition: 'background .15s ease' }}
          >
            Cancel
          </button>
          <button className="btn-primary" onClick={handleEditSave} disabled={saving} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, border: 'none', cursor: 'pointer', padding: '10px 18px', borderRadius: 10, fontWeight: 800, color: '#fff', background: 'var(--primary)' }}>
            <Save size={15} /> {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Row({ icon: Icon, label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', borderRadius: 10, background: 'var(--surface-2)' }}>
      <span className="small muted" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icon size={14} /> {label}</span>
      <span style={{ fontWeight: 700, fontSize: 14, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function Field({ label, name, value, onChange, error, type, options, placeholder, full }) {
  return (
    <label style={{ display: 'block', gridColumn: full ? '1 / -1' : undefined }}>
      <span className="small muted">{label}</span>
      {type === 'select' ? (
        <select className="input" name={name} value={value} onChange={onChange} style={{ width: '100%', marginTop: 4 }}>
          <option value="">Select…</option>
          {options.map((o) => <option key={o} value={o}>{typeof o === 'number' ? o : labelize(o)}</option>)}
        </select>
      ) : (
        <input className="input" name={name} type={type || 'text'} value={value} onChange={onChange} placeholder={placeholder} style={{ width: '100%', marginTop: 4 }} />
      )}
      {error && <div className="small" style={{ color: 'var(--danger-text)', marginTop: 2 }}>{error}</div>}
    </label>
  );
}
