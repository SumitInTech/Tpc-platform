import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import Button from './Button';

const MARGIN = 8;

export default function DownloadMenu({ onDownload, exporting = '', label = 'Download Sheet', disabled = false }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrapRef = useRef(null);
  const menuRef = useRef(null);

  const place = () => {
    const wrap = wrapRef.current;
    const menu = menuRef.current;
    if (!wrap || !menu) return;
    const r = wrap.getBoundingClientRect();
    const m = menu.getBoundingClientRect();
    let top = r.bottom + 6;
    if (top + m.height > window.innerHeight - MARGIN) top = Math.max(MARGIN, r.top - m.height - 6);
    let left = r.right - m.width;
    left = Math.min(Math.max(MARGIN, left), window.innerWidth - m.width - MARGIN);
    setPos({ top, left });
  };

  useLayoutEffect(() => {
    if (!open) { setPos(null); return undefined; }
    place();
    const id = requestAnimationFrame(place);
    return () => cancelAnimationFrame(id);
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onScroll = () => place();
    const onResize = () => place();
    const onClickOutside = (e) => {
      if (
        wrapRef.current && !wrapRef.current.contains(e.target) &&
        menuRef.current && !menuRef.current.contains(e.target)
      ) setOpen(false);
    };
    const onKeyDown = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <div className="download-menu-wrap" ref={wrapRef}>
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
      {open && createPortal(
        <div
          ref={menuRef}
          className="download-menu"
          role="menu"
          style={{
            position: 'fixed',
            top: pos ? pos.top : -9999,
            left: pos ? pos.left : -9999,
            right: 'auto',
            visibility: pos ? 'visible' : 'hidden',
            zIndex: 3000,
          }}
        >
          <button type="button" role="menuitem" disabled={exporting === 'excel'} onClick={() => onDownload('excel')}>
            <FileSpreadsheet size={16} />
            <span>Excel Sheet<small>.xlsx — best for editing &amp; filtering</small></span>
          </button>
          <button type="button" role="menuitem" disabled={exporting === 'pdf'} onClick={() => onDownload('pdf')}>
            <FileText size={16} />
            <span>PDF Document<small>.pdf — best for printing &amp; sharing</small></span>
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
