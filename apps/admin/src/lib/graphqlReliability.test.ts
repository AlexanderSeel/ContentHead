import { describe, expect, it } from 'vitest';

import { createGraphqlFailure } from './graphqlReliability';

describe('createGraphqlFailure', () => {
  it('redacts secret variables and classifies missing permission failures', () => {
    const failure = createGraphqlFailure({
      operationName: 'ListInternalUsers',
      variables: { password: 'secret', nested: { apiKey: 'abc' } },
      error: {
        response: {
          errors: [{ message: 'Forbidden', extensions: { code: 'FORBIDDEN' } }]
        }
      }
    });

    expect(failure.kind).toBe('missing_permission');
    expect(failure.message).toContain('Missing permission');
    expect(failure.variables).toEqual({ password: '[REDACTED]', nested: { apiKey: '[REDACTED]' } });
  });

  it('classifies schema mismatches for non-null failures', () => {
    const failure = createGraphqlFailure({
      operationName: 'GetContentItemDetail',
      variables: { id: 42 },
      error: {
        response: {
          errors: [{ message: 'Cannot return null for non-null field ContentItem.title.' }]
        }
      }
    });

    expect(failure.kind).toBe('schema_mismatch');
    expect(failure.message).toContain('Schema mismatch');
  });
});
