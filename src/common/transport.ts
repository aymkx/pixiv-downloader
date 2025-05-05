import * as t from "io-ts";
import { ExactKeys, Solve } from "./util";

export type TransportEvent = "transport:download" | "transport:save";

type MessageFormatMap = ExactKeys<
  TransportEvent,
  {
    "transport:download": {
      illustId: string;
      json: unknown;
    };
    "transport:save": {
      illusts: {
        illustId: string;
        artworksInfo: t.TypeOf<typeof IllustPages.props.body>;
      }[];
      subfolder?: boolean;
    };
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
    "transport:save": undefined;
  }
>;
export type TransportResponse<K extends TransportEvent> = ResultMap[K];

function pixivAjaxResponseBodyType<T extends t.Mixed>(
  body: T
): t.TypeC<{
  error: t.BooleanC;
  message: t.StringC;
  body: T;
}>;
function pixivAjaxResponseBodyType<T extends t.Props, P extends t.Props>(
  body: t.TypeC<T>,
  partial: t.TypeC<P> | t.PartialC<P>
): t.TypeC<{
  error: t.BooleanC;
  message: t.StringC;
  body: t.IntersectionC<[t.TypeC<T>, t.PartialC<P>]>;
}>;
function pixivAjaxResponseBodyType<T extends t.Mixed, P extends t.Props>(
  body: T,
  partial?: t.TypeC<P> | t.PartialC<P>
) {
  return t.type({
    error: t.boolean,
    message: t.string,
    body:
      partial === undefined
        ? body
        : t.intersection([
            body,
            partial._tag === "PartialType" ? partial : t.partial(partial.props),
          ]),
  });
}

export const IllustPages = pixivAjaxResponseBodyType(
  t.array(
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
  )
);

export const IllustInfo = pixivAjaxResponseBodyType(
  t.type({
    illustId: t.string,
    illustTitle: t.string,
    id: t.string,
    title: t.string,
  }),
  t.partial({
    extraData: t.type({
      meta: t.type({
        canonical: t.string,
      }),
    }),
  })
);
