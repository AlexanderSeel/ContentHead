import type { InternalAuthProvider } from './auth/InternalAuthProvider.js';
import type { SafeUser } from './types/user.js';

export type RequestContext = {
  auth: InternalAuthProvider;
  currentUser: SafeUser | null;
};

export async function getRequestContext(
  auth: InternalAuthProvider,
  authHeader: string | null
): Promise<RequestContext> {
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;
  if (!token) {
    return { auth, currentUser: null };
  }

  const claims = auth.verifyToken(token);
  if (!claims) {
    return { auth, currentUser: null };
  }

  const userId = Number(claims.sub);
  if (!Number.isFinite(userId)) {
    return { auth, currentUser: null };
  }

  const currentUser = await auth.getUserById(userId);
  return { auth, currentUser };
}