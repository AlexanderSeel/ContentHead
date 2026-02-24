import { GraphQLError } from 'graphql';
import { evaluateRule, type Rule, type RuleContext } from '@contenthead/shared';

import type { DbClient } from '../db/DbClient.js';

export const ACL_ENTITY_TYPES = ['PAGE', 'COMPONENT_INSTANCE', 'COMPONENT_TYPE'] as const;
export type AclEntityType = (typeof ACL_ENTITY_TYPES)[number];

export const ACL_PRINCIPAL_TYPES = ['ROLE', 'USER', 'GROUP'] as const;
export type AclPrincipalType = (typeof ACL_PRINCIPAL_TYPES)[number];

export const ACL_EFFECTS = ['ALLOW', 'DENY'] as const;
export type AclEffect = (typeof ACL_EFFECTS)[number];

export const ACL_PERMISSION_KEYS = [
  'page.view',
  'page.create',
  'page.update',
  'page.delete',
  'page.publish',
  'page.admin',
  'component.update',
  'component.delete',
  'component.admin'
] as const;
export type AclPermissionKey = (typeof ACL_PERMISSION_KEYS)[number];

export type EntityAclRecord = {
  id: number;
  entityType: AclEntityType;
  entityId: string;
  principalType: AclPrincipalType;
  principalId: string;
  permissionKey: AclPermissionKey;
  effect: AclEffect;
};

export type PrincipalGroupRecord = {
  id: number;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type VisitorGroupRecord = {
  id: number;
  siteId: number;
  name: string;
  ruleJson: string;
  createdAt: string;
  updatedAt: string;
};

export type PageAclSettingsRecord = {
  contentItemId: number;
  inheritFromParent: boolean;
};

export type PageTargetingRecord = {
  contentItemId: number;
  inheritFromParent: boolean;
  allowVisitorGroupIdsJson: string;
  denyVisitorGroupIdsJson: string;
  denyBehavior: 'NOT_FOUND' | 'FALLBACK';
  fallbackContentItemId: number | null;
};

export type AclEvaluation = {
  allowed: boolean;
  reason: string;
  hasRules: boolean;
  sourceEntityId: string;
};

export type PageViewEvaluation = {
  allowed: boolean;
  reason: string;
  acl: AclEvaluation;
  matchedAllowGroupIds: number[];
  matchedDenyGroupIds: number[];
  fallbackContentItemId: number | null;
};

function invalid(message: string, code = 'BAD_USER_INPUT'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function notFound(message: string, code = 'NOT_FOUND'): never {
  throw new GraphQLError(message, { extensions: { code } });
}

function normalizeEntityId(value: number | string): string {
  const entityId = String(value).trim();
  if (!entityId) {
    invalid('entityId is required');
  }
  return entityId;
}

function parseIdsJson(json: string): number[] {
  try {
    const parsed = JSON.parse(json) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .map((entry) => Number(entry))
      .filter((entry) => Number.isFinite(entry) && entry > 0)
      .map((entry) => Math.trunc(entry));
  } catch {
    return [];
  }
}

function parseRuleContext(contextJson?: string | null): RuleContext {
  if (!contextJson?.trim()) {
    return { segments: [], query: {} };
  }
  try {
    const parsed = JSON.parse(contextJson) as RuleContext;
    return {
      userId: parsed.userId ?? null,
      sessionId: parsed.sessionId ?? null,
      segments: parsed.segments ?? [],
      country: parsed.country ?? null,
      device: parsed.device ?? null,
      referrer: parsed.referrer ?? null,
      query: parsed.query ?? {}
    };
  } catch {
    invalid('contextJson must be valid JSON', 'INVALID_CONTEXT');
  }
}

async function nextId(db: DbClient, table: string): Promise<number> {
  const row = await db.get<{ nextId: number }>(`SELECT COALESCE(MAX(id), 0) + 1 as nextId FROM ${table}`);
  return row?.nextId ?? 1;
}

async function getPageParentId(db: DbClient, contentItemId: number): Promise<number | null> {
  const row = await db.get<{ parentId: number | null }>('SELECT parent_id as parentId FROM content_items WHERE id = ?', [
    contentItemId
  ]);
  if (!row) {
    notFound(`Content item ${contentItemId} not found`, 'CONTENT_ITEM_NOT_FOUND');
  }
  return row.parentId ?? null;
}

async function resolveInheritedPageId(
  db: DbClient,
  contentItemId: number,
  settingsTable: 'page_acl_settings' | 'page_targeting'
): Promise<number> {
  let currentId = contentItemId;
  while (true) {
    const row = await db.get<{ inheritFromParent: boolean }>(
      `SELECT COALESCE(inherit_from_parent, TRUE) as inheritFromParent FROM ${settingsTable} WHERE content_item_id = ?`,
      [currentId]
    );
    const inheritFromParent = Boolean(row?.inheritFromParent ?? true);
    const parentId = await getPageParentId(db, currentId);
    if (!inheritFromParent || parentId == null) {
      return currentId;
    }
    currentId = parentId;
  }
}

function normalizePermissionKey(permissionKey: string): AclPermissionKey {
  if (!(ACL_PERMISSION_KEYS as readonly string[]).includes(permissionKey)) {
    invalid(`Unknown ACL permission key: ${permissionKey}`, 'INVALID_PERMISSION_KEY');
  }
  return permissionKey as AclPermissionKey;
}

function permissionCandidates(permissionKey: AclPermissionKey): AclPermissionKey[] {
  if (permissionKey === 'page.admin') {
    return ['page.admin'];
  }
  if (permissionKey.startsWith('page.')) {
    return [permissionKey, 'page.admin'];
  }
  if (permissionKey === 'component.admin') {
    return ['component.admin', 'page.admin'];
  }
  return [permissionKey, 'component.admin', 'page.admin'];
}

type PrincipalSet = {
  userIds: Set<string>;
  roleIds: Set<string>;
  groupIds: Set<string>;
};

async function principalsForUser(db: DbClient, userId?: number | null): Promise<PrincipalSet> {
  const principals: PrincipalSet = {
    userIds: new Set<string>(),
    roleIds: new Set<string>(),
    groupIds: new Set<string>()
  };
  if (!userId) {
    return principals;
  }
  principals.userIds.add(String(userId));
  const roleRows = await db.all<{ roleId: number }>('SELECT role_id as roleId FROM user_roles WHERE user_id = ?', [
    userId
  ]);
  const groupRows = await db.all<{ groupId: number }>('SELECT group_id as groupId FROM user_groups WHERE user_id = ?', [
    userId
  ]);
  for (const row of roleRows) {
    principals.roleIds.add(String(row.roleId));
  }
  for (const row of groupRows) {
    principals.groupIds.add(String(row.groupId));
  }
  return principals;
}

function matchesPrincipal(row: EntityAclRecord, principals: PrincipalSet): boolean {
  if (row.principalType === 'USER') {
    return principals.userIds.has(row.principalId);
  }
  if (row.principalType === 'ROLE') {
    return principals.roleIds.has(row.principalId);
  }
  return principals.groupIds.has(row.principalId);
}

export async function listEntityAcls(
  db: DbClient,
  input: { entityType: AclEntityType; entityId: number | string }
): Promise<EntityAclRecord[]> {
  const entityId = normalizeEntityId(input.entityId);
  return db.all<EntityAclRecord>(
    `
SELECT
  id,
  entity_type as entityType,
  entity_id as entityId,
  principal_type as principalType,
  principal_id as principalId,
  permission_key as permissionKey,
  effect
FROM entity_acls
WHERE entity_type = ?
  AND entity_id = ?
ORDER BY permission_key, principal_type, principal_id
`,
    [input.entityType, entityId]
  );
}

export async function replaceEntityAcls(
  db: DbClient,
  input: {
    entityType: AclEntityType;
    entityId: number | string;
    entries: Array<{
      principalType: AclPrincipalType;
      principalId: string;
      permissionKey: AclPermissionKey;
      effect: AclEffect;
    }>;
  }
): Promise<EntityAclRecord[]> {
  const entityId = normalizeEntityId(input.entityId);
  const deduped = new Map<string, (typeof input.entries)[number]>();
  for (const entry of input.entries) {
    const permissionKey = normalizePermissionKey(entry.permissionKey);
    if (!(ACL_PRINCIPAL_TYPES as readonly string[]).includes(entry.principalType)) {
      invalid(`Invalid principalType ${entry.principalType}`);
    }
    if (!(ACL_EFFECTS as readonly string[]).includes(entry.effect)) {
      invalid(`Invalid effect ${entry.effect}`);
    }
    const principalId = String(entry.principalId).trim();
    if (!principalId) {
      invalid('principalId is required');
    }
    const key = `${entry.principalType}:${principalId}:${permissionKey}`;
    deduped.set(key, {
      principalType: entry.principalType,
      principalId,
      permissionKey,
      effect: entry.effect
    });
  }

  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM entity_acls WHERE entity_type = ? AND entity_id = ?', [input.entityType, entityId]);
    for (const entry of deduped.values()) {
      const id = await nextId(db, 'entity_acls');
      await db.run(
        `
INSERT INTO entity_acls(
  id,
  entity_type,
  entity_id,
  principal_type,
  principal_id,
  permission_key,
  effect
)
VALUES (?, ?, ?, ?, ?, ?, ?)
`,
        [
          id,
          input.entityType,
          entityId,
          entry.principalType,
          entry.principalId,
          entry.permissionKey,
          entry.effect
        ]
      );
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }

  return listEntityAcls(db, { entityType: input.entityType, entityId });
}

export async function evaluateEntityAclPermission(
  db: DbClient,
  input: {
    entityType: AclEntityType;
    entityId: number | string;
    permissionKey: AclPermissionKey;
    userId?: number | null | undefined;
  }
): Promise<AclEvaluation> {
  const entityId = normalizeEntityId(input.entityId);
  const permissionKey = normalizePermissionKey(input.permissionKey);
  const keys = permissionCandidates(permissionKey);
  const keyPlaceholders = keys.map(() => '?').join(', ');
  const rows = await db.all<EntityAclRecord>(
    `
SELECT
  id,
  entity_type as entityType,
  entity_id as entityId,
  principal_type as principalType,
  principal_id as principalId,
  permission_key as permissionKey,
  effect
FROM entity_acls
WHERE entity_type = ?
  AND entity_id = ?
  AND permission_key IN (${keyPlaceholders})
`,
    [input.entityType, entityId, ...keys]
  );
  if (rows.length === 0) {
    return {
      allowed: true,
      reason: 'no_acl_rules',
      hasRules: false,
      sourceEntityId: entityId
    };
  }

  const principals = await principalsForUser(db, input.userId);
  const matches = rows.filter((row) => matchesPrincipal(row, principals));
  if (matches.some((row) => row.effect === 'DENY')) {
    return {
      allowed: false,
      reason: 'explicit_deny',
      hasRules: true,
      sourceEntityId: entityId
    };
  }
  if (matches.some((row) => row.effect === 'ALLOW')) {
    return {
      allowed: true,
      reason: 'explicit_allow',
      hasRules: true,
      sourceEntityId: entityId
    };
  }
  return {
    allowed: false,
    reason: 'no_matching_grant',
    hasRules: true,
    sourceEntityId: entityId
  };
}

export async function evaluatePageAclPermission(
  db: DbClient,
  input: {
    contentItemId: number;
    permissionKey: AclPermissionKey;
    userId?: number | null | undefined;
  }
): Promise<AclEvaluation> {
  const sourcePageId = await resolveInheritedPageId(db, input.contentItemId, 'page_acl_settings');
  const evaluated = await evaluateEntityAclPermission(db, {
    entityType: 'PAGE',
    entityId: sourcePageId,
    permissionKey: input.permissionKey,
    userId: input.userId
  });
  return {
    ...evaluated,
    sourceEntityId: String(sourcePageId)
  };
}

export async function getPageAclSettings(db: DbClient, contentItemId: number): Promise<PageAclSettingsRecord> {
  await getPageParentId(db, contentItemId);
  const row = await db.get<PageAclSettingsRecord>(
    `
SELECT
  content_item_id as contentItemId,
  COALESCE(inherit_from_parent, TRUE) as inheritFromParent
FROM page_acl_settings
WHERE content_item_id = ?
`,
    [contentItemId]
  );
  return row ?? { contentItemId, inheritFromParent: true };
}

export async function upsertPageAclSettings(
  db: DbClient,
  input: { contentItemId: number; inheritFromParent: boolean }
): Promise<PageAclSettingsRecord> {
  await getPageParentId(db, input.contentItemId);
  await db.run(
    `
INSERT INTO page_acl_settings(content_item_id, inherit_from_parent, updated_at)
VALUES (?, ?, current_timestamp)
ON CONFLICT(content_item_id) DO UPDATE SET
  inherit_from_parent = excluded.inherit_from_parent,
  updated_at = current_timestamp
`,
    [input.contentItemId, input.inheritFromParent]
  );
  return getPageAclSettings(db, input.contentItemId);
}

export async function listPrincipalGroups(db: DbClient): Promise<PrincipalGroupRecord[]> {
  return db.all<PrincipalGroupRecord>(
    `
SELECT
  id,
  name,
  description,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM principal_groups
ORDER BY name
`
  );
}

export async function upsertPrincipalGroup(
  db: DbClient,
  input: { id?: number | null | undefined; name: string; description?: string | null | undefined }
): Promise<PrincipalGroupRecord> {
  const normalizedName = input.name.trim();
  if (!normalizedName) {
    invalid('Group name is required');
  }
  const id = input.id ?? (await nextId(db, 'principal_groups'));
  await db.run(
    `
INSERT INTO principal_groups(id, name, description)
VALUES (?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  description = excluded.description,
  updated_at = current_timestamp
`,
    [id, normalizedName, input.description ?? null]
  );
  const row = await db.get<PrincipalGroupRecord>(
    `
SELECT
  id,
  name,
  description,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM principal_groups
WHERE id = ?
`,
    [id]
  );
  if (!row) {
    throw new Error('Failed to upsert principal group');
  }
  return row;
}

export async function deletePrincipalGroup(db: DbClient, groupId: number): Promise<boolean> {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run("DELETE FROM entity_acls WHERE principal_type = 'GROUP' AND principal_id = ?", [String(groupId)]);
    await db.run('DELETE FROM user_groups WHERE group_id = ?', [groupId]);
    await db.run('DELETE FROM principal_groups WHERE id = ?', [groupId]);
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
  return true;
}

export async function listUserGroupIds(db: DbClient, userId: number): Promise<number[]> {
  const rows = await db.all<{ groupId: number }>('SELECT group_id as groupId FROM user_groups WHERE user_id = ?', [
    userId
  ]);
  return rows.map((row) => row.groupId);
}

export async function setUserGroups(db: DbClient, userId: number, groupIds: number[]): Promise<boolean> {
  await db.run('BEGIN TRANSACTION');
  try {
    await db.run('DELETE FROM user_groups WHERE user_id = ?', [userId]);
    for (const groupId of Array.from(new Set(groupIds.map((entry) => Math.trunc(entry)).filter((entry) => entry > 0)))) {
      await db.run('INSERT INTO user_groups(user_id, group_id) VALUES (?, ?)', [userId, groupId]);
    }
    await db.run('COMMIT');
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
  return true;
}

function parseRuleJson(ruleJson: string): Rule {
  try {
    return JSON.parse(ruleJson) as Rule;
  } catch {
    invalid('ruleJson must be valid JSON', 'INVALID_RULE_JSON');
  }
}

export async function listVisitorGroups(db: DbClient, siteId: number): Promise<VisitorGroupRecord[]> {
  return db.all<VisitorGroupRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  rule_json as ruleJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM visitor_groups
WHERE site_id = ?
ORDER BY name
`,
    [siteId]
  );
}

export async function upsertVisitorGroup(
  db: DbClient,
  input: { id?: number | null | undefined; siteId: number; name: string; ruleJson: string }
): Promise<VisitorGroupRecord> {
  if (!input.name.trim()) {
    invalid('name is required');
  }
  parseRuleJson(input.ruleJson);
  const id = input.id ?? (await nextId(db, 'visitor_groups'));
  await db.run(
    `
INSERT INTO visitor_groups(id, site_id, name, rule_json)
VALUES (?, ?, ?, ?)
ON CONFLICT(id) DO UPDATE SET
  site_id = excluded.site_id,
  name = excluded.name,
  rule_json = excluded.rule_json,
  updated_at = current_timestamp
`,
    [id, input.siteId, input.name.trim(), input.ruleJson]
  );
  const row = await db.get<VisitorGroupRecord>(
    `
SELECT
  id,
  site_id as siteId,
  name,
  rule_json as ruleJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM visitor_groups
WHERE id = ?
`,
    [id]
  );
  if (!row) {
    throw new Error('Failed to upsert visitor group');
  }
  return row;
}

export async function deleteVisitorGroup(db: DbClient, id: number): Promise<boolean> {
  await db.run('DELETE FROM visitor_groups WHERE id = ?', [id]);
  return true;
}

export async function getPageTargeting(db: DbClient, contentItemId: number): Promise<PageTargetingRecord> {
  await getPageParentId(db, contentItemId);
  const row = await db.get<PageTargetingRecord>(
    `
SELECT
  content_item_id as contentItemId,
  COALESCE(inherit_from_parent, TRUE) as inheritFromParent,
  COALESCE(allow_visitor_group_ids_json, '[]') as allowVisitorGroupIdsJson,
  COALESCE(deny_visitor_group_ids_json, '[]') as denyVisitorGroupIdsJson,
  COALESCE(deny_behavior, 'NOT_FOUND') as denyBehavior,
  fallback_content_item_id as fallbackContentItemId
FROM page_targeting
WHERE content_item_id = ?
`,
    [contentItemId]
  );
  return (
    row ?? {
      contentItemId,
      inheritFromParent: true,
      allowVisitorGroupIdsJson: '[]',
      denyVisitorGroupIdsJson: '[]',
      denyBehavior: 'NOT_FOUND',
      fallbackContentItemId: null
    }
  );
}

export async function upsertPageTargeting(
  db: DbClient,
  input: {
    contentItemId: number;
    inheritFromParent: boolean;
    allowVisitorGroupIdsJson: string;
    denyVisitorGroupIdsJson: string;
    denyBehavior: 'NOT_FOUND' | 'FALLBACK';
    fallbackContentItemId?: number | null | undefined;
  }
): Promise<PageTargetingRecord> {
  await getPageParentId(db, input.contentItemId);
  parseIdsJson(input.allowVisitorGroupIdsJson);
  parseIdsJson(input.denyVisitorGroupIdsJson);
  const denyBehavior = input.denyBehavior === 'FALLBACK' ? 'FALLBACK' : 'NOT_FOUND';

  await db.run(
    `
INSERT INTO page_targeting(
  content_item_id,
  inherit_from_parent,
  allow_visitor_group_ids_json,
  deny_visitor_group_ids_json,
  deny_behavior,
  fallback_content_item_id,
  updated_at
)
VALUES (?, ?, ?, ?, ?, ?, current_timestamp)
ON CONFLICT(content_item_id) DO UPDATE SET
  inherit_from_parent = excluded.inherit_from_parent,
  allow_visitor_group_ids_json = excluded.allow_visitor_group_ids_json,
  deny_visitor_group_ids_json = excluded.deny_visitor_group_ids_json,
  deny_behavior = excluded.deny_behavior,
  fallback_content_item_id = excluded.fallback_content_item_id,
  updated_at = current_timestamp
`,
    [
      input.contentItemId,
      input.inheritFromParent,
      input.allowVisitorGroupIdsJson,
      input.denyVisitorGroupIdsJson,
      denyBehavior,
      input.fallbackContentItemId ?? null
    ]
  );
  return getPageTargeting(db, input.contentItemId);
}

async function evaluateTargeting(
  db: DbClient,
  input: { contentItemId: number; context: RuleContext }
): Promise<{
  allowed: boolean;
  reason: string;
  matchedAllowGroupIds: number[];
  matchedDenyGroupIds: number[];
  fallbackContentItemId: number | null;
}> {
  const sourcePageId = await resolveInheritedPageId(db, input.contentItemId, 'page_targeting');
  const targeting = await getPageTargeting(db, sourcePageId);
  const allowIds = parseIdsJson(targeting.allowVisitorGroupIdsJson);
  const denyIds = parseIdsJson(targeting.denyVisitorGroupIdsJson);
  if (allowIds.length === 0 && denyIds.length === 0) {
    return {
      allowed: true,
      reason: 'no_targeting_rules',
      matchedAllowGroupIds: [],
      matchedDenyGroupIds: [],
      fallbackContentItemId: null
    };
  }

  const allIds = Array.from(new Set([...allowIds, ...denyIds]));
  const placeholders = allIds.map(() => '?').join(', ');
  const groups =
    allIds.length === 0
      ? []
      : await db.all<VisitorGroupRecord>(
          `
SELECT
  id,
  site_id as siteId,
  name,
  rule_json as ruleJson,
  CAST(created_at AS VARCHAR) as createdAt,
  CAST(updated_at AS VARCHAR) as updatedAt
FROM visitor_groups
WHERE id IN (${placeholders})
`,
          allIds
        );
  const byId = new Map(groups.map((group) => [group.id, group]));
  const matchedAllowGroupIds = allowIds.filter((id) => {
    const group = byId.get(id);
    if (!group) {
      return false;
    }
    try {
      return evaluateRule(JSON.parse(group.ruleJson) as Rule, input.context);
    } catch {
      return false;
    }
  });
  const matchedDenyGroupIds = denyIds.filter((id) => {
    const group = byId.get(id);
    if (!group) {
      return false;
    }
    try {
      return evaluateRule(JSON.parse(group.ruleJson) as Rule, input.context);
    } catch {
      return false;
    }
  });

  if (matchedDenyGroupIds.length > 0) {
    return {
      allowed: false,
      reason: 'deny_group_match',
      matchedAllowGroupIds,
      matchedDenyGroupIds,
      fallbackContentItemId:
        targeting.denyBehavior === 'FALLBACK' ? (targeting.fallbackContentItemId ?? null) : null
    };
  }
  if (allowIds.length > 0 && matchedAllowGroupIds.length === 0) {
    return {
      allowed: false,
      reason: 'no_allow_group_match',
      matchedAllowGroupIds,
      matchedDenyGroupIds,
      fallbackContentItemId:
        targeting.denyBehavior === 'FALLBACK' ? (targeting.fallbackContentItemId ?? null) : null
    };
  }

  return {
    allowed: true,
    reason: 'targeting_allowed',
    matchedAllowGroupIds,
    matchedDenyGroupIds,
    fallbackContentItemId: null
  };
}

export async function evaluatePageView(
  db: DbClient,
  input: {
    contentItemId: number;
    userId?: number | null | undefined;
    contextJson?: string | null | undefined;
    previewAllowed?: boolean | null | undefined;
  }
): Promise<PageViewEvaluation> {
  if (input.previewAllowed) {
    return {
      allowed: true,
      reason: 'preview_bypass',
      acl: {
        allowed: true,
        reason: 'preview_bypass',
        hasRules: false,
        sourceEntityId: String(input.contentItemId)
      },
      matchedAllowGroupIds: [],
      matchedDenyGroupIds: [],
      fallbackContentItemId: null
    };
  }

  const acl = await evaluatePageAclPermission(db, {
    contentItemId: input.contentItemId,
    permissionKey: 'page.view',
    userId: input.userId
  });
  if (!acl.allowed) {
    return {
      allowed: false,
      reason: `acl:${acl.reason}`,
      acl,
      matchedAllowGroupIds: [],
      matchedDenyGroupIds: [],
      fallbackContentItemId: null
    };
  }

  const targeting = await evaluateTargeting(db, {
    contentItemId: input.contentItemId,
    context: parseRuleContext(input.contextJson)
  });
  if (!targeting.allowed) {
    return {
      allowed: false,
      reason: `targeting:${targeting.reason}`,
      acl,
      matchedAllowGroupIds: targeting.matchedAllowGroupIds,
      matchedDenyGroupIds: targeting.matchedDenyGroupIds,
      fallbackContentItemId: targeting.fallbackContentItemId
    };
  }

  return {
    allowed: true,
    reason: 'allowed',
    acl,
    matchedAllowGroupIds: targeting.matchedAllowGroupIds,
    matchedDenyGroupIds: targeting.matchedDenyGroupIds,
    fallbackContentItemId: null
  };
}

export async function evaluatePageTargeting(
  db: DbClient,
  input: { contentItemId: number; contextJson?: string | null | undefined }
): Promise<PageViewEvaluation> {
  return evaluatePageView(db, {
    contentItemId: input.contentItemId,
    contextJson: input.contextJson,
    userId: null,
    previewAllowed: false
  });
}
