import { describe, expect, it } from 'vitest';

import { redactString, redactValue } from './issueRedaction';

describe('issueRedaction', () => {
  it('redacts sensitive keys recursively', () => {
    const redacted = redactValue({
      authorization: 'Bearer abc',
      password: 'secret',
      nested: {
        apiKey: 'key-123',
        clientSecret: 'shh',
        token: 'tok'
      }
    });

    expect(redacted).toEqual({
      authorization: '[REDACTED]',
      password: '[REDACTED]',
      nested: {
        apiKey: '[REDACTED]',
        clientSecret: '[REDACTED]',
        token: '[REDACTED]'
      }
    });
  });

  it('masks jwt-like strings', () => {
    const input = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payloadsegment.signaturepart';
    const output = redactString(input);

    expect(output).toContain('.***.');
    expect(output).not.toContain('payloadsegment');
  });

  it('truncates long strings with marker', () => {
    const longValue = `${'a'.repeat(90)}${'b'.repeat(40)}`;
    const redacted = redactString(longValue);

    expect(redacted.length).toBeLessThan(longValue.length);
    expect(redacted).toContain('[truncated:');
  });
});
