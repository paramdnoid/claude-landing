# Coding Standards

## React

- Use function components and composition.
- Hooks only at top level and only from React functions/custom hooks.
- Keep components idempotent: same inputs produce same output.
- Effects are for synchronizing with external systems, not for deriving render state that can be computed.
- Separate server-safe utilities from browser-only code.
- Prefer explicit props over spreading unknown objects into DOM nodes.
- Avoid stale closures with correct dependency arrays.
- Clean up subscriptions, timers, observers, GSAP contexts, Three.js render loops and event listeners.

## Next.js App Router

- Server Components by default.
- Add `use client` only to the smallest boundary requiring state, effects, event handlers, browser APIs, GSAP or Three.js.
- Keep Server Actions in dedicated server files when used by Client Components.
- Avoid importing Node-only or server-only modules into Client Components.
- Use framework metadata APIs for SEO where possible.
- Use dynamic imports for heavy client-only modules.
- Do not hardcode route assumptions; inspect the app directory structure.

## TypeScript

- Strict mode mindset even if existing config is weaker.
- No `any`; use `unknown` and narrow.
- Avoid non-null assertions except with an invariant comment.
- Model variants with discriminated unions.
- Use `satisfies` for config/resource validation.
- Export stable public types where modules are reused.
- Keep component prop types small and cohesive.

## Tailwind CSS

- Prefer design tokens and semantic component APIs.
- Use Tailwind v4 CSS-first patterns when the project is already on v4.
- Avoid arbitrary values unless required for precision or third-party integration.
- Keep class lists readable; extract repeated patterns into components or small utilities.
- Preserve focus-visible, disabled, dark mode and responsive states.

## i18next / react-i18next

- No hardcoded user-facing strings in UI components.
- Use namespaces by route/feature.
- Use typed resources where possible.
- Use plurals and interpolation instead of string concatenation.
- Keep translation keys stable and semantic.
- Ensure server/client translation APIs align with Next.js routing strategy.

## Three.js

- Three.js code belongs behind a Client Component boundary.
- Dispose geometries, materials, textures, render targets and controls.
- Stop animation loops on unmount.
- Handle resize with cleanup.
- Avoid unbounded object creation per frame.
- Consider dynamic import and progressive loading for large assets.
- Respect reduced motion and battery/performance constraints.

## GSAP

- Use `@gsap/react` and `useGSAP` when GSAP runs in React.
- Register plugins once in client-only code.
- Scope selectors with refs/context.
- Revert/cleanup animations on unmount.
- Honor `prefers-reduced-motion` and provide non-motion fallback.
- Avoid layout thrashing; prefer transforms and opacity.

## Testing

- Add or update tests for behavior changes.
- Test user-visible behavior, not implementation details.
- Mock i18n consistently.
- For motion/3D, test lifecycle and accessibility fallbacks where full rendering is impractical.
