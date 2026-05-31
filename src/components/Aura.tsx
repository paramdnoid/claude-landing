type AuraColor = 'lime' | 'cyan' | 'indigo';

type Props = {
  /** Plasma tint of the glow. */
  color?: AuraColor;
  /** Size + position utilities for the inner glow blob (e.g. "h-[420px] w-[420px] -left-32 top-10"). */
  className?: string;
};

const TINT: Record<AuraColor, string> = {
  lime: 'bg-plasma-lime/[0.07]',
  cyan: 'bg-plasma-cyan/[0.06]',
  indigo: 'bg-plasma-indigo/[0.10]',
};

/**
 * Soft atmospheric glow for a section backdrop — a heavily-blurred plasma blob.
 * Ships its own `inset-0 overflow-hidden` clip layer (not the section itself), so
 * it never clips a `position: sticky` child the way `overflow-hidden` on the
 * section would. Purely decorative; sits behind the section content.
 */
export default function Aura({ color = 'indigo', className = '' }: Props) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={`absolute rounded-full blur-[130px] ${TINT[color]} ${className}`} />
    </div>
  );
}
