import { useEffect, useState } from "react";
import type { UiApi, UiTask } from "../ui-contract.js";
import { parsePreview, terminal } from "./model.js";
export const statusLabels: Record<string, string> = {
  running: "进行中",
  completed: "已完成",
  failed: "未完成",
  killed: "已停止",
  paused: "限流暂停",
  partial: "部分完成",
  stopped: "已停止",
};
export function useTasks(api: UiApi) {
  const [tasks, setTasks] = useState<UiTask[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const poll = async () => {
      try {
        const result = await api.tasks(controller.signal);
        if (!controller.signal.aborted) {
          setTasks(result.tasks);
          setError("");
        }
      } catch (error) {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "任务加载失败");
      }
      if (!controller.signal.aborted) timer = setTimeout(poll, 1000);
    };
    void poll();
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [api]);
  return { tasks, error };
}
export function Tasks({
  api,
  tasks,
  error,
}: {
  api: UiApi;
  tasks: UiTask[];
  error: string;
}) {
  const [operationError, setOperationError] = useState("");
  const [pending, setPending] = useState("");
  async function act(id: string, operation: () => Promise<unknown>) {
    setPending(id);
    setOperationError("");
    try {
      await operation();
    } catch (error) {
      setOperationError(error instanceof Error ? error.message : "操作失败");
    } finally {
      setPending("");
    }
  }
  return (
    <section className="wandao-task-panel" aria-label="迁移任务">
      <div className="wandao-task-panel-heading">
        <h2>
          迁移任务 <span className="wandao-badge">{tasks.length}</span>
        </h2>
        <span className="wandao-muted">
          {tasks.some((task) => !terminal(task.status))
            ? "正在执行"
            : "最近记录"}
        </span>
      </div>
      {error || operationError ? (
        <p role="alert" className="wandao-error">
          {error || operationError}
        </p>
      ) : null}
      {!tasks.length ? (
        <div className="wandao-empty">
          <span className="wandao-empty-icon" aria-hidden="true">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M7 4h10a2 2 0 0 1 2 2v14H5V6a2 2 0 0 1 2-2ZM9 4V2h6v2M9 10h6m-6 4h4" />
            </svg>
          </span>
          <p>还没有迁移任务</p>
          <p className="wandao-muted">选择平台并执行动作，进度会显示在这里。</p>
          <ol className="wandao-quick-start">
            <li>选择迁移平台</li>
            <li>填写目录与必要设置</li>
            <li>开始任务，查看执行结果</li>
          </ol>
        </div>
      ) : (
        <ol className="wandao-task-list">
          {tasks.map((task) => {
            const summary = parsePreview(task.result?.preview) as
              Record<string, unknown> | undefined;
            const outcome = task.result?.outcome ?? task.status;
            return (
              <li key={task.jobId}>
                <div className="wandao-task-heading">
                  <strong>{task.label.replace(/^Wandao /, "")}</strong>
                  <span className={`wandao-status wandao-status-${outcome}`}>
                    {statusLabels[outcome] ?? outcome}
                  </span>
                </div>
                <p className="wandao-muted">
                  {new Date(task.startedAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  {task.progress ? ` · ${task.progress}` : ""}
                </p>
                {!terminal(task.status) ? (
                  <div className="wandao-progress" aria-label="任务执行中">
                    <span />
                  </div>
                ) : null}
                {task.detail && task.detail !== task.result?.outcome ? (
                  <p className="wandao-task-detail">{task.detail}</p>
                ) : null}
                {summary &&
                ["totalDocs", "successCount", "failureCount"].some(
                  (key) => typeof summary[key] === "number",
                ) ? (
                  <p className="wandao-counts">
                    {typeof summary.successCount === "number"
                      ? `总数 ${summary.totalDocs ?? 0} · 成功 ${summary.successCount} · 失败 ${summary.failureCount ?? 0}`
                      : `共 ${summary.totalDocs ?? 0} 项`}
                  </p>
                ) : null}
                {typeof summary?.output === "string" && summary.output ? (
                  <p className="wandao-path">{summary.output}</p>
                ) : null}
                {task.result &&
                !["login", "saveConfig"].includes(task.result.actionId) ? (
                  <details className="wandao-result">
                    <summary>查看结果</summary>
                    <pre>{task.result.preview}</pre>
                    {task.result.truncated ? (
                      <p className="wandao-muted">
                        显示的是有限摘要，完整结果保留在宿主机。
                      </p>
                    ) : null}
                  </details>
                ) : null}
                {!terminal(task.status) ? (
                  <div className="wandao-task-actions">
                    {task.canConfirmLogin ? (
                      <button
                        className="wandao-button"
                        disabled={pending === task.jobId}
                        onClick={() =>
                          void act(task.jobId, () => api.loginDone(task.jobId))
                        }
                      >
                        我已完成网页登录
                      </button>
                    ) : null}
                    <button
                      className="wandao-button wandao-button-quiet"
                      disabled={pending === task.jobId}
                      onClick={() =>
                        void act(task.jobId, () => api.cancel(task.jobId))
                      }
                    >
                      停止任务
                    </button>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
