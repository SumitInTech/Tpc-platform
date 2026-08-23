const Button = ({
  variant = 'primary',
  size,
  block,
  icon: Icon,
  loading = false,
  children,
  disabled,
  ...rest
}) => {
  const cls = [
    'btn',
    `btn-${variant}`,
    size === 'sm' ? 'btn-sm' : '',
    block ? 'btn-block' : '',
  ]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" aria-hidden /> : Icon ? <Icon size={16} /> : null}
      {children}
    </button>
  );
};

export default Button;
