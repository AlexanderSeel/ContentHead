import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';
import { SplitView } from '../../components/common/SplitView';

type CType = { id: number; name: string; description?: string | null; fieldsJson: string };
type FieldDef = { key: string; label: string; type: 'text' | 'richtext' | 'number' | 'boolean'; required?: boolean };

const parse = <T,>(value: string, fallback: T): T => {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export function ContentTypesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();
  const [types, setTypes] = useState<CType[]>([]);
  const [selected, setSelected] = useState<CType | null>(null);
  const [fields, setFields] = useState<FieldDef[]>([{ key: 'title', label: 'Title', type: 'text', required: true }]);

  const refresh = async () => {
    const result = await sdk.listContentTypes({ siteId });
    setTypes((result.listContentTypes ?? []) as CType[]);
  };

  useEffect(() => {
    refresh().catch(() => undefined);
  }, [siteId]);

  return (
    <div>
      <PageHeader title="Content Types" subtitle="Type builder and field model" actions={<Button label="Add Type" onClick={() => { setSelected({ id: 0, name: '', description: '', fieldsJson: '[]' }); setFields([{ key: 'title', label: 'Title', type: 'text', required: true }]); }} />} />
      <SplitView
        left={
          <DataTable value={types} size="small" selectionMode="single" onSelectionChange={(event) => {
            const next = event.value as CType;
            setSelected(next);
            setFields(parse<FieldDef[]>(next.fieldsJson, []));
          }}>
            <Column field="id" header="ID" />
            <Column field="name" header="Name" />
          </DataTable>
        }
        right={
          selected ? (
            <>
              <div className="form-grid">
                <InputText value={selected.name} onChange={(e) => setSelected((prev) => (prev ? { ...prev, name: e.target.value } : prev))} placeholder="Name" />
                <InputText value={selected.description ?? ''} onChange={(e) => setSelected((prev) => (prev ? { ...prev, description: e.target.value } : prev))} placeholder="Description" />
                <Button label="Add Field" onClick={() => setFields((prev) => [...prev, { key: 'field', label: 'Field', type: 'text', required: false }])} />
              </div>
              <DataTable value={fields} size="small" reorderableRows onRowReorder={(e) => setFields(e.value as FieldDef[])}>
                <Column rowReorder style={{ width: '3rem' }} />
                <Column header="Key" body={(row: FieldDef, options) => <InputText value={row.key} onChange={(e) => setFields((prev) => prev.map((item, index) => (index === options.rowIndex ? { ...item, key: e.target.value } : item)))} />} />
                <Column header="Label" body={(row: FieldDef, options) => <InputText value={row.label} onChange={(e) => setFields((prev) => prev.map((item, index) => (index === options.rowIndex ? { ...item, label: e.target.value } : item)))} />} />
                <Column header="Type" body={(row: FieldDef, options) => <Dropdown value={row.type} options={[{ label: 'text', value: 'text' }, { label: 'richtext', value: 'richtext' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }]} onChange={(e) => setFields((prev) => prev.map((item, index) => (index === options.rowIndex ? { ...item, type: e.value } : item)))} />} />
              </DataTable>
              <div className="inline-actions">
                <Button
                  label="Save Type"
                  onClick={() => {
                    const input = {
                      name: selected.name,
                      description: selected.description || null,
                      fieldsJson: JSON.stringify(fields),
                      by: 'admin'
                    };
                    (selected.id
                      ? sdk.updateContentType({ id: selected.id, ...input })
                      : sdk.createContentType({ siteId, ...input }))
                      .then(() => refresh());
                  }}
                />
              </div>
              <div className="form-row">
                <label>Editor Preview</label>
                <InputTextarea rows={6} value={JSON.stringify(fields, null, 2)} readOnly />
              </div>
            </>
          ) : (
            <p>Select a content type.</p>
          )
        }
      />
    </div>
  );
}
