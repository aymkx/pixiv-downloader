import * as common from "../common";

function basename(path: string) {
  return path.substring(path.lastIndexOf("/") + 1);
}

function registerListener<
  T extends Exclude<common.Message, { payload: any }>["event"],
  R = common.MessageResponse<T> extends undefined
    ? void
    : common.MessageResponse<T>
>(type: T, handler: () => R | Promise<R>): void;
function registerListener<
  T extends Extract<common.Message, { payload: any }>["event"],
  R = common.MessageResponse<T> extends undefined
    ? void
    : common.MessageResponse<T>
>(
  type: T,
  handler: (payload: common.Message<T>["payload"]) => R | Promise<R>
): void;
function registerListener<T extends common.Event>(
  type: T,
  handler: (payload?: any) => unknown
): void {
  chrome.runtime.onMessage.addListener(
    (message: common.Message<T>, sender, sendResponse) => {
      if (!(sender.id === chrome.runtime.id && message.event === type))
        return false;

      const result =
        "payload" in message ? handler(message.payload) : handler();
      result instanceof Promise
        ? result.then(sendResponse)
        : sendResponse(result);

      return true;
    }
  );
}

registerListener("illust-pages", async () => {
  const artworksId = basename(window.location.pathname);
  const url = new URL(`https://www.pixiv.net/ajax/illust/${artworksId}/pages`);
  const response = await fetch(url);
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw Error("response is not json");

  return {
    artworksId,
    json: await response.json(),
    response,
  };
});
