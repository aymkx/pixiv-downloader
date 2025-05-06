import { ContentScriptEvent } from "../content-script/event";
import { getTab, sendMessageToContentScript } from "../common/chrome";
import { basename, validateIllustUrl } from "../common/util";

const button = ["add", "download", "clear"] as const;

export type Button = (typeof button)[number];

export async function sendCurrentTabAs(event: ContentScriptEvent) {
  const tab = await getTab();
  if (tab.id && tab.url) {
    const url = new URL(tab.url);
    if (validateIllustUrl(url))
      sendMessageToContentScript(tab.id, event, {
        illustId: basename(url.pathname),
      });
    else console.info(`The page is not pixiv illust: ${tab.url}`);
  }
}
