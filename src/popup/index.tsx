import { render } from "preact";
import { ReactElement } from "preact/compat";
import { Button, onClick } from "../common/popup";

function App(): ReactElement {
  const buttons = {
    add: { text: "Add this artworks", style: "outline-primary" },
    download: { text: "Download", style: "primary" },
  } as const satisfies Record<Button, { text: string; style: string }>;

  return (
    <div class={["container"].join(" ")}>
      <div class={["row", "g-2"].join(" ")}>
        {Object.entries(buttons).map(([k, v]) => (
          <div class={["col", "text-nowrap"].join(" ")}>
            <button
              id={`btn-${k}`}
              class={`btn btn-${v.style}`}
              onClick={() => onClick(k as Button)}
            >
              {v.text}
            </button>
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
