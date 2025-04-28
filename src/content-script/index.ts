import { registerListener, sendMessage } from "../common/chrome";

function basename(path: string) {
  return path.substring(path.lastIndexOf("/") + 1);
}

async function getIllustPages(): Promise<
  | {
      artworksId: string;
      json: unknown;
      response: Response;
    }
  | undefined
> {
  const artworksId = basename(window.location.pathname);
  const url = new URL(`https://www.pixiv.net/ajax/illust/${artworksId}/pages`);
  const response = await fetch(url);
  if (!response.headers.get("content-type")?.includes("application/json"))
    return undefined;

  return {
    artworksId,
    json: await response.json(),
    response,
  };
}

registerListener("popup:download:click", () => {
  getIllustPages().then(
    async (illustPages) =>
      await sendMessage("transport:download", illustPages ?? {})
  );
});

registerListener("popup:add:click", () => {
  getIllustPages().then(async (illustPages) => {
    if (illustPages === undefined)
      throw Error("failed to retrieve artworks information");
    return await sendMessage("transport:add", illustPages);
  });
});
