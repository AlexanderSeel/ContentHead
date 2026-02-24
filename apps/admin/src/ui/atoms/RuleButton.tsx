import { useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import type { Rule } from '@contenthead/shared';

import { RuleEditorDialog } from '../../components/rules/RuleEditorDialog';

function summarize(rule: Rule | null | undefined): string {
  if (!rule) {
    return 'No rule';
  }
  const root = rule as { all?: unknown[]; any?: unknown[] };
  if (Array.isArray(root.all)) {
    return `ALL (${root.all.length})`;
  }
  if (Array.isArray(root.any)) {
    return `ANY (${root.any.length})`;
  }
  return 'Custom rule';
}

export function RuleButton({
  value,
  fields,
  onChange,
  label = 'Edit Rule'
}: {
  value: Rule | null;
  fields: Array<{ label: string; value: string }>;
  onChange: (next: Rule) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const summary = useMemo(() => summarize(value), [value]);

  return (
    <>
      <div className="inline-actions">
        <Button label={label} onClick={() => setOpen(true)} />
        <small className="muted">{summary}</small>
      </div>
      <RuleEditorDialog
        visible={open}
        initialRule={value}
        fields={fields}
        onHide={() => setOpen(false)}
        onApply={(next) => {
          onChange(next);
          setOpen(false);
        }}
      />
    </>
  );
}
