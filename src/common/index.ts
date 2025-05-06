import type {
  TransportEvent,
  TransportMessage,
  TransportResponse,
} from "./transport";

import {
  ContentScriptEvent,
  ContentScriptMessage,
} from "../content-script/event";

export type Event = TransportEvent | ContentScriptEvent;
export type Message<E extends Event = Event> = E extends TransportEvent
  ? TransportMessage<E>
  : E extends ContentScriptEvent
  ? ContentScriptMessage<E>
  : never;
export type MessageResponse<E> = E extends TransportEvent
  ? TransportResponse<E>
  : undefined;
