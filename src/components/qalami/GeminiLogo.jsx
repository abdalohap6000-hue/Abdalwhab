export default function GeminiLogo({ size = 16, className = "" }) {
  const id = `gem-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="24" x2="24" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1C7DFF" />
          <stop offset="52%" stopColor="#8E68FF" />
          <stop offset="100%" stopColor="#E86BB0" />
        </linearGradient>
      </defs>
      <path
        fill={`url(#${id})`}
        d="M12 0c.28 6.4 5.6 11.72 12 12-6.4.28-11.72 5.6-12 12-.28-6.4-5.6-11.72-12-12C6.4 11.72 11.72 6.4 12 0Z"
      />
    </svg>
  );
}
