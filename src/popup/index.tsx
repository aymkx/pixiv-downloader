import * as t from "io-ts";
import { render } from "preact";
import {
  ButtonHTMLAttributes,
  ReactElement,
  useEffect,
  useState,
} from "preact/compat";
import { Button, sendMessageToContentScript } from "../common/popup";
import { IllustInfo } from "../common/transport";
import {
  clearStoredIllusts,
  getIllustsInStore,
  registerChangeHookOfStore,
  sendMessage,
} from "../common/chrome";

function Button({
  variant,
  ...props
}: { variant: string } & ButtonHTMLAttributes): ReactElement {
  return (
    <button class={["btn", `btn-${variant}`].join(" ")} {...props}>
      {props.children}
    </button>
  );
}

function List(): ReactElement {
  const [state, setState] = useState<
    Record<string, { info: t.TypeOf<typeof IllustInfo.props.body> }>
  >({});
  useEffect(() => {
    let isMounted = true;
    getIllustsInStore().then((a) => isMounted && setState(a));
    const remove = registerChangeHookOfStore((change) =>
      setState(change.newValue)
    );
    return () => {
      isMounted = false;
      remove();
    };
  }, []);

  return (
    <ul class={"list-group"}>
      {Object.values(state).map(({ info }) => (
        <li class={"list-group-item"}>
          <a href={info.extraData?.meta.canonical}>{info.illustTitle}</a>
        </li>
      ))}
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
          sendMessage("transport:save", {
            illusts: Object.entries(illusts).map(([k, v]) => {
              return { illustId: k, artworksInfo: v.artworks };
            }),
          });
          clearStoredIllusts();
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
    <div class={["container"].join(" ")}>
      <div class={["row", "g-2"].join(" ")}>
        <div class="form-check">
          <input
            class="form-checkbox-input"
            type="checkbox"
            id="subfolders"
            value=""
          />
          <label class="form-checkbox-label" for="subfolders">
            Put artworks in subfolders
          </label>
        </div>
        <List />
      </div>
      <div class={["row", "g-2"].join(" ")}>
        {Object.entries(buttons).map(([_, v]) => (
          <div class={["col", "text-nowrap"].join(" ")}>
            <Button variant={v.style} onClick={v.onClick}>
              {v.text}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}

document.addEventListener("DOMContentLoaded", () => {
  const root = document.getElementById("app")!;
  render(<App />, root);
});
