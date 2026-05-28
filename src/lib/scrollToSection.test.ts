import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the transitive deps so we don't pull in gsap/ScrollTrigger (which crashes
// in jsdom when `gsap.registerPlugin` runs at import-time).
vi.mock('./smoothScroll', () => ({
  getLenis: vi.fn(() => null),
  initSmoothScroll: vi.fn(),
  destroySmoothScroll: vi.fn(),
}));
vi.mock('./animations', () => ({
  prefersReducedMotion: vi.fn(() => false),
}));

import { scrollToSection, HEADER_OFFSET_PX } from './scrollToSection';
import * as smoothScroll from './smoothScroll';
import * as animations from './animations';

const getLenisMock = vi.mocked(smoothScroll.getLenis);
const prefersReducedMotionMock = vi.mocked(animations.prefersReducedMotion);

describe('scrollToSection', () => {
  beforeEach(() => {
    document.body.innerHTML = '<section id="hero"></section>';
    window.history.replaceState(null, '', '/');
    getLenisMock.mockReturnValue(null);
    prefersReducedMotionMock.mockReturnValue(false);
  });

  it('returns null and is a no-op when the target id does not exist', () => {
    expect(scrollToSection('nope')).toBeNull();
  });

  it('uses lenis.scrollTo when lenis is available and reduced-motion is off', () => {
    const scrollTo = vi.fn();
    getLenisMock.mockReturnValue({ scrollTo } as never);

    const target = scrollToSection('hero');

    expect(target).toBeInstanceOf(HTMLElement);
    expect(scrollTo).toHaveBeenCalledWith(target, {
      offset: HEADER_OFFSET_PX,
      duration: 1.2,
    });
  });

  it('honours custom offset and duration', () => {
    const scrollTo = vi.fn();
    getLenisMock.mockReturnValue({ scrollTo } as never);

    scrollToSection('hero', { offset: -100, duration: 0.5 });

    expect(scrollTo).toHaveBeenCalledWith(expect.any(HTMLElement), {
      offset: -100,
      duration: 0.5,
    });
  });

  it('falls back to scrollIntoView with smooth behaviour when lenis is unavailable', () => {
    getLenisMock.mockReturnValue(null);
    const el = document.getElementById('hero');
    if (!el) throw new Error('fixture missing');
    const scrollIntoView = vi.fn();
    el.scrollIntoView = scrollIntoView as Element['scrollIntoView'];

    scrollToSection('hero');

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('falls back to scrollIntoView with auto behaviour under reduced motion', () => {
    getLenisMock.mockReturnValue({ scrollTo: vi.fn() } as never);
    prefersReducedMotionMock.mockReturnValue(true);
    const el = document.getElementById('hero');
    if (!el) throw new Error('fixture missing');
    const scrollIntoView = vi.fn();
    el.scrollIntoView = scrollIntoView as Element['scrollIntoView'];

    scrollToSection('hero');

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'auto', block: 'start' });
  });

  it('updates the URL hash by default', () => {
    getLenisMock.mockReturnValue({ scrollTo: vi.fn() } as never);

    scrollToSection('hero');

    expect(window.location.hash).toBe('#hero');
  });

  it('skips the hash update when updateHash: false', () => {
    getLenisMock.mockReturnValue({ scrollTo: vi.fn() } as never);

    scrollToSection('hero', { updateHash: false });

    expect(window.location.hash).toBe('');
  });
});
