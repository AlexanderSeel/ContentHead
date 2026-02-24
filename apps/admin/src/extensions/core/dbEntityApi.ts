import { createAdminSdk } from '../../lib/sdk';

function parseRows<T>(rowsJson: string | null | undefined): T[] {
  if (!rowsJson) {
    return [];
  }
  try {
    const parsed = JSON.parse(rowsJson) as unknown;
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

export async function listEntities<T>(token: string | null, table: string, filter: Array<{ column: string; op: string; value?: string }> = []) {
  const sdk = createAdminSdk(token);
  const res = await sdk.dbAdminList({
    table,
    paging: { limit: 500, offset: 0 },
    sort: { column: 'id', direction: 'asc' },
    filter
  });
  return parseRows<T>(res.dbAdminList?.rowsJson);
}

export async function insertEntity(token: string | null, table: string, row: Record<string, unknown>) {
  const sdk = createAdminSdk(token);
  await sdk.dbAdminInsert({ table, rowJson: JSON.stringify(row), dangerMode: false });
}

export async function updateEntity(
  token: string | null,
  table: string,
  pk: Record<string, unknown>,
  patch: Record<string, unknown>
) {
  const sdk = createAdminSdk(token);
  await sdk.dbAdminUpdate({
    table,
    pkJson: JSON.stringify(pk),
    patchJson: JSON.stringify(patch),
    dangerMode: false
  });
}

export async function deleteEntity(token: string | null, table: string, pk: Record<string, unknown>) {
  const sdk = createAdminSdk(token);
  await sdk.dbAdminDelete({ table, pkJson: JSON.stringify(pk), dangerMode: false });
}
