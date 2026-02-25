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
  areaNames,
  areas,
  componentMap,
  selectedComponentId,
  selectedComponentSource,
  componentTypeLabelResolver,
  onSelect,
  onAdd,
  onMove,
  onMoveToArea,
  onDuplicate,
  onDelete,
  rightPane
}: {
  palette: PaletteEntry[];
  areaNames?: string[];
  areas: CompositionArea[];
  componentMap: Record<string, ComponentRecord>;
  selectedComponentId: string | null;
  selectedComponentSource?: (id: string) => 'template' | 'override' | null;
  componentTypeLabelResolver?: (typeId: string) => string | null;
  onSelect: (id: string) => void;
  onAdd: (componentTypeId: string, areaName?: string) => void;
  onMove: (id: string, direction: -1 | 1) => void;
  onMoveToArea: (id: string, areaName: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  rightPane: ReactNode;
}) {
  const resolvedAreaNames = areaNames && areaNames.length > 0
    ? areaNames
    : areas.map((entry) => entry.name);
  return (
    <SplitWorkspace
      className="builder-workspace"
      left={(
        <div className="content-card">
          <h4 className="mt-0">Block Palette</h4>
          <small className="muted">Insert components into configured content areas.</small>
          <div className="form-row mt-3">
            {palette.map((entry) => (
              <div key={entry.id} className="cms-component-card">
                <div className="cms-component-card-head">
                  <strong>{entry.label}</strong>
                </div>
                {entry.description ? <small className="muted">{entry.description}</small> : null}
                <div className="inline-actions mt-2">
                  {resolvedAreaNames.map((areaName, index) => (
                    <Button
                      key={`${entry.id}-${areaName}`}
                      label={index === 0 ? `Add to ${areaName}` : areaName}
                      size="small"
                      {...(index > 0 ? { text: true } : {})}
                      onClick={() => onAdd(entry.id, areaName)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      center={(
        <div className="content-card">
          <div className="inline-actions justify-content-between">
            <h4 className="m-0">Canvas</h4>
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
            {...(componentTypeLabelResolver ? { labelResolver: componentTypeLabelResolver } : {})}
          />
        </div>
      )}
      right={rightPane}
    />
  );
}

