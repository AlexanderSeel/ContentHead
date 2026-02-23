import { createSdk } from '@contenthead/sdk';

export function createAdminSdk(token: string | null) {
  return createSdk({
    endpoint: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/graphql',
    headersProvider: async () =>
      token
        ? {
            authorization: `Bearer ${token}`
          }
        : undefined
  });
}
