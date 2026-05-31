import { Fragment, type ReactNode, type RefObject } from 'react';
import { scrollToSection } from '../../lib/scrollToSection';
import Aura from '../Aura';

export type StickyStoryItem = {
  /** Stable key for the React list. */
  key: string;
  /** Anchor id rendered as `id` on the article + `href="#…"` on the mini-index. */
  anchorId: string;
  /** Short ordinal (e.g. "01"). Rendered both in the mini-index and the article header. */
  index: string;
  /** Display title. */
  title: string;
};

type Props<T extends StickyStoryItem> = {
  /** Section root id (`#capabilities`, `#process`). */
  sectionId: string;
  /** Heading id matched by `aria-labelledby` on the section and `id` on the h2 inside `renderHeader`. */
  headingId: string;
  /** Aria label for the mini-index `<nav>`. */
  miniIndexLabel: string;
  /** Currently active item key — drives the `data-active` highlight. */
  activeKey: string;
  /** Items rendered both in the mini-index and as article rows. */
  items: readonly T[];
  /** `dataset` attribute key matching `useActiveSection({ dataKey })`. */
  articleDataKey: 'slug' | 'stepIndex';
  /** Maps an item to the `dataset` value used by the IntersectionObserver. */
  articleDataValue: (item: T) => string;
  /** Refs collector for the article elements (used by `useActiveSection`). */
  articlesRef: RefObject<(HTMLElement | null)[]>;
  /** Outer section ref — handed to GSAP `useGSAP({ scope })` by the caller. */
  sectionRef: RefObject<HTMLElement | null>;
  /** Header column ref — gets the reveal animation. */
  headerRef: RefObject<HTMLDivElement | null>;
  /** Render the sticky-column eyebrow/headline/intro block. */
  renderHeader: () => ReactNode;
  /** Render the article body below the index header on each row. */
  renderArticleBody: (item: T) => ReactNode;
  /** Optional desktop CTA (rendered under the mini-index, hidden below md). */
  desktopCta?: ReactNode;
  /** Optional mobile CTA (rendered as a grid sibling below the articles). */
  mobileCta?: ReactNode;
  /** Override the outer `<section>` className. */
  className?: string;
  /** Override the header-column className (e.g. when the section needs extra top padding). */
  headerClassName?: string;
  /**
   * Mirror the desktop layout: articles on the left, sticky sidebar on the
   * right. DOM/reading order is unchanged (heading-first) — only the grid
   * column placement flips, so the two sister sections read distinctly.
   */
  mirror?: boolean;
  /** Optional atmospheric plasma glow tint for depth behind the section. */
  auraColor?: 'lime' | 'cyan' | 'indigo';
};

const DEFAULT_HEADER_CLS = 'flex flex-col gap-6';

/**
 * Generic sticky-mini-index story list used by `Capabilities` and `Process`.
 * Owns the grid layout, mini-index navigation, article rendering and scroll
 * behaviour — the caller supplies content + ref plumbing for GSAP/IO hooks.
 */
export default function StickyStoryList<T extends StickyStoryItem>({
  sectionId,
  headingId,
  miniIndexLabel,
  activeKey,
  items,
  articleDataKey,
  articleDataValue,
  articlesRef,
  sectionRef,
  headerRef,
  renderHeader,
  renderArticleBody,
  desktopCta,
  mobileCta,
  className,
  headerClassName = DEFAULT_HEADER_CLS,
  mirror = false,
  auraColor,
}: Props<T>) {
  // When mirrored, pin the sticky column to the right 5 cols and the articles
  // to the left 7 — explicit col-start keeps both in the same grid row despite
  // the unchanged (heading-first) DOM order.
  const sidebarColCls = mirror ? 'md:col-span-5 md:col-start-8 md:row-start-1' : 'md:col-span-5';
  const articlesColCls = mirror ? 'md:col-span-7 md:col-start-1 md:row-start-1' : 'md:col-span-7';
  const handleAnchorClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    scrollToSection(id, { duration: 1.0 });
  };

  return (
    <section
      ref={sectionRef}
      id={sectionId}
      aria-labelledby={headingId}
      className={className}
    >
      {auraColor && (
        <Aura
          color={auraColor}
          className={`h-[480px] w-[480px] top-[8%] ${mirror ? '-right-40' : '-left-40'}`}
        />
      )}
      <div className="relative mx-auto grid max-w-400 grid-cols-1 gap-x-12 gap-y-16 md:grid-cols-12">
        <div className={`${sidebarColCls} md:sticky md:top-[clamp(6rem,12vh,9rem)] md:self-start`}>
          <div ref={headerRef} className={headerClassName}>
            {renderHeader()}
          </div>

          <nav
            aria-label={miniIndexLabel}
            className="mt-12 hidden border-t border-border pt-8 md:block"
          >
            <ol className="flex flex-col gap-1">
              {items.map((it) => {
                const isActive = activeKey === it.key;
                return (
                  <li key={it.key}>
                    <a
                      href={`#${it.anchorId}`}
                      data-active={isActive}
                      aria-current={isActive ? 'true' : undefined}
                      onClick={(e) => handleAnchorClick(e, it.anchorId)}
                      className="group flex items-center gap-4 py-2 text-muted transition-colors duration-200 hover:text-fg data-[active=true]:text-fg"
                    >
                      <span
                        aria-hidden
                        className="block h-1.5 w-1.5 rounded-full bg-muted/30 transition-all duration-200 group-hover:bg-muted group-data-[active=true]:bg-plasma-lime group-data-[active=true]:shadow-(--shadow-glow-lime)"
                      />
                      <span className="font-mono text-xs tracking-widest text-plasma-lime/70 transition-colors duration-200 group-data-[active=true]:text-plasma-lime">
                        {it.index}
                      </span>
                      <span className="font-display text-base md:text-lg">{it.title}</span>
                    </a>
                  </li>
                );
              })}
            </ol>
          </nav>

          {desktopCta && <div className="mt-10 hidden md:block">{desktopCta}</div>}
        </div>

        <div className={`${articlesColCls} flex flex-col`}>
          {items.map((it, i) => {
            const dataValue = articleDataValue(it);
            const dataAttrs =
              articleDataKey === 'slug'
                ? { 'data-slug': dataValue }
                : { 'data-step-index': dataValue };
            return (
              <Fragment key={it.key}>
                {i > 0 && <div aria-hidden="true" className="rule-fade" />}
                <article
                  id={it.anchorId}
                  ref={(el) => {
                    if (articlesRef.current) articlesRef.current[i] = el;
                  }}
                  aria-labelledby={`${it.anchorId}-title`}
                  className="group/article relative isolate flex scroll-mt-[clamp(6rem,12vh,9rem)] flex-col justify-start gap-6 overflow-hidden py-12 md:gap-7 md:py-24"
                  {...dataAttrs}
                >
                  {/* Oversized ghost index — editorial depth behind the content. */}
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none absolute top-6 -z-10 select-none font-display text-[6.5rem] leading-none tabular-nums text-fg/[0.04] transition-colors duration-500 group-hover/article:text-fg/[0.07] md:top-12 md:text-[10rem] ${
                      mirror ? 'left-0' : 'right-0'
                    }`}
                  >
                    {it.index}
                  </span>
                  {renderArticleBody(it)}
                </article>
              </Fragment>
            );
          })}
        </div>

        {mobileCta && <div className="md:hidden">{mobileCta}</div>}
      </div>
    </section>
  );
}
