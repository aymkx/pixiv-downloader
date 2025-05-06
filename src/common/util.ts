export type ExactKeys<
  K extends string | number | symbol,
  T extends Record<K, any> & Record<Exclude<keyof T, K>, never>
> = T;
export type AllKeys<
  K extends string | number | symbol,
  T extends Partial<Record<K, any>> & Record<Exclude<keyof T, K>, never>
> = T & Record<Exclude<K, keyof T>, undefined>;
export type Solve<T> = T extends object ? { [K in keyof T]: T[K] } : T;

export function basename(path: string) {
  return path.substring(path.lastIndexOf("/") + 1);
}

export function validateIllustUrl(url: string | URL) {
  if (typeof url === "string") {
    url = new URL(url);
  }
  if (url.hostname !== "www.pixiv.net") return false;

  const splittedPath = url.pathname.split("/");
  if (splittedPath[1] !== "artworks") return false;

  const num = Number(splittedPath[2]);

  return !isNaN(num) && num > 0;
}
