import { useState } from 'react';

import { Button, Checkbox } from '../../ui/atoms';

import type { ContentFieldDef } from './fieldValidationUi';

export function FieldList({
  fields,
  selectedKey,
  onSelect,
  onReorder,
  onDuplicate,
  onDelete,
  onRequired,
  className
}: {
  fields: ContentFieldDef[];
  selectedKey: string | null;
  onSelect: (key: string) => void;
  onReorder: (next: ContentFieldDef[]) => void;
  onDuplicate: (key: string) => void;
  onDelete: (key: string) => void;
  onRequired: (key: string, required: boolean) => void;
  className?: string;
}) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDragIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const next = [...fields];
    const moved = next.splice(dragIndex, 1)[0];
    if (!moved) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    next.splice(index, 0, moved);
    onReorder(next);
    setDragIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div
      className={['content-types-field-table', className].filter(Boolean).join(' ')}
      style={{ height: '100%', overflow: 'auto' }}
    >
      <div className="p-datatable p-datatable-sm p-component p-datatable-scrollable" style={{ height: '100%' }}>
        <div className="p-datatable-wrapper" style={{ maxHeight: '100%', overflow: 'auto' }}>
          <table role="table" style={{ width: '100%', tableLayout: 'fixed' }}>
            <thead className="p-datatable-thead">
              <tr>
                <th style={{ width: '2.8rem' }} />
                <th style={{ width: '24%' }}><span className="p-column-title">Key</span></th>
                <th style={{ width: '32%' }}><span className="p-column-title">Label</span></th>
                <th style={{ width: '17%' }}><span className="p-column-title">Type</span></th>
                <th style={{ width: '4.5rem' }}><span className="p-column-title">Req</span></th>
                <th style={{ width: '6rem' }}><span className="p-column-title">Actions</span></th>
              </tr>
            </thead>
            <tbody className="p-datatable-tbody">
              {fields.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-datatable-emptymessage">No fields defined.</td>
                </tr>
              ) : null}
              {fields.map((field, index) => {
                const isSelected = field.key === selectedKey;
                const isDragOver = dragOverIndex === index;
                const rowClass = [
                  isSelected ? 'p-highlight' : '',
                  'p-selectable-row',
                  isDragOver ? 'p-datatable-drag-over' : ''
                ]
                  .filter(Boolean)
                  .join(' ');

                return (
                  <tr
                    key={field.key}
                    className={rowClass}
                    draggable
                    onClick={() => onSelect(field.key)}
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={(e) => handleDragOver(e, index)}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                    style={{ cursor: 'grab' }}
                  >
                    <td style={{ width: '2.8rem', textAlign: 'center', color: 'var(--text-color-secondary)' }}>
                      <span className="pi pi-bars" aria-hidden />
                    </td>
                    <td style={{ width: '24%' }}>
                      <span className="cms-cell-ellipsis">{field.key}</span>
                    </td>
                    <td style={{ width: '32%' }}>
                      <span className="cms-cell-ellipsis">{field.label}</span>
                    </td>
                    <td style={{ width: '17%' }}>
                      <span className="cms-cell-ellipsis">{field.type}</span>
                    </td>
                    <td style={{ width: '4.5rem' }}>
                      <Checkbox
                        checked={Boolean(field.required)}
                        onChange={(next) => {
                          onRequired(field.key, next);
                        }}
                      />
                    </td>
                    <td style={{ width: '6rem' }}>
                      <div className="content-types-field-actions" onClick={(e) => e.stopPropagation()}>
                        <Button
                          text
                          icon="pi pi-copy"
                          onClick={() => onDuplicate(field.key)}
                        />
                        <Button
                          text
                          severity="danger"
                          icon="pi pi-trash"
                          onClick={() => onDelete(field.key)}
                        />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
