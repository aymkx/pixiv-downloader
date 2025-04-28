import type { Event, Message, MessageResponse } from "../common";

export async function sendMessageToCS(message: Message) {
  const tab = (
    await chrome.tabs.query({
      active: true,
      currentWindow: true,
    })
  ).at(0);
  if (!tab?.id) {
    throw Error("cannot retrieve active tab information");
  }

  return await chrome.tabs.sendMessage<Message>(tab.id!, message);
}

export function sendMessage<
  T extends Exclude<Message, { payload: any }>["event"]
>(event: T): Promise<MessageResponse<T>>;
export function sendMessage<
  T extends Extract<Message, { payload: any }>["event"]
>(
  event: T,
  payload: Extract<Message<T>, { payload: any }>["payload"]
): Promise<MessageResponse<T>>;
export function sendMessage<T extends Event>(
  event: T,
  payload?: unknown
): Promise<MessageResponse<T>> {
  return chrome.runtime.sendMessage<any, MessageResponse<T>>({
    event,
    payload,
  });
}

export function registerListener<
  T extends Exclude<Message, { payload: any }>["event"],
  R = MessageResponse<T> extends undefined ? void : MessageResponse<T>
>(
  event: T,
  handler: () => R | Promise<R>,
  condition?: (sender: chrome.runtime.MessageSender) => boolean
): void;
export function registerListener<
  T extends Extract<Message, { payload: any }>["event"],
  R = MessageResponse<T> extends undefined ? void : MessageResponse<T>
>(
  event: T,
  handler: (
    payload: Extract<Message<T>, { payload: any }>["payload"]
  ) => R | Promise<R>,
  condition?: (sender: chrome.runtime.MessageSender) => boolean
): void;
export function registerListener<T extends Event>(
  event: T,
  handler: (payload?: any) => unknown,
  condition: (sender: chrome.runtime.MessageSender) => boolean = () => true
): void {
  chrome.runtime.onMessage.addListener(
    (message: Message<T>, sender, sendResponse) => {
      if (!(sender.id === chrome.runtime.id && message.event === event))
        return false;

      if (!condition(sender)) return false;

      const result =
        "payload" in message ? handler(message.payload) : handler();
      result instanceof Promise
        ? result.then(sendResponse)
        : sendResponse(result);

      return true;
    }
  );
}
