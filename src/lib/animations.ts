import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
 * Animates background-color/boxShadow back to its starting value.
 */
export function chromaticPulse(el: HTMLElement, opts: { color?: string; duration?: number } = {}): gsap.core.Timeline {
  const tl = gsap.timeline();
  if (prefersReducedMotion()) return tl;
  const color = opts.color ?? 'rgba(0, 229, 255, 0.18)';
  const duration = opts.duration ?? 0.6;
  tl.fromTo(
    el,
    { boxShadow: '0 0 0 0 rgba(0,229,255,0)' },
    { boxShadow: `0 0 0 6px ${color}, 0 0 60px ${color}`, duration: duration * 0.4, ease: 'power2.out' },
  ).to(el, { boxShadow: '0 0 0 0 rgba(0,229,255,0)', duration: duration * 0.6, ease: 'power2.inOut' });
  return tl;
}
