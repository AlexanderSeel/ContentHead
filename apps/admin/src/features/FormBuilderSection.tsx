import { useEffect, useState } from 'react';
import { Button } from 'primereact/button';
import { Column } from 'primereact/column';
import { DataTable } from 'primereact/datatable';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { InputTextarea } from 'primereact/inputtextarea';
import { Checkbox } from 'primereact/checkbox';
import { createSdk } from '@contenthead/sdk';

const sdk = createSdk({ endpoint: 'http://localhost:4000/graphql' });

type FormRecord = {
  id: number;
  siteId: number;
  name: string;
  description?: string | null;
  active: boolean;
};

type FormStep = {
  id: number;
  formId: number;
  name: string;
  position: number;
};

type FormField = {
  id: number;
  stepId: number;
  formId: number;
  key: string;
  label: string;
  fieldType: string;
  position: number;
  conditionsJson: string;
  validationsJson: string;
  uiConfigJson: string;
  active: boolean;
};

export function FormBuilderSection({ siteId, onStatus }: { siteId: number; onStatus: (value: string) => void }) {
  const [forms, setForms] = useState<FormRecord[]>([]);
  const [formId, setFormId] = useState<number | null>(null);
  const [formName, setFormName] = useState('Lead Form');
  const [formDescription, setFormDescription] = useState('Basic lead form');
  const [formActive, setFormActive] = useState(true);
  const [steps, setSteps] = useState<FormStep[]>([]);
  const [fields, setFields] = useState<FormField[]>([]);

  const [stepName, setStepName] = useState('Step 1');
  const [stepPosition, setStepPosition] = useState(10);
  const [selectedStepId, setSelectedStepId] = useState<number | null>(null);

  const [fieldKey, setFieldKey] = useState('email');
  const [fieldLabel, setFieldLabel] = useState('Email');
  const [fieldType, setFieldType] = useState('text');
  const [fieldPosition, setFieldPosition] = useState(10);
  const [conditionsJson, setConditionsJson] = useState('{"showIf":{"op":"eq","field":"country","value":"US"}}');
  const [validationsJson, setValidationsJson] = useState('{"regex":".+@.+"}');
  const [uiConfigJson, setUiConfigJson] = useState('{"placeholder":"you@example.com"}');
  const [fieldActive, setFieldActive] = useState(true);

  const [answersJson, setAnswersJson] = useState('{"email":"test@example.com"}');
  const [contextJson, setContextJson] = useState('{"country":"US"}');
  const [evaluationOutput, setEvaluationOutput] = useState('');

  const refreshForms = async () => {
    const res = await sdk.listForms({ siteId });
    const next = (res.listForms ?? []) as FormRecord[];
    setForms(next);
    const nextId = formId ?? next[0]?.id ?? null;
    setFormId(nextId);
    if (nextId) {
      await refreshFormDetails(nextId);
    }
  };

  const refreshFormDetails = async (id: number) => {
    const [stepRes, fieldRes] = await Promise.all([sdk.listFormSteps({ formId: id }), sdk.listFormFields({ formId: id })]);
    const nextSteps = (stepRes.listFormSteps ?? []) as FormStep[];
    setSteps(nextSteps);
    setFields((fieldRes.listFormFields ?? []) as FormField[]);
    setSelectedStepId(nextSteps[0]?.id ?? null);
  };

  useEffect(() => {
    refreshForms().catch((error: unknown) => onStatus(String(error)));
  }, [siteId]);

  const saveForm = async () => {
    const res = await sdk.upsertForm({
      id: formId,
      siteId,
      name: formName,
      description: formDescription || null,
      active: formActive
    });
    const savedId = res.upsertForm?.id ?? null;
    setFormId(savedId);
    await refreshForms();
    onStatus('Form saved');
  };

  const saveStep = async () => {
    if (!formId) {
      return;
    }
    await sdk.upsertFormStep({
      formId,
      name: stepName,
      position: stepPosition
    });
    await refreshFormDetails(formId);
    onStatus('Step saved');
  };

  const saveField = async () => {
    if (!formId || !selectedStepId) {
      return;
    }
    await sdk.upsertFormField({
      formId,
      stepId: selectedStepId,
      key: fieldKey,
      label: fieldLabel,
      fieldType,
      position: fieldPosition,
      conditionsJson,
      validationsJson,
      uiConfigJson,
      active: fieldActive
    });
    await refreshFormDetails(formId);
    onStatus('Field saved');
  };

  const runEvaluation = async () => {
    if (!formId) {
      return;
    }
    const result = await sdk.evaluateForm({
      formId,
      answersJson,
      contextJson
    });
    setEvaluationOutput(JSON.stringify(result.evaluateForm ?? {}, null, 2));
  };

  return (
    <section>
      <h3>Form Builder</h3>
      <div className="form-grid">
        <Dropdown
          value={formId}
          options={forms.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id }))}
          onChange={(event) => {
            const selected = Number(event.value);
            const form = forms.find((entry) => entry.id === selected);
            setFormId(selected);
            setFormName(form?.name ?? '');
            setFormDescription(form?.description ?? '');
            setFormActive(Boolean(form?.active));
            refreshFormDetails(selected).catch((error: unknown) => onStatus(String(error)));
          }}
          placeholder="Select form"
        />
        <InputText value={formName} onChange={(event) => setFormName(event.target.value)} placeholder="Form name" />
        <InputText value={formDescription} onChange={(event) => setFormDescription(event.target.value)} placeholder="Description" />
        <label><Checkbox checked={formActive} onChange={(event) => setFormActive(Boolean(event.checked))} /> Active</label>
        <Button label="Save Form" onClick={() => saveForm().catch((error: unknown) => onStatus(String(error)))} />
      </div>

      <h4>Steps</h4>
      <DataTable value={steps} size="small">
        <Column field="id" header="ID" />
        <Column field="name" header="Name" />
        <Column field="position" header="Position" />
      </DataTable>
      <div className="form-grid">
        <InputText value={stepName} onChange={(event) => setStepName(event.target.value)} placeholder="Step name" />
        <InputText value={String(stepPosition)} onChange={(event) => setStepPosition(Number(event.target.value || '0'))} placeholder="Position" />
        <Dropdown
          value={selectedStepId}
          options={steps.map((entry) => ({ label: `${entry.name} (#${entry.id})`, value: entry.id }))}
          onChange={(event) => setSelectedStepId(Number(event.value))}
          placeholder="Target step"
        />
        <Button label="Save Step" onClick={() => saveStep().catch((error: unknown) => onStatus(String(error)))} />
      </div>

      <h4>Fields</h4>
      <DataTable value={fields} size="small">
        <Column field="id" header="ID" />
        <Column field="key" header="Key" />
        <Column field="label" header="Label" />
        <Column field="fieldType" header="Type" />
        <Column field="position" header="Position" />
        <Column
          header="Load"
          body={(row: FormField) => (
            <Button
              text
              label="Load"
              size="small"
              onClick={() => {
                setSelectedStepId(row.stepId);
                setFieldKey(row.key);
                setFieldLabel(row.label);
                setFieldType(row.fieldType);
                setFieldPosition(row.position);
                setConditionsJson(row.conditionsJson);
                setValidationsJson(row.validationsJson);
                setUiConfigJson(row.uiConfigJson);
                setFieldActive(row.active);
              }}
            />
          )}
        />
      </DataTable>
      <div className="form-grid">
        <InputText value={fieldKey} onChange={(event) => setFieldKey(event.target.value)} placeholder="key" />
        <InputText value={fieldLabel} onChange={(event) => setFieldLabel(event.target.value)} placeholder="label" />
        <Dropdown
          value={fieldType}
          options={[{ label: 'text', value: 'text' }, { label: 'number', value: 'number' }, { label: 'boolean', value: 'boolean' }]}
          onChange={(event) => setFieldType(String(event.value))}
        />
        <InputText value={String(fieldPosition)} onChange={(event) => setFieldPosition(Number(event.target.value || '0'))} placeholder="position" />
        <label><Checkbox checked={fieldActive} onChange={(event) => setFieldActive(Boolean(event.checked))} /> Active</label>
      </div>
      <div className="form-row">
        <label>Conditions JSON</label>
        <InputTextarea rows={3} value={conditionsJson} onChange={(event) => setConditionsJson(event.target.value)} />
      </div>
      <div className="form-row">
        <label>Validations JSON</label>
        <InputTextarea rows={2} value={validationsJson} onChange={(event) => setValidationsJson(event.target.value)} />
      </div>
      <div className="form-row">
        <label>UI Config JSON</label>
        <InputTextarea rows={2} value={uiConfigJson} onChange={(event) => setUiConfigJson(event.target.value)} />
      </div>
      <div className="inline-actions">
        <Button label="Save Field" onClick={() => saveField().catch((error: unknown) => onStatus(String(error)))} />
      </div>

      <h4>Evaluate Form</h4>
      <div className="form-row">
        <label>Answers JSON</label>
        <InputTextarea rows={2} value={answersJson} onChange={(event) => setAnswersJson(event.target.value)} />
      </div>
      <div className="form-row">
        <label>Context JSON</label>
        <InputTextarea rows={2} value={contextJson} onChange={(event) => setContextJson(event.target.value)} />
      </div>
      <div className="inline-actions">
        <Button label="Evaluate" onClick={() => runEvaluation().catch((error: unknown) => onStatus(String(error)))} />
      </div>
      <pre>{evaluationOutput}</pre>
    </section>
  );
}
