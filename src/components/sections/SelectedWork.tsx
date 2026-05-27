import { useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { horizontalScroll } from '../../lib/animations';
import { ScrollTrigger } from '../../lib/gsap';

type RawCase = {
  index: string;
  title: string;
  tag: string;
  year: string;
  blurb: string;
};

type Case = RawCase & {
  palette: [string, string];
  href?: string;
  thumb?: string;
};

const PALETTES: Record<string, [string, string]> = {
  '01': ['#a3ff12', '#06b6d4'],
  '02': ['#06b6d4', '#6366f1'],
  '03': ['#6366f1', '#a3ff12'],
  '04': ['#a3ff12', '#6366f1'],
  '05': ['#06b6d4', '#a3ff12'],
};

const FALLBACK_PALETTE: [string, string] = ['#6366f1', '#a3ff12'];

export default function SelectedWork() {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const rawCases = t('work.cases', { returnObjects: true }) as RawCase[];

  const cases = useMemo<Case[]>(
    () =>
      rawCases.map((c) => ({
        ...c,
        palette: PALETTES[c.index] ?? FALLBACK_PALETTE,
        thumb: undefined,
        href: undefined,
      })),
    [rawCases],
  );

  useLayoutEffect(() => {
    if (!viewportRef.current || !trackRef.current) return;
    const st = horizontalScroll(viewportRef.current, trackRef.current, { snap: true });

    // Nice-to-have: refresh ScrollTrigger once any thumbnail images finish decoding,
    // so the pinned track has correct measurements even when content loads async.
    const imgs = viewportRef.current.querySelectorAll('img');
    if (imgs.length > 0) {
      const promises = Array.from(imgs).map((img) => img.decode().catch(() => {}));
      void Promise.all(promises).then(() => ScrollTrigger.refresh());
    }

    return () => {
      st?.kill();
    };
  }, [cases]);

  const totalLabel = String(cases.length).padStart(2, '0');

  return (
    <section id="work" className="relative">
      <div className="px-6 pb-20 pt-32 md:px-10">
        <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-8">
          <div>
            <div className="tag mb-4">{t('work.eyebrow')}</div>
            <h2 className="font-display text-display-lg">{t('work.title')}</h2>
          </div>
          <p className="lead hidden max-w-sm md:block">{t('work.intro')}</p>
        </div>
      </div>

      <div ref={viewportRef} className="relative h-[100svh] overflow-hidden">
        <div ref={trackRef} className="flex h-full items-center gap-6 px-6 will-change-transform md:gap-10 md:px-10">
          {cases.map((c) => {
            const cardStyle = {
              background: `linear-gradient(135deg, ${c.palette[0]} 0%, ${c.palette[1]} 100%)`,
            };

            const inner = (
              <>
                {c.thumb ? (
                  <img
                    src={c.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(5,5,7,0.85)_0%,rgba(5,5,7,0.0)_60%)]" />
                <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%222%22%2F%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]" />
                <div className="relative flex h-full flex-col justify-between p-8 md:p-12">
                  <div className="flex items-center justify-between">
                    <span className="tag !text-white/80">
                      {c.index} / {totalLabel}
                    </span>
                    <span className="tag !text-white/80">{c.year}</span>
                  </div>
                  <div>
                    <div className="tag !text-white/80 mb-3">{c.tag}</div>
                    <h3 className="font-display text-4xl text-white md:text-6xl">{c.title}</h3>
                    <p className="mt-2 text-sm text-white/70 md:text-base">{c.blurb}</p>
                    {!c.href ? (
                      <div className="tag !text-white/50 border border-white/20 mt-2 inline-block">
                        {t('work.onRequest')}
                      </div>
                    ) : null}
                  </div>
                </div>
              </>
            );

            return (
              <article
                key={c.index}
                className="relative h-[72vh] w-[78vw] flex-shrink-0 overflow-hidden rounded-[28px] md:w-[58vw] lg:w-[44vw]"
                style={cardStyle}
              >
                {c.href ? (
                  <a
                    href={c.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-full"
                  >
                    {inner}
                  </a>
                ) : (
                  inner
                )}
              </article>
            );
          })}
          <div className="flex h-[72vh] w-[60vw] flex-shrink-0 flex-col justify-center pr-10">
            <div className="tag mb-3">{t('work.endTag')}</div>
            <p className="font-display text-3xl md:text-5xl">{t('work.endLine')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
