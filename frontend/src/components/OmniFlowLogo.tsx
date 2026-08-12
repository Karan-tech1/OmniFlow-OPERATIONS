export function OmniFlowLogo({ size = 32, className = '' }: { size?: number; className?: string }) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.28),
        background: 'linear-gradient(135deg, #d2f34c 0%, #10b981 100%)',
        display: 'grid',
        placeItems: 'center',
        boxShadow: '0 4px 14px rgba(16, 185, 129, 0.3)',
        flexShrink: 0,
      }}
    >
      <svg
        width={Math.round(size * 0.65)}
        height={Math.round(size * 0.65)}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M6 16C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C9.5 8 11.5 16 15 16C17.2091 16 19 14.2091 19 12C19 9.79086 17.2091 8 15 8"
          stroke="#0d241d"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="19" cy="12" r="2.2" fill="#0d241d" />
        <path d="M5.5 12H5.51" stroke="#0d241d" strokeWidth="3.2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
