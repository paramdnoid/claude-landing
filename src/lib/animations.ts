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
  const text = el.textContent ?? '';
  el.textContent = '';
  const chars: HTMLSpanElement[] = [];
  const words = text.split(/(\s+)/);
  words.forEach((word) => {
    if (/^\s+$/.test(word)) {
      el.appendChild(document.createTextNode(' '));
      return;
    }
    const wordEl = document.createElement('span');
    wordEl.className = 'word';
    [...word].forEach((c) => {
      const ch = document.createElement('span');
      ch.className = 'char';
      ch.textContent = c;
      wordEl.appendChild(ch);
      chars.push(ch);
    });
    el.appendChild(wordEl);
  });
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
