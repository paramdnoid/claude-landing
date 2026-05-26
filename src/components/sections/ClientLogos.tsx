import { useTranslation } from 'react-i18next';

const LOGOS = [
  { name: 'NorthForge', svg: <NorthForge /> },
  { name: 'ApexLabs', svg: <ApexLabs /> },
  { name: 'Lumenia', svg: <Lumenia /> },
  { name: 'Vektor', svg: <Vektor /> },
  { name: 'Halcyon', svg: <Halcyon /> },
  { name: 'Stratos', svg: <Stratos /> },
  { name: 'Nullspace', svg: <Nullspace /> },
  { name: 'Quanta&', svg: <Quanta /> },
];

export default function ClientLogos() {
  const { t } = useTranslation();
  const items = [...LOGOS, ...LOGOS];

  return (
    <section aria-label="Clients" className="relative py-20">
      <p className="mb-10 text-center font-mono text-[10px] uppercase tracking-[0.3em] text-[var(--color-muted-2)]">
        {t('clients.label')}
      </p>
      <div className="logo-marquee relative overflow-hidden">
        <div className="logo-marquee-track flex gap-16 will-change-transform">
          {items.map((logo, idx) => (
            <div
              key={`${logo.name}-${idx}`}
              className="flex h-10 w-40 shrink-0 items-center justify-center text-[var(--color-muted)] opacity-60 transition-opacity hover:opacity-100"
              title={logo.name}
            >
              {logo.svg}
            </div>
          ))}
        </div>
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[var(--color-bg)] to-transparent"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[var(--color-bg)] to-transparent"
        />
      </div>
      <style>{`
        .logo-marquee-track {
          animation: logo-scroll 40s linear infinite;
        }
        .logo-marquee:hover .logo-marquee-track {
          animation-play-state: paused;
        }
        @keyframes logo-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @media (prefers-reduced-motion: reduce) {
          .logo-marquee-track { animation: none; }
        }
      `}</style>
    </section>
  );
}

// Logo placeholders — replace with real client logos when available.
function NorthForge() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <path d="M2 24V8h2.4l7.6 12V8h2.4v16h-2.4L4.4 12v12H2zm22 0V8h11v2h-8.6v4.8H34v2h-7.6V22H35v2H24z" />
      <text x="42" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">NORTHFORGE</text>
    </svg>
  );
}
function ApexLabs() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <polygon points="6,24 14,8 22,24 19,24 17,20 11,20 9,24" />
      <polygon points="13,18 15,14 17,18" fill="var(--color-bg)" />
      <text x="28" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">APEXLABS</text>
    </svg>
  );
}
function Lumenia() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <circle cx="14" cy="16" r="6" />
      <circle cx="14" cy="16" r="3" fill="var(--color-bg)" />
      <text x="28" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">LUMENIA</text>
    </svg>
  );
}
function Vektor() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <path d="M6 8h3l5 12 5-12h3l-7 16h-2z" />
      <text x="26" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">VEKTOR</text>
    </svg>
  );
}
function Halcyon() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <rect x="6" y="10" width="3" height="12" />
      <rect x="14" y="6" width="3" height="20" />
      <rect x="22" y="12" width="3" height="8" />
      <text x="32" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">HALCYON</text>
    </svg>
  );
}
function Stratos() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <path d="M4 22 L14 8 L24 22 Z" fill="none" stroke="currentColor" strokeWidth="2" />
      <text x="30" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">STRATOS</text>
    </svg>
  );
}
function Nullspace() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <circle cx="14" cy="16" r="7" fill="none" stroke="currentColor" strokeWidth="2" />
      <line x1="9" y1="22" x2="19" y2="10" stroke="currentColor" strokeWidth="2" />
      <text x="28" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">NULLSPACE</text>
    </svg>
  );
}
function Quanta() {
  return (
    <svg viewBox="0 0 160 32" width="120" height="24" fill="currentColor" aria-hidden="true">
      <circle cx="14" cy="16" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
      <circle cx="18" cy="20" r="1.5" />
      <text x="28" y="20" fontFamily="ui-monospace, monospace" fontSize="11" letterSpacing="2">QUANTA</text>
    </svg>
  );
}
