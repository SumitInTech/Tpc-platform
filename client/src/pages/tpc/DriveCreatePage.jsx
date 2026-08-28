import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, Save, Rocket, ArrowLeft, ShieldCheck, Sparkles, Wand2, Layers3, SlidersHorizontal, Check } from 'lucide-react';
import driveService from '../../services/driveService';
import companyService from '../../services/companyService';
import useApi from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import Confetti from '../../components/common/Confetti';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { cardStyle, GlassPanel } from '../../components/dashboard/primitives';
import { OPERATORS, RULE_FIELDS, JOB_TYPES, BRANCHES } from '../../constants';
import { operatorSymbol } from '../../utils/formatters';

const EMPTY_RULE = () => ({ field: 'cgpa', operator: 'GREATER_THAN_OR_EQUAL', value: '' });

const describeRule = (rule) => {
  const def = RULE_FIELDS.find((f) => f.value === rule.field);
  const label = def?.label || rule.field;
  const sym = operatorSymbol(rule.operator);
  let value = String(rule.value ?? '').trim();
  if (def?.type === 'list') {
    const list = value.split(',').map((s) => s.trim()).filter(Boolean);
    return `${label} ${sym} ${list.length ? list.join(', ') : '—'}`;
  }
  if (def?.type === 'number' && value !== '') {
    const n = Number(value);
    value = Number.isNaN(n) ? value : String(n);
  }
  return `${label} ${sym} ${value || '—'}`;
};

const initialForm = {
  companyId: '', title: '', jobRole: '', jobType: 'FULL_TIME', location: '',
  package: '', description: '', applicationStart: '', applicationDeadline: '',
  driveDate: '', graduationYears: [2027], eligibleBranches: [],
};

const STEPS = [
  { key: 'details', label: 'Drive Details', icon: Layers3 },
  { key: 'audience', label: 'Who Can Apply', icon: SlidersHorizontal },
  { key: 'rules', label: 'Eligibility Rules', icon: Wand2 },
];

export default function DriveCreatePage() {
  const navigate = useNavigate();
  const { toast } = useNotification();
  const companiesRes = useApi(() => companyService.getCompanies({ limit: 100 }), []);
  const companies = companiesRes.data?.data || [];

  const [form, setForm] = useState(initialForm);
  const [ruleGroup, setRuleGroup] = useState('ALL');
  const [rules, setRules] = useState([EMPTY_RULE()]);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [confetti, setConfetti] = useState(0);
  useEffect(() => {
    if (companies.length > 0 && !form.companyId) {
      setForm((f) => ({ ...f, companyId: companies[0]._id }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companies.length]);

  const detailsDone = !!(form.title.trim() && form.jobRole.trim() && form.package && form.applicationDeadline);
  const audienceDone = (form.graduationYears || []).length > 0;
  const rulesDone = rules.every((r) => (r.value !== '' && r.value !== null) || r.value === 0);
  const stepState = { details: detailsDone, audience: audienceDone, rules: rulesDone };
  const completedSteps = STEPS.filter((st) => stepState[st.key]).length;

  const setRule = (i, patch) => {
    setRules((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const toggleListItem = (key, value) => {
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));
  };

  const validate = () => {
    const errs = {};
    if (!form.companyId) errs.companyId = 'Select a company';
    if (!form.title.trim()) errs.title = 'Title is required';
    else if (form.title.trim().length < 3) errs.title = 'Use at least 3 characters';
    if (!form.jobRole.trim()) errs.jobRole = 'Job role is required';

    const pkg = Number(form.package);
    if (!form.package || Number.isNaN(pkg) || pkg <= 0) errs.package = 'Package (LPA) is required';
    else if (pkg > 200) errs.package = 'Looks unrealistic — max is 200 LPA';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (!form.applicationDeadline) {
      errs.applicationDeadline = 'Application deadline is required';
    } else if (new Date(form.applicationDeadline) < today) {
      errs.applicationDeadline = "Deadline can't be in the past";
    }
    if (form.applicationStart && form.applicationDeadline
      && new Date(form.applicationStart) > new Date(form.applicationDeadline)) {
      errs.applicationStart = 'Must be on or before the deadline';
    }

    if (form.driveDate && form.applicationDeadline
      && new Date(form.driveDate) < new Date(form.applicationDeadline)) {
      errs.driveDate = "Interview / drive date can't be before the application deadline";
    }

    if ((form.graduationYears || []).length === 0) errs.graduationYears = 'Select at least one graduation year';

    rules.forEach((r, i) => {
      const def = RULE_FIELDS.find((f) => f.value === r.field);
      if (!r.value && r.value !== 0) {
        errs[`rule-${i}`] = 'Value required';
      } else if (def?.type === 'list') {
        const list = String(r.value).split(',').map((s) => s.trim()).filter(Boolean);
        if (list.length === 0) errs[`rule-${i}`] = 'At least one value';
      } else if (def?.type === 'number') {
        const n = Number(r.value);
        if (Number.isNaN(n)) errs[`rule-${i}`] = 'Must be a number';
        else if (r.field === 'cgpa' && (n < 0 || n > 10)) errs[`rule-${i}`] = 'CGPA must be between 0 and 10';
        else if (r.field === 'graduationYear' && (n < 2000 || n > 2100)) errs[`rule-${i}`] = 'Enter a valid year';
        else if ((r.field === 'activeBacklogs' || r.field === 'backlogs') && n < 0) errs[`rule-${i}`] = "Can't be negative";
      }
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const buildPayload = () => {
    const normalizedRules = rules.map((r) => {
      const fieldDef = RULE_FIELDS.find((f) => f.value === r.field);
      let value = r.value;
      if (fieldDef?.type === 'number') value = Number(value);
      if (fieldDef?.type === 'list') {
        value = String(value).split(',').map((s) => s.trim()).filter(Boolean);
      }
      return { field: r.field, operator: r.operator, value };
    });
    const payload = {
      ...form,
      package: Number(form.package),
      graduationYears: form.graduationYears.map(Number).filter(Boolean),
      eligibleBranches: form.eligibleBranches,
      eligibilityRules: { ruleGroup, rules: normalizedRules },
    };
    ['applicationStart', 'applicationDeadline', 'driveDate', 'location', 'description'].forEach((k) => {
      if (!payload[k]) delete payload[k];
    });
    return payload;
  };

  const save = async (publish) => {
    if (!validate()) {
      toast.warning('Missing details', 'Please fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    try {
      const res = await driveService.createDrive(buildPayload());
      const driveId = res.data?._id;
      if (publish && driveId) {
        await driveService.publishDrive(driveId);
        toast.success('Drive published', `${form.title} is now accepting applications.`);
        setConfetti((c) => c + 1);
      } else {
        toast.success('Draft saved', `${form.title || 'Drive'} was saved as a draft.`);
      }
      navigate(driveId ? `/tpc/drives/${driveId}` : '/tpc/drives');
    } catch (err) {
      toast.error('Could not create drive', getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const fieldDef = (fieldName) => RULE_FIELDS.find((f) => f.value === fieldName);

  if (companiesRes.loading) {
    return (
      <div>
        <Skeleton variant="title" />
        <Skeleton variant="card" />
        <div className="mt-3" />
        <Skeleton variant="card" />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <Card>
        <div className="state-box">
          <div className="state-icon"><ShieldCheck size={26} /></div>
          <div className="state-title">Add a company first</div>
          <p className="state-desc">Drives belong to recruiting partners. Create a company before configuring a drive.</p>
          <div className="state-actions">
            <Button onClick={() => navigate('/tpc/companies')}>Go to Companies</Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: 980, margin: '0 auto' }}>
      <Confetti trigger={confetti} />
      <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate('/tpc/drives')}>
        <ArrowLeft size={14} /> Back to Drives
      </button>

      {/* Hero banner — flat sky-blue, no violet/radial gradient */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 16, padding: '22px 24px', color: '#fff', background: 'var(--primary)' }}>
        {/* Dot-grid texture — consistent with Login and other heroes */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)', backgroundSize: '22px 22px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, opacity: 0.88 }}>
            <Rocket size={16} />
            <span style={{ letterSpacing: 1, fontSize: 11.5, textTransform: 'uppercase', fontWeight: 700 }}>New Placement Drive</span>
          </div>
          <h1 style={{ margin: '6px 0 14px', fontSize: 26, fontWeight: 800 }}>Create Drive</h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {STEPS.map((st) => {
              const Icon = st.icon;
              const done = stepState[st.key];
              return (
                <div key={st.key} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(255,255,255,0.15)', padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 700, border: '1px solid rgba(255,255,255,0.25)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: 999, background: done ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)', color: done ? 'var(--primary)' : '#fff' }}>
                    {done ? <Check size={12} /> : <Icon size={12} />}
                  </span>
                  {st.label}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="small muted mt-2" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Sparkles size={13} color="var(--primary)" /> {completedSteps} of {STEPS.length} sections ready — the eligibility engine evaluates these rules for every student.
      </div>

      {/* ── Drive Details ── */}
      <GlassPanel className="mb-3 mt-3" style={cardStyle}>
        <div className="card-title">Drive Details</div>
        {/* Main grid — 2 cols. Date row at bottom is one row. Description always full-width last. */}
        <div className="form-grid mt-2">
          <div className="field">
            <label htmlFor="d-company">Company *</label>
            <select id="d-company" className="input" value={form.companyId} aria-invalid={!!errors.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}>
              {companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.companyId && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.companyId}</span>}
          </div>
          <div className="field">
            <label htmlFor="d-title">Drive title *<span className="hint"> (shown to students)</span></label>
            <input id="d-title" className="input" placeholder="e.g. Software Developer"
              value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} aria-invalid={!!errors.title} />
            {errors.title && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.title}</span>}
          </div>
          <div className="field">
            <label htmlFor="d-role">Job role *</label>
            <input id="d-role" className="input" placeholder="e.g. SDE" value={form.jobRole}
              onChange={(e) => setForm({ ...form, jobRole: e.target.value })} aria-invalid={!!errors.jobRole} />
            {errors.jobRole && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.jobRole}</span>}
          </div>
          <div className="field">
            <label htmlFor="d-type">Job type</label>
            <select id="d-type" className="input" value={form.jobType} onChange={(e) => setForm({ ...form, jobType: e.target.value })}>
              {JOB_TYPES.map((t) => <option key={t}>{t.replace('_', '-')}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="d-pkg">Package (LPA) *<span className="hint"> (₹ lakhs per annum)</span></label>
            <input id="d-pkg" type="number" step="0.5" min="0" className="input" placeholder="8"
              value={form.package} onChange={(e) => setForm({ ...form, package: e.target.value })} aria-invalid={!!errors.package} />
            {errors.package && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.package}</span>}
          </div>
          <div className="field">
            <label htmlFor="d-loc">Location</label>
            <input id="d-loc" className="input" placeholder="e.g. Hyderabad / Hybrid"
              value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>

          {/* ── Date row: all three dates on one line, then description fills rest ── */}
          <div className="field" style={{ flexBasis: '100%' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <label htmlFor="d-start">Applications open</label>
                <input id="d-start" type="date" className="input" value={form.applicationStart}
                  onChange={(e) => setForm({ ...form, applicationStart: e.target.value })} />
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <label htmlFor="d-deadline">Application deadline *</label>
                <input id="d-deadline" type="date" className="input" value={form.applicationDeadline}
                  onChange={(e) => setForm({ ...form, applicationDeadline: e.target.value })} aria-invalid={!!errors.applicationDeadline} />
                {errors.applicationDeadline && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.applicationDeadline}</span>}
              </div>
              <div style={{ flex: '1 1 160px', minWidth: 140 }}>
                <label htmlFor="d-date">Interview / drive date</label>
                <input id="d-date" type="date" className="input" value={form.driveDate} aria-invalid={!!errors.driveDate}
                  onChange={(e) => setForm({ ...form, driveDate: e.target.value })} />
                {errors.driveDate && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.driveDate}</span>}
              </div>
            </div>
          </div>

          {/* Description — full width, below dates */}
          <div className="field" style={{ flexBasis: '100%' }}>
            <label htmlFor="d-desc">Description</label>
            <textarea id="d-desc" className="input" rows={4} placeholder="About the role, selection process…"
              value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
        </div>
      </GlassPanel>

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #4338CA)" className="mb-3" style={cardStyle}>
        <div className="card-title">Who Can Apply *</div>
        <div className="card-sub">Pick the branches and graduating batches this drive is open to. Students see only drives they can apply to.</div>
        <div className="field mt-3">
          <label>Eligible branches</label>
          <div className="chip-select" role="group" aria-label="Eligible branches">
            {BRANCHES.map((b) => (
              <button
                key={b}
                type="button"
                className={`chip ${form.eligibleBranches.includes(b) ? 'chip-active' : ''}`}
                onClick={() => toggleListItem('eligibleBranches', b)}
              >
                {b}
              </button>
            ))}
          </div>
          <span className="hint">Leave empty to allow every branch.</span>
        </div>
        <div className="field mt-3">
          <label>Graduation years *</label>
          <div className="chip-select" role="group" aria-label="Graduation years">
            {[2026, 2027, 2028, 2029, 2030].map((y) => (
              <button
                key={y}
                type="button"
                className={`chip ${(form.graduationYears || []).includes(y) ? 'chip-active' : ''}`}
                onClick={() => toggleListItem('graduationYears', y)}
              >
                {y}
              </button>
            ))}
          </div>
          {(errors.graduationYears || errors.eligibleBranches) && (
            <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.graduationYears}</span>
          )}
        </div>
      </GlassPanel>

      <GlassPanel className="mb-3" style={cardStyle}>
        <div className="flex-between">
          <div>
            <div className="card-title">Eligibility Rules</div>
            <div className="card-sub">Rules are data, not code. They live with the drive and are evaluated by the backend engine.</div>
          </div>
        </div>

        <div className="mt-3 flex-between">
          <div className="field" style={{ minWidth: 180 }}>
            <label htmlFor="rg">Match</label>
            <select id="rg" className="input" value={ruleGroup} onChange={(e) => setRuleGroup(e.target.value)} style={{ width: '100%' }}>
              <option value="ALL">ALL — student must satisfy every rule</option>
              <option value="ANY">ANY — any one rule is enough</option>
            </select>
          </div>
        </div>

        <div className="mt-3">
          {rules.map((rule, i) => (
            <div key={i} style={{ marginBottom: 4 }}>
              {i > 0 && <div className="rule-builder-and">{ruleGroup}</div>}
              <div className="rule-builder-rule">
                <select className="input" value={rule.field} aria-label={`Field for rule ${i + 1}`}
                  onChange={(e) => setRule(i, { field: e.target.value })}>
                  {RULE_FIELDS.map((f) => <option key={f.value} value={f.value}>{f.label}</option>)}
                </select>
                <select className="input" value={rule.operator} aria-label={`Operator for rule ${i + 1}`}
                  onChange={(e) => setRule(i, { operator: e.target.value })}>
                  {OPERATORS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div>
                  <input className="input" value={rule.value} aria-label={`Value for rule ${i + 1}`}
                    placeholder={fieldDef(rule.field)?.placeholder || 'Value'}
                    type={fieldDef(rule.field)?.type === 'number' ? 'number' : 'text'}
                    step={fieldDef(rule.field)?.type === 'number' ? '0.01' : undefined}
                    onChange={(e) => setRule(i, { value: e.target.value })}
                    aria-invalid={!!errors[`rule-${i}`]} />
                  {errors[`rule-${i}`] && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors[`rule-${i}`]}</span>}
                  {fieldDef(rule.field)?.type === 'list' && (
                    <span className="hint small muted">Comma-separated values</span>
                  )}
                </div>
                <button type="button" className="icon-btn" style={{ width: 34, height: 34, color: 'var(--danger-text)' }}
                  disabled={rules.length === 1}
                  onClick={() => setRules((rs) => rs.filter((_, idx) => idx !== i))}
                  aria-label={`Remove rule ${i + 1}`}>
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
          <Button variant="secondary" icon={Plus} size="sm" className="mt-2"
            onClick={() => setRules((rs) => [...rs, EMPTY_RULE()])}>
            Add Rule
          </Button>
        </div>

        {rules.length > 0 && (
          <>
            <hr className="divider" />
            <div className="policy-summary">
              <div className="policy-summary-title">
                {ruleGroup === 'ALL' ? 'A student is eligible only if they meet ALL of:' : 'A student is eligible if they meet ANY ONE of:'}
              </div>
              <div className="rule-preview-list mt-1">
                {rules.map((r, i) => (
                  <span key={i} className="rule-preview-item">
                    {i > 0 && <span className="rule-preview-conn">{ruleGroup}</span>}
                    <span className="policy-config-chip">{describeRule(r)}</span>
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </GlassPanel>

      <div className="flex-between">
        <Button variant="ghost" onClick={() => navigate('/tpc/drives')}>Cancel</Button>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" icon={Save} loading={saving} onClick={() => save(false)}>Save Draft</Button>
          <Button icon={Rocket} loading={saving} onClick={() => save(true)}>Publish Drive</Button>
        </div>
      </div>
    </div>
  );
}
