import type {
  TransportEvent,
  TransportMessage,
  TransportResponse,
} from "./transport";

import type { PopupUIEvent, PopupUIMessage, PopupUIResponse } from "./popup";

export type Event = PopupUIEvent | TransportEvent;
export type Message<E extends Event = Event> =
  | E extends TransportEvent
      ? TransportMessage<E>
      : E extends PopupUIEvent
      ? PopupUIMessage<E>
      : never;
export type MessageResponse<E> = E extends TransportEvent
  ? TransportResponse<E>
  : E extends PopupUIEvent
  ? PopupUIResponse<E>
  : undefined;
