import { useMemo, useState } from 'react';
import { Dialog } from 'primereact/dialog';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button } from 'primereact/button';
import { InputTextarea } from 'primereact/inputtextarea';
import { TabPanel, TabView } from 'primereact/tabview';
import { evaluateRule, type Rule, type RuleContext } from '@contenthead/shared';

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
    <Dialog header="Rule Editor" visible={visible} onHide={onHide} style={{ width: '46rem' }}>
      <TabView>
        <TabPanel header="Visual">
          <div className="form-row">
            <label>Group Mode</label>
            <Dropdown value={mode} options={[{ label: 'ALL', value: 'all' }, { label: 'ANY', value: 'any' }]} onChange={(event) => setMode(event.value as GroupMode)} />
          </div>

          {rows.map((row, index) => (
            <div key={`row-${index}`} className="form-grid">
              <Dropdown
                value={row.field}
                options={fields.length > 0 ? fields : [{ label: 'country', value: 'country' }]}
                onChange={(event) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, field: String(event.value) } : entry)))}
                filter
              />
              <Dropdown
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
                onChange={(event) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, op: event.value as Comparator } : entry)))}
              />
              <InputText value={row.value} onChange={(event) => setRows((prev) => prev.map((entry, i) => (i === index ? { ...entry, value: event.target.value } : entry)))} placeholder="Value" />
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
            <InputTextarea rows={4} value={testContext} onChange={(event) => setTestContext(event.target.value)} />
            <small>Result: {testResult}</small>
          </div>
        </TabPanel>

        <TabPanel header="Advanced JSON">
          <div className="form-row">
            <label>Rule JSON</label>
            <InputTextarea
              rows={12}
              value={jsonValue}
              onChange={(event) => {
                setJsonValue(event.target.value);
                try {
                  const parsed = JSON.parse(event.target.value) as Rule;
                  const next = parseRuleToRows(parsed);
                  setMode(next.mode);
                  setRows(next.rows);
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
        </TabPanel>
      </TabView>
    </Dialog>
  );
}
