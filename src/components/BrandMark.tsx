type Variant = 'header' | 'footer';

type Props = {
  variant: Variant;
};

/**
 * Brand wordmark used in the site header and footer. Header pairs it with the
 * logo SVG (animated on hover), the footer with a static rotated tile so the
 * wordmark itself stays identical across both surfaces.
 */
export default function BrandMark({ variant }: Props) {
  if (variant === 'header') {
    return (
      <>
        <img
          src="/logo.svg"
          alt=""
          aria-hidden="true"
          width="28"
          height="28"
          className="block h-7 w-7 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3"
          style={{ filter: 'drop-shadow(0 0 12px rgba(163, 255, 18, 0.35))' }}
        />
        <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-[var(--color-fg)] leading-tight">
          <span className="block">ZIAN AI CONCEPTS</span>
          <span className="block text-[var(--color-muted)] text-[10px]">by Andre Zimmermann</span>
        </span>
      </>
    );
  }
  return (
    <>
      <span aria-hidden="true" className="inline-block h-2 w-2 rotate-45 bg-[var(--color-plasma-lime)]" />
      <span className="font-mono text-[11px] uppercase tracking-[0.22em] leading-tight">
        <span className="block">ZIAN AI CONCEPTS</span>
        <span className="block text-[var(--color-muted)] text-[10px]">by Andre Zimmermann</span>
      </span>
    </>
  );
}
