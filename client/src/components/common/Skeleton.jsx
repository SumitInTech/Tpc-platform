const Skeleton = ({ variant = 'line', width, height, style, ...rest }) => {
  const base = { width: width || (variant === 'line' ? '100%' : undefined), height, style };
  if (variant === 'title') return <div className="skeleton sk-title" {...base} />;
  if (variant === 'card') return <div className="skeleton sk-card" {...base} />;
  if (variant === 'row') return <div className="skeleton sk-row" {...base} />;
  if (variant === 'stat') {
    return (
      <div className="card stat-card" aria-hidden>
        <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 11 }} />
        <div className="skeleton" style={{ width: '55%', height: 26 }} />
        <div className="skeleton" style={{ width: '35%', height: 12 }} />
      </div>
    );
  }
  if (variant === 'table') {
    return (
      <div aria-hidden>
        {Array.from({ length: rest.rows || 5 }).map((_, i) => (
          <div key={i} className="skeleton sk-row" />
        ))}
      </div>
    );
  }
  return <div className="skeleton sk-line" {...base} />;
};

export default Skeleton;
