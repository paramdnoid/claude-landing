/**
 * Single source of truth for the in-page section anchor ids, in document order.
 *
 * Consumed by the header navigation (`Header.tsx`) and the scroll rail
 * (`SectionRail.tsx`) so the two can never drift apart. Each id must match a
 * real `id="…"` on a section element rendered by `Home.tsx` (directly, or via
 * `StickyStoryList`'s `sectionId` for Capabilities/Process). The hero is
 * intentionally excluded — both the nav and the rail start at the manifesto.
 */
export const SECTION_IDS = ['manifesto', 'work', 'capabilities', 'process', 'contact'] as const;

export type SectionId = (typeof SECTION_IDS)[number];
