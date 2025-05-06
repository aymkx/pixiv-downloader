import { sendMessageToContentScript } from "./chrome";
import { basename, validateIllustUrl } from "./util";

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
        const url = new URL(info.linkUrl);
        if (validateIllustUrl(url))
          sendMessageToContentScript(tab.id, "add", {
            illustId: basename(url.pathname),
          });
        else console.info(`The page is not pixiv illust: ${info.linkUrl}`);
      }
    },
  },
};
