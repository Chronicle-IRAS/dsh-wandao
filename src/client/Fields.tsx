import type { ProviderField } from "../ui-contract.js";
import type { Options, Values } from "./model.js";

export function Fields({
  fields,
  values,
  options,
  onChange,
}: {
  fields: ProviderField[];
  values: Values;
  options: Options;
  onChange(name: string, value: string | number | boolean): void;
}) {
  return (
    <div className="wandao-fields">
      {fields.map((field) => {
        const id = `wandao-field-${field.name}`;
        const label = field.label || field.name;
        if (field.type === "checkbox")
          return (
            <label
              className="wandao-check wandao-option"
              key={field.name}
              htmlFor={id}
            >
              <input
                id={id}
                type="checkbox"
                checked={values[field.name] === true}
                onChange={(event) => onChange(field.name, event.target.checked)}
              />
              {label}
            </label>
          );
        const choices =
          options[field.name] ??
          (field.options ?? []).map((option) =>
            typeof option === "string"
              ? { value: option, label: option }
              : { ...option, label: option.label ?? option.value },
          );
        return (
          <label className="wandao-field" key={field.name} htmlFor={id}>
            <span>
              {label}
              {field.required ? (
                <span className="wandao-required"> *</span>
              ) : null}
            </span>
            {field.type === "select" && choices.length ? (
              <select
                id={id}
                required={field.required}
                value={String(values[field.name] ?? "")}
                onChange={(event) => onChange(field.name, event.target.value)}
              >
                <option value="">请选择</option>
                {choices.map((choice) => (
                  <option key={choice.value} value={choice.value}>
                    {choice.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                id={id}
                type={field.type === "number" ? "number" : "text"}
                step={field.type === "number" ? "any" : undefined}
                min={field.min}
                max={field.max}
                required={field.required}
                autoComplete="off"
                value={String(values[field.name] ?? "")}
                placeholder={
                  field.type === "directory" || field.type === "file"
                    ? "输入宿主机上的绝对路径"
                    : field.type === "select"
                      ? "先列出目标，再填写目标 ID"
                      : undefined
                }
                onChange={(event) =>
                  onChange(
                    field.name,
                    field.type === "number" && event.target.value !== ""
                      ? Number(event.target.value)
                      : event.target.value,
                  )
                }
              />
            )}
            {field.type === "directory" || field.type === "file" ? (
              <small className="wandao-field-help">
                {field.name === "output"
                  ? "文件将保存到此目录"
                  : "填写运行 DSH 的电脑上的绝对路径"}
              </small>
            ) : null}
          </label>
        );
      })}
    </div>
  );
}
