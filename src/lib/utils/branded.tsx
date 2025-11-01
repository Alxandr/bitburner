const _brand = Symbol("brand");

export type Branded<T, B extends string> = T & { readonly [_brand]: [T, B] };
