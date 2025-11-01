export const toArray = <const T,>(
  value: T,
): T extends readonly (infer U)[] ? T : readonly T[] =>
  Array.isArray(value) ? (value as any) : ([value] as any);
