import {
  addIllustInStore,
  registerListener,
  sendMessage,
} from "../common/chrome";
import { IllustInfo, IllustPages } from "../common/transport";
import { basename } from "../common/util";

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

registerListener("popup:download:click", async () => {
  const illustId = basename(window.location.pathname);
  const illustPages = await getIllustPages(illustId);
  await sendMessage("transport:download", {
    illustId: illustId,
    json: illustPages,
  });
});

registerListener("popup:add:click", async () => {
  const illustId = basename(window.location.pathname);
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
});
