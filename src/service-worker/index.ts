import JSZip from "jszip";

import { IllustPages } from "../common/transport";
import { registerListener } from "../common/chrome";
import { basename } from "../common/util";
import { contextMenusProperties } from "../common/contextMenus";

function downloadZip(zip: JSZip, filename: string) {
  const reader = new FileReader();

  zip
    .generateAsync({ type: "blob" })
    // URL.createObjectURL() is not available in service workers.
    .then((blob) => reader.readAsDataURL(blob));

  const onLoadend = () => {
    if (reader.readyState === reader.DONE && typeof reader.result === "string")
      chrome.downloads.download({
        url: reader.result,
        filename,
        saveAs: true,
      });
  };
  reader.addEventListener("loadend", onLoadend);
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.clear();

  Object.entries(contextMenusProperties).map(([k, v]) =>
    chrome.contextMenus.create({
      ...v,
      id: k,
      onclick: undefined,
    })
  );
});
chrome.runtime.onStartup.addListener(() => chrome.storage.local.clear());

registerListener(
  "transport:download",
  async (payload) => {
    const { illustId, json } = payload;
    const parseResult = IllustPages.decode(json);
    if (parseResult._tag === "Left" || parseResult.right.error) {
      return;
    }
    const zip = new JSZip();

    await Promise.all(
      parseResult.right.body.map(async ({ urls }) => {
        const url = new URL(urls.original);
        const resp = await fetch(url);
        if (resp.status === 200)
          zip.file(basename(url.pathname), await resp.blob());
        else throw new Error("download failed");
      })
    );

    downloadZip(zip, `${illustId}.zip`);
  },
  (sender) => sender.tab !== undefined
);

registerListener("transport:save", async ({ illusts, ...options }) => {
  const zip = new JSZip();
  await Promise.all(
    illusts.flatMap(({ illustId, artworksInfo }) => {
      return artworksInfo.map(async ({ urls }) => {
        const url = new URL(urls.original);
        const resp = await fetch(url);
        if (resp.status === 200) {
          const name = basename(url.pathname);
          zip.file(
            options.subfolder ? [illustId, name].join("/") : name,
            await resp.blob()
          );
        } else throw new Error(`download image failed: ${urls.original}`);
      });
    })
  );

  downloadZip(zip, "out.zip");
});

Object.entries(contextMenusProperties).map(([k, v]) => {
  if (v.onclick) {
    const onclick = v.onclick;
    chrome.contextMenus.onClicked.addListener((info, tab) => {
      if (info.menuItemId === k && tab) onclick(info, tab);
    });
  }
});
