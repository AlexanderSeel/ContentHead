export type LayoutMetadata = {
  row?: number;
  order?: number;
  span?: number;
  spanMd?: number;
  spanLg?: number;
};

export type UiConfigRecord = Record<string, unknown> & {
  layout?: LayoutMetadata;
};

export type FieldWithLayout = {
  id: number;
  position: number;
  uiConfigJson: string;
};

export type DesignerRow = {
  row: number;
  items: Array<{
    fieldId: number;
    span: number;
    spanMd?: number;
    spanLg?: number;
  }>;
};

type RowItemInternal = {
  fieldId: number;
  span: number;
  spanMd?: number;
  spanLg?: number;
  order: number;
  fallback: number;
};

function withOptionalNumber(target: Record<string, unknown>, key: string, value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    target[key] = value;
  }
}

function safeParse(value: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      return parsed as Record<string, unknown>;
    }
    return {};
  } catch {
    return {};
  }
}

function clampSpan(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 12;
  }
  return Math.max(1, Math.min(12, Math.round(parsed)));
}

function cleanLayout(layout: LayoutMetadata): LayoutMetadata {
  const next: Record<string, unknown> = { span: clampSpan(layout.span) };
  withOptionalNumber(next, 'row', layout.row);
  withOptionalNumber(next, 'order', layout.order);
  if (layout.spanMd != null) {
    next.spanMd = clampSpan(layout.spanMd);
  }
  if (layout.spanLg != null) {
    next.spanLg = clampSpan(layout.spanLg);
  }
  return next as LayoutMetadata;
}

export function parseUiConfigJson(value: string): UiConfigRecord {
  const parsed = safeParse(value);
  const layoutRaw = parsed.layout;
  const next: UiConfigRecord = { ...parsed };
  if (layoutRaw && typeof layoutRaw === 'object' && !Array.isArray(layoutRaw)) {
    next.layout = cleanLayout(layoutRaw as LayoutMetadata);
  }
  return next;
}

export function stringifyUiConfigJson(config: UiConfigRecord): string {
  const next = { ...config };
  if (next.layout) {
    next.layout = cleanLayout(next.layout);
  }
  return JSON.stringify(next);
}

export function buildDesignerRows(fields: FieldWithLayout[]): DesignerRow[] {
  const sorted = [...fields].sort((a, b) => a.position - b.position || a.id - b.id);
  const rows = new Map<number, RowItemInternal[]>();

  sorted.forEach((field, index) => {
    const config = parseUiConfigJson(field.uiConfigJson);
    const layout = config.layout;
    const row = layout?.row ?? index;
    const item: RowItemInternal = {
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
          const entry: { fieldId: number; span: number; spanMd?: number; spanLg?: number } = { fieldId, span };
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

export function applyDesignerRows<T extends FieldWithLayout>(fields: T[], rows: DesignerRow[]): T[] {
  const ordered: Array<{ fieldId: number; row: number; order: number; span: number; spanMd?: number; spanLg?: number }> = [];

  rows.forEach((row, rowIndex) => {
    row.items.forEach((item, order) => {
      const next: { fieldId: number; row: number; order: number; span: number; spanMd?: number; spanLg?: number } = {
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

  const orderById = new Map<number, typeof ordered[number]>();
  ordered.forEach((item) => orderById.set(item.fieldId, item));

  return fields.map((field) => {
    const layoutInfo = orderById.get(field.id);
    if (!layoutInfo) {
      return field;
    }

    const config = parseUiConfigJson(field.uiConfigJson);
    const layout: LayoutMetadata = {
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

    const nextConfig: UiConfigRecord = { ...config, layout: cleanLayout(layout) };

    return {
      ...field,
      position: (layoutInfo.row * 1000) + (layoutInfo.order * 10),
      uiConfigJson: stringifyUiConfigJson(nextConfig)
    };
  });
}
