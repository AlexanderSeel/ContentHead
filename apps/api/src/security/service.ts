import bcrypt from 'bcryptjs';
import { GraphQLError } from 'graphql';

import type { DbClient } from '../db/DbClient.js';

export const INTERNAL_PERMISSIONS = [
  'ASSET_READ',
  'ASSET_WRITE',
  'ASSET_DELETE',
  'CONTENT_READ',
  'CONTENT_WRITE',
  'DB_ADMIN',
  'DB_ADMIN_READ',
  'DB_ADMIN_WRITE',
  'SETTINGS_MANAGE',
  'SECURITY_MANAGE'
] as const;

export type InternalPermission = (typeof INTERNAL_PERMISSIONS)[number];

export type InternalUserRecord = {
  id: number;
  username: string;
  displayName: string;
  active: boolean;
  createdAt: string;
};

export type InternalRoleRecord = {
  id: number;
  name: string;
  description: string | null;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
};

function invalid(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

export async function listInternalUsers(db: DbClient): Promise<InternalUserRecord[]> {
  return db.all<InternalUserRecord>(
    `
SELECT
  id,
  username,
  display_name as displayName,
  COALESCE(active, TRUE) as active,
  CAST(created_at AS VARCHAR) as createdAt
FROM users
ORDER BY username
`
  );
}

export async function createInternalUser(
  db: DbClient,
  input: { username: string; displayName: string; password: string; active: boolean }
): Promise<InternalUserRecord> {
  if (!input.username.trim()) {
    invalid('username is required');
  }
  if (input.password.length < 8) {
    invalid('password must be at least 8 characters');
  }

  const id = await nextId(db, 'users');
  const passwordHash = await bcrypt.hash(input.password, 12);

  await db.run(
    'INSERT INTO users(id, username, password_hash, display_name, active) VALUES (?, ?, ?, ?, ?)',
    [id, input.username.trim(), passwordHash, input.displayName.trim() || input.username.trim(), input.active]
  );

  const created = await db.get<InternalUserRecord>(
    `
SELECT
  id,
  username,
  display_name as displayName,
  COALESCE(active, TRUE) as active,
  CAST(created_at AS VARCHAR) as createdAt
FROM users
WHERE id = ?
`,
    [id]
  );

  if (!created) {
    throw new Error('Failed to create user');
  }

  return created;
}

export async function updateInternalUser(
  db: DbClient,
  input: { id: number; displayName: string; active: boolean }
): Promise<InternalUserRecord> {
  await db.run('UPDATE users SET display_name = ?, active = ? WHERE id = ?', [input.displayName, input.active, input.id]);

  const updated = await db.get<InternalUserRecord>(
    `
SELECT
  id,
  username,
  display_name as displayName,
  COALESCE(active, TRUE) as active,
  CAST(created_at AS VARCHAR) as createdAt
FROM users
WHERE id = ?
`,
    [input.id]
  );

  if (!updated) {
    throw new GraphQLError(`User ${input.id} not found`, { extensions: { code: 'USER_NOT_FOUND' } });
  }

  return updated;
}

export async function resetInternalUserPassword(db: DbClient, userId: number, password: string): Promise<boolean> {
  if (password.length < 8) {
    invalid('password must be at least 8 characters');
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  return true;
}

export async function listInternalRoles(db: DbClient): Promise<InternalRoleRecord[]> {
  let roles: Array<{
    id: number;
    name: string;
    description: string | null;
    createdAt: string;
    updatedAt: string;
  }>;
  try {
    roles = await db.all<{
      id: number;
      name: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      `
SELECT
  id,
  name,
  description,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM roles
ORDER BY name
`
    );
  } catch {
    // Legacy DBs can miss roles.updated_at.
    roles = await db.all<{
      id: number;
      name: string;
      description: string | null;
      createdAt: string;
      updatedAt: string;
    }>(
      `
SELECT
  id,
  name,
  description,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(current_timestamp AS VARCHAR) as updatedAt
FROM roles
ORDER BY name
`
    );
  }

  const permissions = await db.all<{ roleId: number; permissionKey: string }>(
    'SELECT role_id as roleId, permission_key as permissionKey FROM role_permissions'
  );

  const byRole = permissions.reduce<Record<number, string[]>>((acc, row) => {
    acc[row.roleId] = [...(acc[row.roleId] ?? []), row.permissionKey];
    return acc;
  }, {});

  return roles.map((role) => ({
    ...role,
    permissions: byRole[role.id] ?? []
  }));
}

export async function upsertInternalRole(
  db: DbClient,
  input: { id?: number | null; name: string; description?: string | null; permissions: string[] }
): Promise<InternalRoleRecord> {
  const id = input.id ?? (await nextId(db, 'roles'));
  const permissions = Array.from(new Set(input.permissions.filter(Boolean)));

  await db.run('BEGIN TRANSACTION');
  try {
    const existing = await db.get<{ id: number }>('SELECT id FROM roles WHERE id = ?', [id]);

    if (!existing) {
      await db.run('INSERT INTO roles(id, name, description) VALUES (?, ?, ?)', [
        id,
        input.name,
        input.description ?? null
      ]);
    } else {
      try {
        // First try UPDATE (fast path)
        await db.run('UPDATE roles SET name = ?, description = ? WHERE id = ?', [
          input.name,
          input.description ?? null,
          id
        ]);
      } catch (e: any) {
        // DuckDB FK limitation workaround: rebuild role row while preserving links
        const msg = String(e?.message ?? e);
        const isFkViolation =
          msg.includes('Constraint Error') &&
          msg.includes('foreign key') &&
          msg.includes('role_id');

        if (!isFkViolation) throw e;

        // preserve user-role links
        const userRoleLinks = await db.all<{ userId: number }>(
          'SELECT user_id as userId FROM user_roles WHERE role_id = ?',
          [id]
        );

        // remove children that reference roles (must delete before deleting role)
        await db.run('DELETE FROM role_permissions WHERE role_id = ?', [id]);
        await db.run('DELETE FROM user_roles WHERE role_id = ?', [id]);

        // rebuild role row
        await db.run('DELETE FROM roles WHERE id = ?', [id]);
        await db.run('INSERT INTO roles(id, name, description) VALUES (?, ?, ?)', [
          id,
          input.name,
          input.description ?? null
        ]);

        // restore links
        for (const link of userRoleLinks) {
          await db.run('INSERT INTO user_roles(user_id, role_id) VALUES (?, ?)', [link.userId, id]);
        }
      }
    }

    // now reset permissions to desired state
    await db.run('DELETE FROM role_permissions WHERE role_id = ?', [id]);
    for (const permission of permissions) {
      await db.run('INSERT INTO role_permissions(role_id, permission_key) VALUES (?, ?)', [id, permission]);
    }

    await db.run('COMMIT');

  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  const roles = await listInternalRoles(db);
  const role = roles.find((entry) => entry.id === id);
  if (!role) {
    throw new Error('Failed to upsert role');
  }
  return role;
}

export async function deleteInternalRole(db: DbClient, roleId: number): Promise<boolean> {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM user_roles WHERE role_id = ?', [roleId]);
    await db.run('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
    await db.run('DELETE FROM roles WHERE id = ?', [roleId]);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
  return true;
}

export async function listUserRoles(db: DbClient, userId: number): Promise<number[]> {
  const rows = await db.all<{ roleId: number }>('SELECT role_id as roleId FROM user_roles WHERE user_id = ?', [userId]);
  return rows.map((row) => row.roleId);
}

export async function listUserPermissions(db: DbClient, userId: number): Promise<string[]> {
  const rows = await db.all<{ permissionKey: string }>(
    `
SELECT rp.permission_key as permissionKey
FROM role_permissions rp
INNER JOIN user_roles ur ON ur.role_id = rp.role_id
WHERE ur.user_id = ?
`,
    [userId]
  );
  return Array.from(new Set(rows.map((row) => row.permissionKey)));
}

export async function setUserRoles(db: DbClient, userId: number, roleIds: number[]): Promise<boolean> {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM user_roles WHERE user_id = ?', [userId]);
    for (const roleId of Array.from(new Set(roleIds))) {
      await db.run('INSERT INTO user_roles(user_id, role_id) VALUES (?, ?)', [userId, roleId]);
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
  return true;
}

export async function ensureBaselineSecurity(db: DbClient): Promise<void> {
  const adminRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE name = 'admin'");
  const editorRole = await db.get<{ id: number }>("SELECT id FROM roles WHERE name = 'editor'");

  const adminRoleId = adminRole?.id ?? (await nextId(db, 'roles'));
  if (!adminRole) {
    await db.run('INSERT INTO roles(id, name, description) VALUES (?, ?, ?)', [
      adminRoleId,
      'admin',
      'Full access'
    ]);
  }

  const editorRoleId = editorRole?.id ?? (adminRole ? adminRoleId + 1 : await nextId(db, 'roles'));
  if (!editorRole) {
    await db.run('INSERT INTO roles(id, name, description) VALUES (?, ?, ?)', [
      editorRoleId,
      'editor',
      'Content editing access'
    ]);
  }

  const allPermissions = [
    ...INTERNAL_PERMISSIONS,
    'CONTENT_READ',
    'CONTENT_WRITE',
    'SETTINGS_MANAGE',
    'SECURITY_MANAGE'
  ];

  for (const permission of Array.from(new Set(allPermissions))) {
    await db.run('INSERT INTO role_permissions(role_id, permission_key) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_key = ?)', [adminRoleId, permission, adminRoleId, permission]);
  }

  for (const permission of ['CONTENT_READ', 'CONTENT_WRITE', 'ASSET_READ', 'ASSET_WRITE']) {
    await db.run('INSERT INTO role_permissions(role_id, permission_key) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM role_permissions WHERE role_id = ? AND permission_key = ?)', [editorRoleId, permission, editorRoleId, permission]);
  }
}
