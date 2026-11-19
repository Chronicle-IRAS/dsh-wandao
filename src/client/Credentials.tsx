import { useState } from "react";
import type { ProviderField, UiApi } from "../ui-contract.js";
export function Credentials({
  api,
  providerId,
  fields,
}: {
  api: UiApi;
  providerId: string;
  fields: ProviderField[];
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  if (!fields.length) return null;
  return (
    <details className="wandao-credentials">
      <summary>账号与 API 设置</summary>
      <p className="wandao-muted">
        仅保存到宿主机，留空保留原值。不会发送给模型。
      </p>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          if (saving) return;
          setSaving(true);
          setMessage("");
          try {
            await api.saveCredentials(providerId, values);
            setValues({});
            setMessage("设置已保存");
          } catch (error) {
            setMessage(error instanceof Error ? error.message : "保存失败");
          } finally {
            setSaving(false);
          }
        }}
      >
        {fields.map((field) => (
          <label className="wandao-field" key={field.name}>
            <span>{field.label || field.name}</span>
            <input
              type="password"
              autoComplete="new-password"
              value={values[field.name] ?? ""}
              onChange={(event) =>
                setValues((old) => ({
                  ...old,
                  [field.name]: event.target.value,
                }))
              }
            />
          </label>
        ))}
        <button
          className="wandao-button"
          type="submit"
          disabled={saving || !Object.values(values).some(Boolean)}
        >
          {saving ? "保存中…" : "保存账号设置"}
        </button>
        <p role="status" className="wandao-muted">
          {message}
        </p>
      </form>
    </details>
  );
}
