import { describe, expect, it } from 'vitest';

import { applyDesignerRows, buildDesignerRows, parseUiConfigJson } from './layoutModel';

describe('layoutModel', () => {
  it('builds rows from uiConfig layout metadata', () => {
    const rows = buildDesignerRows([
      { id: 1, position: 10, uiConfigJson: '{"layout":{"row":0,"order":1,"span":6}}' },
      { id: 2, position: 20, uiConfigJson: '{"layout":{"row":0,"order":0,"span":6}}' },
      { id: 3, position: 30, uiConfigJson: '{}' }
    ]);

    expect(rows).toHaveLength(2);
    expect(rows[0]?.items.map((item) => item.fieldId)).toEqual([2, 1]);
    expect(rows[0]?.items[0]?.span).toBe(6);
    expect(rows[1]?.items[0]?.fieldId).toBe(3);
  });

  it('serializes rows back into uiConfig.layout and position', () => {
    const fields = [
      { id: 1, position: 10, uiConfigJson: '{}' },
      { id: 2, position: 20, uiConfigJson: '{}' }
    ];

    const updated = applyDesignerRows(fields, [
      { row: 0, items: [{ fieldId: 2, span: 4 }] },
      { row: 1, items: [{ fieldId: 1, span: 8, spanMd: 12, spanLg: 6 }] }
    ]);

    const field1 = updated.find((entry) => entry.id === 1);
    const field2 = updated.find((entry) => entry.id === 2);

    expect(field2?.position).toBe(0);
    expect(field1?.position).toBe(1000);

    const ui1 = parseUiConfigJson(field1?.uiConfigJson ?? '{}');
    const ui2 = parseUiConfigJson(field2?.uiConfigJson ?? '{}');
    expect(ui2.layout?.row).toBe(0);
    expect(ui2.layout?.span).toBe(4);
    expect(ui1.layout?.row).toBe(1);
    expect(ui1.layout?.spanMd).toBe(12);
    expect(ui1.layout?.spanLg).toBe(6);
  });
});
