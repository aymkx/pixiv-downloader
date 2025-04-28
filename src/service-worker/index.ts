import JSZip from "jszip";

import { IllustPages } from "../common/transport";
import { registerListener } from "../common/chrome";

function basename(path: string) {
  return path.substring(path.lastIndexOf("/") + 1);
}

const currentZip: {
  filename?: string;
  zip?: JSZip;
} = {};

async function downloadZip(zip: JSZip, filename?: string) {
  const reader = new FileReader();

  zip
    .generateAsync({ type: "blob" })
    // URL.createObjectURL() is not available in service workers.
    .then((blob) => reader.readAsDataURL(blob));

  const onLoadend = () => {
    if (
      reader.readyState === reader.DONE &&
      typeof reader.result === "string"
    ) {
      reader.removeEventListener("loadend", onLoadend);
      currentZip.zip = undefined;
      chrome.downloads.download({
        url: reader.result,
        filename: filename ?? currentZip.filename,
        saveAs: true,
      });
    }
  };
  reader.addEventListener("loadend", onLoadend);
}

async function add(filename: string, urls: URL[]) {
  if (urls.length <= 0) {
    return;
  }

  if (currentZip.zip === undefined) {
    currentZip.zip = new JSZip();
    currentZip.filename = filename;
  }

  await Promise.all(
    urls.map(async (url) => {
      const response = await fetch(url);
      if (response.status === 200)
        currentZip.zip!.file(basename(url.pathname), await response.blob());
      else throw Error("download failed");
    })
  );
}

registerListener(
  "transport:download",
  async (payload) => {
    if ("artworksId" in payload) {
      const { artworksId, json } = payload;
      const parseResult = IllustPages.decode(json);
      if (parseResult._tag === "Right" && !parseResult.right.error) {
        await add(
          `${artworksId}.zip`,
          parseResult.right.body.map(({ urls }) => new URL(urls.original))
        );
      }
    }

    if (currentZip.zip) {
      downloadZip(
        currentZip.zip,
        "artworksId" in payload &&
          `${payload.artworksId}.zip` === currentZip.filename
          ? undefined
          : "out.zip"
      );
    }
  },
  (sender) => sender.tab !== undefined
);

registerListener(
  "transport:add",
  async ({ artworksId, json }) => {
    const parseResult = IllustPages.decode(json);
    if (parseResult._tag === "Left" || parseResult.right.error)
      throw Error("error is found in artworks information");

    add(
      `${artworksId}.zip`,
      parseResult.right.body.map(({ urls }) => new URL(urls.original))
    );
  },
  (sender) => sender.tab !== undefined
);
