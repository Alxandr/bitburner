export function clampNumber(
  value: number,
  min = -Number.MAX_VALUE,
  max = Number.MAX_VALUE,
) {
  return Math.max(Math.min(value, max), min);
}
