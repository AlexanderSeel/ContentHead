import { Button } from 'primereact/button';
import type { ReactNode } from 'react';

import { SplitWorkspace } from '../../../ui/molecules/SplitWorkspace';
import { ComponentList } from '../components/ComponentList';
import type { ComponentRecord, CompositionArea } from './visualBuilderModel';

type PaletteEntry = {
  id: string;
  label: string;
  description?: string;
};

export function VisualBuilderWorkspace({
  palette,
  areas,
  componentMap,
  selectedComponentId,
  selectedComponentSource,
  onSelect,
  onAdd,
  onMove,
  onMoveToArea,
  onDuplicate,
  onDelete,
  rightPane
}: {
  palette: PaletteEntry[];
  areas: CompositionArea[];
  componentMap: Record<string, ComponentRecord>;
  selectedComponentId: string | null;
  selectedComponentSource?: (id: string) => 'template' | 'override' | null;
  onSelect: (id: string) => void;
  onAdd: (componentTypeId: string, areaName?: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToArea: (id: string, areaName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  rightPane: ReactNode;
}) {
  return (
    <SplitWorkspace
      className="builder-workspace"
      left={(
        <div className="content-card">
          <h4 style={{ marginTop: 0 }}>Block Palette</h4>
          <small className="muted">Insert components into header, main, sidebar, or footer.</small>
          <div className="form-row" style={{ marginTop: '0.75rem' }}>
            {palette.map((entry) => (
              <div key={entry.id} className="cms-component-card">
                <div className="cms-component-card-head">
                  <strong>{entry.label}</strong>
                </div>
                {entry.description ? <small className="muted">{entry.description}</small> : null}
                <div className="inline-actions" style={{ marginTop: '0.4rem' }}>
                  <Button label="Add to Main" size="small" onClick={() => onAdd(entry.id, 'main')} />
                  <Button text label="Header" size="small" onClick={() => onAdd(entry.id, 'header')} />
                  <Button text label="Sidebar" size="small" onClick={() => onAdd(entry.id, 'sidebar')} />
                  <Button text label="Footer" size="small" onClick={() => onAdd(entry.id, 'footer')} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      center={(
        <div className="content-card">
          <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
            <h4 style={{ margin: 0 }}>Canvas</h4>
            <small className="muted">Areas with drop zones and ordering controls</small>
          </div>
          <ComponentList
            areas={areas}
            componentMap={componentMap}
            selected={selectedComponentId}
            onSelect={onSelect}
            onMove={onMove}
            onMoveToArea={onMoveToArea}
            onDuplicate={onDuplicate}
            onDelete={onDelete}
            {...(selectedComponentSource ? { sourceResolver: selectedComponentSource } : {})}
          />
        </div>
      )}
      right={rightPane}
    />
  );
}
