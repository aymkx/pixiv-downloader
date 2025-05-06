import { addIllustInStore, sendMessage } from "../common/chrome";
import { IllustInfo, IllustPages } from "../common/transport";
import { ExactKeys, Solve } from "../common/util";

export type ContentScriptEvent = "download" | "add";

type ContentScriptMessageFormatMap = ExactKeys<
  ContentScriptEvent,
  {
    download: {
      illustId: string;
    };
    add: {
      illustId: string;
    };
  }
>;

export type ContentScriptMessage<
  E extends ContentScriptEvent = ContentScriptEvent
> = Solve<{
  [K in E]: {
    event: K;
  } & (ContentScriptMessageFormatMap[K] extends {}
    ? { payload: ContentScriptMessageFormatMap[K] }
    : {});
}>[E];

async function getIllustPages(illustId: string): Promise<unknown> {
  const url = new URL(`https://www.pixiv.net/ajax/illust/${illustId}/pages`);
  const response = await fetch(url);
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("failed to get artworks");

  return await response.json();
}

async function getIllustInfo(illustId: string): Promise<unknown> {
  const url = new URL(`https://www.pixiv.net/ajax/illust/${illustId}`);
  const response = await fetch(url);
  if (!response.headers.get("content-type")?.includes("application/json"))
    throw new Error("failed to get illust information");

  return await response.json();
}

export const contentScriptHandlers: {
  [K in ContentScriptEvent]: ContentScriptMessageFormatMap[K] extends {}
    ? (_: ContentScriptMessageFormatMap[K]) => void
    : () => void;
} = {
  add: async ({ illustId }) => {
    const illustPages = IllustPages.decode(await getIllustPages(illustId));
    const illustInfo = IllustInfo.decode(await getIllustInfo(illustId));
    if (
      illustInfo._tag === "Right" &&
      !illustInfo.right.error &&
      illustPages._tag === "Right" &&
      !illustPages.right.error
    ) {
      addIllustInStore(illustId, illustPages.right.body, illustInfo.right.body);
    }
  },
  download: async ({ illustId }) => {
    const illustPages = await getIllustPages(illustId);
    await sendMessage("transport:download", {
      illustId: illustId,
      json: illustPages,
    });
  },
};
