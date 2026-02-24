import { useState } from 'react';
import { Accordion, AccordionTab } from 'primereact/accordion';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { MultiSelect } from 'primereact/multiselect';
import { Checkbox } from 'primereact/checkbox';

import { getNodeRegistryEntry, validateNodeConfig } from './nodeRegistry';

type GraphNode = { id: string; type: string; config?: Record<string, unknown> };

export function NodeInspector({
  node,
  onChange
}: {
  node: GraphNode | null;
  onChange: (nextConfig: Record<string, unknown>) => void;
}) {
  const [advancedIndex, setAdvancedIndex] = useState<number[] | number | null>([]);
  if (!node) {
    return <div className="status-panel">Select a node on the canvas.</div>;
  }

  const registry = getNodeRegistryEntry(node.type);
  if (!registry) {
    return <div className="status-panel">Unsupported node type: {node.type}</div>;
  }

  const config = node.config ?? {};
  const errors = validateNodeConfig(node.type, config);

  return (
    <>
      <div className="status-panel"><strong>{registry.label}</strong><div>{node.id}</div></div>
      {registry.fields.map((field) => (
        <div className="form-row" key={field.key}>
          <label>{field.label}</label>
          {field.type === 'number' ? (
            <InputNumber value={Number(config[field.key] ?? 0)} onValueChange={(event) => onChange({ ...config, [field.key]: event.value ?? 0 })} />
          ) : field.type === 'select' ? (
            <Dropdown value={String(config[field.key] ?? '')} options={field.options ?? []} onChange={(event) => onChange({ ...config, [field.key]: event.value })} />
          ) : field.type === 'multiselect' ? (
            <MultiSelect value={Array.isArray(config[field.key]) ? config[field.key] : []} options={field.options ?? []} onChange={(event) => onChange({ ...config, [field.key]: event.value })} />
          ) : field.type === 'boolean' ? (
            <Checkbox checked={Boolean(config[field.key])} onChange={(event) => onChange({ ...config, [field.key]: Boolean(event.checked) })} />
          ) : field.type === 'textarea' ? (
            <InputTextarea rows={4} value={String(config[field.key] ?? '')} onChange={(event) => onChange({ ...config, [field.key]: event.target.value })} />
          ) : (
            <InputText value={String(config[field.key] ?? '')} onChange={(event) => onChange({ ...config, [field.key]: event.target.value })} />
          )}
        </div>
      ))}

      {errors.length > 0 ? (
        <div className="status-panel">
          {errors.map((entry) => <div key={entry} className="editor-error">{entry}</div>)}
        </div>
      ) : null}

      <Accordion multiple activeIndex={advancedIndex} onTabChange={(event) => setAdvancedIndex(event.index)}>
        <AccordionTab header="Advanced JSON">
          <InputTextarea
            rows={10}
            value={JSON.stringify(config, null, 2)}
            onChange={(event) => {
              try {
                const parsed = JSON.parse(event.target.value) as Record<string, unknown>;
                onChange(parsed);
              } catch {
                // keep invalid json local
              }
            }}
          />
        </AccordionTab>
      </Accordion>
    </>
  );
}
