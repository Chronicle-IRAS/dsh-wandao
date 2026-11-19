import { useEffect, useRef, useState } from "react";
import type {
  ActionRequest,
  Catalogue,
  ProviderDescription,
  UiApi,
  UiTask,
} from "../ui-contract.js";
import { Credentials } from "./Credentials.js";
import { Fields } from "./Fields.js";
import { Documents } from "./Documents.js";
import {
  fieldsForAction,
  initialValues,
  parsePreview,
  scanRows,
  terminal,
  updatedOptions,
  valuesForAction,
  type Options,
  type Values,
} from "./model.js";

export function MigrationForm({
  api,
  providerId,
  catalogue,
  tasks,
}: {
  api: UiApi;
  providerId: string;
  catalogue: Catalogue;
  tasks: UiTask[];
}) {
  const [description, setDescription] = useState<ProviderDescription>();
  const [error, setError] = useState("");
  const [actionId, setActionId] = useState("");
  const [values, setValues] = useState<Values>({});
  const [options, setOptions] = useState<Options>({});
  const [busy, setBusy] = useState(false);
  const [pendingJob, setPendingJob] = useState<{
    id: string;
    actionId: string;
  }>();
  const [rows, setRows] = useState<Array<{ id: string; title: string }>>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectionOnly, setSelectionOnly] = useState(false);
  const [confirmation, setConfirmation] = useState<ActionRequest>();
  const dialog = useRef<HTMLDialogElement>(null);
  const mounted = useRef(true);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);
  useEffect(() => {
    const controller = new AbortController();
    void api
      .describe(providerId, controller.signal)
      .then((data) => {
        if (controller.signal.aborted) return;
        setDescription(data);
        setValues(initialValues(data, catalogue.outputRoot));
        setActionId(
          (
            data.actions.find((action) => action.kind === "export") ??
            data.actions.find((action) => action.kind === "import") ??
            data.actions[0]
          )?.id ?? "",
        );
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(error instanceof Error ? error.message : "平台加载失败");
      });
    return () => controller.abort();
  }, [api, providerId, catalogue.outputRoot]);
  useEffect(() => {
    if (confirmation) dialog.current?.showModal();
    else dialog.current?.close();
  }, [confirmation]);
  useEffect(() => {
    if (!description || !pendingJob) return;
    const task = tasks.find((task) => task.jobId === pendingJob.id);
    if (!task || !terminal(task.status)) return;
    setPendingJob(undefined);
    if (!task.result) return;
    const data = parsePreview(task.result.preview);
    const action = description.actions.find(
      (action) => action.id === pendingJob.actionId,
    );
    if (action?.kind === "scan") {
      setRows(scanRows(description, data));
      setSelected(new Set());
      setSelectionOnly(false);
    }
    if (action)
      setOptions((old) => ({ ...old, ...updatedOptions(action, data) }));
  }, [tasks, pendingJob, description]);
  async function start(request: ActionRequest) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const task = await api.start(request);
      if (mounted.current)
        setPendingJob({ id: task.jobId, actionId: request.actionId });
    } catch (error) {
      if (mounted.current)
        setError(error instanceof Error ? error.message : "启动失败");
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  if (!description)
    return (
      <section className="wandao-form-panel">
        <p role={error ? "alert" : "status"}>{error || "正在加载平台…"}</p>
      </section>
    );
  const action = description.actions.find((action) => action.id === actionId);
  const active =
    tasks.some((task) => !terminal(task.status)) ||
    Boolean(pendingJob && !tasks.some((task) => task.jobId === pendingJob.id));
  const provider = catalogue.providers.find(
    (provider) => provider.id === providerId,
  );
  const write =
    action?.kind === "import" || Boolean(action?.confirm || action?.danger);
  const canSelect =
    ["export", "import"].includes(action?.kind ?? "") &&
    action?.includeSelection !== false;
  return (
    <section className="wandao-form-panel" aria-label="迁移设置">
      <div className="wandao-panel-eyebrow">迁移配置</div>
      <h2>{provider?.title}</h2>
      <p className="wandao-muted">{description.description}</p>
      {provider?.supported === false ? (
        <p role="alert" className="wandao-error">
          当前操作系统不支持这个平台。
        </p>
      ) : null}
      <Credentials
        api={api}
        providerId={providerId}
        fields={description.fields.filter((field) => field.private)}
      />
      {!description.actions.length ? (
        <p>此平台提供迁移指南，请展开下方说明。</p>
      ) : (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (!action || busy || active) return;
            if (selectionOnly && canSelect && !selected.size) {
              setError("请至少勾选一篇文档，或关闭仅迁移勾选项");
              return;
            }
            const request: ActionRequest = {
              providerId,
              actionId,
              fields: valuesForAction(description, actionId, values),
              ...(selectionOnly && canSelect ? { docIds: [...selected] } : {}),
            };
            if (
              values.__resume === true &&
              description.checkpoint.supported &&
              ["export", "import"].includes(action.kind)
            )
              request.resume = true;
            if (write) setConfirmation(request);
            else void start(request);
          }}
        >
          <fieldset className="wandao-action-fields" disabled={busy || active}>
            <label className="wandao-field">
              <span>操作步骤</span>
              <select
                aria-label="操作步骤"
                value={actionId}
                onChange={(event) => {
                  setActionId(event.target.value);
                  setError("");
                }}
              >
                {description.actions.map((action) => (
                  <option key={action.id} value={action.id}>
                    {action.label || action.id}
                  </option>
                ))}
              </select>
            </label>
            {action?.kind === "scan" ? (
              <p className="wandao-action-hint">
                先读取目录了解来源内容，再切换到导出或导入步骤。
              </p>
            ) : null}
            <div className="wandao-field-divider" />
            <Fields
              fields={fieldsForAction(description, actionId)}
              values={values}
              options={options}
              onChange={(name, value) => {
                setValues((old) => ({ ...old, [name]: value }));
                if (typeof value === "string" && name !== "output") {
                  setRows([]);
                  setSelected(new Set());
                  setSelectionOnly(false);
                }
              }}
            />
            {description.checkpoint.supported &&
            ["export", "import"].includes(action?.kind ?? "") ? (
              <label className="wandao-check">
                <input
                  type="checkbox"
                  checked={values.__resume === true}
                  onChange={(event) =>
                    setValues((old) => ({
                      ...old,
                      __resume: event.target.checked,
                    }))
                  }
                />
                从上次断点继续
              </label>
            ) : null}
            {rows.length ? (
              <Documents
                rows={rows}
                selected={selected}
                selectionOnly={selectionOnly}
                onSelect={setSelected}
                onSelectionOnly={setSelectionOnly}
              />
            ) : null}
            <div className="wandao-form-footer">
              <button
                className="wandao-button wandao-button-primary"
                type="submit"
                disabled={busy || active || provider?.supported === false}
              >
                {busy
                  ? "正在启动…"
                  : active
                    ? "任务执行中"
                    : action?.label || "执行动作"}
              </button>
              <span className="wandao-muted">
                {action?.kind === "login"
                  ? "在本机浏览器完成登录后，确认登录任务。"
                  : action?.kind === "export"
                    ? "已有目标文件可能被覆盖，请选择合适的导出目录。"
                    : "任务在后台执行，可随时查看进度。"}
              </span>
            </div>
          </fieldset>
        </form>
      )}
      {error ? (
        <p role="alert" className="wandao-error">
          {error}
        </p>
      ) : null}
      <details className="wandao-guide">
        <summary>平台使用说明</summary>
        <pre>{description.guide || "此平台暂无附加说明。"}</pre>
      </details>
      <dialog
        className="wandao-confirm"
        ref={dialog}
        onCancel={() => setConfirmation(undefined)}
        onClose={() => setConfirmation(undefined)}
      >
        <h2>确认写入目标平台</h2>
        <p>
          即将执行“{action?.label}
          ”，将向目标平台创建或更新内容。请确认账号、目标位置和来源目录。
        </p>
        <dl>
          {Object.entries(confirmation?.fields ?? {})
            .filter(([, value]) => typeof value === "string" && value)
            .map(([key, value]) => (
              <div key={key}>
                <dt>
                  {description.fields.find((field) => field.name === key)
                    ?.label || key}
                </dt>
                <dd>{String(value)}</dd>
              </div>
            ))}
        </dl>
        <div className="wandao-task-actions">
          <button
            className="wandao-button"
            onClick={() => setConfirmation(undefined)}
          >
            返回检查
          </button>
          <button
            className="wandao-button wandao-button-primary"
            onClick={() => {
              if (confirmation) {
                const request = confirmation;
                setConfirmation(undefined);
                void start({ ...request, confirmWrite: true });
              }
            }}
          >
            确认执行
          </button>
        </div>
      </dialog>
    </section>
  );
}
