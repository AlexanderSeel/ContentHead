import { useEffect, useMemo, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import type { Rule } from '@contenthead/shared';

import { useAuth } from '../../app/AuthContext';
import { useAdminContext } from '../../app/AdminContext';
import { createAdminSdk } from '../../lib/sdk';
import { RuleEditorDialog } from '../../components/rules/RuleEditorDialog';
import { formatErrorMessage, isForbiddenError } from '../../lib/graphqlErrorUi';
import { ForbiddenState, WorkspaceActionBar, WorkspaceBody, WorkspaceHeader, WorkspacePage } from '../../ui/molecules';

type VisitorGroup = {
  id: number;
  siteId: number;
  name: string;
  ruleJson: string;
};

export function VisitorGroupsPage() {
  const { token } = useAuth();
  const sdk = useMemo(() => createAdminSdk(token), [token]);
  const { siteId } = useAdminContext();

  const [rows, setRows] = useState<VisitorGroup[]>([]);
  const [selected, setSelected] = useState<VisitorGroup | null>(null);
  const [ruleEditorOpen, setRuleEditorOpen] = useState(false);
  const [status, setStatus] = useState('');
  const [forbiddenReason, setForbiddenReason] = useState('');

  const handleError = (error: unknown) => {
    const message = formatErrorMessage(error);
    if (isForbiddenError(error)) {
      setForbiddenReason(message);
      return;
    }
    setStatus(message);
  };

  const refresh = async () => {
    const res = await sdk.listVisitorGroups({ siteId });
    const nextRows = (res.listVisitorGroups ?? []) as VisitorGroup[];
    setRows(nextRows);
    setSelected((prev) => nextRows.find((entry) => entry.id === prev?.id) ?? nextRows[0] ?? null);
    setStatus('');
  };

  useEffect(() => {
    refresh().catch(handleError);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId]);

  const save = async () => {
    if (!selected) {
      return;
    }
    await sdk.upsertVisitorGroup({
      id: selected.id || null,
      siteId,
      name: selected.name,
      ruleJson: selected.ruleJson
    });
    await refresh();
  };

  const remove = async () => {
    if (!selected?.id) {
      return;
    }
    await sdk.deleteVisitorGroup({ id: selected.id });
    await refresh();
  };

  return (
    <WorkspacePage>
      <WorkspaceHeader
        title="Visitor Groups"
        subtitle="Rule-based audience segments for page targeting and personalization."
        helpTopicKey="variants"
      />
      {forbiddenReason ? (
        <WorkspaceBody>
          <ForbiddenState title="Visitor groups unavailable" reason={forbiddenReason} />
        </WorkspaceBody>
      ) : (
        <>
          <WorkspaceActionBar
            primary={(
              <>
                <Button
                  label="New Group"
                  onClick={() => setSelected({ id: 0, siteId, name: '', ruleJson: '{"all":[]}' })}
                />
                <Button
                  label="Save"
                  onClick={() => save().catch(handleError)}
                  disabled={!selected || !selected.name.trim()}
                />
                <Button
                  label="Delete"
                  severity="danger"
                  onClick={() => remove().catch(handleError)}
                  disabled={!selected?.id}
                />
              </>
            )}
          />
          <WorkspaceBody>
        <div className="paneRoot paneScroll">
          <DataTable
            value={rows}
            size="small"
            selectionMode="single"
            selection={selected}
            onSelectionChange={(event) => setSelected((event.value as VisitorGroup) ?? null)}
          >
            <Column field="name" header="Name" />
            <Column field="id" header="ID" />
          </DataTable>
          {!selected ? (
            <p className="muted" style={{ marginTop: '0.75rem' }}>Select or create a visitor group.</p>
          ) : (
            <div className="form-row" style={{ marginTop: '0.75rem' }}>
              <label>Name</label>
              <InputText value={selected.name} onChange={(event) => setSelected({ ...selected, name: event.target.value })} />
              <label>Rule JSON</label>
              <InputTextarea rows={8} value={selected.ruleJson} onChange={(event) => setSelected({ ...selected, ruleJson: event.target.value })} />
              <div className="inline-actions">
                <Button label="Rule Editor" text onClick={() => setRuleEditorOpen(true)} />
              </div>
            </div>
          )}
        </div>
          </WorkspaceBody>
          <RuleEditorDialog
        visible={ruleEditorOpen}
        initialRule={(() => {
          try {
            return JSON.parse(selected?.ruleJson ?? '{}') as Rule;
          } catch {
            return null;
          }
        })()}
        fields={[
          { label: 'segments', value: 'segments' },
          { label: 'country', value: 'country' },
          { label: 'device', value: 'device' },
          { label: 'query.campaign', value: 'query.campaign' }
        ]}
        onHide={() => setRuleEditorOpen(false)}
        onApply={(rule) => {
          if (selected) {
            setSelected({ ...selected, ruleJson: JSON.stringify(rule) });
          }
          setRuleEditorOpen(false);
        }}
          />
          {status ? <div className="status-panel" role="alert">{status}</div> : null}
        </>
      )}
    </WorkspacePage>
  );
}
