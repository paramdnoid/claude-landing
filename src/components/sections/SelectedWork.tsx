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
  '01': ['#c0392b', '#e74c3c'],
  '02': ['#1a0f06', '#c8860a'],
  '03': ['#d4c4a8', '#9b7a52'],
  '04': ['#1a2e1a', '#2d6a2d'],
  '05': ['#2d1b69', '#8b5cf6'],
};

const THUMBS: Record<string, string> = {
  '01': '/work/personalengel.jpg',
  '02': '/work/suprium.png',
  '03': '/work/fiecon.png',
  '04': '/work/lastizun.jpg',
  '05': '/work/nanas.png',
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
        thumb: THUMBS[c.index],
        href: undefined,
      })),
    [rawCases],
  );

  useLayoutEffect(() => {
    if (viewportRef.current === null || trackRef.current === null) return;
    const st = horizontalScroll(viewportRef.current, trackRef.current, { snap: true });

    const imgs = viewportRef.current.querySelectorAll('img');
    if (imgs.length > 0) {
      const promises = Array.from(imgs).map((img) => img.decode().catch(() => {}));
      void Promise.all(promises).then(() => ScrollTrigger.refresh());
    }

    return () => {
      st?.kill();
    };
  }, [cases]);

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

            const contentInner = (
              <>
                {c.thumb ? (
                  <img
                    src={c.thumb}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 h-full w-full object-cover object-top"
                  />
                ) : null}
                <div className="absolute inset-0 bg-[linear-gradient(to_top,rgba(5,5,7,0.92)_0%,rgba(5,5,7,0.4)_50%,rgba(5,5,7,0.1)_100%)]" />
                <div className="absolute inset-0 mix-blend-overlay opacity-20 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%222%22%2F%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]" />
                <div className="relative flex h-full flex-col justify-end p-8 md:p-12">
                  <div>
                    <div className="tag !text-white/70 mb-3">{c.tag}</div>
                    <h3 className="font-display text-4xl text-white md:text-6xl">{c.title}</h3>
                    <p className="mt-2 text-sm text-white/70 md:text-base">{c.blurb}</p>
                    {c.href === undefined ? (
                      <div className="tag !text-white/40 border border-white/15 mt-3 inline-block rounded-full px-3 py-1">
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
                className="flex flex-col relative h-[72vh] w-[78vw] flex-shrink-0 overflow-hidden rounded-[28px] md:w-[58vw] lg:w-[44vw]"
              >
                {/* Browser chrome titlebar */}
                <div className="relative z-10 flex h-10 flex-shrink-0 items-center border-b border-white/[0.08] bg-[#0d0d0f]/85 px-4 backdrop-blur-sm">
                  <div className="flex items-center gap-[6px]" aria-hidden="true">
                    <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
                    <span className="h-3 w-3 rounded-full bg-[#FFBD2E]" />
                    <span className="h-3 w-3 rounded-full bg-[#28C840]" />
                  </div>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="tag !text-white/40">{c.title}</span>
                  </div>
                  <span className="tag !text-white/30 ml-auto">{c.year}</span>
                </div>

                {/* Content area */}
                <div className="relative flex-1 overflow-hidden" style={cardStyle}>
                  {c.href ? (
                    <a
                      href={c.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full"
                    >
                      {contentInner}
                    </a>
                  ) : (
                    contentInner
                  )}
                </div>
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
