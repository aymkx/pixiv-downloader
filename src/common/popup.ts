import { getTab } from "./chrome";
import { AllKeys } from "./util";

const prefix = "popup";
const button = ["add", "download", "clear"] as const;
const eventType = ["click"] as const;

export type Button = (typeof button)[number];
type EventType = (typeof eventType)[number];
export type PopupUIEvent<
  B extends Button = Button,
  T extends EventType = EventType
> = {
  [_ in `${B}:${T}`]: `${typeof prefix}:${Button}:${EventType}`;
}[`${B}:${T}`];

export type PopupUIMessage<T extends PopupUIEvent = PopupUIEvent> = {
  [K in T]: {
    event: K;
  };
}[T];

export type PopupUIResponse<T extends PopupUIEvent> = AllKeys<
  PopupUIEvent,
  {}
>[T];

export async function sendMessageToContentScript(
  button: Button,
  eventType: EventType
) {
  const tab = await getTab();
  if (tab.id) {
    return await chrome.tabs.sendMessage<
      PopupUIMessage,
      PopupUIResponse<PopupUIEvent<typeof button>>
    >(tab.id, {
      event: `${prefix}:${button}:${eventType}`,
    });
  }
  throw new Error("tab id missing");
}
