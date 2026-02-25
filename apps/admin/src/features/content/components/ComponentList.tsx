import { Button } from 'primereact/button';
import { Dropdown } from 'primereact/dropdown';

import { getComponentRegistryEntry } from './componentRegistry';

type CompositionArea = { name: string; components: string[] };
type ComponentRecord = { id: string; type: string; props: Record<string, unknown> };

export function ComponentList({
  areas,
  componentMap,
  selected,
  onSelect,
  onMove,
  onMoveToArea,
  onDuplicate,
  onDelete,
  sourceResolver
}: {
  areas: CompositionArea[];
  componentMap: Record<string, ComponentRecord>;
  selected: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToArea: (id: string, areaName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  sourceResolver?: (id: string) => 'template' | 'override' | null;
}) {
  return (
    <div className="cms-component-list">
      {areas.map((area) => (
        <section key={area.name} className="cms-area-block">
          <div className="cms-area-header">
            <strong>{area.name}</strong>
            <small>{area.components.length} components</small>
          </div>
          {area.components.length === 0 ? <div className="muted">No components in this area.</div> : null}
          {area.components.map((id) => {
            const component = componentMap[id];
            const meta = getComponentRegistryEntry(component?.type ?? '');
            const active = selected === id;
            const source = sourceResolver?.(id) ?? null;
            return (
              <article
                key={id}
                className={`cms-component-card ${active ? 'selected' : ''}`}
                onClick={() => onSelect(id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onSelect(id);
                  }
                }}
              >
                <div className="cms-component-card-head">
                  <strong>{meta?.label ?? component?.type ?? 'Unknown'}</strong>
                  <small>{id}</small>
                </div>
                {source ? <small className={`cms-component-source cms-component-source-${source}`}>{source}</small> : null}
                <div className="inline-actions">
                  <Button text size="small" icon="pi pi-angle-up" onClick={(event) => { event.stopPropagation(); onMove(id, -1); }} />
                  <Button text size="small" icon="pi pi-angle-down" onClick={(event) => { event.stopPropagation(); onMove(id, 1); }} />
                  <Dropdown
                    value={area.name}
                    options={areas.map((entry) => ({ label: entry.name, value: entry.name }))}
                    onClick={(event) => event.stopPropagation()}
                    onChange={(event) => onMoveToArea(id, String(event.value ?? area.name))}
                    className="w-10rem"
                  />
                  <Button text size="small" icon="pi pi-copy" onClick={(event) => { event.stopPropagation(); onDuplicate(id); }} />
                  <Button text size="small" severity="danger" icon="pi pi-trash" onClick={(event) => { event.stopPropagation(); onDelete(id); }} />
                </div>
              </article>
            );
          })}
        </section>
      ))}
    </div>
  );
}

