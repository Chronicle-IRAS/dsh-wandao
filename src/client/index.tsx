import type { Context } from "@deepseek-ai/cordis";
import type {} from "@deepseek-ai/dsh-client-ui-renderer/client";
import type {} from "@deepseek-ai/dsh-client-ui-sidebar/client";
import type { MainPanelId } from "@deepseek-ai/dsh-client-ui-layout/client";
import type {} from "@deepseek-ai/dsh-client-connection/client";
import type { UiApi } from "../ui-contract.js";
import { WandaoPage } from "./Page.js";

export const name = "wandao-page";
export const inject = ["slots", "connection"];
export const PANEL_ID = "wandao" as MainPanelId;
export function WandaoIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M5 3h9l5 5v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
      <path d="M14 3v5h5M8 12h7m-3-3 3 3-3 3M8 17h7" />
    </svg>
  );
}
export function apply(ctx: Context) {
  async function call<T>(
    endpoint: string,
    payload = {},
    signal?: AbortSignal,
  ): Promise<T> {
    const result = await ctx.connection.rpc.call(
      "/api",
      `wandao/${endpoint}`,
      payload,
      signal,
    );
    if (!result.ok) throw new Error(result.error.message);
    return result.value as T;
  }
  const api: UiApi = {
    catalogue: (signal) => call("catalogue", {}, signal),
    describe: (providerId, signal) => call("describe", { providerId }, signal),
    start: (request) => call("start", request),
    tasks: (signal) => call("tasks", {}, signal),
    cancel: (jobId) => call("cancel", { jobId }),
    loginDone: (jobId) => call("loginDone", { jobId }),
    saveCredentials: (providerId, fields) =>
      call("saveCredentials", { providerId, fields }),
  };
  ctx.slots.inject("main", () =>
    ctx.slots.register(
      { name: "main", key: PANEL_ID, inject: () => ({ api }) },
      WandaoPage,
    ),
  );
  ctx.slots.inject("sidebar.panellist", () =>
    ctx.slots.register(
      { name: "sidebar.panellist", id: PANEL_ID, order: 30, label: "万能导" },
      WandaoIcon,
    ),
  );
}
