export const SCALE_MAX = 2.0;

export function quantizeToUint8(v: number, max = SCALE_MAX): number {
  const clamped = Math.max(0, Math.min(max, v));
  return Math.round((clamped / max) * 255);
}
