import { getLenis } from './smoothScroll';
import { prefersReducedMotion } from './animations';

type ScrollToSectionOpts = {
  /** Offset from the top of the target, in px. Defaults to the header height. */
  offset?: number;
  /** Lenis tween duration in seconds. */
  duration?: number;
  /** Update the URL hash via `history.replaceState`. */
  updateHash?: boolean;
};

const HEADER_OFFSET = -64;

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
  const offset = opts.offset ?? HEADER_OFFSET;

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
