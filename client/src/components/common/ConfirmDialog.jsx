import Modal from './Modal';
import Button from './Button';
import { AlertTriangle } from 'lucide-react';

const ConfirmDialog = ({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', danger = true, loading }) => (
  <Modal
    open={open}
    onClose={onClose}
    title={title}
    footer={
      <>
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </>
    }
  >
    <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
      <div className="state-icon danger" style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0 }}>
        <AlertTriangle size={20} />
      </div>
      <p style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{message}</p>
    </div>
  </Modal>
);

export default ConfirmDialog;
