import * as t from "io-ts";
import { ExactKeys, Solve } from "./util";

export type TransportEvent = "transport:download" | "transport:add";

type MessageFormatMap = ExactKeys<
  TransportEvent,
  {
    "transport:download":
      | {
          artworksId: string;
          json: unknown;
          response: Response;
        }
      | {};
    "transport:add": { artworksId: string; json: unknown; response: Response };
  }
>;

export type TransportMessage<T extends TransportEvent = TransportEvent> =
  Solve<{
    [K in T]: {
      event: K;
    } & (MessageFormatMap[K] extends {}
      ? { payload: MessageFormatMap[K] }
      : {});
  }>[T];

type ResultMap = ExactKeys<
  TransportEvent,
  {
    "transport:download": undefined;
    "transport:add": undefined;
  }
>;
export type TransportResponse<K extends TransportEvent> = ResultMap[K];

export const IllustPages = t.type({
  error: t.boolean,
  message: t.string,
  body: t.array(
    t.type({
      urls: t.type({
        thumb_mini: t.string,
        small: t.string,
        regular: t.string,
        original: t.string,
      }),
      width: t.number,
      height: t.number,
    })
  ),
});
