import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Activity, Terminal, Cpu, Signal } from 'lucide-react';
import { prefersReducedMotion, splitText } from '../../lib/animations';

gsap.registerPlugin(ScrollTrigger);

type Step = { label: string; title: string; body: string };
type Metric = { label: string; value: string; delta: string };

export default function Process() {
  const { t, i18n } = useTranslation();
  const sectionRef = useRef<HTMLElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const ledeRef = useRef<HTMLParagraphElement>(null);
  const pinRef = useRef<HTMLDivElement>(null);
  const layerARef = useRef<HTMLDivElement>(null);
  const layerBRef = useRef<HTMLDivElement>(null);
  const layerCRef = useRef<HTMLDivElement>(null);
  const stepsWrapRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  const steps = t('process.steps', { returnObjects: true }) as Step[];
  const metrics = t('processExtras.metrics', { returnObjects: true }) as Metric[];
  const terminalLines = t('processExtras.terminalLines', { returnObjects: true }) as string[];
  const stack = t('processExtras.stack', { returnObjects: true }) as string[];

  useEffect(() => {
    if (!sectionRef.current) return;

    const ctx = gsap.context(() => {
      // --- header reveal ---
      if (titleRef.current) {
        const chars = splitText(titleRef.current);
        if (prefersReducedMotion()) {
          gsap.set(chars, { y: 0, opacity: 1 });
        } else {
          gsap.fromTo(
            chars,
            { yPercent: 110, opacity: 0 },
            {
              yPercent: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'expo.out',
              stagger: 0.015,
              scrollTrigger: { trigger: titleRef.current, start: 'top 85%', once: true },
            },
          );
        }
      }
      if (ledeRef.current) {
        if (prefersReducedMotion()) {
          gsap.set(ledeRef.current, { opacity: 1, y: 0 });
        } else {
          gsap.fromTo(
            ledeRef.current,
            { y: 24, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.9,
              ease: 'power3.out',
              scrollTrigger: { trigger: ledeRef.current, start: 'top 85%', once: true },
            },
          );
        }
      }

      // --- pinned cinematic timeline (desktop only) ---
      const isDesktop = window.matchMedia('(min-width: 1024px)').matches;
      if (!isDesktop || prefersReducedMotion() || !pinRef.current) {
        // Static fallback: every layer visible-ish but final layer dominant.
        gsap.set([layerARef.current, layerBRef.current], { opacity: 0 });
        gsap.set(layerCRef.current, { opacity: 1, scale: 1 });
        if (stepsWrapRef.current) {
          const stepNodes = stepsWrapRef.current.querySelectorAll<HTMLElement>('.process-step');
          gsap.set(stepNodes, { opacity: 1, y: 0 });
        }
        return;
      }

      // Initial state for crossfade
      gsap.set(layerARef.current, { opacity: 1, scale: 1 });
      gsap.set(layerBRef.current, { opacity: 0, scale: 0.96 });
      gsap.set(layerCRef.current, { opacity: 0, scale: 0.94 });

      const stepNodes = stepsWrapRef.current
        ? Array.from(stepsWrapRef.current.querySelectorAll<HTMLElement>('.process-step'))
        : [];
      gsap.set(stepNodes, { opacity: 0.25 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: pinRef.current,
          start: 'top top',
          end: '+=300%',
          scrub: 1,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
        },
      });

      // --- 0.0 → 0.33: Week 01 active ---
      tl.to(stepNodes[0], { opacity: 1, duration: 0.15 }, 0);

      // Transition 01 -> 02 around 0.33
      tl.to(layerARef.current, { opacity: 0, scale: 1.06, duration: 0.25 }, 0.25);
      tl.fromTo(
        layerBRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.25 },
        0.3,
      );
      tl.to(stepNodes[0], { opacity: 0.3, duration: 0.15 }, 0.3);
      tl.to(stepNodes[1], { opacity: 1, duration: 0.2 }, 0.3);

      // --- 0.66: Week 02 -> Week 03 ---
      tl.to(layerBRef.current, { opacity: 0, scale: 1.05, duration: 0.25 }, 0.6);
      tl.fromTo(
        layerCRef.current,
        { opacity: 0, scale: 0.96 },
        { opacity: 1, scale: 1, duration: 0.25 },
        0.65,
      );
      tl.to(stepNodes[1], { opacity: 0.3, duration: 0.15 }, 0.65);
      tl.to(stepNodes[2], { opacity: 1, duration: 0.2 }, 0.65);

      // Progress bar grows over the full scrub
      if (progressRef.current) {
        gsap.fromTo(
          progressRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            transformOrigin: 'top center',
            scrollTrigger: {
              trigger: pinRef.current,
              start: 'top top',
              end: '+=300%',
              scrub: 1,
            },
          },
        );
      }
    }, sectionRef);

    return () => ctx.revert();
  }, [i18n.language]);

  return (
    <section ref={sectionRef} id="process" aria-label="Process" className="relative">
      {/* Header */}
      <div className="mx-auto max-w-400 px-6 pt-32 pb-12 lg:px-10 lg:pt-40 lg:pb-16">
        <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-cyan">
          {t('process.eyebrow')}
        </span>
        <h2
          ref={titleRef}
          className="mt-5 font-display text-[clamp(2rem,7vw,6rem)] leading-none tracking-[-0.04em] text-white"
        >
          {t('process.title')}{' '}
          <span className="text-gradient">{t('process.titleAccent')}</span>
        </h2>
        <p
          ref={ledeRef}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-muted"
        >
          {t('process.lede')}
        </p>
      </div>

      {/* Pinned cinematic scene (desktop) — flows vertically on mobile */}
      <div
        ref={pinRef}
        className="relative w-full overflow-hidden lg:h-screen"
      >
        {/* Ambient backdrop: grid + radial glows */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0">
          <div
            className="absolute inset-0 opacity-[0.5]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)',
              backgroundSize: '64px 64px',
              maskImage:
                'radial-gradient(ellipse 80% 60% at 50% 50%, #000 30%, transparent 75%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 60% at 50% 50%, #000 30%, transparent 75%)',
            }}
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(600px 320px at 22% 35%, rgba(0,229,255,0.10), transparent 65%), radial-gradient(620px 360px at 80% 70%, rgba(168,85,247,0.10), transparent 65%)',
            }}
          />
          <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/8 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-white/6 to-transparent" />
        </div>

        <div className="relative mx-auto grid h-full max-w-400 gap-10 px-6 pb-20 lg:grid-cols-[1.15fr_1fr] lg:gap-10 lg:px-10 lg:pb-10 lg:pt-16">
          {/* LEFT — product mock with 3 crossfading layers + telemetry */}
          <div className="relative flex h-[70vh] w-full flex-col gap-6 lg:h-auto">
            <div className="relative flex-1">
              {/* Layer A — Wireframe */}
              <div
                ref={layerARef}
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
              >
                <WireframeMock />
              </div>
              {/* Layer B — Prototype */}
              <div
                ref={layerBRef}
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
              >
                <PrototypeMock />
              </div>
              {/* Layer C — Live */}
              <div
                ref={layerCRef}
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center"
              >
                <LiveMock />
              </div>
            </div>

            {/* Metrics strip below the mock */}
            <div className="relative hidden grid-cols-3 gap-3 lg:grid">
              {metrics.map((m) => (
                <div
                  key={m.label}
                  className="relative overflow-hidden rounded-xl border border-white/7 bg-white/1.5 p-3 backdrop-blur-sm"
                >
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/12 to-transparent"
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[9px] uppercase tracking-[0.22em] text-white/35">
                      {m.label}
                    </span>
                    <Activity size={11} strokeWidth={1.5} className="text-accent-cyan/70" aria-hidden="true" />
                  </div>
                  <div className="mt-1.5 font-display text-2xl tabular-nums text-white">
                    {m.value}
                  </div>
                  <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-300/75">
                    {m.delta}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT — step entries + premium modules */}
          <div ref={stepsWrapRef} className="relative flex flex-col">
            {/* Vertical progress rail */}
            <div className="pointer-events-none absolute -left-1 top-2 hidden h-[calc(100%-1rem)] w-px bg-white/10 lg:block">
              <div
                ref={progressRef}
                className="h-full w-px bg-linear-to-b from-accent-cyan via-accent-cyan to-accent-violet"
                style={{ transformOrigin: 'top center' }}
              />
            </div>

            <ol className="space-y-10 lg:space-y-12 lg:pl-8">
              {steps.map((step) => (
                <li
                  key={step.label}
                  className="process-step transition-opacity duration-500"
                >
                  <span className="font-mono text-[11px] uppercase tracking-[0.28em] text-accent-cyan">
                    {step.label}
                  </span>
                  <h3 className="mt-3 font-display text-2xl tracking-[-0.02em] text-white md:text-3xl lg:text-[2rem]">
                    {step.title}
                  </h3>
                  <p className="mt-3 max-w-md text-base leading-relaxed text-muted">
                    {step.body}
                  </p>
                </li>
              ))}
            </ol>

            {/* Terminal / build log — fills empty right-side area */}
            <div className="mt-10 hidden lg:ml-8 lg:block">
              <TerminalPanel
                label={t('processExtras.terminalLabel')}
                host={t('processExtras.terminalHost')}
                lines={terminalLines}
              />
            </div>

            {/* Status dock */}
            <div className="mt-4 hidden items-center justify-between rounded-xl border border-white/7 bg-white/1.5 px-4 py-3 lg:ml-8 lg:flex">
              <div className="flex items-center gap-3">
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/60" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/70">
                  {t('processExtras.statusOk')}
                </span>
              </div>
              <div className="flex items-center gap-4 font-mono text-[10px] uppercase tracking-[0.2em] text-white/40">
                <span className="flex items-center gap-1.5">
                  <Signal size={11} strokeWidth={1.5} aria-hidden="true" />
                  {t('processExtras.statusLatency')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Cpu size={11} strokeWidth={1.5} aria-hidden="true" />
                  {t('processExtras.statusRegion')}
                </span>
              </div>
            </div>

            {/* Stack chips */}
            <div className="mt-4 hidden flex-wrap items-center gap-2 lg:ml-8 lg:flex">
              <span className="font-mono text-[9px] uppercase tracking-[0.24em] text-white/30">
                {t('processExtras.stackLabel')}
              </span>
              {stack.map((s) => (
                <span
                  key={s}
                  className="rounded-full border border-white/8 bg-white/2 px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] text-white/70"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- premium right-side terminal -------------------- */

function TerminalPanel({
  label,
  host,
  lines,
}: {
  label: string;
  host: string;
  lines: string[];
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-white/7 bg-black/40 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-white/12 to-transparent"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-50"
        style={{
          background:
            'radial-gradient(400px 200px at 90% 0%, rgba(0,229,255,0.06), transparent 70%)',
        }}
      />
      {/* header bar */}
      <div className="relative flex items-center justify-between border-b border-white/6 px-3 py-2">
        <div className="flex items-center gap-2">
          <Terminal size={12} strokeWidth={1.75} className="text-white/50" aria-hidden="true" />
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/55">
            {label}
          </span>
        </div>
        <span className="font-mono text-[10px] tracking-[0.08em] text-white/30">
          {host}
        </span>
      </div>
      {/* body */}
      <div className="relative px-4 py-3 font-mono text-[11px] leading-relaxed text-white/75">
        {lines.map((line, i) => {
          const isPass = line.startsWith('✓');
          const isArrow = line.startsWith('→');
          const isPrompt = line.startsWith('$');
          return (
            <div
              key={i}
              className={`whitespace-pre ${
                isPass
                  ? 'text-emerald-300/85'
                  : isArrow
                    ? 'text-accent-cyan/85'
                    : isPrompt
                      ? 'text-white/85'
                      : 'text-white/65'
              }`}
            >
              {line}
              {i === lines.length - 1 && (
                <span className="ml-0 inline-block h-3 w-1.5 translate-y-0.5 animate-pulse bg-white/80 align-middle" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* -------------------- mock layers -------------------- */

function WireframeMock() {
  return (
    <div className="relative aspect-4/3 w-full max-w-170 rounded-2xl border border-white/15 bg-bg-elev/40 p-6 shadow-[0_30px_80px_-30px_rgba(0,0,0,0.6)]">
      <div className="mb-4 flex items-center gap-1.5">
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
        <span className="h-2 w-2 rounded-full bg-white/15" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-1/3 rounded-sm border border-white/15" />
        <div className="h-3 w-2/3 rounded-sm border border-white/12" />
      </div>
      <div className="mt-6 grid grid-cols-3 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square rounded-md border border-dashed border-white/15"
          />
        ))}
      </div>
      <div className="absolute right-5 top-5 font-mono text-[10px] uppercase tracking-[0.22em] text-white/40">
        wire
      </div>
    </div>
  );
}

function PrototypeMock() {
  return (
    <div className="relative aspect-4/3 w-full max-w-180 rounded-2xl border border-white/12 bg-bg-elev/80 p-6 shadow-[0_40px_100px_-40px_rgba(0,229,255,0.25)] backdrop-blur">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-cyan/60" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-2">
          prototype
        </span>
      </div>
      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        {/* Chart panel */}
        <div className="rounded-lg border border-white/10 bg-white/3 p-3">
          <div className="mb-2 h-2 w-1/2 rounded bg-white/20" />
          <div className="flex h-24 items-end gap-1.5">
            {[40, 70, 55, 90, 65, 80, 50].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-linear-to-t from-accent-cyan/70 to-accent-violet/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        {/* Chat panel */}
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/3 p-3">
          <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-white/10 px-3 py-2 text-[10px] text-white/70">
            Pull last quarter's churn cohort
          </div>
          <div className="max-w-[80%] rounded-lg rounded-tl-sm bg-accent-cyan/15 px-3 py-2 text-[10px] text-white/80">
            Running query on cohort_v2…
          </div>
          <div className="max-w-[90%] rounded-lg rounded-tl-sm bg-accent-violet/15 px-3 py-2 text-[10px] text-white/80">
            12 accounts dropped after day 14 — 7 are SMB.
          </div>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3">
        <div className="rounded-md border border-white/10 bg-white/3 p-3">
          <div className="h-1.5 w-2/3 rounded bg-white/20" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-white/12" />
        </div>
        <div className="rounded-md border border-white/10 bg-white/3 p-3">
          <div className="h-1.5 w-1/2 rounded bg-white/20" />
          <div className="mt-2 h-1.5 w-2/3 rounded bg-white/12" />
        </div>
        <div className="rounded-md border border-accent-cyan/30 bg-accent-cyan/10 p-3">
          <div className="h-1.5 w-3/4 rounded bg-accent-cyan/70" />
          <div className="mt-2 h-1.5 w-1/2 rounded bg-accent-cyan/40" />
        </div>
      </div>
    </div>
  );
}

function LiveMock() {
  return (
    <div className="relative aspect-4/3 w-full max-w-185 rounded-2xl border border-accent-cyan/25 bg-bg-elev/90 p-6 shadow-[0_50px_120px_-30px_rgba(0,229,255,0.45),0_30px_80px_-30px_rgba(168,85,247,0.35)] backdrop-blur">
      {/* LIVE pill */}
      <div className="absolute -top-3 left-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-emerald-300">
        <span className="relative inline-flex h-1.5 w-1.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400/70" />
          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-300" />
        </span>
        live
      </div>

      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-white/60">
          prod.zian-ai.dev
        </span>
      </div>

      <div className="grid grid-cols-[1fr_1.4fr] gap-4">
        <div className="rounded-lg border border-white/10 bg-white/4 p-3">
          <div className="mb-2 flex items-center justify-between">
            <div className="h-2 w-1/2 rounded bg-white/30" />
            <span className="font-mono text-[9px] uppercase tracking-[0.18em] text-emerald-300/80">
              +18%
            </span>
          </div>
          <div className="flex h-24 items-end gap-1.5">
            {[60, 80, 70, 95, 75, 90, 85].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-linear-to-t from-accent-cyan to-accent-violet shadow-[0_0_12px_rgba(0,229,255,0.45)]"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="space-y-2 rounded-lg border border-white/10 bg-white/4 p-3">
          <div className="ml-auto max-w-[80%] rounded-lg rounded-tr-sm bg-white/15 px-3 py-2 text-[10px] text-white/85">
            How fast can we ship V2?
          </div>
          <div className="max-w-[90%] rounded-lg rounded-tl-sm bg-linear-to-br from-accent-cyan/25 to-accent-violet/25 px-3 py-2 text-[10px] text-white/95">
            Two weeks. I'll have a working version Friday.
            <span className="ml-1 inline-block h-2 w-1 translate-y-0.5 animate-pulse bg-white/90" />
          </div>
          <div className="max-w-[80%] rounded-lg rounded-tr-sm bg-white/10 px-3 py-2 text-[10px] text-white/70">
            User: "This is exactly what we needed."
          </div>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.2em] text-white/45">
        <span>03 users · 41 events · 0 errors</span>
        <span className="text-accent-cyan/80">shipped</span>
      </div>
    </div>
  );
}
