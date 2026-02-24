import { createSdk } from '@contenthead/sdk';
import { getApiGraphqlUrl } from './api';
import {
  AdminGraphqlError,
  type GraphqlResult,
  createGraphqlFailure,
  reportGraphqlFailure
} from './graphqlReliability';

type RawSdk = ReturnType<typeof createSdk>;
type SdkMethodKey = {
  [K in keyof RawSdk]: RawSdk[K] extends (...args: any[]) => Promise<any> ? K : never;
}[keyof RawSdk];

type SafeSdk = {
  [K in SdkMethodKey]: RawSdk[K] extends (...args: infer A) => Promise<infer R>
    ? (...args: A) => Promise<GraphqlResult<R>>
    : never;
};

export type AdminSdk = RawSdk & { safe: SafeSdk };

export function createAdminSdk(token: string | null) {
  const rawSdk = createSdk({
    endpoint: getApiGraphqlUrl(),
    headersProvider: async () =>
      token
        ? {
            authorization: `Bearer ${token}`
          }
        : undefined
  });

  const wrapped = {} as RawSdk;
  const safe = {} as SafeSdk;

  for (const key of Object.keys(rawSdk) as SdkMethodKey[]) {
    const method = rawSdk[key] as (...args: unknown[]) => Promise<unknown>;

    (wrapped as Record<SdkMethodKey, (...args: unknown[]) => Promise<unknown>>)[key] = async (
      ...args: unknown[]
    ) => {
      try {
        return await method(...args);
      } catch (error) {
        const failure = createGraphqlFailure({
          operationName: String(key),
          variables: args[0] ?? null,
          error
        });
        reportGraphqlFailure(failure);
        throw new AdminGraphqlError(failure);
      }
    };

    (safe as Record<SdkMethodKey, (...args: unknown[]) => Promise<GraphqlResult<unknown>>>)[key] = async (
      ...args: unknown[]
    ) => {
      try {
        const data = await (wrapped as Record<SdkMethodKey, (...args: unknown[]) => Promise<unknown>>)[key](
          ...args
        );
        return { ok: true, data };
      } catch (error) {
        if (error instanceof AdminGraphqlError) {
          return { ok: false, error: error.failure };
        }
        const failure = createGraphqlFailure({
          operationName: String(key),
          variables: args[0] ?? null,
          error
        });
        reportGraphqlFailure(failure);
        return { ok: false, error: failure };
      }
    };
  }

  return { ...wrapped, safe } as AdminSdk;
}
