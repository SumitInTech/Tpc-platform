import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Users, UserCheck, GraduationCap, Target, Filter, Download, X } from 'lucide-react';
import studentService from '../../services/studentService';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import DownloadMenu from '../../components/common/DownloadMenu';
import { getApiError } from '../../services/api';
import { exportStudentsToExcel, exportStudentsToPDF } from '../../utils/studentExport';
import { BRANCHES, STUDENT_PLACEMENT_STATUS, STUDENT_CAREER_OUTCOME } from '../../constants';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { labelize } from '../../utils/formatters';
import { Hero, Kpi, Segmented, SectionHeader, GlassPanel, KpiGrid, cardStyle } from '../../components/dashboard/primitives';

const EMPTY_FORM = {
  studentId: '', name: '', email: '', phone: '', branch: 'CSE', department: '',
  batch: '2023-27', graduationYear: 2027, cgpa: '', backlogs: 0, activeBacklogs: 0,
  placementStatus: 'UNPLACED', careerOutcome: '', skills: [],
};

export default function StudentsPage() {
  const { toast } = useNotification();
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [branch, setBranch] = useState('');
  const [status, setStatus] = useState('');
  const search = useDebounce(searchInput);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [deleting, setDeleting] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exporting, setExporting] = useState('');

  const filterKey = `${search}|${branch}|${status}`;
  const listKey = `${page}|${filterKey}`;
  const summary = useApi(
    () => studentService.getStudents({ limit: 10000, ...(search ? { search } : {}), ...(branch ? { branch } : {}), ...(status ? { placementStatus: status } : {}) }),
    [filterKey]
  );
  const { data: res, loading, error, refetch } = useApi(
    () => studentService.getStudents({
      page, limit: 10, ...(search ? { search } : {}), ...(branch ? { branch } : {}), ...(status ? { placementStatus: status } : {}),
    }),
    [listKey]
  );

  const all = summary.data?.data || [];
  const total = res?.pagination?.total || all.length || 0;
  const placed = all.filter((s) => s.placementStatus === 'PLACED').length;
  const avgCgpa = all.length ? (all.reduce((a, s) => a + (Number(s.cgpa) || 0), 0) / all.length) : 0;
  const higherStudies = all.filter((s) => s.careerOutcome === 'HIGHER_STUDIES').length;
  const branchDist = BRANCHES.map((b) => ({ b, n: all.filter((s) => (s.branch || s.department) === b).length })).sort((x, y) => y.n - x.n);
  const maxBranch = Math.max(1, ...branchDist.map((x) => x.n));

  const students = res?.data || [];
  const pagination = res?.pagination || {};

  const branchOptions = [
    { value: '', label: 'All Branches', color: '#6366F1', count: all.length },
    ...BRANCHES.map((b) => ({ value: b, label: b, color: '#06B6D4', count: all.filter((s) => (s.branch || s.department) === b).length, dot: true })),
  ];
  const statusOptions = [
    { value: '', label: 'All', color: '#6366F1', count: all.length },
    ...STUDENT_PLACEMENT_STATUS.map((st) => ({ value: st, label: labelize(st), color: st === 'PLACED' ? '#10B981' : '#F59E0B', count: all.filter((s) => s.placementStatus === st).length, dot: true })),
  ];

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  };

  const openEdit = (s) => {
    setEditing(s);
    setForm({
      studentId: s.studentId || '',
      name: s.name || '',
      email: s.email || '',
      phone: s.phone || '',
      branch: s.branch || 'CSE',
      department: s.department || '',
      batch: s.batch || '',
      graduationYear: s.graduationYear || 2027,
      cgpa: s.cgpa ?? '',
      backlogs: s.backlogs ?? 0,
      activeBacklogs: s.activeBacklogs ?? 0,
      placementStatus: s.placementStatus || 'UNPLACED',
      careerOutcome: s.careerOutcome || '',
      skills: s.skills || [],
    });
    setFormOpen(true);
  };

  const addFormSkill = () => {
    const v = (form.skillInput || '').trim();
    if (v && !form.skills.includes(v)) setForm({ ...form, skills: [...form.skills, v] });
    setForm({ ...form, skillInput: '' });
  };
  const removeFormSkill = (sk) => setForm({ ...form, skills: form.skills.filter((x) => x !== sk) });

  const validate = () => {
    const e = {};
    const name = (form.name || '').trim();
    const email = (form.email || '').trim();
    const sid = (form.studentId || '').trim();
    const cgpa = form.cgpa === '' || form.cgpa === null ? NaN : Number(form.cgpa);
    const gy = form.graduationYear === '' || form.graduationYear === null ? NaN : Number(form.graduationYear);
    const ab = form.activeBacklogs === '' ? 0 : Number(form.activeBacklogs);
    const tb = form.backlogs === '' ? 0 : Number(form.backlogs);

    if (!name) e.name = 'Full name is required';
    else if (name.length < 2) e.name = 'Use at least 2 characters';
    if (!sid) e.studentId = 'Student ID is required';
    if (!email) e.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Enter a valid email address';
    if (Number.isNaN(cgpa)) e.cgpa = 'CGPA is required';
    else if (cgpa < 0 || cgpa > 10) e.cgpa = 'CGPA must be between 0 and 10';
    if (Number.isNaN(gy)) e.graduationYear = 'Graduation year is required';
    else if (gy < 2000 || gy > 2100) e.graduationYear = 'Enter a valid year (2000–2100)';
    if (Number.isNaN(ab) || ab < 0) e.activeBacklogs = 'Cannot be negative';
    if (Number.isNaN(tb) || tb < 0) e.backlogs = 'Cannot be negative';
    if (form.phone && !/^[+\d][\d\s-]{6,}$/.test(form.phone)) e.phone = 'Enter a valid phone number';

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
      const payload = {
        ...form,
        graduationYear: Number(form.graduationYear),
        cgpa: Number(form.cgpa),
        backlogs: Number(form.backlogs),
        activeBacklogs: Number(form.activeBacklogs),
        careerOutcome: form.careerOutcome ? form.careerOutcome : null,
        skills: form.skills || [],
      };
      if (editing) {
        await studentService.updateStudent(editing._id, payload);
        toast.success('Student updated', `${payload.name}'s record has been saved.`);
      } else {
        await studentService.createStudent(payload);
        toast.success('Student created', `${payload.name} added to the talent pool.`);
      }
      setFormOpen(false);
      if (!editing) setPage(1);
      refetch();
    } catch (err) {
      const e = getApiError(err);
      toast.error('Could not save student', e.message);
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteLoading(true);
    try {
      await studentService.deleteStudent(deleting._id);
      toast.info('Student removed', `${deleting.name} was deleted.`);
      setDeleting(null);
      refetch();
    } catch (err) {
      toast.error('Delete failed', getApiError(err).message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDownload = async (format) => {
    setExporting(format);
    try {
      const allRows = await studentService.getStudents({
        page: 1, limit: 10000,
        ...(search ? { search } : {}),
        ...(branch ? { branch } : {}),
        ...(status ? { placementStatus: status } : {}),
      });
      const rows = allRows?.data || [];
      if (rows.length === 0) {
        toast.info('Nothing to export', 'No students match the current filters.');
        return;
      }
      const stamp = new Date().toISOString().slice(0, 10);
      if (format === 'excel') exportStudentsToExcel(rows, `students-${stamp}`);
      else exportStudentsToPDF(rows, `students-${stamp}`);
      toast.success('Download ready', `${rows.length} student record(s) exported as ${format.toUpperCase()}.`);
    } catch (err) {
      toast.error('Export failed', getApiError(err).message);
    } finally {
      setExporting('');
    }
  };

  const kpis = [
    { key: 'total', label: 'Students', value: total, icon: Users, tone: '#6366F1' },
    { key: 'placed', label: 'Placed', value: placed, icon: UserCheck, tone: '#10B981' },
    { key: 'cgpa', label: 'Avg CGPA', value: Number(avgCgpa.toFixed(2)), icon: GraduationCap, tone: '#06B6D4', format: (v) => Number(v).toFixed(2) },
    { key: 'hs', label: 'Higher Studies', value: higherStudies, icon: Target, tone: '#F59E0B' },
  ];

  return (
    <div style={{ fontFamily: "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif" }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="Student Records"
        subtitle="The verified student profiles behind every placement decision — academics, eligibility and career outcomes, managed in one place."
        compact
        actions={
          <>
            <DownloadMenu onDownload={handleDownload} exporting={exporting} />
            <Button icon={Plus} onClick={openCreate}>Add Student</Button>
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
          title="Find students"
          subtitle="Search by name or filter by branch and placement status."
          tone="#6366F1"
          action={search || branch || status ? (
            <button type="button" className="btn btn-sm btn-ghost" onClick={() => { setSearchInput(''); setBranch(''); setStatus(''); setPage(1); }}>Clear</button>
          ) : null}
        />
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: '1 1 280px', minWidth: 240, display: 'flex', gap: 8, alignItems: 'center', background: 'var(--surface-2, #eef2f7)', borderRadius: 12, padding: '10px 12px' }}>
            <Search size={16} color="var(--text-sub, #64748b)" />
            <input className="input" style={{ border: 'none', background: 'transparent', padding: 0 }}
              placeholder="Search by name…" value={searchInput}
              onChange={(e) => { setSearchInput(e.target.value); setPage(1); }} aria-label="Search students" />
          </div>
          <div style={{ flex: '1 1 320px', minWidth: 260 }}>
            <Segmented options={branchOptions} value={branch} onChange={(v) => { setBranch(v); setPage(1); }} />
          </div>
          <div style={{ flex: '1 1 280px', minWidth: 240 }}>
            <Segmented options={statusOptions} value={status} onChange={(v) => { setStatus(v); setPage(1); }} />
          </div>
        </div>
        {branchDist.some((x) => x.n > 0) && (
          <div className="mt-3">
            <div className="small muted" style={{ marginBottom: 8 }}>Branch distribution</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {branchDist.map((x) => (
                <div key={x.b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 42, fontSize: 12, fontWeight: 700, color: 'var(--text-sub)' }}>{x.b}</span>
                  <div style={{ flex: 1, height: 8, background: 'var(--surface-2, #eef2f7)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${(x.n / maxBranch) * 100}%`, height: '100%', background: 'linear-gradient(90deg, #6366F1, #06B6D4)', borderRadius: 999, transition: 'width .8s cubic-bezier(.2,.7,.3,1)' }} />
                  </div>
                  <span style={{ width: 28, textAlign: 'right', fontSize: 12, fontWeight: 700 }}>{x.n}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlassPanel>

      {loading ? (
        <Card><Skeleton variant="table" rows={8} /></Card>
      ) : error ? (
        <Card><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : students.length === 0 ? (
        <Card><EmptyState icon={Users} title="No students found" description="Try adjusting your search or filters, or add a new student." actions={<Button icon={Plus} onClick={openCreate}>Add Student</Button>} /></Card>
      ) : (
        <>
          <GlassPanel style={{ padding: 0, overflow: 'hidden' }}>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Student</th><th>Branch</th><th>CGPA</th><th>Grad Year</th>
                    <th>Backlogs</th><th>Status</th><th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((s) => (
                    <tr key={s._id}>
                      <td>
                        <div className="cell-main">{s.name}</div>
                        <div className="cell-sub">{s.studentId} · {s.email}</div>
                      </td>
                      <td>{s.department || s.branch}<div className="cell-sub">{s.batch}</div></td>
                      <td><strong>{Number(s.cgpa).toFixed(2)}</strong></td>
                      <td>{s.graduationYear}</td>
                      <td>{s.activeBacklogs}/{s.backlogs}</td>
                      <td>
                        <Badge status={s.placementStatus} />
                        {s.careerOutcome && (
                          <div className="cell-sub" style={{ marginTop: 2 }}>{labelize(s.careerOutcome)}</div>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-actions">
                          <button className="icon-btn" onClick={() => openEdit(s)} aria-label={`Edit ${s.name}`} title="Edit">
                            <Pencil size={14} />
                          </button>
                          {isAdmin && (
                            <button className="icon-btn danger" onClick={() => setDeleting(s)} aria-label={`Delete ${s.name}`} title="Delete (Admin only)">
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassPanel>
          <Pagination page={pagination.page || page} limit={pagination.limit || 10} total={pagination.total || 0} onPage={setPage} />
        </>
      )}

      <Modal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={editing ? `Edit Student — ${editing.name}` : 'Add Student'}
        size="lg"
        footer={
          <>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
            <Button type="submit" form="student-form" loading={saving}>{editing ? 'Save Changes' : 'Create Student'}</Button>
          </>
        }
      >
        <form id="student-form" onSubmit={save}>
          <div className="form-grid">
            <div className="field"><label htmlFor="f-name">Full name *</label>
              <input id="f-name" className="input" required value={form.name} placeholder="e.g. Rahul Sharma"
                aria-invalid={!!errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              {errors.name && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.name}</span>}
            </div>
            <div className="field"><label htmlFor="f-sid">Student ID *</label>
              <input id="f-sid" className="input" required disabled={!!editing} value={form.studentId} aria-invalid={!!errors.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })} placeholder="e.g. CSE2027042" />
              {errors.studentId && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.studentId}</span>}
            </div>
            <div className="field"><label htmlFor="f-email">Email *</label>
              <input id="f-email" type="email" className="input" required value={form.email} aria-invalid={!!errors.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="e.g. rahul@college.edu.in" />
              {errors.email && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.email}</span>}
            </div>
            <div className="field"><label htmlFor="f-phone">Phone</label>
              <input id="f-phone" className="input" value={form.phone} aria-invalid={!!errors.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="e.g. +91 98765 43210" />
              {errors.phone && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.phone}</span>}
            </div>
            <div className="field"><label htmlFor="f-branch">Branch *</label>
              <select id="f-branch" className="input" value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}>
                {BRANCHES.map((b) => <option key={b}>{b}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="f-dept">Department</label>
              <input id="f-dept" className="input" value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="e.g. Computer Science" />
            </div>
            <div className="field"><label htmlFor="f-batch">Batch</label>
              <input id="f-batch" className="input" value={form.batch} onChange={(e) => setForm({ ...form, batch: e.target.value })} placeholder="e.g. 2023-27" />
            </div>
            <div className="field"><label htmlFor="f-year">Graduation year *</label>
              <input id="f-year" type="number" className="input" required min="2000" max="2100" value={form.graduationYear} aria-invalid={!!errors.graduationYear}
                onChange={(e) => setForm({ ...form, graduationYear: e.target.value })} placeholder="e.g. 2027" />
              {errors.graduationYear && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.graduationYear}</span>}
            </div>
            <div className="field"><label htmlFor="f-cgpa">CGPA *<span className="hint"> (drives evaluate against this)</span></label>
              <input id="f-cgpa" type="number" step="0.01" min="0" max="10" className="input" required value={form.cgpa} aria-invalid={!!errors.cgpa}
                onChange={(e) => setForm({ ...form, cgpa: e.target.value })} placeholder="e.g. 8.2" />
              {errors.cgpa && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.cgpa}</span>}
            </div>
            <div className="field"><label htmlFor="f-ab">Active backlogs</label>
              <input id="f-ab" type="number" min="0" className="input" value={form.activeBacklogs} aria-invalid={!!errors.activeBacklogs}
                onChange={(e) => setForm({ ...form, activeBacklogs: e.target.value })} />
              {errors.activeBacklogs && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.activeBacklogs}</span>}
            </div>
            <div className="field"><label htmlFor="f-tb">Total backlogs</label>
              <input id="f-tb" type="number" min="0" className="input" value={form.backlogs} aria-invalid={!!errors.backlogs}
                onChange={(e) => setForm({ ...form, backlogs: e.target.value })} />
              {errors.backlogs && <span className="small" style={{ color: 'var(--danger-text)' }}>{errors.backlogs}</span>}
            </div>
            <div className="field"><label htmlFor="f-status">Placement status</label>
              <select id="f-status" className="input" value={form.placementStatus} onChange={(e) => setForm({ ...form, placementStatus: e.target.value })}>
                {STUDENT_PLACEMENT_STATUS.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div className="field"><label htmlFor="f-outcome">Career outcome (NIRF GO)</label>
              <select id="f-outcome" className="input" value={form.careerOutcome} onChange={(e) => setForm({ ...form, careerOutcome: e.target.value })}>
                <option value="">— Unspecified —</option>
                {STUDENT_CAREER_OUTCOME.map((o) => <option key={o} value={o}>{labelize(o)}</option>)}
              </select>
              <span className="small" style={{ color: 'var(--text-sub)' }}>Feeds the NIRF Graduation Outcomes report.</span>
            </div>
            <div className="field" style={{ gridColumn: '1 / -1' }}>
              <label htmlFor="f-skills">Tech Stack</label>
              <div className="chip-list">
                {(form.skills || []).map((sk) => (
                  <span key={sk} className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {sk}
                    <button type="button" onClick={() => removeFormSkill(sk)} aria-label={`Remove ${sk}`} style={{ border: 'none', background: 'transparent', cursor: 'pointer', padding: 0, display: 'inline-flex' }}>
                      <X size={12} />
                    </button>
                  </span>
                ))}
                {(form.skills || []).length === 0 && <span className="small muted">No skills added.</span>}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                <input id="f-skills" className="input" placeholder="Add a skill and press Enter" value={form.skillInput || ''}
                  onChange={(e) => setForm({ ...form, skillInput: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFormSkill(); } }} />
                <button type="button" className="btn btn-sm btn-secondary" onClick={addFormSkill}>Add</button>
              </div>
              <span className="small" style={{ color: 'var(--text-sub)' }}>Students own this on their profile; officers can correct it here. Changes are audited.</span>
            </div>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        title="Delete student?"
        message={`${deleting?.name} (${deleting?.studentId}) will be permanently removed. Applications and placement records referencing this student remain for audit purposes.`}
        confirmLabel="Delete"
        loading={deleteLoading}
      />
    </div>
  );
}
