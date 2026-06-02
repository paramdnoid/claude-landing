/**
 * Cheap WebGL2 capability probe that does NOT import `three`, so the check can
 * live in the main bundle (e.g. in Hero) to decide whether to even fetch the
 * heavy lazy WebGL chunks. Mirrors three's `WebGL.isWebGL2Available()`.
 */
export function isWebGL2Available(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    return !!document.createElement('canvas').getContext('webgl2');
  } catch {
    return false;
  }
}
