import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useMagnet } from '../../lib/useMagnet';
import { revealWordsOnScroll } from '../../lib/animations';

export default function Contact() {
  const { t } = useTranslation();
  const mailRef = useMagnet<HTMLAnchorElement>(0.25);
  const headlineRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    if (headlineRef.current) {
      revealWordsOnScroll(headlineRef.current, { start: 'top 80%', end: 'bottom 50%', scrub: 0.6 });
    }
  }, []);

  return (
    <section id="contact" className="relative px-6 pb-16 pt-40 md:px-10 md:pb-24 md:pt-56">
      <div className="mx-auto max-w-[1600px]">
        <div className="tag mb-6">{t('contact.eyebrow')}</div>
        <h2 ref={headlineRef} className="font-display text-display-xl">
          {t('contact.title')}
        </h2>

        <div className="mt-20 flex flex-col items-start justify-between gap-12 md:flex-row md:items-end">
          <a
            ref={mailRef}
            href={`mailto:${t('contact.email')}`}
            className="group relative inline-flex items-center gap-4 rounded-full border border-[var(--color-border-strong)] px-8 py-5 text-lg transition-colors duration-300 hover:border-[var(--color-plasma-lime)] hover:text-[var(--color-plasma-lime)] md:px-10 md:py-6 md:text-2xl"
          >
            <span className="font-mono">{t('contact.email')}</span>
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-plasma-lime)] text-[var(--color-bg)] transition-transform duration-500 group-hover:rotate-45 md:h-12 md:w-12">
              <svg width="18" height="18" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                <path d="M1 13L13 1M13 1H3M13 1v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </span>
          </a>

          <div className="flex flex-col gap-2 md:items-end">
            <div className="tag mb-2">{t('contact.socials')}</div>
            <a className="hover:text-[var(--color-plasma-lime)]" href="https://github.com" target="_blank" rel="noopener noreferrer">GitHub ↗</a>
            <a className="hover:text-[var(--color-plasma-lime)]" href="https://x.com" target="_blank" rel="noopener noreferrer">X / Twitter ↗</a>
            <a className="hover:text-[var(--color-plasma-lime)]" href="https://www.linkedin.com" target="_blank" rel="noopener noreferrer">LinkedIn ↗</a>
          </div>
        </div>
      </div>
    </section>
  );
}
