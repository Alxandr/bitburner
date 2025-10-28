export function sum<T extends number>(array: readonly T[]): T;
export function sum<T, V extends number>(
  array: readonly T[],
  map: (value: T) => V,
): V;
export function sum<T, V extends number>(
  array: readonly T[],
  map?: (value: T) => V,
) {
  map ??= (value) => value as any;
  return array.reduce((acc, value) => acc + map(value), 0 as any);
}
