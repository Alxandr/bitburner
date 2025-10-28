export const sortBy = <T, K>(
  array: T[],
  key: (value: T) => K,
  order: "desc" | "asc" = "asc",
) => {
  array.sort((a, b) => {
    const aKey = key(a);
    const bKey = key(b);

    const ord = getOrd(aKey, bKey);
    return order === "asc" ? ord : -ord;
  });
};

const getOrd = (a: any, b: any): -1 | 0 | 1 => {
  if (a == b) return 0;
  if (a > b) return 1;
  if (a < b) return -1;
  return 0;
};
