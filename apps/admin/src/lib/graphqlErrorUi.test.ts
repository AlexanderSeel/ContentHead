import { describe, expect, it } from 'vitest';

import { extractGraphqlErrorCode, formatErrorMessage, isForbiddenError } from './graphqlErrorUi';

describe('graphqlErrorUi', () => {
  it('extracts graphql error code from response payload', () => {
    const code = extractGraphqlErrorCode({
      response: {
        errors: [{ extensions: { code: 'FORBIDDEN' } }]
      }
    });

    expect(code).toBe('FORBIDDEN');
  });

  it('detects forbidden and unauthorized errors', () => {
    expect(
      isForbiddenError({
        response: {
          errors: [{ extensions: { code: 'UNAUTHORIZED' } }]
        }
      })
    ).toBe(true);
    expect(isForbiddenError(new Error('Request failed: FORBIDDEN'))).toBe(true);
    expect(isForbiddenError(new Error('Validation failed'))).toBe(false);
  });

  it('formats error message safely', () => {
    expect(formatErrorMessage(new Error('Boom'))).toBe('Boom');
    expect(formatErrorMessage({ message: 'raw' })).toBe('[object Object]');
  });
});
