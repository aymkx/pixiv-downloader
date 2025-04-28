import * as t from "io-ts";
import JSZip from "jszip";

import * as common from "../common";

const IllustPages = t.type({
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

function basename(path: string) {
  return path.substring(path.lastIndexOf("/") + 1);
}

function sendMessage<
  T extends Exclude<common.Message, { payload: any }>["event"]
>(tabId: number, event: T): Promise<common.MessageResponse<T>>;
function sendMessage<
  T extends Extract<common.Message, { payload: any }>["event"]
>(
  tabId: number,
  event: T,
  payload: common.Message<T>["payload"]
): Promise<common.MessageResponse<T>>;
function sendMessage<T extends common.Event>(
  tabId: number,
  event: T,
  payload?: unknown
): Promise<common.MessageResponse<T>> {
  return chrome.tabs.sendMessage<any, common.MessageResponse<T>>(tabId, {
    event,
    payload,
  });
}

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.id === undefined) return;

  const { artworksId, json } = await sendMessage(tab.id, "illust-pages");

  const illustPages = IllustPages.decode(json);

  if (illustPages._tag === "Left" || illustPages.right.error) {
    throw Error("json format invalid");
  }

  const urls = illustPages.right.body.map(({ urls }) => new URL(urls.original));

  if (urls.length <= 0) {
    return;
  }

  const zip = new JSZip();
  const reader = new FileReader();

  Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url);
      if (response.status === 200)
        zip.file(basename(new URL(url).pathname), await response.blob());
      else throw Error("download failed");
    })
  )
    .then(() => zip.generateAsync({ type: "blob" }))
    // URL.createObjectURL() is not available in service workers.
    .then((blob) => reader.readAsDataURL(blob));

  const onLoadend = () => {
    if (
      reader.readyState === reader.DONE &&
      typeof reader.result === "string"
    ) {
      reader.removeEventListener("loadend", onLoadend);
      chrome.downloads.download({
        url: reader.result,
        filename: `${artworksId}.zip`,
        saveAs: true,
      });
    }
  };
  reader.addEventListener("loadend", onLoadend);
});
