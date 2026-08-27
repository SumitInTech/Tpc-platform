import { useState } from 'react';
import {
  ShieldCheck, Plus, Power, Trash2, Layers, ListChecks, IndianRupee, Ban, MapPin,
  FlaskConical, CheckCircle2, XCircle,
} from 'lucide-react';
import policyService from '../../services/policyService';
import studentService from '../../services/studentService';
import useApi from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Modal from '../../components/common/Modal';
import Button from '../../components/common/Button';
import ConfirmActionModal from '../../components/common/ConfirmActionModal';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { POLICY_TYPES } from '../../constants';
import { formatDate, labelize, formatLPA } from '../../utils/formatters';
import { Hero, Kpi, KpiGrid, SectionHeader, GlassPanel, cardStyle } from '../../components/dashboard/primitives';

const EMPTY_FORM = {
  name: '', description: '', type: 'MAX_ACCEPTED_OFFERS',
  configValue: 1, branches: '', scope: 'INSTITUTION', effectiveFrom: '',
};

const POLICY_META = {
  MAX_ACCEPTED_OFFERS: { color: 'primary', icon: ListChecks },
  MAX_TOTAL_OFFERS: { color: 'primary', icon: Layers },
  MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION: { color: 'primary', icon: IndianRupee },
  PLACED_STUDENT_RESTRICTION: { color: 'primary', icon: Ban },
  BRANCH_SPECIFIC_RESTRICTION: { color: 'primary', icon: MapPin },
};

const buildConfiguration = (type, configValue, branches) => {
  const def = POLICY_TYPES.find((p) => p.value === type);
  if (def?.configKey === 'maximum') return { maximum: Number(configValue) };
  if (def?.configKey === 'minimumPackage') return { minimumPackage: Number(configValue) };
  if (def?.configKey === 'branches') {
    return { branches: branches.split(',').map((s) => s.trim()).filter(Boolean) };
  }
  return {};
};

const describeConfiguration = (policy) => {
  const cfg = policy.configuration || {};
  switch (policy.type) {
    case 'MAX_ACCEPTED_OFFERS':
      return `Max ${cfg.maximum ?? '—'} accepted offer${Number(cfg.maximum) === 1 ? '' : 's'} at a time`;
    case 'MAX_TOTAL_OFFERS':
      return `Max ${cfg.maximum ?? '—'} offer${Number(cfg.maximum) === 1 ? '' : 's'} in total`;
    case 'MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION':
      return `Needs ${formatLPA(cfg.minimumPackage)}+ for extra applications`;
    case 'PLACED_STUDENT_RESTRICTION':
      return 'Blocks placed students from applying';
    case 'BRANCH_SPECIFIC_RESTRICTION':
      return `Restricted: ${(cfg.branches || []).join(', ') || '—'}`;
    default:
      return '—';
  }
};

function Toggle({ active, onClick, loading }) {
  return (
    <button type="button" onClick={onClick} disabled={loading}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', background: 'transparent', cursor: 'pointer', padding: 0 }}>
      <span style={{ width: 44, height: 24, borderRadius: 999, padding: 3, background: active ? 'var(--success)' : 'var(--surface-2,#e2e8f0)', transition: 'background .25s', position: 'relative' }}>
        <span style={{ position: 'absolute', top: 3, left: active ? 20 : 3, width: 18, height: 18, borderRadius: 999, background: '#fff', boxShadow: '0 2px 6px rgba(0,0,0,.25)', transition: 'left .25s' }} />
      </span>
      <span style={{ fontSize: 12, fontWeight: 700, color: active ? 'var(--success-text)' : 'var(--text-sub)' }}>{active ? 'Active' : 'Inactive'}</span>
    </button>
  );
}

function PolicyCard({ p, onToggle, toggling, onArchive }) {
  const meta = POLICY_META[p.type] || { color: '#6366F1', icon: ShieldCheck };
  const Icon = meta.icon;
  return (
    <div style={{ ...cardStyle, position: 'relative', overflow: 'hidden', height: '100%', display: 'flex', flexDirection: 'column', padding: 20, transition: 'transform .2s ease, box-shadow .2s ease' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 24px 48px -26px var(--primary)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = cardStyle.boxShadow; }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, var(--primary), #4338CA)' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
          <span style={{ display: 'inline-flex', padding: 11, borderRadius: 13, color: '#fff', background: 'var(--primary)', boxShadow: '0 12px 24px -14px var(--primary)', flexShrink: 0 }}>
            <Icon size={18} />
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</div>
            <div className="small muted" style={{ marginTop: 2 }}>{POLICY_TYPES.find((t) => t.value === p.type)?.label || p.type}</div>
          </div>
        </div>
        <span className="badge" style={{ background: p.isActive ? 'var(--success-soft)' : 'var(--surface-2)', color: p.isActive ? 'var(--success-text)' : 'var(--text-sub)', flexShrink: 0 }}>
          {p.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
        {p.description && <div className="small muted" style={{ lineHeight: 1.5 }}>{p.description}</div>}
        <div><span className="policy-config-chip">{describeConfiguration(p)}</span></div>
        <div className="small muted" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <span>Scope: {labelize(p.scope)}</span>
          <span>· v{p.version}</span>
          <span>· {formatDate(p.effectiveFrom)}</span>
        </div>
      </div>

      <hr className="divider" style={{ marginTop: 16, marginBottom: 14 }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Toggle active={p.isActive} onClick={() => onToggle(p)} loading={toggling === p._id} />
        <button className="icon-btn danger" onClick={() => onArchive(p)} aria-label={`Archive ${p.name}`} title="Archive">
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  );
}

export default function PoliciesPage() {
  const { toast } = useNotification();
  const { data: res, loading, error, refetch } = useApi(() => policyService.getPolicies(), []);
  const policies = res?.data || [];

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [toggling, setToggling] = useState('');
  const [deleting, setDeleting] = useState(null);

  const studentsRes = useApi(() => studentService.getStudents({ limit: 200 }), []);
  const [evalStudent, setEvalStudent] = useState('');
  const [evalResult, setEvalResult] = useState(null);
  const [evaluating, setEvaluating] = useState(false);

  const typeDef = (t) => POLICY_TYPES.find((p) => p.value === t);

  const total = policies.length;
  const active = policies.filter((p) => p.isActive).length;
  const inactive = total - active;
  const typesCovered = new Set(policies.map((p) => p.type)).size;

  const kpis = [
    { key: 'total', label: 'Policies', value: total, icon: ShieldCheck, tone: 'primary' },
    { key: 'active', label: 'Active', value: active, icon: Power, tone: 'success' },
    { key: 'inactive', label: 'Inactive', value: inactive, icon: Ban, tone: 'muted' },
    { key: 'types', label: 'Policy Types', value: typesCovered, icon: Layers, tone: 'primary' },
  ];

  const openCreate = () => { setForm(EMPTY_FORM); setErrors({}); setFormOpen(true); };

  const validate = () => {
    const e = {};
    const name = (form.name || '').trim();
    const def = typeDef(form.type);

    if (!name) e.name = 'Policy name is required';
    else if (name.length < 3) e.name = 'Use at least 3 characters';

    if (def?.configKey === 'maximum' || def?.configKey === 'minimumPackage') {
      const v = Number(form.configValue);
      if (form.configValue === '' || Number.isNaN(v)) e.configValue = 'Value is required';
      else if (v <= 0) e.configValue = 'Must be greater than 0';
    }
    if (def?.configKey === 'branches') {
      const branches = (form.branches || '').split(',').map((s) => s.trim()).filter(Boolean);
      if (branches.length === 0) e.branches = 'At least one branch is required';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = async (e) => {
    e.preventDefault();
    if (!validate()) {
      toast.warning('Check the form', 'Please fix the highlighted fields before saving.');
      return;
    }
    setSaving(true);
    try {
      const configuration = buildConfiguration(form.type, form.configValue, form.branches);
      await policyService.createPolicy({
        name: form.name,
        description: form.description,
        type: form.type,
        configuration,
        scope: form.scope,
        effectiveFrom: form.effectiveFrom ? new Date(form.effectiveFrom).toISOString() : new Date().toISOString(),
        isActive: true,
      });
      toast.success('Policy created', `"${form.name}" is now active and will guard workflow actions.`);
      setFormOpen(false);
      refetch();
    } catch (err) {
      toast.error('Could not create policy', getApiError(err).message);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (p) => {
    setToggling(p._id);
    try {
      if (p.isActive) await policyService.deactivatePolicy(p._id);
      else await policyService.activatePolicy(p._id);
      toast.info(p.isActive ? 'Policy deactivated' : 'Policy activated', p.name);
      refetch();
    } catch (err) {
      toast.error('Action failed', getApiError(err).message);
    } finally {
      setToggling('');
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    try {
      await policyService.updatePolicy(deleting._id, { isActive: false });
      toast.info('Policy archived', `${deleting.name} was deactivated. Version history is preserved.`);
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error('Archive failed', getApiError(err).message);
    }
  };

  const runEval = async () => {
    if (!evalStudent) return;
    setEvaluating(true);
    setEvalResult(null);
    try {
      const r = await policyService.evaluatePolicy({ studentId: evalStudent, action: 'ACCEPT_OFFER' });
      setEvalResult(r.data);
    } catch (err) {
      toast.error('Evaluation failed', getApiError(err).message);
    } finally {
      setEvaluating(false);
    }
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="Placement Policies"
        subtitle="Institution-defined guardrails. Policy definition lives here; evaluation happens in the engine; enforcement happens in the workflow — never hardcoded."
        compact
        actions={<Button icon={Plus} onClick={openCreate}>New Policy</Button>}
      />

      <div style={{ marginTop: 18 }}>
        {loading ? (
          <KpiGrid>{kpis.map((k) => <Skeleton key={k.key} variant="card" />)}</KpiGrid>
        ) : (
          <KpiGrid>{kpis.map((k) => <Kpi key={k.key} {...k} />)}</KpiGrid>
        )}
      </div>

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #4338CA)" style={{ ...cardStyle, marginTop: 22, marginBottom: 22 }}>
        <SectionHeader
          icon={FlaskConical}
          title="Policy Sandbox"
          subtitle="See exactly what the engine would decide for a student right now."
          tone="primary"
        />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 14 }}>
          <select className="input" value={evalStudent} onChange={(e) => setEvalStudent(e.target.value)}
            aria-label="Select student for policy evaluation" style={{ flex: 1, minWidth: 240 }}>
            <option value="">Select a student…</option>
            {(studentsRes.data?.data || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — accepted offers: {s.acceptedOffersCount}, status: {s.placementStatus}
              </option>
            ))}
          </select>
          <Button
            variant="secondary" disabled={!evalStudent || evaluating} loading={evaluating} onClick={runEval}
            style={{ background: 'var(--primary)', borderColor: 'transparent', color: '#fff' }}
          >
            Evaluate All Active Policies
          </Button>
        </div>

        {evalResult && (
          <div style={{
            marginTop: 16, borderRadius: 16, padding: 16,
            border: `1px solid ${evalResult.allowed ? 'var(--success)' : 'var(--danger)'}`,
            background: evalResult.allowed ? 'color-mix(in srgb, var(--success) 8%, var(--surface))' : 'color-mix(in srgb, var(--danger) 8%, var(--surface))',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'inline-flex', padding: 10, borderRadius: 12, color: '#fff', background: evalResult.allowed ? 'var(--success)' : 'var(--danger)' }}>
                {evalResult.allowed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
              </span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 15, color: evalResult.allowed ? 'var(--success-text)' : 'var(--danger-text)' }}>
                  {evalResult.allowed ? 'ALLOWED' : 'BLOCKED'}
                </div>
                <div className="small">{evalResult.summary}</div>
              </div>
            </div>
            {(evalResult.decisions || []).map((d) => (
              <div key={d.policy} className="small mt-2" style={{ color: d.allowed ? 'var(--success-text)' : 'var(--danger-text)' }}>
                • <strong>{d.policy}</strong>: {d.reason}
              </div>
            ))}
          </div>
        )}
      </GlassPanel>

      <SectionHeader
        icon={ShieldCheck}
        title="Active Guardrails"
        subtitle={`${active} of ${total} policies are live and guarding workflow actions.`}
        tone="primary"
        action={<Button icon={Plus} onClick={openCreate}>New Policy</Button>}
      />

      {loading ? (
        <Card><Skeleton variant="table" rows={5} /></Card>
      ) : error ? (
        <Card><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : policies.length === 0 ? (
        <Card><EmptyState icon={ShieldCheck} title="No policies configured"
          description="Without active policies, offer actions run unrestricted. Add your institution's first guardrail."
          actions={<Button icon={Plus} onClick={openCreate}>New Policy</Button>} /></Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {policies.map((p) => (
            <PolicyCard key={p._id} p={p} onToggle={toggle} toggling={toggling} onArchive={(pol) => setDeleting(pol)} />
          ))}
        </div>
      )}

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Create Placement Policy"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="policy-form" loading={saving}>Create Policy</Button>
          </>
        }>
        <form id="policy-form" onSubmit={save}>
          <div className="field">
            <label htmlFor="p-name">Policy name *</label>
            <input id="p-name" className="input" required value={form.name} aria-invalid={!!errors.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Maximum Accepted Offers" />
            {errors.name && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.name}</span>}
          </div>
          <div className="field mt-3">
            <label htmlFor="p-type">Type *</label>
            <select id="p-type" className="input" value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {POLICY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {typeDef(form.type)?.configKey === 'branches' ? (
            <div className="field mt-3">
              <label htmlFor="p-branch">Restricted branches *<span className="hint"> (comma separated)</span></label>
              <input id="p-branch" className="input" value={form.branches} aria-invalid={!!errors.branches}
                onChange={(e) => setForm({ ...form, branches: e.target.value })} placeholder="CSE, IT" />
              {errors.branches && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.branches}</span>}
            </div>
          ) : typeDef(form.type)?.configKey ? (
            <div className="field mt-3">
              <label htmlFor="p-cfg">{typeDef(form.type).configLabel} *</label>
              <input id="p-cfg" type="number" min="0" step="0.5" className="input"
                value={form.configValue} aria-invalid={!!errors.configValue}
                onChange={(e) => setForm({ ...form, configValue: e.target.value })} required
                placeholder={form.type === 'MIN_PACKAGE_FOR_ADDITIONAL_APPLICATION' ? 'e.g. 10' : 'e.g. 1'} />
              {errors.configValue && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.configValue}</span>}
            </div>
          ) : null}

          <div className="form-grid mt-3">
            <div className="field">
              <label htmlFor="p-scope">Scope</label>
              <select id="p-scope" className="input" value={form.scope}
                onChange={(e) => setForm({ ...form, scope: e.target.value })}>
                <option>INSTITUTION</option>
                <option>BRANCH</option>
                <option>DEPARTMENT</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="p-eff">Effective from</label>
              <input id="p-eff" type="date" className="input" value={form.effectiveFrom}
                onChange={(e) => setForm({ ...form, effectiveFrom: e.target.value })} />
            </div>
          </div>

          <div className="field mt-3">
            <label htmlFor="p-desc">Description</label>
            <textarea id="p-desc" className="input" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Why does this rule exist? Shown to officers when a decision is blocked." />
          </div>

          <hr className="divider" />
          <div className="policy-summary">
            <div className="policy-summary-title">This policy will mean:</div>
            <div className="policy-summary-text">
              {describeConfiguration({ type: form.type, configuration: buildConfiguration(form.type, form.configValue, form.branches) })}
            </div>
            <div className="small muted mt-1">
              Applies {labelize(form.scope).toLowerCase()}-wide
              {' '}· effective from {form.effectiveFrom ? formatDate(form.effectiveFrom) : 'today'}
              {form.name ? <> · saved as “{form.name}”</> : null}
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmActionModal
        open={!!deleting}
        title="Archive policy?"
        message={`"${deleting?.name}" will be deactivated. Historical decisions keep the version that evaluated them.`}
        confirmLabel="Deactivate & Archive"
        tone="danger"
        gradient="linear-gradient(135deg, #EF4444, #DC2626 55%, #B91C1C)"
        icon={Trash2}
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(null)}
      />
    </div>
  );
}
