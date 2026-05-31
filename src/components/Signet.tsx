import { useId } from 'react';

type SignetProps = {
  className?: string;
  /**
   * When set, the mark is exposed to assistive tech with this label. Otherwise
   * it renders decoratively (aria-hidden) — the right default wherever the
   * wordmark already names the brand.
   */
  title?: string;
  /** Subtle, reduced-motion-safe brand motion (aura breathe + rim shimmer). */
  animated?: boolean;
};

/**
 * The ZIAN monolith signet, inlined so it scales cleanly, renders its gradients
 * and filters reliably, and can animate. Every gradient/filter id is namespaced
 * per instance via `useId`, so the mark can appear multiple times on one page
 * without duplicate-id collisions breaking the fills.
 */
export default function Signet({ className, title, animated = false }: SignetProps) {
  const raw = useId();
  const uid = raw.replace(/[^a-zA-Z0-9]/g, '');
  const id = (name: string) => `${uid}-${name}`;
  const decorative = !title;

  return (
    <svg
      viewBox="0 0 360 360"
      focusable="false"
      className={className}
      role={decorative ? undefined : 'img'}
      aria-hidden={decorative ? true : undefined}
      aria-labelledby={decorative ? undefined : id('title')}
      xmlns="http://www.w3.org/2000/svg"
    >
      {!decorative && <title id={id('title')}>{title}</title>}
      <defs>
        <radialGradient id={id('aura')} cx="50%" cy="38%" r="62%">
          <stop offset="0" stopColor="#a3ff12" stopOpacity="0.18" />
          <stop offset="0.45" stopColor="#06b6d4" stopOpacity="0.12" />
          <stop offset="0.8" stopColor="#6366f1" stopOpacity="0.06" />
          <stop offset="1" stopColor="#000000" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={id('shell')} x1="100" y1="58" x2="250" y2="306" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#11111a" />
          <stop offset="0.42" stopColor="#0a0a0f" />
          <stop offset="1" stopColor="#050507" />
        </linearGradient>
        <linearGradient id={id('shellL')} x1="91" y1="70" x2="177" y2="310" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a3ff12" stopOpacity="0.12" />
          <stop offset="0.36" stopColor="#06b6d4" stopOpacity="0.06" />
          <stop offset="1" stopColor="#050507" stopOpacity="0.1" />
        </linearGradient>
        <linearGradient id={id('shellR')} x1="259" y1="82" x2="166" y2="295" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#6366f1" stopOpacity="0.14" />
          <stop offset="0.48" stopColor="#06b6d4" stopOpacity="0.05" />
          <stop offset="1" stopColor="#050507" stopOpacity="0.12" />
        </linearGradient>
        <linearGradient id={id('zBody')} x1="95" y1="93" x2="249" y2="264" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#d4ff6e" stopOpacity="0.95" />
          <stop offset="0.42" stopColor="#a3ff12" stopOpacity="0.95" />
          <stop offset="1" stopColor="#4a7300" stopOpacity="0.95" />
        </linearGradient>
        <linearGradient id={id('zHi')} x1="100" y1="91" x2="240" y2="236" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.7" />
          <stop offset="0.4" stopColor="#d4ff6e" stopOpacity="0.32" />
          <stop offset="1" stopColor="#a3ff12" stopOpacity="0.08" />
        </linearGradient>
        <linearGradient id={id('rim')} x1="108" y1="54" x2="258" y2="290" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#a3ff12" stopOpacity="0.85" />
          <stop offset="0.42" stopColor="#06b6d4" stopOpacity="0.6" />
          <stop offset="0.72" stopColor="#6366f1" stopOpacity="0.75" />
          <stop offset="1" stopColor="#1e1b4b" stopOpacity="0.4" />
        </linearGradient>
        <filter id={id('innerShadow')} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="12" stdDeviation="10" floodColor="#050507" floodOpacity="0.75" />
        </filter>
        <filter id={id('glow')} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="6" />
        </filter>
      </defs>

      <g
        filter={`url(#${id('glow')})`}
        opacity="0.85"
        className={animated ? 'signet-aura' : undefined}
        style={{ transformOrigin: 'center', transformBox: 'fill-box' }}
      >
        <ellipse cx="180" cy="170" rx="150" ry="160" fill={`url(#${id('aura')})`} />
      </g>
      <path d="M180 35 274 89v141l-94 97-94-97V89l94-54Z" fill={`url(#${id('shell')})`} stroke="rgba(163, 255, 18, 0.22)" strokeWidth="1.25" />
      <path d="M180 35 86 89v141l94 97v-43l-65-68V106l65-38V35Z" fill={`url(#${id('shellL')})`} opacity="0.86" />
      <path d="M180 35 274 89v141l-94 97v-43l65-68V106l-65-38V35Z" fill={`url(#${id('shellR')})`} opacity="0.86" />
      <path d="M180 72 238 107v104l-58 61-58-61V107l58-35Z" fill="rgba(6, 182, 212, 0.06)" stroke="rgba(163, 255, 18, 0.22)" strokeLinejoin="round" strokeWidth="0.85" />
      <path d="M180 52 250 93l-70 41-70-41 70-41Z" fill="rgba(255, 255, 255, 0.04)" opacity="0.58" />
      <path
        d="M180 35 274 89v141l-94 97-94-97V89l94-54Z"
        fill="none"
        stroke={`url(#${id('rim')})`}
        strokeLinejoin="round"
        strokeWidth="2"
        className={animated ? 'signet-rim' : undefined}
      />
      <path d="M180 65 246 104v111l-66 70-66-70V104l66-39Z" fill="none" stroke="rgba(163, 255, 18, 0.32)" strokeDasharray="2 7" strokeLinejoin="round" strokeWidth="0.9" opacity="0.78" />
      <g filter={`url(#${id('innerShadow')})`}>
        <path d="M114 104h132v32l-72 47h72v32H114v-32l72-47h-72v-32z" fill={`url(#${id('zBody')})`} stroke="rgba(255, 255, 255, 0.38)" strokeLinejoin="round" strokeWidth="1.05" />
        <path d="M114 104h132v32H114z" fill={`url(#${id('zHi')})`} />
        <path d="M186 136h60l-72 47h-60z" fill={`url(#${id('zHi')})`} opacity="0.56" />
        <path d="M114 183h132v32H114z" fill={`url(#${id('zHi')})`} opacity="0.26" />
      </g>
      <g fill="none" stroke="rgba(163, 255, 18, 0.18)" opacity="0.78">
        <path d="M130 120h100" />
        <path d="M206 142l-52 35" />
        <path d="M130 199h100" />
        <path d="M180 65v39" />
        <path d="M180 215v70" />
      </g>
      <g fill="none" stroke="rgba(6, 182, 212, 0.22)" opacity="0.4">
        <path d="M110 89 180 48 250 89" />
        <path d="M100 229 180 310 260 229" />
      </g>
      <path d="M180 35 274 89v141l-94 97-94-97V89l94-54Z" fill="none" stroke={`url(#${id('rim')})`} strokeLinejoin="round" strokeWidth="1.85" />
    </svg>
  );
}
