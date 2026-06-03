export default function StaticGradientFallback() {
  return (
    <div
      data-testid="webgl-fallback"
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          'conic-gradient(from 180deg at 50% 60%, #07211f 0deg, #0d9488 80deg, #06b6d4 160deg, #a3ff12 220deg, #07211f 360deg)',
        opacity: 0.85,
      }}
    />
  );
}
