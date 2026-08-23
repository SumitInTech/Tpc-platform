import { useState, useEffect } from 'react';
import { UploadCloud, FileText, Sparkles, Eye, X, Wand2, Tags } from 'lucide-react';
import Modal from '../common/Modal';
import Button from '../common/Button';
import ResumeViewerModal from '../common/ResumeViewerModal';

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function buildResumeHtml(student = {}, drive = {}) {
  const s = student;
  const name = s.name || 'Student';
  const contact = [s.email, s.phone].filter(Boolean).join(' · ');
  const skills = (s.skills || []).map((k) => `<span class="sk">${escapeHtml(k)}</span>`).join('');
  const role = drive.jobRole || 'Role';
  const company = drive.companyId?.name || 'Company';
  const top = (s.skills || []).slice(0, 3).join(', ') || 'core engineering';
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    *{box-sizing:border-box} body{font-family:Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;padding:34px;max-width:720px;margin:auto}
    h1{margin:0;font-size:26px}.sub{color:#64748b;margin:4px 0 14px}
    .badge{display:inline-block;background:#eef2ff;color:#4338ca;padding:6px 12px;border-radius:999px;font-weight:700;font-size:13px}
    .sec{margin-top:18px;font-weight:700;border-left:3px solid #6366f1;padding-left:8px}
    .sk{display:inline-block;background:#f1f5f9;border:1px solid #e2e8f0;border-radius:8px;padding:4px 10px;margin:4px 4px 0 0;font-size:13px}
    .fit{margin-top:12px;color:#0f172a;font-style:italic}.foot{margin-top:24px;color:#94a3b8;font-size:12px}
  </style></head><body>
    <h1>${escapeHtml(name)}</h1>
    <div class="sub">${escapeHtml(contact)}</div>
    <div class="badge">Applying for ${escapeHtml(role)} · ${escapeHtml(company)}</div>
    <div class="sec">Profile</div>
    <div>Branch: ${escapeHtml(s.branch || '—')} &nbsp; CGPA: ${s.cgpa != null ? Number(s.cgpa).toFixed(2) : '—'} &nbsp; Class of ${s.graduationYear ?? '—'}</div>
    <div class="sec">Skills</div><div>${skills || '—'}</div>
    <div class="fit">“Strong in ${escapeHtml(top)} — aligned with the ${escapeHtml(role)} role at ${escapeHtml(company)}.”</div>
    <div class="foot">Auto-generated from your TNP profile. Tune it by uploading a role-specific PDF.</div>
  </body></html>`;
}

export default function ResumeApplyModal({ open, onClose, drive, student, onSubmitted }) {
  const [file, setFile] = useState(null);
  const [generated, setGenerated] = useState(null);
  const [why, setWhy] = useState('');
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);

  const [selected, setSelected] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [added, setAdded] = useState([]);

  const company = drive?.companyId?.name || 'Company';
  const role = drive?.jobRole || 'Role';
  const topSkill = (student?.skills || [])[0];

  useEffect(() => {
    if (open) {
      setSelected([...(student?.skills || [])]);
      setAdded([]);
      setNewSkill('');
    }
  }, [open, student]);

  const reset = () => { setFile(null); setGenerated(null); setWhy(''); setPreview(null); };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== 'application/pdf') { alert('Please upload a PDF resume.'); return; }
    if (f.size > 6 * 1024 * 1024) { alert('Resume is larger than 6MB.'); return; }
    const reader = new FileReader();
    reader.onload = () => setFile({ name: f.name, size: f.size, dataUrl: reader.result });
    reader.readAsDataURL(f);
  };

  const handleGenerate = () => {
    const html = buildResumeHtml(student, drive);
    const b64 = btoa(unescape(encodeURIComponent(html)));
    setGenerated({ name: `resume-${role.replace(/\s+/g, '-').toLowerCase()}@${company.split(' ')[0].toLowerCase()}.html`, dataUrl: `data:text/html;base64,${b64}` });
  };

  const toggleSkill = (s) => {
    setSelected((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const addNewSkill = () => {
    const v = newSkill.trim();
    if (!v) return;
    if (!selected.includes(v)) setSelected((prev) => [...prev, v]);
    if (!added.includes(v)) setAdded((prev) => [...prev, v]);
    setNewSkill('');
  };

  const activeResume = file?.dataUrl || generated?.dataUrl;
  const activeName = file?.name || generated?.name;

  const submit = async () => {
    if (!activeResume) return;
    setBusy(true);
    try {
      await onSubmitted({
        resume: activeResume,
        resumeName: activeName,
        whyThisRole: why.trim(),
        highlightedSkills: selected,
        newSkills: added,
      });
      reset();
    } finally {
      setBusy(false);
    }
  };

  const close = () => { reset(); onClose?.(); };

  return (
    <>
      <Modal open={open} onClose={close} title={`Apply to ${company} · ${role}`} size="lg"
        footer={<>
          <Button variant="secondary" onClick={close} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={!activeResume} icon={FileText}>
            {busy ? 'Submitting…' : 'Submit Application'}
          </Button>
        </>}>
        <div className="ra-grid">
          <div className="ra-draft">
            <div className="ra-greet"><Sparkles size={15} /> Role-tuned draft</div>
            <h4>{student?.name || 'Your Name'}</h4>
            <div className="ra-sub">{([student?.email, student?.phone].filter(Boolean).join(' · ')) || 'email · phone'}</div>
            <div className="ra-badge">Applying for {role} · {company}</div>
            <div className="ra-sec">Snapshot</div>
            <div className="ra-line">Branch <b>{student?.branch || '—'}</b> · CGPA <b>{student?.cgpa != null ? Number(student.cgpa).toFixed(2) : '—'}</b> · Class of <b>{student?.graduationYear ?? '—'}</b></div>
            <div className="ra-sec">Skills</div>
            <div className="ra-chips">
              {(student?.skills || []).length ? student.skills.map((k) => <span key={k} className="ra-chip">{k}</span>)
                : <span className="ra-chip">—</span>}
            </div>
            <div className="ra-fit">“Strong in {topSkill || 'core engineering'} — aligned with the {role} role at {company}.”</div>
            <div className="ra-foot">Auto-built from your profile. Upload a company-specific PDF or attach this draft.</div>
          </div>

          <div className="ra-right">
            <div className="ra-sec"><Tags size={14} /> Highlight skills for this role</div>
            <div className="ra-chips">
              {(student?.skills || []).length === 0 && <span className="ra-chip">No skills on profile yet — add below.</span>}
              {(student?.skills || []).map((k) => (
                <button
                  key={k} type="button"
                  className="ra-chip"
                  onClick={() => toggleSkill(k)}
                  style={{
                    cursor: 'pointer', border: '1px solid',
                    borderColor: selected.includes(k) ? 'var(--primary)' : 'var(--border)',
                    background: selected.includes(k) ? 'color-mix(in srgb, var(--primary) 14%, var(--surface))' : 'var(--surface)',
                    color: selected.includes(k) ? 'var(--primary-text, #4338ca)' : 'var(--text-sub)',
                  }}
                >
                  {selected.includes(k) ? '✓ ' : ''}{k}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <input
                className="input" placeholder="Add a new skill for this role…" value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewSkill(); } }}
              />
              <button type="button" className="btn btn-sm btn-secondary" onClick={addNewSkill}>Add</button>
            </div>
            <div className="small muted" style={{ marginTop: 6 }}>
              {added.length > 0
                ? `“${added.join(', ')}” will also be added to your profile tech stack.`
                : 'Selected skills are saved with this application; new ones update your profile too.'}
            </div>

            <label className="ra-drop" style={{ marginTop: 12 }}>
              <UploadCloud size={26} />
              <div style={{ fontWeight: 700, marginTop: 6 }}>Drop or click to upload a role-specific PDF</div>
              <div className="small muted">PDF only · max 6MB · recommended for {company}</div>
              <input type="file" accept="application/pdf" hidden onChange={handleFile} />
            </label>

            {file && (
              <div className="ra-file">
                <FileText size={18} color="var(--primary)" />
                <span className="nm">{file.name}</span>
                <span className="small muted">{(file.size / 1024).toFixed(0)} KB</span>
                <button className="icon-btn" style={{ width: 28, height: 28 }} title="Preview" onClick={() => setPreview({ src: file.dataUrl, name: file.name })}><Eye size={14} /></button>
                <button className="icon-btn" style={{ width: 28, height: 28 }} title="Remove" onClick={() => setFile(null)}><X size={14} /></button>
              </div>
            )}

            <div className="ra-or">— or —</div>

            <button className="btn btn-secondary btn-block" onClick={handleGenerate} disabled={!!file}>
              <Wand2 size={15} /> Generate from profile
            </button>
            {generated && (
              <div className="ra-file">
                <Sparkles size={18} color="#8B5CF6" />
                <span className="nm">{generated.name}</span>
                <button className="icon-btn" style={{ width: 28, height: 28 }} title="Preview" onClick={() => setPreview({ src: generated.dataUrl, name: generated.name })}><Eye size={14} /></button>
                <button className="icon-btn" style={{ width: 28, height: 28 }} title="Remove" onClick={() => setGenerated(null)}><X size={14} /></button>
              </div>
            )}

            <div className="ra-sec">Why this role</div>
            <textarea
              className="input" rows={2} value={why}
              placeholder={`Because ${role} at ${company} matches my strengths in ${topSkill || 'engineering'}.`}
              onChange={(e) => setWhy(e.target.value)}
            />
            <div className="small muted">Optional — one line the officer shares with {company}.</div>
          </div>
        </div>
      </Modal>

      <ResumeViewerModal open={!!preview} onClose={() => setPreview(null)} src={preview?.src} title={preview?.name || 'Resume'} />
    </>
  );
}
