import { GraphQLError } from 'graphql';
import { evaluateFieldConditions, type FormEvaluationContext } from '@contenthead/shared';

import type { DbClient } from '../db/DbClient.js';

export type FormRecord = {
  id: number;
  siteId: number;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

export type FormStepRecord = {
  id: number;
  formId: number;
  name: string;
  position: number;
};

export type FormFieldRecord = {
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

export type FormEvaluation = {
  formId: number;
  valid: boolean;
  evaluatedFieldsJson: string;
  errorsJson: string;
};

function invalid(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function parseJson(value: string, name: string): unknown {
  try {
    return JSON.parse(value);
  } catch {
    invalid(`${name} must be valid JSON`);
  }
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

async function getForm(db: DbClient, id: number): Promise<FormRecord> {
  const form = await db.get<FormRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  description,
  active,
  created_at as createdAt,
  updated_at as updatedAt
FROM forms
WHERE id = ?
`,
    [id]
  );

  if (!form) {
    throw new GraphQLError(`Form ${id} not found`, { extensions: { code: 'FORM_NOT_FOUND' } });
  }

  return form;
}

export async function listForms(db: DbClient, siteId: number): Promise<FormRecord[]> {
  return db.all<FormRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  description,
  active,
  created_at as createdAt,
  updated_at as updatedAt
FROM forms
WHERE site_id = ?
ORDER BY name
`,
    [siteId]
  );
}

export async function upsertForm(
  db: DbClient,
  input: {
    id?: number | null | undefined;
    siteId: number;
    name: string;
    description?: string | null | undefined;
    active: boolean;
  }
): Promise<FormRecord> {
  const id = input.id ?? (await nextId(db, 'forms'));
  await db.run(
    `
INSERT INTO forms(id, site_id, name, description, active)
VALUES (?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  site_id = excluded.site_id,
  name = excluded.name,
  description = excluded.description,
  active = excluded.active,
  updated_at = now()
`,
    [id, input.siteId, input.name, input.description ?? null, input.active]
  );

  return getForm(db, id);
}

export async function deleteForm(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM forms WHERE id = ?', [id]);
  return true;
}

export async function listFormSteps(db: DbClient, formId: number): Promise<FormStepRecord[]> {
  await getForm(db, formId);
  return db.all<FormStepRecord>(
    `
SELECT
  id,
  form_id as formId,
  name,
  position
FROM form_steps
WHERE form_id = ?
ORDER BY position, id
`,
    [formId]
  );
}

export async function upsertFormStep(
  db: DbClient,
  input: {
    id?: number | null | undefined;
    formId: number;
    name: string;
    position: number;
  }
): Promise<FormStepRecord> {
  await getForm(db, input.formId);
  const id = input.id ?? (await nextId(db, 'form_steps'));

  await db.run(
    `
INSERT INTO form_steps(id, form_id, name, position)
VALUES (?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  form_id = excluded.form_id,
  name = excluded.name,
  position = excluded.position
`,
    [id, input.formId, input.name, input.position]
  );

  const row = await db.get<FormStepRecord>(
    `SELECT id, form_id as formId, name, position FROM form_steps WHERE id = ?`,
    [id]
  );

  if (!row) {
    throw new GraphQLError(`Step ${id} not found`, { extensions: { code: 'FORM_STEP_NOT_FOUND' } });
  }

  return row;
}

export async function deleteFormStep(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM form_steps WHERE id = ?', [id]);
  return true;
}

export async function listFormFields(db: DbClient, formId: number): Promise<FormFieldRecord[]> {
  await getForm(db, formId);
  return db.all<FormFieldRecord>(
    `
SELECT
  id,
  step_id as stepId,
  form_id as formId,
  key,
  label,
  field_type as fieldType,
  position,
  conditions_json as conditionsJson,
  validations_json as validationsJson,
  ui_config_json as uiConfigJson,
  active
FROM form_fields
WHERE form_id = ?
ORDER BY position, id
`,
    [formId]
  );
}

export async function upsertFormField(
  db: DbClient,
  input: {
    id?: number | null | undefined;
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
  }
): Promise<FormFieldRecord> {
  parseJson(input.conditionsJson, 'conditionsJson');
  parseJson(input.validationsJson, 'validationsJson');
  parseJson(input.uiConfigJson, 'uiConfigJson');

  const step = await db.get<{ id: number; formId: number }>(
    'SELECT id, form_id as formId FROM form_steps WHERE id = ?',
    [input.stepId]
  );
  if (!step || step.formId !== input.formId) {
    invalid('stepId must belong to formId', 'FORM_STEP_MISMATCH');
  }

  const id = input.id ?? (await nextId(db, 'form_fields'));

  await db.run(
    `
INSERT INTO form_fields(
  id,
  step_id,
  form_id,
  key,
  label,
  field_type,
  position,
  conditions_json,
  validations_json,
  ui_config_json,
  active
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  step_id = excluded.step_id,
  form_id = excluded.form_id,
  key = excluded.key,
  label = excluded.label,
  field_type = excluded.field_type,
  position = excluded.position,
  conditions_json = excluded.conditions_json,
  validations_json = excluded.validations_json,
  ui_config_json = excluded.ui_config_json,
  active = excluded.active
`,
    [
      id,
      input.stepId,
      input.formId,
      input.key,
      input.label,
      input.fieldType,
      input.position,
      input.conditionsJson,
      input.validationsJson,
      input.uiConfigJson,
      input.active
    ]
  );

  const row = await db.get<FormFieldRecord>(
    `
SELECT
  id,
  step_id as stepId,
  form_id as formId,
  key,
  label,
  field_type as fieldType,
  position,
  conditions_json as conditionsJson,
  validations_json as validationsJson,
  ui_config_json as uiConfigJson,
  active
FROM form_fields
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    throw new GraphQLError(`Field ${id} not found`, { extensions: { code: 'FORM_FIELD_NOT_FOUND' } });
  }

  return row;
}

export async function deleteFormField(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM form_fields WHERE id = ?', [id]);
  return true;
}

export async function evaluateForm(
  db: DbClient,
  input: {
    formId: number;
    answersJson: string;
    contextJson?: string | null | undefined;
  }
): Promise<FormEvaluation> {
  await getForm(db, input.formId);
  const fields = await listFormFields(db, input.formId);
  const answers = parseJson(input.answersJson, 'answersJson');
  const contextRaw = parseJson(input.contextJson ?? '{}', 'contextJson');

  const answersObject = answers && typeof answers === 'object' && !Array.isArray(answers)
    ? (answers as Record<string, unknown>)
    : {};
  const contextObject = contextRaw && typeof contextRaw === 'object' && !Array.isArray(contextRaw)
    ? (contextRaw as Record<string, unknown>)
    : {};

  const evalContext: FormEvaluationContext = {
    userId: typeof contextObject.userId === 'string' ? contextObject.userId : null,
    sessionId: typeof contextObject.sessionId === 'string' ? contextObject.sessionId : null,
    country: typeof contextObject.country === 'string' ? contextObject.country : null,
    device: typeof contextObject.device === 'string' ? contextObject.device : null,
    referrer: typeof contextObject.referrer === 'string' ? contextObject.referrer : null,
    segments: Array.isArray(contextObject.segments)
      ? contextObject.segments.filter((entry): entry is string => typeof entry === 'string')
      : [],
    query: contextObject.query && typeof contextObject.query === 'object' && !Array.isArray(contextObject.query)
      ? (contextObject.query as Record<string, string | number | boolean | null | undefined>)
      : {},
    answers: answersObject
  };

  const errors: Array<{ key: string; message: string }> = [];
  const evaluated = fields.map((field) => {
    const conditions = parseJson(field.conditionsJson, `conditionsJson for ${field.key}`);
    const validations = parseJson(field.validationsJson, `validationsJson for ${field.key}`);
    const conditionObject = conditions && typeof conditions === 'object' && !Array.isArray(conditions)
      ? conditions
      : {};
    const validationObject = validations && typeof validations === 'object' && !Array.isArray(validations)
      ? validations
      : {};

    const behavior = evaluateFieldConditions(conditionObject, evalContext);
    const value = answersObject[field.key];

    if (behavior.visible && behavior.required && (value === null || value === undefined || value === '')) {
      errors.push({ key: field.key, message: 'Required field is missing' });
    }

    if (
      behavior.visible &&
      value != null &&
      typeof value === 'string' &&
      typeof (validationObject as { regex?: unknown }).regex === 'string'
    ) {
      try {
        const regex = new RegExp((validationObject as { regex: string }).regex);
        if (!regex.test(value)) {
          errors.push({ key: field.key, message: 'Regex validation failed' });
        }
      } catch {
        errors.push({ key: field.key, message: 'Invalid regex validator' });
      }
    }

    return {
      id: field.id,
      key: field.key,
      label: field.label,
      stepId: field.stepId,
      fieldType: field.fieldType,
      visible: behavior.visible,
      required: behavior.required,
      enabled: behavior.enabled,
      value
    };
  });

  return {
    formId: input.formId,
    valid: errors.length === 0,
    evaluatedFieldsJson: JSON.stringify(evaluated),
    errorsJson: JSON.stringify(errors)
  };
}
