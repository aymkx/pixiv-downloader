export type ExactKeys<
  K extends string | number | symbol,
  T extends Record<K, any> & Record<Exclude<keyof T, K>, never>
> = T;
export type Solve<T> = T extends object ? { [K in keyof T]: T[K] } : T;
