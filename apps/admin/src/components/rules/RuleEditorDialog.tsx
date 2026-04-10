import { useMemo, useState } from 'react';
import { Button, DialogPanel, Select, TabItem, Tabs, Textarea, TextInput } from '../../ui/atoms';
import { evaluateRule, type Rule, type RuleContext } from '@contenthead/shared';
import { HelpDialog } from '../../help/HelpDialog';
import { HelpIcon } from '../../help/HelpIcon';
import { helpContent } from '../../help/helpContent';

type GroupMode = 'all' | 'any';
type Comparator = 'eq' | 'neq' | 'in' | 'contains' | 'gt' | 'lt' | 'regex';

type ConditionRow = {
  field: string;
  op: Comparator;
  value: string;
};

function parseRuleToRows(rule: Rule | null | undefined): { mode: GroupMode; rows: ConditionRow[] } {
  if (!rule || typeof rule !== 'object' || Array.isArray(rule)) {
    return { mode: 'all', rows: [{ field: 'country', op: 'eq', value: 'US' }] };
  }

  const root = rule as { all?: Rule[]; any?: Rule[]; op?: string; field?: string; value?: unknown };
  if (Array.isArray(root.all) || Array.isArray(root.any)) {
    const list = (root.all ?? root.any ?? []).map((entry) => {
      const r = entry as { field?: string; op?: Comparator; value?: unknown };
      return {
        field: typeof r.field === 'string' ? r.field : 'country',
        op: (r.op ?? 'eq') as Comparator,
        value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value ?? '')
      };
    });
    return { mode: root.all ? 'all' : 'any', rows: list.length > 0 ? list : [{ field: 'country', op: 'eq', value: 'US' }] };
  }

  return {
    mode: 'all',
    rows: [{ field: root.field ?? 'country', op: (root.op as Comparator) ?? 'eq', value: typeof root.value === 'string' ? root.value : JSON.stringify(root.value ?? '') }]
  };
}

function rowsToRule(mode: GroupMode, rows: ConditionRow[]): Rule {
  const mapped: Rule[] = rows.map((row) => ({
    field: row.field,
    op: row.op,
    value: row.op === 'in' ? row.value.split(',').map((entry) => entry.trim()).filter(Boolean) : row.value
  }));
  return mode === 'all' ? { all: mapped } : { any: mapped };
}

export function RuleEditorDialog({
  visible,
  initialRule,
  fields,
  onHide,
  onApply
}: {
  visible: boolean;
  initialRule: Rule | null | undefined;
  fields: Array<{ label: string; value: string }>;
  onHide: () => void;
  onApply: (rule: Rule) => void;
}) {
  const initial = useMemo(() => parseRuleToRows(initialRule), [initialRule]);
  const [mode, setMode] = useState<GroupMode>(initial.mode);
  const [rows, setRows] = useState<ConditionRow[]>(initial.rows);
  const [jsonValue, setJsonValue] = useState(JSON.stringify(rowsToRule(initial.mode, initial.rows), null, 2));
  const [testContext, setTestContext] = useState('{"country":"US"}');
  const [jsonError, setJsonError] = useState('');
  const [helpOpen, setHelpOpen] = useState(false);

  const currentRule = useMemo(() => rowsToRule(mode, rows), [mode, rows]);
  const testResult = useMemo(() => {
    try {
      const ctx = JSON.parse(testContext) as RuleContext;
      return evaluateRule(currentRule, ctx) ? 'true' : 'false';
    } catch {
      return 'invalid context';
    }
  }, [testContext, currentRule]);

  return (
    <>
      <DialogPanel
        header={(
          <div className="inline-actions justify-content-between w-full">
            <span>Rule Editor</span>
            <HelpIcon
              tooltip={helpContent.rules?.tooltip ?? 'Rule editor help'}
              onClick={() => setHelpOpen(true)}
            />
          </div>
        )}
        visible={visible}
        onHide={onHide}
        className="w-11 lg:w-9 xl:w-8"
      >
      <Tabs>
        <TabItem header="Visual">
          <div className="form-row">
            <label>Group Mode</label>
            <Select<GroupMode> value={mode} options={[{ label: 'ALL', value: 'all' }, { label: 'ANY', value: 'any' }]} onChange={(next) => setMode(next ?? 'all')} />
          </div>

          {rows.map((row, index) => (
            <div key={`row-${index}`} className="form-grid">
              <Select<string>
                value={row.field}
                options={fields.length > 0 ? fields : [{ label: 'country', value: 'country' }]}
                onChange={(next) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, field: next ?? '' } : entry)))}
                filter
              />
              <Select<Comparator>
                value={row.op}
                options={[
                  { label: 'eq', value: 'eq' },
                  { label: 'neq', value: 'neq' },
                  { label: 'in', value: 'in' },
                  { label: 'contains', value: 'contains' },
                  { label: 'gt', value: 'gt' },
                  { label: 'lt', value: 'lt' },
                  { label: 'regex', value: 'regex' }
                ]}
                onChange={(next) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, op: next ?? 'eq' } : entry)))}
              />
              <TextInput value={row.value} onChange={(next) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, value: next } : entry)))} placeholder="Value" />
              <Button text severity="danger" icon="pi pi-trash" onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))} />
            </div>
          ))}

          <div className="inline-actions">
            <Button label="Add condition" text onClick={() => setRows((prev) => [...prev, { field: fields[0]?.value ?? 'country', op: 'eq', value: '' }])} />
            <Button
              label="Apply"
              onClick={() => onApply(currentRule)}
            />
          </div>

          <div className="form-row">
            <label>Test context JSON</label>
            <Textarea rows={4} value={testContext} onChange={(next) => setTestContext(next)} />
            <small>Result: {testResult}</small>
          </div>
        </TabItem>

        <TabItem header="Advanced JSON">
          <div className="form-row">
            <label>Rule JSON</label>
            <Textarea
              rows={12}
              value={jsonValue}
              onChange={(next) => {
                setJsonValue(next);
                try {
                  const parsed = JSON.parse(next) as Rule;
                  const nextRows = parseRuleToRows(parsed);
                  setMode(nextRows.mode);
                  setRows(nextRows.rows);
                  setJsonError('');
                } catch (error) {
                  setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
                }
              }}
            />
            {jsonError ? <small className="error-text">{jsonError}</small> : null}
          </div>
          <div className="inline-actions">
            <Button label="Apply JSON" onClick={() => {
              try {
                onApply(JSON.parse(jsonValue) as Rule);
                setJsonError('');
              } catch (error) {
                setJsonError(error instanceof Error ? error.message : 'Invalid JSON');
              }
            }} />
          </div>
        </TabItem>
      </Tabs>
      </DialogPanel>
      <HelpDialog topicKey="rules" visible={helpOpen} onHide={() => setHelpOpen(false)} />
    </>
  );
}

