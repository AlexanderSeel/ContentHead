import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';
import { evaluateForm } from './service.js';

export type FormSubmissionStatus = 'new' | 'processed' | 'needs_review';

export type FormSubmissionRecord = {
  id: number;
  siteId: number;
  formId: number;
  createdAt: string;
  submittedByUserId: string | null;
  marketCode: string;
  localeCode: string;
  pageContentItemId: number | null;
  pageRouteSlug: string | null;
  status: FormSubmissionStatus;
  dataJson: string;
  metaJson: string;
};

export type FormSubmissionListResult = {
  rows: FormSubmissionRecord[];
  total: number;
};

function invalid(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function parseObjectJson(value: string, name: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(value);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      invalid(`${name} must be a JSON object`);
    }
    return parsed as Record<string, unknown>;
  } catch {
    invalid(`${name} must be valid JSON`);
  }
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

function mapStatus(status: string): FormSubmissionStatus {
  if (status === 'processed' || status === 'needs_review') {
    return status;
  }
  return 'new';
}

function normalizeStatus(status: string): FormSubmissionStatus {
  if (status === 'new' || status === 'processed' || status === 'needs_review') {
    return status;
  }
  invalid('status must be one of: new, processed, needs_review');
}

function csvEscape(value: unknown): string {
  if (value == null) {
    return '';
  }
  const text = String(value);
  if (text.includes('"') || text.includes(',') || text.includes('\n') || text.includes('\r')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

export async function submitForm(
  db: DbClient,
  input: {
    siteId: number;
    formId: number;
    marketCode: string;
    localeCode: string;
    pageContentItemId?: number | null | undefined;
    pageRouteSlug?: string | null | undefined;
    submittedByUserId?: string | null | undefined;
    answersJson: string;
    contextJson?: string | null | undefined;
    metaJson?: string | null | undefined;
  }
): Promise<FormSubmissionRecord> {
  parseObjectJson(input.answersJson, 'answersJson');
  const metaObject = input.metaJson ? parseObjectJson(input.metaJson, 'metaJson') : {};
  const contextObject = input.contextJson ? parseObjectJson(input.contextJson, 'contextJson') : {};

  const evaluation = await evaluateForm(db, {
    formId: input.formId,
    answersJson: input.answersJson,
    contextJson: JSON.stringify(contextObject)
  });

  if (!evaluation.valid) {
    throw new GraphQLError('Form submission failed validation', {
      extensions: {
        code: 'FORM_VALIDATION_FAILED',
        errorsJson: evaluation.errorsJson
      }
    });
  }

  const id = await nextId(db, 'form_submissions');
  await db.run(
    `
INSERT INTO form_submissions(
  id,
  site_id,
  form_id,
  submitted_by_user_id,
  market_code,
  locale_code,
  page_content_item_id,
  page_route_slug,
  status,
  data_json,
  meta_json
)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`,
    [
      id,
      input.siteId,
      input.formId,
      input.submittedByUserId ?? null,
      input.marketCode,
      input.localeCode,
      input.pageContentItemId ?? null,
      input.pageRouteSlug ?? null,
      'new',
      input.answersJson,
      JSON.stringify(metaObject)
    ]
  );

  const row = await db.get<FormSubmissionRecord>(
    `
SELECT
  id,
  site_id as siteId,
  form_id as formId,
  created_at as createdAt,
  submitted_by_user_id as submittedByUserId,
  market_code as marketCode,
  locale_code as localeCode,
  page_content_item_id as pageContentItemId,
  page_route_slug as pageRouteSlug,
  status,
  data_json as dataJson,
  meta_json as metaJson
FROM form_submissions
WHERE id = ?
`,
    [id]
  );

  if (!row) {
    throw new GraphQLError(`Submission ${id} not found`, { extensions: { code: 'SUBMISSION_NOT_FOUND' } });
  }

  return {
    ...row,
    status: mapStatus(row.status)
  };
}

export async function listFormSubmissions(
  db: DbClient,
  input: {
    siteId: number;
    formId?: number | null | undefined;
    search?: string | null | undefined;
    status?: string | null | undefined;
    marketCode?: string | null | undefined;
    localeCode?: string | null | undefined;
    fromDate?: string | null | undefined;
    toDate?: string | null | undefined;
    limit?: number | null | undefined;
    offset?: number | null | undefined;
    sortField?: string | null | undefined;
    sortOrder?: string | null | undefined;
  }
): Promise<FormSubmissionListResult> {
  const whereParts = ['site_id = ?'];
  const params: unknown[] = [input.siteId];

  if (input.formId != null) {
    whereParts.push('form_id = ?');
    params.push(input.formId);
  }
  if (input.status) {
    whereParts.push('status = ?');
    params.push(normalizeStatus(input.status));
  }
  if (input.marketCode) {
    whereParts.push('market_code = ?');
    params.push(input.marketCode);
  }
  if (input.localeCode) {
    whereParts.push('locale_code = ?');
    params.push(input.localeCode);
  }
  if (input.fromDate) {
    whereParts.push('created_at >= ?');
    params.push(input.fromDate);
  }
  if (input.toDate) {
    whereParts.push('created_at <= ?');
    params.push(input.toDate);
  }
  if (input.search?.trim()) {
    const term = `%${input.search.trim().toLowerCase()}%`;
    whereParts.push(
      '(LOWER(COALESCE(page_route_slug, \'\')) LIKE ? OR LOWER(data_json) LIKE ? OR LOWER(meta_json) LIKE ?)'
    );
    params.push(term, term, term);
  }

  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const countRow = await db.get<{ total: number }>(
    `SELECT COUNT(*) as total FROM form_submissions ${whereSql}`,
    params
  );

  const sortMap: Record<string, string> = {
    id: 'id',
    createdAt: 'created_at',
    status: 'status',
    marketCode: 'market_code',
    localeCode: 'locale_code',
    formId: 'form_id'
  };
  const orderBy = sortMap[input.sortField ?? ''] ?? 'created_at';
  const orderDir = String(input.sortOrder ?? 'DESC').toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
  const limit = Math.max(1, Math.min(500, input.limit ?? 50));
  const offset = Math.max(0, input.offset ?? 0);

  const rows = await db.all<FormSubmissionRecord>(
    `
SELECT
  id,
  site_id as siteId,
  form_id as formId,
  created_at as createdAt,
  submitted_by_user_id as submittedByUserId,
  market_code as marketCode,
  locale_code as localeCode,
  page_content_item_id as pageContentItemId,
  page_route_slug as pageRouteSlug,
  status,
  data_json as dataJson,
  meta_json as metaJson
FROM form_submissions
${whereSql}
ORDER BY ${orderBy} ${orderDir}
LIMIT ?
OFFSET ?
`,
    [...params, limit, offset]
  );

  return {
    rows: rows.map((row) => ({ ...row, status: mapStatus(row.status) })),
    total: countRow?.total ?? 0
  };
}

export async function updateFormSubmissionStatus(
  db: DbClient,
  input: { id: number; status: string }
): Promise<FormSubmissionRecord> {
  const status = normalizeStatus(input.status);
  await db.run('UPDATE form_submissions SET status = ? WHERE id = ?', [status, input.id]);
  const row = await db.get<FormSubmissionRecord>(
    `
SELECT
  id,
  site_id as siteId,
  form_id as formId,
  created_at as createdAt,
  submitted_by_user_id as submittedByUserId,
  market_code as marketCode,
  locale_code as localeCode,
  page_content_item_id as pageContentItemId,
  page_route_slug as pageRouteSlug,
  status,
  data_json as dataJson,
  meta_json as metaJson
FROM form_submissions
WHERE id = ?
`,
    [input.id]
  );
  if (!row) {
    throw new GraphQLError(`Submission ${input.id} not found`, { extensions: { code: 'SUBMISSION_NOT_FOUND' } });
  }
  return { ...row, status: mapStatus(row.status) };
}

export async function exportFormSubmissions(
  db: DbClient,
  input: {
    siteId: number;
    formId?: number | null | undefined;
    search?: string | null | undefined;
    status?: string | null | undefined;
    marketCode?: string | null | undefined;
    localeCode?: string | null | undefined;
    fromDate?: string | null | undefined;
    toDate?: string | null | undefined;
    format: string;
  }
): Promise<string> {
  const format = String(input.format).toUpperCase();
  if (format !== 'CSV' && format !== 'JSON') {
    invalid('format must be CSV or JSON');
  }

  const listed = await listFormSubmissions(db, {
    ...input,
    limit: 5000,
    offset: 0,
    sortField: 'createdAt',
    sortOrder: 'DESC'
  });

  if (format === 'JSON') {
    return JSON.stringify(listed.rows, null, 2);
  }

  const header = [
    'id',
    'siteId',
    'formId',
    'createdAt',
    'submittedByUserId',
    'marketCode',
    'localeCode',
    'pageContentItemId',
    'pageRouteSlug',
    'status',
    'dataJson',
    'metaJson'
  ];
  const lines = [header.join(',')];
  for (const row of listed.rows) {
    lines.push(
      [
        row.id,
        row.siteId,
        row.formId,
        row.createdAt,
        row.submittedByUserId,
        row.marketCode,
        row.localeCode,
        row.pageContentItemId,
        row.pageRouteSlug,
        row.status,
        row.dataJson,
        row.metaJson
      ]
        .map((value) => csvEscape(value))
        .join(',')
    );
  }
  return lines.join('\n');
}
