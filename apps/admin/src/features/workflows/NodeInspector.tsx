import { useState } from 'react';

import { Accordion, AccordionItem, Checkbox, MultiSelect, NumberInput, Select, Textarea, TextInput } from '../../ui/atoms';

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
            <NumberInput value={Number(config[field.key] ?? 0)} onChange={(next) => onChange({ ...config, [field.key]: next ?? 0 })} />
          ) : field.type === 'select' ? (
            <Select value={String(config[field.key] ?? '')} options={field.options ?? []} onChange={(next) => onChange({ ...config, [field.key]: next })} />
          ) : field.type === 'multiselect' ? (
            <MultiSelect value={Array.isArray(config[field.key]) ? config[field.key] as string[] : []} options={field.options ?? []} onChange={(next) => onChange({ ...config, [field.key]: next })} />
          ) : field.type === 'boolean' ? (
            <Checkbox checked={Boolean(config[field.key])} onChange={(next) => onChange({ ...config, [field.key]: next })} />
          ) : field.type === 'textarea' ? (
            <Textarea rows={4} value={String(config[field.key] ?? '')} onChange={(next) => onChange({ ...config, [field.key]: next })} />
          ) : (
            <TextInput value={String(config[field.key] ?? '')} onChange={(next) => onChange({ ...config, [field.key]: next })} />
          )}
        </div>
      ))}

      {errors.length > 0 ? (
        <div className="status-panel">
          {errors.map((entry) => <div key={entry} className="editor-error">{entry}</div>)}
        </div>
      ) : null}

      <Accordion multiple activeIndex={advancedIndex} onTabChange={(index) => setAdvancedIndex(index)}>
        <AccordionItem header="Advanced JSON">
          <Textarea
            rows={10}
            value={JSON.stringify(config, null, 2)}
            onChange={(next) => {
              try {
                const parsed = JSON.parse(next) as Record<string, unknown>;
                onChange(parsed);
              } catch {
                // keep invalid json local
              }
            }}
          />
        </AccordionItem>
      </Accordion>
    </>
  );
}
