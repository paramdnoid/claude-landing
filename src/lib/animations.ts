import { gsap, ScrollTrigger } from './gsap';

if (typeof document !== 'undefined') {
  void document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * GSAP-side motion rhythm — mirrors the `--ease-*` / `--dur-*` design tokens in
 * globals.css so JS animations and CSS transitions share one feel. GSAP cannot
 * read CSS custom properties, so we duplicate the values here intentionally.
 */
export const EASE = {
  outExpo: 'expo.out',
  outQuint: 'power4.out',
  inOutSoft: 'power2.inOut',
} as const;

export const DUR = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
} as const;

/**
 * Splits an element's text into word + char spans for stagger animations.
 * Returns array of char spans for tweening. Idempotent via `data-split`.
 *
 * Note: the original text node is replaced by spans. If the React tree later
 * tries to update the same element's text content, mount the element with a
 * fresh `key` (e.g. `key={i18n.language}`) or remount the surrounding subtree
 * so React rebuilds the children from scratch. `PageTransition`'s
 * `key={pathname}` covers the locale-switch case in this app.
 */
export function splitText(el: HTMLElement): HTMLSpanElement[] {
  if (el.dataset.split === 'done') {
    return Array.from(el.querySelectorAll<HTMLSpanElement>('.char'));
  }
  const chars: HTMLSpanElement[] = [];

  const splitNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((token) => {
        if (token === '') return;
        if (/^\s+$/.test(token)) {
          frag.appendChild(document.createTextNode(token));
          return;
        }
        const wordEl = document.createElement('span');
        wordEl.className = 'word';
        wordEl.style.display = 'inline-block';
        [...token].forEach((c) => {
          const ch = document.createElement('span');
          ch.className = 'char';
          ch.style.display = 'inline-block';
          ch.textContent = c;
          wordEl.appendChild(ch);
          chars.push(ch);
        });
        frag.appendChild(wordEl);
      });
      parent.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach((child) => splitNode(child, node as HTMLElement));
    }
  };

  Array.from(el.childNodes).forEach((child) => splitNode(child, el));
  el.dataset.split = 'done';
  return chars;
}

/**
 * Split text into word spans only (not chars). Faster + better for long passages.
 * Each word is wrapped in a `.reveal-mask` so transforms can clip cleanly.
 */
export function splitWords(el: HTMLElement): HTMLSpanElement[] {
  if (el.dataset.splitWords === 'done') {
    return Array.from(el.querySelectorAll<HTMLSpanElement>('.word'));
  }
  const words: HTMLSpanElement[] = [];
  const splitNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const frag = document.createDocumentFragment();
      text.split(/(\s+)/).forEach((token) => {
        if (token === '') return;
        if (/^\s+$/.test(token)) {
          frag.appendChild(document.createTextNode(token));
          return;
        }
        const mask = document.createElement('span');
        mask.className = 'reveal-mask';
        const wordEl = document.createElement('span');
        wordEl.className = 'word';
        wordEl.textContent = token;
        mask.appendChild(wordEl);
        frag.appendChild(mask);
        words.push(wordEl);
      });
      parent.replaceChild(frag, node);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      Array.from(node.childNodes).forEach((child) => splitNode(child, node as HTMLElement));
    }
  };
  Array.from(el.childNodes).forEach((child) => splitNode(child, el));
  el.dataset.splitWords = 'done';
  return words;
}

/**
 * Word-by-word reveal on scroll (scrubbed). For manifesto-style sections.
 */
export function revealWordsOnScroll(
  el: HTMLElement,
  opts: { trigger?: HTMLElement; start?: string; end?: string; scrub?: boolean | number } = {},
): gsap.core.Tween {
  const words = splitWords(el);
  if (prefersReducedMotion()) {
    gsap.set(words, { opacity: 1, yPercent: 0 });
    return gsap.to(words, { duration: 0 });
  }
  return gsap.fromTo(
    words,
    { yPercent: 110, opacity: 0.15 },
    {
      yPercent: 0,
      opacity: 1,
      ease: 'power2.out',
      stagger: { each: 0.08, from: 'start' },
      scrollTrigger: {
        trigger: opts.trigger ?? el,
        start: opts.start ?? 'top 75%',
        end: opts.end ?? 'bottom 40%',
        scrub: opts.scrub ?? 0.6,
      },
    },
  );
}

/**
 * Horizontal-scroll section: the track element moves left as user scrolls down.
 * `track` should be a wide flex container inside a pinned viewport.
 */
export function horizontalScroll(
  viewport: HTMLElement,
  track: HTMLElement,
  opts: { snap?: boolean; scrub?: number; onUpdate?: (progress: number) => void } = {},
): ScrollTrigger | null {
  if (prefersReducedMotion()) return null;
  const getDistance = () => track.scrollWidth - viewport.clientWidth;
  const tween = gsap.to(track, {
    x: () => -getDistance(),
    ease: 'none',
  });
  return ScrollTrigger.create({
    trigger: viewport,
    start: 'top top',
    end: () => `+=${getDistance()}`,
    pin: true,
    scrub: opts.scrub ?? 1,
    animation: tween,
    onUpdate: opts.onUpdate ? (self) => opts.onUpdate?.(self.progress) : undefined,
    invalidateOnRefresh: true,
    // Higher priority refreshes first. This pin sits above sibling pins (e.g. Process)
    // in DOM order, so its pin-spacer must be inserted before later pins measure their
    // start positions — otherwise they cache a documentTop that's short by this
    // pin-spacer's height and engage prematurely.
    refreshPriority: 1,
    snap: opts.snap
      ? { snapTo: 1 / Math.max(1, track.children.length - 1), duration: 0.4, ease: 'power2.inOut' }
      : undefined,
  });
}

/**
 * Endless marquee with velocity-driven speed boost.
 * The track is duplicated by the caller (children rendered twice) so the loop is seamless.
 * Pauses while the document is hidden to avoid background-tab CPU drain.
 */
export function marquee(
  track: HTMLElement,
  opts: { speed?: number; direction?: 1 | -1 } = {},
): { kill: () => void } {
  if (prefersReducedMotion()) {
    return { kill: () => {} };
  }

  const speed = opts.speed ?? 80; // px/s
  const dir = opts.direction ?? -1;
  let xPos = 0;
  let velocityBoost = 0;
  let raf = 0;
  let last = performance.now();

  const halfWidth = () => track.scrollWidth / 2;

  const tick = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    xPos += dir * (speed + velocityBoost) * dt;
    const hw = halfWidth();
    if (hw > 0) {
      // Wrap into [-hw, 0] regardless of direction.
      if (xPos <= -hw) xPos += hw;
      else if (xPos >= 0) xPos -= hw;
    }
    track.style.transform = `translate3d(${xPos}px, 0, 0)`;
    velocityBoost *= 0.93;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const onVisibility = () => {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (raf === 0) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  const st = ScrollTrigger.create({
    trigger: track,
    start: 'top bottom',
    end: 'bottom top',
    onUpdate: (self) => {
      velocityBoost = Math.min(800, Math.abs(self.getVelocity()) * 0.3);
    },
  });

  return {
    kill: () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVisibility);
      st.kill();
      // Reset transform so a remount starts clean rather than flashing the
      // last computed position for one frame.
      track.style.transform = '';
    },
  };
}

type RevealOpts = {
  /** Stagger between children, in seconds. */
  stagger?: number;
  /** Y offset (px) the children animate up from. */
  y?: number;
  /** `scrollTrigger.start` value. */
  start?: string;
  /** Whether to fire once and disable. */
  once?: boolean;
  /** Animation duration. */
  duration?: number;
};

/**
 * Stagger-reveal direct children on scroll-into-view. Returns the created
 * `gsap.Tween` for callers that want to `.kill()` it explicitly — but the
 * companion `scrollTrigger` is auto-cleaned via the parent `gsap.context`
 * when called inside `useGSAP`.
 *
 * Respects `prefers-reduced-motion` by snapping to the final state.
 */
export function revealChildrenOnScroll(
  parent: HTMLElement,
  opts: RevealOpts = {},
): gsap.core.Tween {
  const kids = Array.from(parent.children) as HTMLElement[];
  if (prefersReducedMotion()) {
    gsap.set(kids, { opacity: 1, y: 0 });
    return gsap.to(kids, { duration: 0 });
  }
  return gsap.fromTo(
    kids,
    { y: opts.y ?? 24, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: opts.duration ?? 0.8,
      ease: 'power3.out',
      stagger: opts.stagger ?? 0.07,
      scrollTrigger: {
        trigger: parent,
        start: opts.start ?? 'top 85%',
        once: opts.once ?? true,
      },
    },
  );
}
