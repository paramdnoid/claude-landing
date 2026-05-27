import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { useTranslation } from 'react-i18next';
import { prefersReducedMotion } from '../lib/animations';

const RING_RADIUS = 92;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

export default function Loader({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const counterRef = useRef<HTMLSpanElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const monogramRef = useRef<HTMLDivElement>(null);
  const topLeftRef = useRef<HTMLDivElement>(null);
  const topRightRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setDone(true);
      onDoneRef.current();
      return;
    }
    const ctx = gsap.context(() => {
      const chips = [topLeftRef.current, topRightRef.current, bottomRef.current].filter(Boolean);
      if (!ringRef.current || !stageRef.current || !rootRef.current || chips.length < 3) return;

      gsap.set(ringRef.current, {
        strokeDasharray: RING_CIRCUMFERENCE,
        strokeDashoffset: RING_CIRCUMFERENCE,
      });

      // Breathing radial glow
      gsap.to(glowRef.current, {
        scale: 1.15,
        opacity: 0.9,
        duration: 2.2,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      // Subtle monogram float
      gsap.to(monogramRef.current, {
        y: -4,
        duration: 2.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });

      const count = { v: 0 };
      const tl = gsap.timeline({
        onComplete: () => {
          setDone(true);
          onDoneRef.current();
        },
      });

      tl.fromTo(
        chips,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out', stagger: 0.08 }
      )
        .fromTo(
          stageRef.current,
          { opacity: 0, scale: 0.94, filter: 'blur(12px)' },
          { opacity: 1, scale: 1, filter: 'blur(0px)', duration: 0.9, ease: 'expo.out' },
          '-=0.5'
        )
        .to(
          count,
          {
            v: 100,
            duration: 1.8,
            ease: 'power2.inOut',
            onUpdate: () => {
              const v = count.v;
              if (counterRef.current) counterRef.current.textContent = String(Math.round(v)).padStart(3, '0');
              if (ringRef.current) {
                ringRef.current.style.strokeDashoffset = String(RING_CIRCUMFERENCE * (1 - v / 100));
              }
            },
          },
          '-=0.4'
        )
        .to(
          chips,
          { opacity: 0, y: -6, duration: 0.5, ease: 'power2.out', stagger: 0.05 },
          '+=0.1'
        )
        .to(
          stageRef.current,
          { scale: 1.08, filter: 'blur(20px)', opacity: 0, duration: 0.9, ease: 'expo.in' },
          '-=0.35'
        )
        .to(
          rootRef.current,
          { opacity: 0, duration: 0.6, ease: 'power2.out' },
          '-=0.6'
        );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  if (done) return null;

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] overflow-hidden bg-[var(--color-bg)]"
    >
      {/* Breathing plasma glow */}
      <div
        ref={glowRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-[60vmin] w-[60vmin] -translate-x-1/2 -translate-y-1/2 opacity-60"
        style={{
          background:
            'radial-gradient(circle at center, rgba(99,102,241,0.45) 0%, rgba(6,182,212,0.22) 35%, rgba(163,255,18,0.08) 60%, transparent 75%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Vignette */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_70%_at_50%_50%,transparent_0%,rgba(5,5,7,0.6)_75%,rgba(5,5,7,0.95)_100%)]" />

      {/* Top-left: status chip */}
      <div ref={topLeftRef} className="absolute left-6 top-6 md:left-10 md:top-10" style={{ opacity: 0 }}>
        <div className="glass glass-pill tag inline-flex items-center gap-3">
          <span className="relative inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-plasma-lime)] glow-lime">
            <span className="absolute inset-0 animate-ping rounded-full bg-[var(--color-plasma-lime)] opacity-60" />
          </span>
          <span>{t('loader.label')}</span>
        </div>
      </div>

      {/* Top-right: version chip */}
      <div ref={topRightRef} className="absolute right-6 top-6 md:right-10 md:top-10" style={{ opacity: 0 }}>
        <div className="glass glass-pill tag">v0.2 · 2026</div>
      </div>

      {/* Center: monogram + progress ring */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div ref={stageRef} className="relative" style={{ opacity: 0 }}>
          <svg
            width="220"
            height="220"
            viewBox="0 0 220 220"
            className="block"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="loader-ring" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="var(--color-plasma-lime)" />
                <stop offset="50%" stopColor="var(--color-plasma-cyan)" />
                <stop offset="100%" stopColor="var(--color-plasma-indigo)" />
              </linearGradient>
            </defs>
            {/* Track */}
            <circle
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1.5"
            />
            {/* Progress */}
            <circle
              ref={ringRef}
              cx="110"
              cy="110"
              r={RING_RADIUS}
              fill="none"
              stroke="url(#loader-ring)"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform="rotate(-90 110 110)"
              style={{
                filter: 'drop-shadow(0 0 8px rgba(6,182,212,0.55))',
              }}
            />
          </svg>

          {/* Monogram */}
          <div
            ref={monogramRef}
            className="font-display absolute inset-0 flex items-center justify-center text-plasma"
            style={{
              fontSize: '4.5rem',
              letterSpacing: '-0.06em',
              lineHeight: 1,
            }}
          >
            AZ
          </div>

          {/* Counter */}
          <div className="absolute left-1/2 top-full mt-8 -translate-x-1/2 font-mono text-xs uppercase tracking-[0.3em] text-[var(--color-muted)]">
            <span ref={counterRef}>000</span>
            <span className="text-[var(--color-muted-2)]">/100</span>
          </div>
        </div>
      </div>

      {/* Bottom: composing label */}
      <div
        ref={bottomRef}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 md:bottom-10"
        style={{ opacity: 0 }}
      >
        <div className="font-mono text-[10px] uppercase tracking-[0.32em] text-[var(--color-muted-2)]">
          {t('loader.composing')} · WEBGL · GSAP · LENIS
        </div>
      </div>
    </div>
  );
}
