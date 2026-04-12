import { config } from '../config.js';
import type { DbClient } from '../db/DbClient.js';
import { listUserPermissions } from './service.js';

export type PermissionEvaluation = {
  allowed: boolean;
  reason: string;
  permissions: string[];
  roles: string[];
};

export type PermissionCheckInput = {
  userId?: number | null;
  action: string;
  fallbackActions?: string[];
};

async function listRoleNames(db: DbClient, userId: number): Promise<string[]> {
  const rows = await db.all<{ name: string }>(
    `
SELECT lower(r.name) as name
FROM user_roles ur
INNER JOIN roles r ON r.id = ur.role_id
WHERE ur.user_id = ?
`,
    [userId]
  );
  return Array.from(new Set(rows.map((row) => row.name)));
}

async function getUsername(db: DbClient, userId: number): Promise<string | null> {
  const row = await db.get<{ username: string }>(
    'SELECT lower(username) as username FROM users WHERE id = ?',
    [userId]
  );
  return row?.username ?? null;
}

export async function checkPermission(db: DbClient, input: PermissionCheckInput): Promise<PermissionEvaluation> {
  const action = input.action.trim();
  if (!action) {
    return { allowed: false, reason: 'No permission action provided', permissions: [], roles: [] };
  }
  if (!input.userId) {
    return { allowed: false, reason: 'No authenticated user', permissions: [], roles: [] };
  }

  const [roles, permissions] = await Promise.all([
    listRoleNames(db, input.userId),
    listUserPermissions(db, input.userId)
  ]);

  if (roles.includes('admin')) {
    return { allowed: true, reason: 'Allowed via admin role', permissions, roles };
  }

  const seedAdminUsername = config.seedAdminUsername.trim().toLowerCase();
  if (seedAdminUsername) {
    const username = await getUsername(db, input.userId);
    if (username === seedAdminUsername) {
      await ensureUserHasRole(db, input.userId, 'admin');
      const [healedRoles, healedPermissions] = await Promise.all([
        listRoleNames(db, input.userId),
        listUserPermissions(db, input.userId)
      ]);
      return {
        allowed: true,
        reason: 'Allowed via configured seed admin account',
        permissions: healedPermissions,
        roles: healedRoles.includes('admin') ? healedRoles : [...healedRoles, 'admin']
      };
    }
  }

  const allCandidates = [action, ...(input.fallbackActions ?? [])].map((entry) => entry.trim()).filter(Boolean);
  const denyMatch = allCandidates.find((candidate) => permissions.includes(`DENY:${candidate}`));
  if (denyMatch) {
    return { allowed: false, reason: `Denied by explicit permission DENY:${denyMatch}`, permissions, roles };
  }

  const allowMatch = allCandidates.find((candidate) => permissions.includes(candidate));
  if (allowMatch) {
    return { allowed: true, reason: `Allowed via permission ${allowMatch}`, permissions, roles };
  }

  return { allowed: false, reason: `Missing permissions: ${allCandidates.join(', ')}`, permissions, roles };
}

export async function ensureUserHasRole(db: DbClient, userId: number, roleName: string): Promise<void> {
  const role = await db.get<{ id: number }>('SELECT id FROM roles WHERE lower(name) = lower(?)', [roleName]);
  if (!role) {
    return;
  }
  await db.run(
    `INSERT INTO user_roles(user_id, role_id)
     SELECT ?, ?
     WHERE NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = ? AND role_id = ?)`,
    [userId, role.id, userId, role.id]
  );
}
