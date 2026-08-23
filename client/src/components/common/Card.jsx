const Card = ({ hover = false, pad, className = '', children, ...rest }) => (
  <div
    className={`card ${hover ? 'hover' : ''} ${pad === 'sm' ? 'card-pad-sm' : ''} ${className}`}
    {...rest}
  >
    {children}
  </div>
);

export default Card;
