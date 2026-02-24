import { createSdk } from '@contenthead/sdk';
import { getApiGraphqlUrl } from './api';

export function createAdminSdk(token: string | null) {
  return createSdk({
    endpoint: getApiGraphqlUrl(),
    headersProvider: async () =>
      token
        ? {
            authorization: `Bearer ${token}`
          }
        : undefined
  });
}
