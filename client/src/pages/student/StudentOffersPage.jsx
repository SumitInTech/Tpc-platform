import { useState } from 'react';
import { Handshake } from 'lucide-react';
import offerService from '../../services/offerService';
import useApi from '../../hooks/useApi';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Skeleton from '../../components/common/Skeleton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import Button from '../../components/common/Button';
import { getApiError } from '../../services/api';
import { useNotification } from '../../context/NotificationContext';
import { formatLPA, formatDate, formatDateTime, labelize } from '../../utils/formatters';

export default function StudentOffersPage() {
  const { toast } = useNotification();
  const { data: res, loading, error, refetch } = useApi(() => offerService.getOffers({ limit: 30 }), []);
  const [acting, setActing] = useState('');
  const [confirmAction, setConfirmAction] = useState(null);

  const offers = res?.data || [];

  const act = async () => {
    if (!confirmAction) return;
    setActing(confirmAction.type);
    try {
      // Accept runs inside a server transaction: policy re-check → offer update →
      // student counters → placement record → audit + notification.
      if (confirmAction.type === 'accept') {
        await offerService.acceptOffer(confirmAction.offer._id);
        toast.success('Offer accepted', `Congratulations! Placement record created for ${confirmAction.offer.role}.`);
      } else {
        await offerService.declineOffer(confirmAction.offer._id);
        toast.info('Offer declined');
      }
      setConfirmAction(null);
      refetch();
    } catch (err) {
      toast.error('Action blocked', getApiError(err).message);
    } finally {
      setActing('');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">My Offers</h1>
          <p className="page-desc">
            Offers are policy-guarded. Accepting one updates your placement status and creates an auditable placement record.
          </p>
        </div>
      </div>

      {loading ? (
        <><Skeleton variant="card" /><div className="mt-2" /><Skeleton variant="card" /></>
      ) : error ? (
        <Card><ErrorState message={error.message} onRetry={() => refetch()} /></Card>
      ) : offers.length === 0 ? (
        <Card><EmptyState icon={Handshake} title="No offers yet"
          description="When the TPC creates an offer for you, it appears here for review." /></Card>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {offers.map((o) => (
            <Card key={o._id} hover style={{ borderColor: o.status === 'ACCEPTED' ? 'color-mix(in srgb, var(--success) 40%, transparent)' : undefined }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                <div className="avatar" style={{ width: 46, height: 46, borderRadius: 12, background: 'linear-gradient(135deg,#0EA5E9,#6366F1)' }}>
                  {(o.companyId?.name || '?').slice(0, 1)}
                </div>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div className="flex-between">
                    <div className="card-title">{o.role} · {o.companyId?.name}</div>
                    <Badge status={o.status} />
                  </div>
                  <div className="small muted mt-1">
                    Offered {formatDate(o.offerDate)}
                    {o.acceptedAt && <> · Accepted {formatDateTime(o.acceptedAt)}</>}
                  </div>
                  {o.policyDecisionSnapshot && (
                    <div className={`policy-decision mt-2 ${o.policyDecisionSnapshot.allowed ? 'allowed' : 'blocked'}`} style={{ padding: '8px 11px' }}>
                      <span className="small">
                        <strong>{labelize('POLICY_SNAPSHOT')}</strong>: {o.policyDecisionSnapshot.summary}
                      </span>
                    </div>
                  )}
                </div>
                <strong style={{ fontSize: 19, color: 'var(--success-text)' }}>{formatLPA(o.package, o.currency)}</strong>

                {o.status === 'OFFERED' && (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="success" loading={acting === 'accept'} onClick={() => setConfirmAction({ type: 'accept', offer: o })}>
                      Accept Offer
                    </Button>
                    <Button variant="secondary" disabled={!!acting} onClick={() => setConfirmAction({ type: 'decline', offer: o })}>
                      Decline
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={act}
        danger={confirmAction?.type === 'decline'}
        title={confirmAction?.type === 'accept' ? 'Accept this offer?' : 'Decline this offer?'}
        confirmLabel={confirmAction?.type === 'accept' ? 'Accept' : 'Decline'}
        loading={!!acting}
        message={
          confirmAction?.type === 'accept'
            ? `${confirmAction?.offer?.role} at ${confirmAction?.offer?.companyId?.name} for ${formatLPA(confirmAction?.offer?.package)}. Your placement status will update and a placement record will be created.`
            : 'Declined offers cannot be reopened. You can continue participating in other drives where policies allow.'
        }
      />
    </div>
  );
}
