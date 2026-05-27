import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { horizontalScroll } from '../../lib/animations';

type Case = {
  index: string;
  title: string;
  tag: string;
  year: string;
  palette: [string, string];
};

const CASES: Case[] = [
  { index: '01', title: 'Neural Compositions', tag: 'AI · Generative Audio', year: '2026', palette: ['#a3ff12', '#06b6d4'] },
  { index: '02', title: 'Synthetic Studio', tag: 'AI · Brand System', year: '2025', palette: ['#06b6d4', '#6366f1'] },
  { index: '03', title: 'Atlas of Latent Space', tag: 'WebGL · R&D', year: '2025', palette: ['#6366f1', '#a3ff12'] },
  { index: '04', title: 'Quiet Machines', tag: 'AI · Interface', year: '2024', palette: ['#a3ff12', '#6366f1'] },
  { index: '05', title: 'Soft Protocol', tag: 'Creative Tech · Concept', year: '2024', palette: ['#06b6d4', '#a3ff12'] },
];

export default function SelectedWork() {
  const { t } = useTranslation();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!viewportRef.current || !trackRef.current) return;
    const st = horizontalScroll(viewportRef.current, trackRef.current, { snap: true });
    return () => { st?.kill(); };
  }, []);

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
          {CASES.map((c) => (
            <article
              key={c.index}
              className="relative h-[72vh] w-[78vw] flex-shrink-0 overflow-hidden rounded-[28px] md:w-[58vw] lg:w-[44vw]"
              style={{
                background: `linear-gradient(135deg, ${c.palette[0]} 0%, ${c.palette[1]} 100%)`,
              }}
            >
              <div className="absolute inset-0 bg-[radial-gradient(120%_80%_at_50%_120%,rgba(5,5,7,0.85)_0%,rgba(5,5,7,0.0)_60%)]" />
              <div className="absolute inset-0 mix-blend-overlay opacity-30 bg-[url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22200%22%20height%3D%22200%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.85%22%20numOctaves%3D%222%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')]" />
              <div className="relative flex h-full flex-col justify-between p-8 md:p-12">
                <div className="flex items-center justify-between">
                  <span className="tag !text-white/80">{c.index} / {String(CASES.length).padStart(2, '0')}</span>
                  <span className="tag !text-white/80">{c.year}</span>
                </div>
                <div>
                  <div className="tag !text-white/80 mb-3">{c.tag}</div>
                  <h3 className="font-display text-4xl text-white md:text-6xl">{c.title}</h3>
                </div>
              </div>
            </article>
          ))}
          <div className="flex h-[72vh] w-[60vw] flex-shrink-0 flex-col justify-center pr-10">
            <div className="tag mb-3">{t('work.endTag')}</div>
            <p className="font-display text-3xl md:text-5xl">{t('work.endLine')}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
