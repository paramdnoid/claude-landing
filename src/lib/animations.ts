import { gsap, ScrollTrigger } from './gsap';

if (typeof document !== 'undefined') {
  document.fonts.ready.then(() => ScrollTrigger.refresh());
}

export const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Splits an element's text into word + char spans for stagger animations.
 * Returns array of char spans for tweening.
 */
export function splitText(el: HTMLElement): HTMLSpanElement[] {
  if (el.dataset.split === 'done') {
    return Array.from(el.querySelectorAll<HTMLSpanElement>('.char'));
  }
  const chars: HTMLSpanElement[] = [];

  // Walk children: split text nodes into char spans, recurse into elements so
  // existing markup (e.g. <span class="text-gradient">) is preserved.
  const splitNode = (node: Node, parent: HTMLElement) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent ?? '';
      const frag = document.createDocumentFragment();
      const words = text.split(/(\s+)/);
      words.forEach((word) => {
        if (word === '') return;
        if (/^\s+$/.test(word)) {
          frag.appendChild(document.createTextNode(word));
          return;
        }
        const wordEl = document.createElement('span');
        wordEl.className = 'word';
        wordEl.style.display = 'inline-block';
        [...word].forEach((c) => {
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

export function splitTextReset(el: HTMLElement): void {
  const text = Array.from(el.querySelectorAll<HTMLElement>('.word'))
    .map((w) => w.textContent ?? '')
    .join(' ');
  el.innerHTML = text;
  delete el.dataset.split;
  delete el.dataset.splitWords;
}

export function revealChars(
  chars: HTMLElement[],
  opts: { delay?: number; stagger?: number; duration?: number } = {},
): gsap.core.Tween {
  if (prefersReducedMotion()) {
    gsap.set(chars, { y: 0, opacity: 1 });
    return gsap.to(chars, { duration: 0 });
  }
  return gsap.fromTo(
    chars,
    { yPercent: 110, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: opts.duration ?? 0.9,
      ease: 'expo.out',
      stagger: opts.stagger ?? 0.018,
      delay: opts.delay ?? 0,
    },
  );
}

export function fadeUp(
  el: gsap.TweenTarget,
  opts: { delay?: number; duration?: number; y?: number; scrollTrigger?: ScrollTrigger.Vars | Element } = {},
): gsap.core.Tween {
  if (prefersReducedMotion()) {
    return gsap.to(el, { duration: 0, opacity: 1, y: 0 });
  }
  const trigger =
    opts.scrollTrigger instanceof Element
      ? { trigger: opts.scrollTrigger, start: 'top 80%' }
      : opts.scrollTrigger;
  return gsap.fromTo(
    el,
    { y: opts.y ?? 40, opacity: 0 },
    {
      y: 0,
      opacity: 1,
      duration: opts.duration ?? 1,
      ease: 'power3.out',
      delay: opts.delay ?? 0,
      scrollTrigger: trigger,
    },
  );
}

/**
 * Reveal a chunk of chars when its trigger enters the viewport.
 * Wraps splitText + revealChars + a ScrollTrigger in one call.
 */
export function revealLineOnScroll(
  el: HTMLElement,
  opts: { start?: string; stagger?: number; duration?: number } = {},
): gsap.core.Tween {
  const chars = splitText(el);
  if (prefersReducedMotion()) {
    gsap.set(chars, { y: 0, opacity: 1 });
    return gsap.to(chars, { duration: 0 });
  }
  return gsap.fromTo(
    chars,
    { yPercent: 110, opacity: 0 },
    {
      yPercent: 0,
      opacity: 1,
      duration: opts.duration ?? 1,
      ease: 'expo.out',
      stagger: opts.stagger ?? 0.016,
      scrollTrigger: { trigger: el, start: opts.start ?? 'top 85%', once: true },
    },
  );
}

/**
 * Brief cyan-tinted flash on a target — used for success transitions.
 */
export function chromaticPulse(el: HTMLElement, opts: { color?: string; duration?: number } = {}): gsap.core.Timeline {
  const tl = gsap.timeline();
  if (prefersReducedMotion()) return tl;
  const color = opts.color ?? 'rgba(6, 182, 212, 0.2)';
  const duration = opts.duration ?? 0.6;
  tl.fromTo(
    el,
    { boxShadow: '0 0 0 0 rgba(6,182,212,0)' },
    { boxShadow: `0 0 0 6px ${color}, 0 0 60px ${color}`, duration: duration * 0.4, ease: 'power2.out' },
  ).to(el, { boxShadow: '0 0 0 0 rgba(6,182,212,0)', duration: duration * 0.6, ease: 'power2.inOut' });
  return tl;
}

/**
 * Split text into word spans only (not chars). Faster + better for long passages.
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
 * Word-by-word reveal on scroll (scrubbed). For Manifesto-style sections.
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
 * Pinned timeline factory. Caller adds tweens to `tl` against the returned timeline,
 * positions are normalized 0..1 within the pin duration.
 */
export function pinnedTimeline(
  trigger: HTMLElement,
  opts: { end?: string | (() => string); scrub?: boolean | number } = {},
): gsap.core.Timeline {
  if (prefersReducedMotion()) return gsap.timeline();
  return gsap.timeline({
    scrollTrigger: {
      trigger,
      start: 'top top',
      end: opts.end ?? '+=2000',
      pin: true,
      scrub: opts.scrub ?? 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
    },
  });
}

/**
 * Horizontal-scroll section: the track element moves left as user scrolls down.
 * `track` should be a wide flex container inside a pinned viewport.
 */
export function horizontalScroll(
  viewport: HTMLElement,
  track: HTMLElement,
  opts: { snap?: boolean } = {},
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
    scrub: 1,
    animation: tween,
    invalidateOnRefresh: true,
    snap: opts.snap
      ? { snapTo: 1 / Math.max(1, track.children.length - 1), duration: 0.4, ease: 'power2.inOut' }
      : undefined,
  });
}

/**
 * Endless marquee with velocity-driven speed boost.
 * The track is duplicated by the caller (children rendered twice) so the loop is seamless.
 */
export function marquee(
  track: HTMLElement,
  opts: { speed?: number; direction?: 1 | -1 } = {},
): { kill: () => void } {
  const speed = opts.speed ?? 80; // px/s
  const dir = opts.direction ?? -1;
  let xPos = 0;
  let velocityBoost = 0;
  let raf = 0;
  let last = performance.now();

  if (prefersReducedMotion()) {
    return { kill: () => {} };
  }

  const halfWidth = () => track.scrollWidth / 2;

  const tick = (now: number) => {
    const dt = (now - last) / 1000;
    last = now;
    xPos += dir * (speed + velocityBoost) * dt;
    const hw = halfWidth();
    if (hw > 0) {
      if (xPos <= -hw) xPos += hw;
      if (xPos >= 0 && dir === 1) xPos -= hw;
    }
    track.style.transform = `translate3d(${xPos}px, 0, 0)`;
    velocityBoost *= 0.93;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

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
      cancelAnimationFrame(raf);
      st.kill();
    },
  };
}

