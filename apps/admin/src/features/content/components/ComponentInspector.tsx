import { Accordion, AccordionTab } from 'primereact/accordion';
import { Checkbox } from 'primereact/checkbox';
import { Dropdown } from 'primereact/dropdown';
import { InputNumber } from 'primereact/inputnumber';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { getComponentRegistryEntry, validateComponentProps } from './componentRegistry';

type ComponentRecord = {
  id: string;
  type: string;
  props: Record<string, unknown>;
};

export function ComponentInspector({
  component,
  onChange
}: {
  component: ComponentRecord | null;
  onChange: (next: ComponentRecord) => void;
}) {
  if (!component) {
    return <p className="muted">Select a component to edit props.</p>;
  }

  const entry = getComponentRegistryEntry(component.type);
  if (!entry) {
    return <p className="error-text">Unknown component type: {component.type}</p>;
  }

  const errors = validateComponentProps(component.type, component.props);

  return (
    <div className="p-fluid">
      <div className="status-panel"><strong>{entry.label}</strong><div>{component.id}</div></div>
      {entry.fields.map((field) => {
        const value = component.props[field.key];
        return (
          <div className="form-row" key={field.key}>
            <label>{field.label}</label>
            {field.type === 'number' ? (
              <InputNumber value={typeof value === 'number' ? value : null} onValueChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value ?? 0 } })} />
            ) : field.type === 'select' ? (
              <Dropdown value={value ?? null} options={field.options ?? []} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.value } })} />
            ) : field.type === 'boolean' ? (
              <Checkbox checked={Boolean(value)} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: Boolean(event.checked) } })} />
            ) : field.type === 'multiline' ? (
              <InputTextarea rows={4} value={String(value ?? '')} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } })} />
            ) : (
              <InputText value={String(value ?? '')} onChange={(event) => onChange({ ...component, props: { ...component.props, [field.key]: event.target.value } })} />
            )}
          </div>
        );
      })}

      {errors.length > 0 ? (
        <div className="status-panel">
          {errors.map((entryError) => <div key={entryError} className="error-text">{entryError}</div>)}
        </div>
      ) : null}

      <Accordion>
        <AccordionTab header="Advanced JSON">
          <InputTextarea
            rows={10}
            value={JSON.stringify(component.props, null, 2)}
            onChange={(event) => {
              try {
                const parsed = JSON.parse(event.target.value) as Record<string, unknown>;
                onChange({ ...component, props: parsed });
              } catch {
                // keep invalid json local
              }
            }}
          />
        </AccordionTab>
      </Accordion>
    </div>
  );
}
