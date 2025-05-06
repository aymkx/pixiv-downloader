import { sendMessageToContentScript } from "./chrome";
import { basename } from "./util";

const contextMenus = ["add"] as const;
type ContextMenus = (typeof contextMenus)[number];

export const contextMenusProperties: Partial<
  Record<ContextMenus, Omit<chrome.contextMenus.CreateProperties, "id">>
> = {
  add: {
    title: "Add this illust to download list",
    contexts: ["link"],
    onclick: (info, tab) => {
      if (info.linkUrl && tab.id) {
        const illustId = basename(new URL(info.linkUrl).pathname);
        const num = Number(illustId);
        if (!isNaN(num) && num > 0)
          sendMessageToContentScript(tab.id, "add", { illustId });
        else console.warn("This page is not pixiv illust.");
      }
    },
  },
};
