import { getLenis } from './smoothScroll';
import { prefersReducedMotion } from './animations';

/**
 * Vertical offset applied when scrolling to anchored sections so the sticky
 * header (h-16 = 64px) doesn't cover the target heading. Single source of
 * truth — `App.tsx`'s deep-link refresh and `scroll-mt-*` Tailwind utilities
 * mirror this value.
 */
export const HEADER_OFFSET_PX = -64;

type ScrollToSectionOpts = {
  /** Offset from the top of the target, in px. Defaults to {@link HEADER_OFFSET_PX}. */
  offset?: number;
  /** Lenis tween duration in seconds. */
  duration?: number;
  /** Update the URL hash via `history.replaceState`. */
  updateHash?: boolean;
};

/**
 * Smooth-scroll to a section by id. Uses Lenis when available and reduced
 * motion is not requested, otherwise falls back to the native scroll API.
 *
 * Returns the resolved target element, or `null` if no element matched `id`.
 */
export function scrollToSection(id: string, opts: ScrollToSectionOpts = {}): HTMLElement | null {
  const target = document.getElementById(id);
  if (!target) return null;

  const reduced = prefersReducedMotion();
  const lenis = reduced ? null : getLenis();
  const offset = opts.offset ?? HEADER_OFFSET_PX;

  if (lenis) {
    lenis.scrollTo(target, { offset, duration: opts.duration ?? 1.2 });
  } else {
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
  }

  if (opts.updateHash !== false) {
    history.replaceState(null, '', `#${id}`);
  }
  return target;
}
