// Shared, theme-aware styling for all recharts visuals.
// Centralised so every chart stays readable in both light and dark mode.
export const getChartTheme = (resolved) => {
  const isDark = resolved === 'dark';
  return {
    axis: { stroke: isDark ? '#8B96AC' : '#64748B', fontSize: 11.5 },
    grid: isDark ? '#232E47' : '#E2E8F0',
    legend: { fontSize: 11.5, color: isDark ? '#8B96AC' : '#64748B' },
    // Background/border follow the theme surface so the box is always visible.
    tooltipStyle: {
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 10,
      color: 'var(--text)',
      fontSize: 12.5,
      boxShadow: 'var(--shadow-md)',
      padding: '8px 10px',
    },
    // Force label + value text to the theme text colour. Without this, recharts
    // colours the value with the series colour, which is hard to read on dark.
    tooltipLabelStyle: { color: 'var(--text-secondary)', fontSize: 12, fontWeight: 600 },
    tooltipItemStyle: { color: 'var(--text)', fontSize: 12.5 },
  };
};
