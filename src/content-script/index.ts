import { registerListener } from "../common/chrome";
import { ContentScriptEvent, contentScriptHandlers } from "./event";

for (const event of Object.keys(
  contentScriptHandlers
) as ContentScriptEvent[]) {
  registerListener(event, contentScriptHandlers[event]);
}
