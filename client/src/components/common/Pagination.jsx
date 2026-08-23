import { ChevronLeft, ChevronRight } from 'lucide-react';

const Pagination = ({ page = 1, limit = 10, total = 0, onPage }) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (total === 0) return null;
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  return (
    <div className="pagination-bar">
      <span className="muted small">
        Showing <strong>{from}–{to}</strong> of <strong>{total}</strong>
      </span>
      <div className="page-btns">
        <button
          className="icon-btn"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          aria-label="Previous page"
          style={{ width: 32, height: 32 }}
        >
          <ChevronLeft size={16} />
        </button>
        <span className="small muted" style={{ padding: '0 6px', fontWeight: 650 }}>
          Page {page} of {pages}
        </span>
        <button
          className="icon-btn"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          aria-label="Next page"
          style={{ width: 32, height: 32 }}
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default Pagination;
