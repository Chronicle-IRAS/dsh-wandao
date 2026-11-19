export function fieldsForAction(description, actionId) {
    return description.fields.filter((f) => !f.private && (!f.actions?.length || f.actions.includes(actionId)));
}
export function initialValues(description, outputRoot) {
    return Object.fromEntries(description.fields
        .filter((f) => !f.private)
        .map((f) => [
        f.name,
        f.name === "output"
            ? `${outputRoot.replace(/[\\/]+$/, "")}${outputRoot.includes("\\") ? "\\" : "/"}${description.pluginId}`
            : (f.default ?? (f.type === "checkbox" ? false : "")),
    ]));
}
export function valuesForAction(description, actionId, values) {
    return Object.fromEntries(fieldsForAction(description, actionId)
        .filter((f) => values[f.name] !== "" && values[f.name] !== undefined)
        .map((f) => [f.name, values[f.name]]));
}
function at(data, key = "") {
    return key
        .split(".")
        .filter(Boolean)
        .reduce((v, part) => v && typeof v === "object"
        ? v[part]
        : undefined, data);
}
export function scanRows(description, data) {
    const toc = description.toc;
    const items = at(data, toc?.itemsPath ?? "nodes");
    if (!Array.isArray(items))
        return [];
    if (toc?.adapter === "yinxiang-notebooks")
        return items.flatMap((book) => Array.isArray(book?.notes)
            ? book.notes
                .filter((note) => note?.guid)
                .map((note) => ({
                id: String(note.guid),
                title: `${book.name || "笔记本"} / ${note.title || note.guid}`,
            }))
            : []);
    if (toc?.adapter === "zsxq-column-groups")
        return items.flatMap((group, groupIndex) => Array.isArray(group?.topics)
            ? group.topics
                .filter((topic) => topic && typeof topic === "object")
                .map((topic, topicIndex) => ({
                id: String(topic.key ||
                    `toc:${group.groupIndex ?? groupIndex}:${topic.topicIndex ?? topicIndex}`),
                title: `${group.groupTitle || "专栏"} / ${topic.title || "未命名"}`,
            }))
            : []);
    return items
        .filter((item) => item &&
        typeof item === "object" &&
        (!toc?.selectableKey || item[toc.selectableKey] !== false))
        .flatMap((item) => {
        const id = item[toc?.exportIdKey ?? toc?.idKey ?? "exportId"];
        return (typeof id === "string" && id) ||
            (typeof id === "number" && Number.isFinite(id))
            ? [
                {
                    id: String(id),
                    title: String(item[toc?.titleKey ?? "title"] ?? id),
                },
            ]
            : [];
    });
}
export function updatedOptions(action, data) {
    return Object.fromEntries((action.updates ?? [])
        .filter((update) => update.type === "options")
        .map((update) => {
        const items = at(data, update.path);
        return [
            update.field,
            Array.isArray(items)
                ? items
                    .filter((item) => item && typeof item === "object")
                    .map((item) => ({
                    value: String(item[update.valueKey ?? "value"] ?? ""),
                    label: String(item[update.labelKey ?? "label"] ??
                        item[update.valueKey ?? "value"] ??
                        ""),
                }))
                    .filter((item) => item.value)
                : [],
        ];
    }));
}
export function parsePreview(preview) {
    try {
        return JSON.parse(preview ?? "");
    }
    catch {
        return undefined;
    }
}
export const terminal = (status) => ["completed", "failed", "killed"].includes(status);
