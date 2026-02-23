import { useEffect, useMemo, useState } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Button } from 'primereact/button';

import { createAdminSdk } from '../../lib/sdk';
import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';

type Template = { id: number; name: string; compositionJson: string; componentsJson: string; constraintsJson: string };

export function TemplatesPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [draft, setDraft] = useState<Template>({ id: 0, name: 'Default Page', compositionJson: '{"areas":[{"name":"main","components":[]}]}', componentsJson: '{}', constraintsJson: '{"requiredFields":["title"]}' });
  const [status, setStatus] = useState('');

  const refresh = async () => {
    const list = await sdk.listTemplates({ siteId });
    setTemplates((list.listTemplates ?? []) as Template[]);
  };

  useEffect(() => {
    refresh().catch((error: unknown) => setStatus(String(error)));
  }, [siteId]);

  return (
    <div>
      <PageHeader title="Templates" subtitle="Template composition and constraints" />
      <DataTable value={templates} size="small">
        <Column field="id" header="ID" />
        <Column field="name" header="Name" />
        <Column header="Edit" body={(row: Template) => <Button text label="Edit" onClick={() => setDraft(row)} />} />
      </DataTable>
      <div className="form-row"><label>Name</label><InputText value={draft.name} onChange={(e) => setDraft((prev) => ({ ...prev, name: e.target.value }))} /></div>
      <div className="form-row"><label>Composition JSON</label><InputTextarea rows={3} value={draft.compositionJson} onChange={(e) => setDraft((prev) => ({ ...prev, compositionJson: e.target.value }))} /></div>
      <div className="form-row"><label>Components JSON</label><InputTextarea rows={3} value={draft.componentsJson} onChange={(e) => setDraft((prev) => ({ ...prev, componentsJson: e.target.value }))} /></div>
      <div className="form-row"><label>Constraints JSON</label><InputTextarea rows={3} value={draft.constraintsJson} onChange={(e) => setDraft((prev) => ({ ...prev, constraintsJson: e.target.value }))} /></div>
      <div className="inline-actions">
        <Button
          label="Save"
          onClick={() =>
            (draft.id
              ? sdk.updateTemplate({ id: draft.id, name: draft.name, compositionJson: draft.compositionJson, componentsJson: draft.componentsJson, constraintsJson: draft.constraintsJson })
              : sdk.createTemplate({ siteId, name: draft.name, compositionJson: draft.compositionJson, componentsJson: draft.componentsJson, constraintsJson: draft.constraintsJson })
            )
              .then(() => refresh())
              .catch((error: unknown) => setStatus(String(error)))
          }
        />
        <Button label="Reconcile" severity="secondary" onClick={() => sdk.reconcileTemplate({ templateId: draft.id }).then((res) => setStatus(JSON.stringify(res.reconcileTemplate ?? {}, null, 2))).catch((error: unknown) => setStatus(String(error)))} disabled={!draft.id} />
      </div>
      {status ? <pre>{status}</pre> : null}
    </div>
  );
}
