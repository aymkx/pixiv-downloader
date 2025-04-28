import { sendMessageToCS } from "./chrome";

const prefix = "popup";
const button = ["add", "download"] as const;
const eventType = ["click"] as const;

export type Button = (typeof button)[number];
type EventType = (typeof eventType)[number];
export type PopupUIEvent<
  B extends Button = Button,
  T extends EventType = EventType
> = {
  [K in `${B}:${T}`]: `${typeof prefix}:${Button}:${EventType}`;
}[`${B}:${T}`];

export type PopupUIMessage<T extends PopupUIEvent = PopupUIEvent> = {
  [K in T]: {
    event: K;
  };
}[T];

export function onClick(button: Button) {
  sendMessageToCS({
    event: `${prefix}:${button}:click`,
  });
  return true;
}
