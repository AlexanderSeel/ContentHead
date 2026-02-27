import { useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';

import { useAdminContext } from './AdminContext';
import { useAuth } from './AuthContext';
import { deriveFeatureTag, issueCollector } from '../lib/issueCollector';

const buildInfo =
  import.meta.env.VITE_BUILD_SHA ??
  import.meta.env.VITE_COMMIT_SHA ??
  import.meta.env.VITE_APP_VERSION ??
  undefined;

export function IssueCollectorRouteBridge() {
  const location = useLocation();
  const { username, userId, token } = useAuth();
  const rolesSummary = useMemo(() => summarizeRoles(token), [token]);

  useEffect(() => {
    issueCollector.setContextSnapshot({
      route: `${location.pathname}${location.search}`,
      username,
      userId,
      rolesSummary,
      featureTag: deriveFeatureTag(location.pathname),
      buildInfo
    });
  }, [location.pathname, location.search, username, userId, rolesSummary]);

  return null;
}

export function IssueCollectorAdminBridge() {
  const { siteId, marketCode, localeCode } = useAdminContext();

  useEffect(() => {
    issueCollector.setContextSnapshot({
      siteId,
      market: marketCode,
      locale: localeCode
    });
  }, [siteId, marketCode, localeCode]);

  return null;
}

function summarizeRoles(token: string | null): string | null {
  if (!token) {
    return null;
  }
  const payload = decodeJwtPayload(token);
  if (!payload) {
    return null;
  }

  const roleValues = pickStringArray(payload, ['roles', 'role', 'permissions', 'perms', 'scope', 'scp']);
  if (roleValues.length === 0) {
    return null;
  }

  const deduped = Array.from(new Set(roleValues)).slice(0, 6);
  const suffix = roleValues.length > deduped.length ? ` +${roleValues.length - deduped.length} more` : '';
  return `${deduped.join(', ')}${suffix}`;
}

function pickStringArray(payload: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = payload[key];
    if (Array.isArray(value)) {
      return value
        .map((entry) => String(entry).trim())
        .filter((entry) => entry.length > 0);
    }
    if (typeof value === 'string') {
      return value
        .split(/[,\s]+/)
        .map((entry) => entry.trim())
        .filter((entry) => entry.length > 0);
    }
  }
  return [];
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  const parts = token.split('.');
  const payload = parts[1];
  if (!payload) {
    return null;
  }

  try {
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}
