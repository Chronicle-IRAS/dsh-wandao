// A small shell around the actual DSH 0.2.2-rc.1 SlotRegistry and packed client.
import * as React from "react";
import * as ReactDOM from "react-dom";
import * as ReactDOMClient from "react-dom/client";
import * as JSXRuntime from "react/jsx-runtime";
import * as Cordis from "@deepseek-ai/cordis";
import * as SlotCore from "@deepseek-ai/dsh-client-ui-slots";

const seeds: Record<string, unknown> = {
  react: React,
  "react-dom": ReactDOM,
  "react-dom/client": ReactDOMClient,
  "react/jsx-runtime": JSXRuntime,
  "@deepseek-ai/cordis": Cordis,
  "@deepseek-ai/dsh-client-ui-slots": SlotCore,
};
const factories = new Map<string, (require: (id: string) => unknown) => any>();
(window as any).__ModuleLoader__ = {
  load(row: any) {
    factories.set(row.id, row.factory);
  },
};
async function load(url: string, id: string) {
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = url;
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.append(script);
  });
  return factories.get(id)!((request) => {
    if (!(request in seeds))
      throw new Error(`Unexpected client dependency: ${request}`);
    return seeds[request];
  });
}
const renderer = await load(
  "/renderer.js",
  "@deepseek-ai/dsh-client-ui-renderer",
);
const plugin = await load("/client.js", "@chronicle-iras/dsh-wandao");
const ctx = new Cordis.Context();
ctx.provide("connection", {
  rpc: {
    async call(
      channel: string,
      endpoint: string,
      payload: unknown,
      signal?: AbortSignal,
    ) {
      const rpcId = crypto.randomUUID();
      const response = await fetch(`${channel}/${endpoint}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: "client-request",
          rpcId,
          method: endpoint,
          payload,
        }),
        signal,
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const message = await response.json();
      if (message.rpcId !== rpcId) throw new Error("RPC correlation failed");
      return message.result;
    },
  },
} as any);
await ctx.plugin(renderer).await();
const absentBinding = { hooks: {}, keyedHooks: {}, props: {} };
const absentSource = {
  getSnapshot: () => absentBinding,
  subscribe: () => () => {},
};
ctx.slots.installScope("session", {
  current: absentSource,
  bindingSource: () => absentSource,
});
function Shell({ renderSlot }: any) {
  const [panel, setPanel] = React.useState("home");
  return (
    <div className="preview-shell">
      <aside>
        <div className="preview-brand">
          deepseek <small>HARNESS</small>
        </div>
        <button className="preview-new" onClick={() => setPanel("home")}>
          ＋ 新会话
        </button>
        <nav aria-label="主导航">
          <button onClick={() => setPanel("home")}>♧ 插件</button>
          <button onClick={() => setPanel("home")}>♧ 归藏设计</button>
          <button onClick={() => setPanel("home")}>◷ 自动化任务</button>
          <button onClick={() => setPanel("home")}>▤ 上下文洞察</button>
          {ctx.slots.entries("sidebar.panellist").map((entry: any) => (
            <button
              key={entry.options.id}
              aria-current={panel === entry.options.id ? "page" : undefined}
              onClick={() => setPanel(entry.options.id)}
            >
              {renderSlot(
                "sidebar.panellist",
                { size: 20, active: panel === entry.options.id },
                { only: entry.options.id },
              )}
              <span>{entry.options.label}</span>
            </button>
          ))}
          <button onClick={() => setPanel("home")}>⊞ 更多</button>
        </nav>
        <div className="preview-caption">DSH 插件测试环境</div>
      </aside>
      <div className="preview-main">
        {panel === "home" ? (
          <div className="preview-home">从侧边栏打开“万能导”</div>
        ) : (
          renderSlot("main", {}, { entryKey: panel })
        )}
      </div>
    </div>
  );
}
ctx.slots.register(
  {
    name: "root",
    children: {
      main: { kind: "keyed", scope: "root" },
      "sidebar.panellist": { kind: "list", scope: "root" },
    },
  } as any,
  Shell as any,
);
await ctx.plugin(plugin).await();
ctx.uiRenderer.mount(document.getElementById("root")!);
(window as any).__WANDAOPREVIEW__ = { ctx };
