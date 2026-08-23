import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from './Button';

export default function DownloadMenu({ onDownload, exporting = '', label = 'Download Sheet', disabled = false }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="download-menu-wrap" ref={ref}>
      <Button
        variant="secondary"
        icon={Download}
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        loading={!!exporting}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {label}
      </Button>
      {open && (
        <div className="download-menu" role="menu">
          <button type="button" role="menuitem" disabled={exporting === 'excel'} onClick={() => onDownload('excel')}>
            <FileSpreadsheet size={16} />
            <span>Excel Sheet<small>.xlsx — best for editing &amp; filtering</small></span>
          </button>
          <button type="button" role="menuitem" disabled={exporting === 'pdf'} onClick={() => onDownload('pdf')}>
            <FileText size={16} />
            <span>PDF Document<small>.pdf — best for printing &amp; sharing</small></span>
          </button>
        </div>
      )}
    </div>
  );
}
