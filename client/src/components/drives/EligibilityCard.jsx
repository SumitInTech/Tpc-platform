const FIELD_LABELS = {
  cgpa: 'CGPA',
  branch: 'Branch',
  activeBacklogs: 'Active Backlogs',
  backlogs: 'Total Backlogs',
  graduationYear: 'Graduation Year',
  department: 'Department',
};

const OP_SYMBOLS = {
  EQUAL: '=',
  NOT_EQUAL: '≠',
  GREATER_THAN: '>',
  GREATER_THAN_OR_EQUAL: '≥',
  LESS_THAN: '<',
  LESS_THAN_OR_EQUAL: '≤',
  IN: 'IN',
  NOT_IN: 'NOT IN',
};

/**
 * Explainable eligibility card.
 * Renders the backend evaluation result — never decides eligibility itself.
 */
const EligibilityCard = ({ eligibility, policyCheck }) => {
  if (!eligibility) return null;
  const results = eligibility.results || [];

  return (
    <div className="mt-3">
      <div className={`eligibility-banner ${eligibility.eligible ? 'ok' : 'no'}`} role="status">
        <span style={{ fontSize: 20 }} aria-hidden>
          {eligibility.eligible ? '🟢' : '🔴'}
        </span>
        <span>
          {eligibility.eligible ? 'YOU ARE ELIGIBLE' : 'NOT ELIGIBLE'}
          <span className="small" style={{ display: 'block', fontWeight: 550, opacity: 0.85 }}>
            {eligibility.summary}
          </span>
        </span>
      </div>

      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 14 }}>
          {results.map((r) => (
            <div key={`${r.field}-${JSON.stringify(r.required)}`} className={`rule-row ${r.passed ? 'passed' : 'failed'}`}>
              <span className="rule-icon" aria-hidden style={{ fontWeight: 800 }}>
                {r.passed ? (
                  <span style={{ color: 'var(--success-text)' }}>✓</span>
                ) : (
                  <span style={{ color: 'var(--danger-text)' }}>✕</span>
                )}
              </span>
              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                  {FIELD_LABELS[r.field] || r.field} — {r.passed ? 'Passed' : 'Failed'}
                </div>
                <div className="rule-required">
                  Required:{' '}
                  <strong>
                    {(OP_SYMBOLS[r.operator] || r.operator)}{' '}
                    {Array.isArray(r.required) ? `[${r.required.join(', ')}]` : String(r.required)}
                  </strong>{' '}
                  · Your value: <strong>{String(r.actual ?? '—')}</strong>
                </div>
                {!r.passed && r.reason && (
                  <div className="rule-required" style={{ color: 'var(--danger-text)' }}>{r.reason}</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {policyCheck && policyCheck.decisions && policyCheck.decisions.length > 0 && (
        <div className={`policy-decision mt-3 ${policyCheck.allowed ? 'allowed' : 'blocked'}`}>
          <strong>{policyCheck.allowed ? '🟢 POLICY CHECK PASSED' : '🔴 ACTION BLOCKED BY POLICY'}</strong>
          <div className="small mt-1">{policyCheck.summary}</div>
          {!policyCheck.allowed &&
            (policyCheck.decisions || [])
              .filter((d) => !d.allowed)
              .map((d) => (
                <div key={d.policy} className="small mt-1" style={{ color: 'var(--danger-text)' }}>
                  • <strong>{d.policy}</strong>: {d.reason}
                </div>
              ))}
        </div>
      )}
    </div>
  );
};

export default EligibilityCard;
