import { useEffect, useState } from "react";
import type { Catalogue, UiApi } from "../ui-contract.js";
import { MigrationForm } from "./MigrationForm.js";
import { Tasks, useTasks } from "./Tasks.js";
import styles from "./styles.css";

export function WandaoPage({ api }: { api: UiApi }) {
  const [catalogue, setCatalogue] = useState<Catalogue>();
  const [providerId, setProviderId] = useState("");
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [filter, setFilter] = useState("all");
  const { tasks, error: taskError } = useTasks(api);
  useEffect(() => {
    const controller = new AbortController();
    setError("");
    void api
      .catalogue(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setCatalogue(data);
        setProviderId(
          (old) =>
            old ||
            data.providers.find((provider) => provider.id === "obsidian-export")
              ?.id ||
            data.providers[0]?.id ||
            "",
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "平台加载失败");
      });
    return () => controller.abort();
  }, [api, retry]);
  const providers =
    catalogue?.providers.filter(
      (provider) =>
        filter === "all" ||
        (filter === "import"
          ? provider.id.includes("import")
          : !provider.id.includes("import")),
    ) ?? [];
  return (
    <main className="wandao-page">
      <style>{styles}</style>
      <div className="wandao-content">
        <header className="wandao-page-heading">
          <div className="wandao-title-group">
            <span className="wandao-app-icon" aria-hidden="true">
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 7V4h16v3M4 13v7h16v-7M12 7v9m-4-4 4 4 4-4" />
              </svg>
            </span>
            <div>
              <h1>万能导</h1>
              <p className="wandao-muted">导出、备份和迁移你的知识库</p>
            </div>
          </div>
          <span className="wandao-local-label">本机运行</span>
        </header>
        {error ? (
          <div role="alert" className="wandao-error">
            {error}{" "}
            <button
              className="wandao-button"
              onClick={() => setRetry((value) => value + 1)}
            >
              重试连接
            </button>
          </div>
        ) : null}
        {!catalogue && !error ? <p role="status">正在加载迁移平台…</p> : null}
        {catalogue ? (
          <>
            <section
              className="wandao-platform-picker"
              aria-label="平台与迁移方向"
            >
              <div className="wandao-filter" role="group" aria-label="迁移方向">
                {[
                  ["all", "全部"],
                  ["export", "导出"],
                  ["import", "导入"],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    aria-pressed={filter === value}
                    onClick={() => {
                      setFilter(value);
                      const first = catalogue.providers.find(
                        (provider) =>
                          value === "all" ||
                          (value === "import"
                            ? provider.id.includes("import")
                            : !provider.id.includes("import")),
                      );
                      if (
                        value !== "all" &&
                        (value === "import") !== providerId.includes("import")
                      )
                        setProviderId(first?.id ?? "");
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <label className="wandao-field">
                <span>选择平台</span>
                <select
                  aria-label="选择平台"
                  value={providerId}
                  onChange={(event) => setProviderId(event.target.value)}
                >
                  {providers.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.title}
                      {provider.supported ? "" : "（当前系统不支持）"}
                    </option>
                  ))}
                </select>
              </label>
              <span className="wandao-platform-count">
                {providers.length} 个迁移方案
              </span>
            </section>
            <div className="wandao-workspace">
              <MigrationForm
                key={providerId}
                api={api}
                catalogue={catalogue}
                providerId={providerId}
                tasks={tasks}
              />
              <Tasks api={api} tasks={tasks} error={taskError} />
            </div>
            <p className="wandao-footnote">
              来源目录和导出目录均位于 DSH
              宿主机。网页登录需要本机浏览器；取消任务后，独立浏览器窗口可能需要手动关闭。
            </p>
          </>
        ) : null}
      </div>
    </main>
  );
}
