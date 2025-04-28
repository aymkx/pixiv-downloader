type ExactKeys<
  K extends string | number | symbol,
  T extends Record<K, any> & Record<Exclude<keyof T, K>, never>
> = T;
type Solve<T> = T extends object ? { [K in keyof T]: T[K] } : T;

export type Event = "illust-pages" | "request";

type MessageFormatMap = ExactKeys<
  Event,
  {
    "illust-pages": undefined;
    request: { info: RequestInfo | URL; init?: RequestInit };
  }
>;

export type Message<T extends Event = Event> = Solve<{
  [K in T]: {
    event: K;
  } & (MessageFormatMap[K] extends {} ? { payload: MessageFormatMap[K] } : {});
}>[T];

type ResultMap = ExactKeys<
  Event,
  {
    "illust-pages": { artworksId: string; json: unknown; response: Response };
    request: Response | Promise<Response>;
  }
>;
export type MessageResponse<K extends Event> = ResultMap[K];
