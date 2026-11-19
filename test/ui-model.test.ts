import assert from "node:assert/strict";
import test from "node:test";
import {
  fieldsForAction,
  initialValues,
  scanRows,
  updatedOptions,
  valuesForAction,
} from "../src/client/model.ts";
import type { ProviderDescription } from "../src/ui-contract.ts";
const description: ProviderDescription = {
  providerId: "test",
  pluginId: "test",
  description: "",
  guide: "",
  checkpoint: {},
  fields: [
    { name: "output", type: "directory", private: false, actions: ["export"] },
    { name: "api_key", private: true },
    { name: "incremental", type: "checkbox", default: false, private: false },
  ],
  actions: [],
  toc: { itemsPath: "ordered", exportIdKey: "wiki_token", titleKey: "title" },
};
test("scan selection retains numeric Yuque IDs and nested notebook documents", () => {
  assert.deepEqual(
    scanRows(
      {
        ...description,
        toc: { itemsPath: "docs", exportIdKey: "doc_id", titleKey: "title" },
      },
      { docs: [{ doc_id: 123, title: "Doc" }] },
    ),
    [{ id: "123", title: "Doc" }],
  );
  assert.deepEqual(
    scanRows(
      {
        ...description,
        toc: { adapter: "yinxiang-notebooks", itemsPath: "notebooks" },
      } as any,
      {
        notebooks: [
          { name: "Book", notes: [{ guid: "note-id", title: "Note" }] },
        ],
      },
    ),
    [{ id: "note-id", title: "Book / Note" }],
  );
  assert.deepEqual(
    scanRows(
      {
        ...description,
        toc: { adapter: "zsxq-column-groups", itemsPath: "groups" },
      },
      {
        groups: [
          {
            groupIndex: 2,
            groupTitle: "Group",
            topics: [{ topicIndex: 4, title: "Topic" }],
          },
        ],
      },
    ),
    [{ id: "toc:2:4", title: "Group / Topic" }],
  );
});
test("action forms keep credentials separate and never send hidden fields from another action", () => {
  assert.deepEqual(
    fieldsForAction(description, "login").map((f) => f.name),
    ["incremental"],
  );
  assert.deepEqual(initialValues(description, "/exports"), {
    output: "/exports/test",
    incremental: false,
  });
  assert.deepEqual(
    valuesForAction(description, "login", {
      output: "/exports/a",
      incremental: false,
      api_key: "private",
    }),
    { incremental: false },
  );
});
test("default export paths follow the host path separator", () => {
  for (const [root, expected] of [
    ["C:\\exports\\", "C:\\exports\\test"],
    ["\\\\host\\share", "\\\\host\\share\\test"],
    ["/exports/", "/exports/test"],
    ["E:/exports", "E:/exports/test"],
  ])
    assert.equal(initialValues(description, root).output, expected);
});
test("scan selection uses declared export IDs and dynamic targets update form options", () => {
  assert.deepEqual(
    scanRows(description, {
      ordered: [{ title: "Document", wiki_token: "wiki-id" }],
    }),
    [{ id: "wiki-id", title: "Document" }],
  );
  assert.deepEqual(
    updatedOptions(
      {
        id: "targets",
        kind: "check",
        updates: [
          {
            field: "parent_id",
            type: "options",
            path: "targets",
            valueKey: "id",
            labelKey: "label",
          },
        ],
      },
      { targets: [{ id: "p1", label: "Page" }] },
    ),
    { parent_id: [{ value: "p1", label: "Page" }] },
  );
});
