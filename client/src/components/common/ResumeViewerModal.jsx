import Modal from './Modal';

export default function ResumeViewerModal({ open, onClose, src, title }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Resume Preview'} size="lg">
      {src ? (
        <iframe src={src} title="resume" className="resume-frame" />
      ) : (
        <div className="muted small">No resume attached to this application.</div>
      )}
    </Modal>
  );
}
