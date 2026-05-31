import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { marquee } from '../../lib/animations';

const TOOLS = [
  'React',
  'Three.js',
  'GSAP',
  'TypeScript',
  'Vite',
  'Tailwind',
  'WebGL',
  'GLSL',
  'Claude',
  'Anthropic',
  'Python',
  'Rust',
  'Figma',
  'Blender',
];

export default function Marquee() {
  const { t } = useTranslation();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;
    const m = marquee(trackRef.current, { speed: 70, direction: -1 });
    return () => m.kill();
  }, []);

  const items = [...TOOLS, ...TOOLS];

  return (
    <section id="stack" className="relative overflow-hidden border-y border-border py-10 md:py-16">
      <div className="mx-auto mb-6 max-w-400 px-6 md:px-10">
        <div className="tag">{t('marquee.eyebrow')}</div>
      </div>
      <div className="relative w-full overflow-hidden [-webkit-mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)] [mask-image:linear-gradient(to_right,transparent,black_8%,black_92%,transparent)]">
        <div ref={trackRef} className="flex w-max items-center gap-12 whitespace-nowrap will-change-transform md:gap-20">
          {items.map((label, i) => (
            <div key={i} className="flex items-center gap-12 md:gap-20">
              <span className="font-display text-5xl text-fg/60 transition-colors duration-300 hover:text-fg md:text-7xl">{label}</span>
              <span className="inline-block h-2 w-2 rotate-45 bg-plasma-lime" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
