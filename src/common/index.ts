import type {
  TransportEvent,
  TransportMessage,
  TransportResponse,
} from "./transport";

import type { PopupUIEvent, PopupUIMessage } from "./popup";

export type Event = PopupUIEvent | TransportEvent;
export type Message<E extends Event = Event> =
  | (E extends PopupUIEvent ? PopupUIMessage<E> : never)
  | (E extends TransportEvent ? TransportMessage<E> : never);
export type MessageResponse<E> = E extends TransportEvent
  ? TransportResponse<E>
  : undefined;
