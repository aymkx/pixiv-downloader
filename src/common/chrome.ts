import * as t from "io-ts";
import type { Event, Message, MessageResponse } from "../common";
import { IllustInfo, IllustPages } from "./transport";
import { ContentScriptEvent } from "../content-script/event";

export async function getTab(): Promise<chrome.tabs.Tab & { id: number }> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  if (tab.id !== undefined) return { ...tab, id: tab.id };
  throw new Error("failed to get tab");
}

export async function sendMessage<
  E extends Exclude<Message, { payload: any }>["event"]
>(event: E): Promise<MessageResponse<E>>;
export async function sendMessage<
  E extends Event,
  P extends Extract<Message<E>, { payload: any }>["payload"]
>(event: E, payload: P): Promise<MessageResponse<E>>;
export async function sendMessage<E extends Event>(
  event: E,
  payload?: Message<E> extends { payload: unknown }
    ? Message<E>["payload"]
    : undefined
): Promise<MessageResponse<E>> {
  return await chrome.runtime.sendMessage<any, MessageResponse<E>>({
    event,
    payload,
  });
}

export async function sendMessageToContentScript<
  E extends Exclude<Message<ContentScriptEvent>, { payload: any }>["event"]
>(tabId: number, event: E): Promise<MessageResponse<E>>;
export async function sendMessageToContentScript<
  E extends ContentScriptEvent,
  P extends Extract<Message<E>, { payload: any }>["payload"]
>(tabId: number, event: E, payload: P): Promise<MessageResponse<E>>;
export async function sendMessageToContentScript<E extends Event>(
  tabId: number,
  event: E,
  payload?: Message<E> extends { payload: unknown }
    ? Message<E>["payload"]
    : undefined
): Promise<MessageResponse<E>> {
  return await chrome.tabs.sendMessage<any, MessageResponse<E>>(tabId, {
    event,
    ...(payload ? { payload } : {}),
  });
}

export function registerListener<
  E extends Exclude<Message, { payload: any }>["event"]
>(
  event: E,
  handler: () => MessageResponse<E> extends undefined
    ? void | Promise<void>
    : MessageResponse<E> | Promise<MessageResponse<E>>,
  condition?: (sender: chrome.runtime.MessageSender) => boolean
): void;
export function registerListener<
  E extends Event,
  P extends Extract<Message<E>, { payload: any }>["payload"]
>(
  event: E,
  handler: (
    payload: P
  ) => MessageResponse<E> extends undefined
    ? void | Promise<void>
    : MessageResponse<E> | Promise<MessageResponse<E>>,
  condition?: (sender: chrome.runtime.MessageSender) => boolean
): void;
export function registerListener<E extends Event>(
  event: E,
  handler: (
    payload?: any
  ) => MessageResponse<E> extends undefined
    ? void | Promise<void>
    : MessageResponse<E> | Promise<MessageResponse<E>>,
  condition: (sender: chrome.runtime.MessageSender) => boolean = () => true
): void {
  chrome.runtime.onMessage.addListener(
    (message: Message<E>, sender, sendResponse: (_: unknown) => void) => {
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

export interface Properties {
  omit: boolean;
}

export async function getIllustsInStore(): Promise<
  Record<
    string,
    {
      artworks: t.TypeOf<typeof IllustPages.props.body>;
      info: t.TypeOf<typeof IllustInfo.props.body>;
      _serial: number;
      properties: Partial<Properties>;
    }
  >
> {
  const { illusts, properties } = await chrome.storage.local.get<{
    illusts: Record<
      string,
      {
        artworks: t.TypeOf<typeof IllustPages.props.body>;
        info: t.TypeOf<typeof IllustInfo.props.body>;
        _serial: number;
      }
    >;
    properties: Record<string, Partial<Properties>>;
  }>({ illusts: {}, properties: {} });
  return (
    Object.fromEntries(
      Object.entries(illusts).map(([k, v]) => [
        k,
        { ...v, properties: properties[k] ?? {} },
      ])
    ) ?? {}
  );
}

export async function addIllustInStore(
  illustId: string,
  artworks: t.TypeOf<typeof IllustPages.props.body>,
  info: t.TypeOf<typeof IllustInfo.props.body>
) {
  const illusts = await getIllustsInStore();

  await chrome.storage.local.set({
    illusts: {
      ...illusts,
      [illustId]: { artworks, info, _serial: Object.keys(illusts).length },
    },
  });
}

export async function setIllustPropertiesInStore(
  illustId: string,
  properties: {} = {}
) {
  const { properties: props } = await chrome.storage.local.get<{
    properties: Record<string, Partial<{ omit: boolean }>>;
  }>({ properties: {} });

  await chrome.storage.local.set({
    properties: {
      ...props,
      [illustId]: { ...(props[illustId] ?? {}), ...properties },
    },
  });
}

export function registerChangeHookOfStore(
  hook: ReturnType<typeof getIllustsInStore> extends Promise<infer R>
    ? (_: R) => void
    : never
): () => void {
  const listener = async (
    changes: Record<string, chrome.storage.StorageChange>,
    area: chrome.storage.AreaName
  ) => {
    if (area !== "local") return;
    if ("illusts" in changes) hook(await getIllustsInStore());
  };
  chrome.storage.onChanged.addListener(listener);

  return () => chrome.storage.onChanged.removeListener(listener);
}

export function clearStoredIllusts() {
  chrome.storage.local.set({ illusts: {} });
}
