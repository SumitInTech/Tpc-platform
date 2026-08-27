const BrandLogo = ({ size = 38, pad = 0, radius, style, ...rest }) => (
  <img
    src="/tnp-logo.png"
    alt="TPC Flow"
    draggable={false}
    style={{
      width: size,
      height: size,
      objectFit: 'contain',
      padding: pad,
      borderRadius: radius,
      display: 'block',
      flexShrink: 0,
      ...style,
    }}
    {...rest}
  />
);

export default BrandLogo;
