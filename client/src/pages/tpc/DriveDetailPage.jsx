import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Rocket, XCircle, Trash2, ShieldCheck, ArrowLeft, PlayCircle } from 'lucide-react';
import driveService from '../../services/driveService';
import studentService from '../../services/studentService';
import useApi from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Skeleton from '../../components/common/Skeleton';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import EligibilityCard from '../../components/drives/EligibilityCard';
import { getApiError } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { formatLPA, formatDate, labelize } from '../../utils/formatters';

export default function DriveDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useNotification();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const { data: driveRes, loading, error, refetch } = useApi(() => driveService.getDrive(id), [id]);
  const drive = driveRes?.data;
  const studentsRes = useApi(() => studentService.getStudents({ limit: 200 }), []);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [evaluation, setEvaluation] = useState(null);
  const [actionLoading, setActionLoading] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmClose, setConfirmClose] = useState(false);
  const [confirmReopen, setConfirmReopen] = useState(false);

  const doAction = async (action) => {
    setActionLoading(action);
    try {
      if (action === 'publish') {
        await driveService.publishDrive(id);
        toast.success('Drive published', 'Students can now view this drive and apply.');
      } else if (action === 'close') {
        await driveService.closeDrive(id);
        toast.info('Drive closed', 'No new applications will be accepted.');
      } else if (action === 'reopen') {
        await driveService.reopenDrive(id);
        toast.success('Drive reopened', 'Students can apply again.');
      } else if (action === 'delete') {
        await driveService.deleteDrive(id);
        toast.info('Drive deleted');
        navigate('/tpc/drives');
        return;
      }
      setConfirmClose(false);
      setConfirmReopen(false);
      refetch();
    } catch (err) {
      toast.error('Action failed', getApiError(err).message);
    } finally {
      setActionLoading('');
    }
  };

  const runEvaluation = async () => {
    if (!selectedStudent) return;
    setEvaluating(true);
    setEvaluation(null);
    try {
      const res = await driveService.evaluateEligibility(id, selectedStudent);
      setEvaluation(res.data);
    } catch (err) {
      toast.error('Evaluation failed', getApiError(err).message);
    } finally {
      setEvaluating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 860, margin: '0 auto' }}>
        <Skeleton variant="title" /><Skeleton variant="card" />
        <div className="mt-3" /><Skeleton variant="card" />
      </div>
    );
  }

  if (error || !drive) {
    return <Card><ErrorState message={error?.message || 'Drive not found.'} onRetry={() => refetch()} /></Card>;
  }

  const rules = drive.eligibilityRules?.rules || [];

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>
      <button className="btn btn-ghost btn-sm mb-3" onClick={() => navigate('/tpc/drives')}>
        <ArrowLeft size={14} /> Back to Drives
      </button>

      <div className="page-header">
        <div>
          <h1 className="page-title">{drive.title}</h1>
          <p className="page-desc">
            {drive.companyId?.name} · {drive.jobRole} · {labelize(drive.jobType)}
          </p>
        </div>
        <Badge status={drive.status} />
      </div>

      <Card className="mb-3">
        <div className="form-grid">
          <div><div className="kv-k small muted">Package</div><strong style={{ fontSize: 16, color: 'var(--success-text)' }}>{formatLPA(drive.package, drive.currency)}</strong></div>
          <div><div className="kv-k small muted">Location</div><strong>{drive.location || 'On campus'}</strong></div>
          <div><div className="kv-k small muted">Applications open</div><strong>{formatDate(drive.applicationStart)}</strong></div>
          <div><div className="kv-k small muted">Deadline</div><strong>{formatDate(drive.applicationDeadline)}</strong></div>
          <div><div className="kv-k small muted">Drive date</div><strong>{formatDate(drive.driveDate)}</strong></div>
          <div><div className="kv-k small muted">Grad years</div><strong>{(drive.graduationYears || []).join(', ') || 'Any'}</strong></div>
        </div>
        {drive.description && (
          <>
            <hr className="divider" />
            <p className="small" style={{ color: 'var(--text-muted)', lineHeight: 1.7 }}>{drive.description}</p>
          </>
        )}

        <hr className="divider" />
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {drive.status === 'DRAFT' && (
            <Button icon={Rocket} loading={actionLoading === 'publish'} onClick={() => doAction('publish')}>
              Publish Drive
            </Button>
          )}
          {drive.status === 'PUBLISHED' && (
            <Button variant="secondary" icon={XCircle} loading={actionLoading === 'close'} onClick={() => setConfirmClose(true)}>
              Close Applications
            </Button>
          )}
          {drive.status === 'CLOSED' && (
            <Button icon={PlayCircle} loading={actionLoading === 'reopen'} onClick={() => setConfirmReopen(true)}>
              Reopen Applications
            </Button>
          )}
          {isAdmin && (
            <Button variant="ghost" icon={Trash2} style={{ color: 'var(--danger-text)' }} onClick={() => setConfirmDelete(true)}>
              Delete
            </Button>
          )}
        </div>
      </Card>

      <Card className="mb-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <ShieldCheck size={17} color="var(--primary)" />
          <div className="card-title">Eligibility Configuration</div>
          <span className="badge ml-auto" style={{ background: 'var(--surface-2)', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            Match {rules.length > 0 ? drive.eligibilityRules.ruleGroup : 'NONE'}
          </span>
        </div>

        {rules.length === 0 ? (
          <p className="small muted mt-2">No rules configured — every published-drive viewer is treated as eligible.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="mt-3">
            {rules.map((r, i) => (
              <code key={i} className="rule-row" style={{ fontFamily: 'inherit', fontSize: 13 }}>
                <strong>{labelize(r.field)}</strong>
                <span className="muted">&nbsp;{r.operator.replace(/_/g, ' ').toLowerCase()}&nbsp;</span>
                <strong>{Array.isArray(r.value) ? `[${r.value.join(', ')}]` : String(r.value)}</strong>
              </code>
            ))}
          </div>
        )}
      </Card>

      <Card>
        <div className="card-title">Test the Engine</div>
        <div className="card-sub">
          Pick a student and evaluate them against this drive's rules — exactly what the backend does at apply time.
        </div>
        <div className="mt-2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <select className="input" value={selectedStudent} onChange={(e) => setSelectedStudent(e.target.value)} aria-label="Select student to evaluate" style={{ flex: 1, minWidth: 220 }}>
            <option value="">Select a student…</option>
            {(studentsRes.data?.data || []).map((s) => (
              <option key={s._id} value={s._id}>
                {s.name} — {s.branch}, CGPA {Number(s.cgpa).toFixed(1)}, {s.activeBacklogs} active backlogs
              </option>
            ))}
          </select>
          <Button onClick={runEvaluation} disabled={!selectedStudent || evaluating} loading={evaluating}>
            Evaluate Eligibility
          </Button>
        </div>

        {evaluating && <Skeleton variant="row" />}

        {evaluation && !evaluating && (
          <EligibilityCard eligibility={evaluation.eligibility} policyCheck={evaluation.policyCheck} />
        )}
      </Card>

      <ConfirmDialog open={confirmClose} onClose={() => setConfirmClose(false)} onConfirm={() => doAction('close')}
        title="Close applications?" confirmLabel="Close" loading={actionLoading === 'close'}
        message={`No new applications will be accepted for "${drive.title}". You can reopen it anytime.`} />

      <ConfirmDialog open={confirmReopen} onClose={() => setConfirmReopen(false)} onConfirm={() => doAction('reopen')}
        title="Reopen applications?" confirmLabel="Reopen" loading={actionLoading === 'reopen'} danger={false}
        message={`Students will be able to apply to "${drive.title}" again.`} />

      <ConfirmDialog open={confirmDelete} onClose={() => setConfirmDelete(false)} onConfirm={() => doAction('delete')}
        title="Delete drive?" confirmLabel="Delete" loading={actionLoading === 'delete'}
        message={`"${drive.title}" will be permanently deleted. Applications referencing it remain for audit purposes.`} />
    </div>
  );
}
