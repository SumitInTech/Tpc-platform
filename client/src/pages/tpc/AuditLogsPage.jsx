import { useState, useMemo, useEffect } from 'react';
import {
  ScrollText, Search, Download, Activity, PlusCircle, CheckCircle2, XCircle, Undo2, Ban,
  Send, RefreshCw, LogIn, UserPlus, UserCog, Database, ShieldAlert, Users, CalendarDays,
  Clock, ChevronDown, Radio, FileJson, Filter, Fingerprint,
} from 'lucide-react';
import auditService from '../../services/auditService';
import useApi from '../../hooks/useApi';
import useDebounce from '../../hooks/useDebounce';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Pagination from '../../components/common/Pagination';
import { formatDateTime, timeAgo, labelize, initials, downloadCSV } from '../../utils/formatters';
import { Hero, Kpi, KpiGrid, Segmented, GlassPanel, SectionHeader, cardStyle } from '../../components/dashboard/primitives';

const FONT = "'Inter', system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
const ENTITY_PALETTE = ['#6366F1', '#4F46E5', '#4338CA', '#818CF8', '#A5B4FC', '#6D74F0', '#372E9C', '#1E1B4B'];

const ACTION_META = {
  CREATE_OFFER: { icon: PlusCircle, color: 'var(--primary)', label: 'Offer Created' },
  ACCEPT_OFFER: { icon: CheckCircle2, color: 'var(--success)', label: 'Offer Accepted' },
  DECLINE_OFFER: { icon: XCircle, color: 'var(--text-muted)', label: 'Offer Declined' },
  WITHDRAW_OFFER: { icon: Undo2, color: 'var(--warning)', label: 'Offer Withdrawn' },
  REVOKE_OFFER: { icon: Ban, color: 'var(--danger)', label: 'Offer Revoked' },
  APPLY_DRIVE: { icon: Send, color: 'var(--primary)', label: 'Applied to Drive' },
  UPDATE_APPLICATION_STATUS: { icon: RefreshCw, color: 'var(--primary)', label: 'Application Updated' },
  LOGIN: { icon: LogIn, color: 'var(--info)', label: 'Login' },
  REGISTER: { icon: UserPlus, color: 'var(--success)', label: 'Account Registered' },
  REGISTER_STAFF: { icon: UserCog, color: 'var(--primary)', label: 'Staff Added' },
  SEED_DATABASE: { icon: Database, color: 'var(--text-muted)', label: 'Database Seeded' },
};

const metaFor = (action) =>
  ACTION_META[action] || { icon: Activity, color: 'var(--text-muted)', label: labelize(action) };

const entityColor = (type, allTypes = []) => {
  if (!type) return '#64748B';
  const idx = allTypes.indexOf(type);
  if (idx >= 0) return ENTITY_PALETTE[idx % ENTITY_PALETTE.length];
  return ENTITY_PALETTE[Math.abs(hashStr(type)) % ENTITY_PALETTE.length];
};

const hashStr = (s) => {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
};

function buildDiff(oldValue, newValue) {
  const out = [];
  const keys = new Set([...(oldValue ? Object.keys(oldValue) : []), ...(newValue ? Object.keys(newValue) : [])]);
  keys.forEach((k) => {
    const o = oldValue ? oldValue[k] : undefined;
    const n = newValue ? newValue[k] : undefined;
    if (JSON.stringify(o) !== JSON.stringify(n)) out.push({ key: k, old: o, new: n });
  });
  return out;
}

function DiffView({ oldValue, newValue, metadata }) {
  const diff = buildDiff(oldValue, newValue);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {diff.length > 0 ? (
        <div>
          <div className="small muted" style={{ marginBottom: 6, fontWeight: 700 }}>Change</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {diff.map((d) => (
              <div key={d.key} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', minWidth: 70 }}>{labelize(d.key)}</span>
                <code style={{ fontSize: 12, padding: '3px 8px', borderRadius: 8, background: 'var(--surface-2)', color: 'var(--text-muted)' }}>{d.old ?? '—'}</code>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <code style={{ fontSize: 12, padding: '3px 8px', borderRadius: 8, background: 'color-mix(in srgb, var(--success) 14%, var(--surface))', color: 'var(--success-text)' }}>{d.new ?? '—'}</code>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="small muted">No field-level change recorded for this event.</div>
      )}
      {metadata && Object.keys(metadata).length > 0 && (
        <div>
          <div className="small muted" style={{ marginBottom: 6, fontWeight: 700 }}>Metadata</div>
          <pre style={{ margin: 0, fontSize: 11.5, lineHeight: 1.5, padding: 10, borderRadius: 10, background: 'var(--surface-2)', color: 'var(--text-sub)', overflowX: 'auto' }}>
            {JSON.stringify(metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

function TimelineRow({ log, expanded, onToggle, entityTypes }) {
  const meta = metaFor(log.action);
  const Icon = meta.icon;
  const color = meta.color;
  const actor = log.userId;
  const actorName = actor?.name || 'System';
  const actorRole = actor?.role || (actor ? 'User' : 'Automated');
  const entityTone = entityColor(log.entityType, entityTypes);

  return (
    <div style={{ position: 'relative', paddingLeft: 56 }}>
      <span style={{ position: 'absolute', left: 14, top: 18, width: 34, height: 34, borderRadius: 12, display: 'grid', placeItems: 'center', color: '#fff', background: `linear-gradient(135deg, ${color}, color-mix(in srgb, ${color} 70%, #0f172a))`, boxShadow: `0 12px 24px -14px ${color}`, zIndex: 2 }}>
        <Icon size={17} />
      </span>
      <div
        onClick={onToggle}
        style={{
          ...cardStyle, position: 'relative', overflow: 'hidden', cursor: 'pointer',
          transition: 'transform .18s ease, box-shadow .18s ease', marginBottom: 14,
          borderColor: expanded ? color : 'var(--border)',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateX(4px)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: `linear-gradient(180deg, ${color}, transparent)` }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
            <span style={{ display: 'inline-flex', width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 12, color: '#fff', background: 'linear-gradient(135deg,#334155,#475569)', flex: '0 0 auto' }}>
              {initials(actorName)}
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: 14, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {actorName} <span className="small muted">· {actorRole}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 3 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color }}>{meta.label}</span>
                <span className="badge" style={{ background: `color-mix(in srgb, ${entityTone} 15%, transparent)`, color: entityTone, fontSize: 11 }}>{log.entityType}</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2, flex: '0 0 auto' }}>
            <span className="small muted" style={{ whiteSpace: 'nowrap' }} title={formatDateTime(log.timestamp)}>{timeAgo(log.timestamp)}</span>
            <span style={{ color: 'var(--text-muted)' }}><ChevronDown size={16} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} /></span>
          </div>
        </div>

        {expanded && (
          <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-sub)' }}>
                <Clock size={12} style={{ marginRight: 4 }} />{formatDateTime(log.timestamp)}
              </span>
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-sub)' }}>
                <Fingerprint size={12} style={{ marginRight: 4 }} />{log.ipAddress || '—'}
              </span>
              <span className="badge" style={{ background: 'var(--surface-2)', color: 'var(--text-sub)' }}>
                ID: {String(log.entityId || '—').slice(-8)}
              </span>
            </div>
            <DiffView oldValue={log.oldValue} newValue={log.newValue} metadata={log.metadata} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function AuditLogsPage() {
  const [entity, setEntity] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState(new Set());
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [live, setLive] = useState(false);
  const search = useDebounce(searchInput, 300);

  const stats = useApi(() => auditService.getAuditStats(), []);
  const list = useApi(
    () => auditService.getAuditLogs({ page, limit: 20, entityType: entity || undefined }),
    [page, entity]
  );

  const logs = (list.data?.data || []).filter((l) => {
    if (criticalOnly && !['WITHDRAW_OFFER', 'REVOKE_OFFER', 'DECLINE_OFFER'].includes(l.action)) return false;
    if (!search) return true;
    const hay = `${l.action} ${l.entityType} ${l.userId?.name || ''} ${l.ipAddress || ''}`.toLowerCase();
    return hay.includes(search.toLowerCase());
  });
  const pagination = list.data?.pagination || {};

  const allEntityTypes = useMemo(
    () => (stats.data?.data?.byEntityType || []).map((e) => e._id).filter(Boolean),
    [stats.data]
  );

  const entityOptions = useMemo(() => {
    const counts = Object.fromEntries((stats.data?.data?.byEntityType || []).map((e) => [e._id, e.count]));
    return [
      { label: 'All Entities', value: '', count: stats.data?.data?.total, color: 'primary' },
      ...allEntityTypes.map((t) => ({ label: t, value: t, count: counts[t] || 0, color: entityColor(t, allEntityTypes), dot: true })),
    ];
  }, [stats.data, allEntityTypes]);

  useEffect(() => {
    if (!live) return undefined;
    const id = setInterval(() => { list.refetch(); stats.refetch(); }, 15000);
    return () => clearInterval(id);
  }, [live, list, stats]);

  const kpis = useMemo(() => {
    const d = stats.data?.data || {};
    const spark = (d.daily || []).map((x) => x.count);
    return [
      { key: 'total', label: 'Total Events', value: d.total || 0, icon: ScrollText, tone: 'primary', spark },
      { key: 'today', label: 'Today', value: d.today || 0, icon: CalendarDays, tone: 'primary' },
      { key: 'week', label: 'This Week', value: d.thisWeek || 0, icon: Activity, tone: 'primary' },
      { key: 'actors', label: 'Unique Actors', value: d.uniqueActors || 0, icon: Users, tone: 'primary' },
      { key: 'critical', label: 'Critical Actions', value: d.sensitive || 0, icon: ShieldAlert, tone: 'danger' },
    ];
  }, [stats.data]);

  const doExport = () => {
    const rows = logs.map((l) => ({
      Timestamp: formatDateTime(l.timestamp),
      Actor: l.userId?.name || 'System',
      Role: l.userId?.role || '',
      Action: l.action,
      Entity: l.entityType,
      EntityId: l.entityId || '',
      IP: l.ipAddress || '',
      Change: JSON.stringify({ old: l.oldValue || null, new: l.newValue || null }),
    }));
    downloadCSV(rows, 'audit-trail.csv');
  };

  const toggleExpand = (id) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const heroAside = (
    <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
      <button
        type="button"
        onClick={() => setLive((v) => !v)}
        className="btn-shimmer"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer',
          padding: '10px 16px', borderRadius: 999, fontWeight: 800, fontSize: 13, color: '#fff',
          background: live
            ? 'var(--success)'
            : 'rgba(255,255,255,0.16)', backdropFilter: 'blur(6px)',
          boxShadow: live ? '0 14px 30px -12px var(--success)' : 'none',
        }}
      >
        <Radio size={15} style={{ animation: live ? 'live-pulse 1.4s infinite' : 'none' }} />
        {live ? 'Live · 15s' : 'Go Live'}
      </button>
      <div style={{ textAlign: 'right', maxWidth: 180 }}>
        <div style={{ fontSize: 12, opacity: 0.9, fontWeight: 700 }}>Latest activity</div>
        <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{timeAgo((list.data?.data || [])[0]?.timestamp) || '—'}</div>
      </div>
    </div>
  );

  return (
    <div style={{ fontFamily: FONT }}>
      <Hero
        eyebrow="Training & Placement Cell"
        title="Audit Trail Command Center"
        subtitle="Every sensitive action answers WHO did WHAT, WHEN, and on WHICH record. Passwords and secrets are never logged — this is your tamper-evident activity vault."
        compact
        aside={heroAside}
        actions={<button type="button" className="btn-shimmer" onClick={doExport} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer', padding: '10px 16px', borderRadius: 12, fontWeight: 800, fontSize: 13, color: 'var(--primary-text, #fff)', background: 'rgba(255,255,255,0.16)' }}><Download size={15} /> Export CSV</button>}
      />

      <div style={{ marginTop: 18 }}>
        {stats.loading ? (
          <KpiGrid>{kpis.map((k) => <Skeleton key={k.key} variant="card" />)}</KpiGrid>
        ) : (
          <KpiGrid>{kpis.map((k) => <Kpi key={k.key} {...k} />)}</KpiGrid>
        )}
      </div>

      <GlassPanel gradient="linear-gradient(90deg, #6366F1, #4338CA)" className="mb-3 mt-3" style={{ ...cardStyle, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <Filter size={16} color="var(--text-sub, #64748b)" style={{ flexShrink: 0 }} />
        <span style={{ fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>Filter by entity</span>
        {stats.loading ? (
          <span className="small muted">Loading filters…</span>
        ) : (
          <div style={{ flex: '1 1 260px', minWidth: 0, overflowX: 'auto' }}>
            <Segmented options={entityOptions} value={entity} onChange={setEntity} />
          </div>
        )}
        <div style={{ flex: '1 1 300px', minWidth: 0, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div className="search-box" style={{ flex: '1 1 200px', minWidth: 0, maxWidth: 'none' }}>
            <Search size={16} />
            <input className="input" placeholder="Search action, actor or IP…" value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)} aria-label="Search audit logs" />
          </div>
          <button
            type="button"
            onClick={() => setCriticalOnly((v) => !v)}
            style={{
              flexShrink: 0,
              display: 'inline-flex', alignItems: 'center', gap: 6, border: '1px solid', cursor: 'pointer',
              padding: '0 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
              color: criticalOnly ? '#fff' : 'var(--danger-text)',
              borderColor: criticalOnly ? 'transparent' : 'var(--border)',
              background: criticalOnly ? 'var(--danger)' : 'var(--surface)',
            }}
          >
            <ShieldAlert size={14} /> Critical only
          </button>
        </div>
      </GlassPanel>

      <SectionHeader
        icon={ScrollText}
        title="Activity Timeline"
        subtitle={entity ? `Showing ${entity} events` : 'Chronological stream of every audited action'}
        tone="primary"
      />

      {list.loading ? (
        <div style={{ ...cardStyle }}><Skeleton variant="table" rows={8} /></div>
      ) : list.error ? (
        <div style={{ ...cardStyle }}><ErrorState message={list.error.message} onRetry={() => list.refetch()} /></div>
      ) : logs.length === 0 ? (
        <div style={{ ...cardStyle }}>
          <EmptyState icon={ScrollText} title="No matching audit entries"
            description="Adjust filters or search to surface the events you are looking for." />
        </div>
      ) : (
        <div style={{ position: 'relative' }}>
          <span style={{ position: 'absolute', left: 30, top: 8, bottom: 8, width: 2, background: 'linear-gradient(180deg, var(--border), transparent)' }} />
          {logs.map((log) => (
            <TimelineRow
              key={log._id}
              log={log}
              expanded={expanded.has(log._id)}
              onToggle={() => toggleExpand(log._id)}
              entityTypes={allEntityTypes}
            />
          ))}
          {(pagination.total || 0) > (pagination.limit || 20) && (
            <Pagination page={pagination.page || page} limit={pagination.limit || 20} total={pagination.total || 0} onPage={setPage} />
          )}
        </div>
      )}

      <div className="small muted mt-3" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <FileJson size={14} /> Records are written by the workflow engine. Export the visible filtered set for compliance reviews.
      </div>
    </div>
  );
}
