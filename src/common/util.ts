export type ExactKeys<
  K extends string | number | symbol,
  T extends Record<K, any> & Record<Exclude<keyof T, K>, never>
> = T;
export type AllKeys<
  K extends string | number | symbol,
  T extends Partial<Record<K, any>> & Record<Exclude<keyof T, K>, never>
> = T & Record<Exclude<K, keyof T>, undefined>;
export type Solve<T> = T extends object ? { [K in keyof T]: T[K] } : T;
