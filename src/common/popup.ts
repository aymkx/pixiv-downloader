import { ContentScriptEvent } from "../content-script/event";
import { getTab, sendMessageToContentScript } from "./chrome";
import { basename } from "./util";

const button = ["add", "download", "clear"] as const;

export type Button = (typeof button)[number];

export async function sendCurrentTabAs(event: ContentScriptEvent) {
  const tab = await getTab();
  if (tab.id && tab.url) {
    const url = new URL(tab.url);
    const illustId = basename(url.pathname);
    const num = Number(illustId);
    if (!isNaN(num) && num > 0)
      sendMessageToContentScript(tab.id, event, { illustId });
    else console.warn("This page is not pixiv illust.");
  }
}
