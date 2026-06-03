export default function StaticGradientFallback() {
  return (
    <div
      data-testid="webgl-fallback"
      aria-hidden="true"
      className="absolute inset-0"
      style={{
        background:
          'conic-gradient(from 180deg at 50% 60%, #0a1430 0deg, #3b82f6 80deg, #06b6d4 160deg, #a3ff12 220deg, #0a1430 360deg)',
        opacity: 0.85,
      }}
    />
  );
}
