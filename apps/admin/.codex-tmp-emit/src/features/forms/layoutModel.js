function withOptionalNumber(target, key, value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
        target[key] = value;
    }
}
function safeParse(value) {
    try {
        const parsed = JSON.parse(value);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            return parsed;
        }
        return {};
    }
    catch {
        return {};
    }
}
function clampSpan(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return 12;
    }
    return Math.max(1, Math.min(12, Math.round(parsed)));
}
function cleanLayout(layout) {
    const next = { span: clampSpan(layout.span) };
    withOptionalNumber(next, 'row', layout.row);
    withOptionalNumber(next, 'order', layout.order);
    if (layout.spanMd != null) {
        next.spanMd = clampSpan(layout.spanMd);
    }
    if (layout.spanLg != null) {
        next.spanLg = clampSpan(layout.spanLg);
    }
    return next;
}
export function parseUiConfigJson(value) {
    const parsed = safeParse(value);
    const layoutRaw = parsed.layout;
    const next = { ...parsed };
    if (layoutRaw && typeof layoutRaw === 'object' && !Array.isArray(layoutRaw)) {
        next.layout = cleanLayout(layoutRaw);
    }
    return next;
}
export function stringifyUiConfigJson(config) {
    const next = { ...config };
    if (next.layout) {
        next.layout = cleanLayout(next.layout);
    }
    return JSON.stringify(next);
}
export function buildDesignerRows(fields) {
    const sorted = [...fields].sort((a, b) => a.position - b.position || a.id - b.id);
    const rows = new Map();
    sorted.forEach((field, index) => {
        const config = parseUiConfigJson(field.uiConfigJson);
        const layout = config.layout;
        const row = layout?.row ?? index;
        const item = {
            fieldId: field.id,
            span: clampSpan(layout?.span),
            order: layout?.order ?? index,
            fallback: index
        };
        if (layout?.spanMd != null) {
            item.spanMd = clampSpan(layout.spanMd);
        }
        if (layout?.spanLg != null) {
            item.spanLg = clampSpan(layout.spanLg);
        }
        const list = rows.get(row) ?? [];
        list.push(item);
        rows.set(row, list);
    });
    return [...rows.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([row, items]) => ({
        row,
        items: [...items]
            .sort((a, b) => a.order - b.order || a.fallback - b.fallback)
            .map(({ fieldId, span, spanMd, spanLg }) => {
            const entry = { fieldId, span };
            if (typeof spanMd === 'number') {
                entry.spanMd = spanMd;
            }
            if (typeof spanLg === 'number') {
                entry.spanLg = spanLg;
            }
            return entry;
        })
    }));
}
export function applyDesignerRows(fields, rows) {
    const ordered = [];
    rows.forEach((row, rowIndex) => {
        row.items.forEach((item, order) => {
            const next = {
                fieldId: item.fieldId,
                row: rowIndex,
                order,
                span: clampSpan(item.span)
            };
            if (item.spanMd != null) {
                next.spanMd = clampSpan(item.spanMd);
            }
            if (item.spanLg != null) {
                next.spanLg = clampSpan(item.spanLg);
            }
            ordered.push(next);
        });
    });
    const orderById = new Map();
    ordered.forEach((item) => orderById.set(item.fieldId, item));
    return fields.map((field) => {
        const layoutInfo = orderById.get(field.id);
        if (!layoutInfo) {
            return field;
        }
        const config = parseUiConfigJson(field.uiConfigJson);
        const layout = {
            row: layoutInfo.row,
            order: layoutInfo.order,
            span: layoutInfo.span
        };
        if (layoutInfo.spanMd != null) {
            layout.spanMd = layoutInfo.spanMd;
        }
        if (layoutInfo.spanLg != null) {
            layout.spanLg = layoutInfo.spanLg;
        }
        const nextConfig = { ...config, layout: cleanLayout(layout) };
        return {
            ...field,
            position: (layoutInfo.row * 1000) + (layoutInfo.order * 10),
            uiConfigJson: stringifyUiConfigJson(nextConfig)
        };
    });
}
