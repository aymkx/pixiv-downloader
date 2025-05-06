import * as t from "io-ts";
import { render } from "preact";
import {
  ButtonHTMLAttributes,
  ReactElement,
  useEffect,
  useState,
} from "preact/compat";
import { Button, sendMessageToContentScript } from "../common/popup";
import { IllustInfo, IllustPages } from "../common/transport";
import {
  clearStoredIllusts,
  getIllustsInStore,
  Properties,
  registerChangeHookOfStore,
  sendMessage,
  setIllustPropertiesInStore,
} from "../common/chrome";

function Button({
  variant,
  ...props
}: { variant: string } & ButtonHTMLAttributes): ReactElement {
  return (
    <button
      type="button"
      class={["btn", `btn-${variant}`, "text-nowrap", "mx-1"].join(" ")}
      {...props}
    >
      {props.children}
    </button>
  );
}

const checkboxId = (illustId: string) => `checkbox-${illustId}`;

function List(): ReactElement {
  const [state, setState] = useState<
    ReturnType<typeof getIllustsInStore> extends Promise<infer R> ? R : never
  >({});

  useEffect(() => {
    let isMounted = true;
    getIllustsInStore().then((a) => isMounted && setState(a));
    const remove = registerChangeHookOfStore((s) => setState(s));

    return () => {
      isMounted = false;
      remove();
    };
  }, []);

  return (
    <ul id="list" class={["list-group"].join(" ")}>
      {Object.entries(state)
        .toSorted(([_, { _serial: a }], [__, { _serial: b }]) => a - b)
        .map(([illustId, { artworks, info, properties }]) => {
          return (
            <li class={["list-group-item"].join(" ")}>
              <input
                type="checkbox"
                id={checkboxId(illustId)}
                checked={!Boolean(properties.omit)}
                onChange={(e) =>
                  setIllustPropertiesInStore(illustId, {
                    omit: !e.currentTarget.checked,
                  })
                }
              />
              <a
                href={info.extraData?.meta.canonical}
                target="_blank"
                class="text-wrap"
              >{`${info.alt} (${illustId})`}</a>
            </li>
          );
        })}
    </ul>
  );
}

function App(): ReactElement {
  const buttons: Record<
    Button,
    { text: string; style: string; onClick?: () => void }
  > = {
    add: {
      text: "Add this artworks",
      style: "outline-primary",
      onClick: () => sendMessageToContentScript("add", "click"),
    },
    download: {
      text: "Download",
      style: "primary",
      onClick: async () => {
        const illusts = await getIllustsInStore();
        if (Object.keys(illusts).length === 0) {
          sendMessageToContentScript("download", "click");
        } else {
          const list = Object.entries(illusts)
            .filter(([_, v]) => !Boolean(v.properties.omit))
            .map(([k, v]) => ({
              illustId: k,
              artworksInfo: v.artworks,
            }));
          if (list.length > 0)
            sendMessage("transport:save", {
              illusts: list,
            });
          else alert("no illusts to be downloaded");
        }
      },
    },
    clear: {
      text: "Clear",
      style: "outline-secondary",
      onClick: clearStoredIllusts,
    },
  } as const;

  return (
    <>
      <div class="form-check my-1">
        <input class="form-checkbox-input" type="checkbox" id="subfolders" />
        <label class="form-checkbox-label" for="subfolders">
          Put artworks in subfolders
        </label>
      </div>
      <div class="my-1">
        <List />
      </div>
      <div class="flex">
        {Object.entries(buttons).map(([_, v]) => (
          <Button variant={v.style} onClick={v.onClick}>
            {v.text}
          </Button>
        ))}
      </div>
    </>
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app")!;
  render(<App />, root);
});
