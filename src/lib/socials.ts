export type SocialKey = 'github' | 'twitter' | 'linkedin';
export type SocialLink = { key: SocialKey; url: string };

// Social profile URLs are env-driven so the production build can't ship the
// placeholder handles. Missing values silently drop the link. Shared by the
// Connect rail and the footer so there's a single source of truth.
export const SOCIAL_LINKS: ReadonlyArray<SocialLink> = (
  [
    { key: 'github', url: import.meta.env.VITE_SOCIAL_GITHUB ?? '' },
    { key: 'twitter', url: import.meta.env.VITE_SOCIAL_TWITTER ?? '' },
    { key: 'linkedin', url: import.meta.env.VITE_SOCIAL_LINKEDIN ?? '' },
  ] as ReadonlyArray<SocialLink>
).filter((s) => s.url.length > 0);
