import { useState } from "react";

export function Documents({
  rows,
  selected,
  selectionOnly,
  onSelect,
  onSelectionOnly,
}: {
  rows: Array<{ id: string; title: string }>;
  selected: Set<string>;
  selectionOnly: boolean;
  onSelect(selected: Set<string>): void;
  onSelectionOnly(value: boolean): void;
}) {
  const [query, setQuery] = useState("");
  const needle = query.trim().toLocaleLowerCase();
  const visible = rows.filter((row) =>
    `${row.title} ${row.id}`.toLocaleLowerCase().includes(needle),
  );
  return (
    <section className="wandao-documents" aria-label="已扫描文档">
      <div className="wandao-documents-heading">
        <h3>
          已扫描文档 <span className="wandao-badge">{rows.length}</span>
        </h3>
        <span className="wandao-muted" role="status">
          已选 {selected.size} / {rows.length} 篇
        </span>
      </div>
      <label className="wandao-field wandao-document-search">
        <span className="wandao-sr-only">搜索已扫描文档</span>
        <input
          type="search"
          onKeyDown={(event) => {
            if (event.key === "Enter") event.preventDefault();
          }}
          placeholder="搜索文档名称或路径…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="wandao-selection-tools">
        <button
          className="wandao-button wandao-button-quiet"
          type="button"
          disabled={!visible.length}
          onClick={() =>
            onSelect(new Set([...selected, ...visible.map((row) => row.id)]))
          }
        >
          全选当前结果
        </button>
        <button
          className="wandao-button wandao-button-quiet"
          type="button"
          disabled={!selected.size}
          onClick={() => onSelect(new Set())}
        >
          清空选择
        </button>
      </div>
      <ul>
        {visible.map((row) => (
          <li key={row.id}>
            <label className="wandao-check">
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={(event) => {
                  const next = new Set(selected);
                  if (event.target.checked) next.add(row.id);
                  else next.delete(row.id);
                  onSelect(next);
                }}
              />
              <span title={row.id}>{row.title}</span>
            </label>
          </li>
        ))}
      </ul>
      {!visible.length ? (
        <p className="wandao-no-results">没有匹配的文档</p>
      ) : null}
      <label className="wandao-check">
        <input
          type="checkbox"
          checked={selectionOnly}
          onChange={(event) => onSelectionOnly(event.target.checked)}
        />
        仅迁移勾选项
      </label>
      <p className="wandao-muted">
        这里只展示部分目录摘要；关闭“仅迁移勾选项”可迁移全部文档。
      </p>
    </section>
  );
}
