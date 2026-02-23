import { describe, expect, it } from 'vitest';

import { evaluateFieldConditions } from './conditions.js';

describe('evaluateFieldConditions', () => {
  it('is visible by default', () => {
    const result = evaluateFieldConditions({}, {});
    expect(result.visible).toBe(true);
    expect(result.enabled).toBe(true);
    expect(result.required).toBe(false);
  });

  it('hides field on false showIf', () => {
    const result = evaluateFieldConditions({ showIf: { op: 'eq', field: 'country', value: 'DE' } }, { country: 'US' });
    expect(result.visible).toBe(false);
    expect(result.enabled).toBe(false);
    expect(result.required).toBe(false);
  });

  it('shows field on true showIf', () => {
    const result = evaluateFieldConditions({ showIf: { op: 'eq', field: 'country', value: 'US' } }, { country: 'US' });
    expect(result.visible).toBe(true);
  });

  it('requires field with requiredIf true', () => {
    const result = evaluateFieldConditions({ requiredIf: { op: 'contains', field: 'segments', value: 'vip' } }, { segments: ['vip'] });
    expect(result.required).toBe(true);
  });

  it('does not require when hidden', () => {
    const result = evaluateFieldConditions(
      {
        showIf: { op: 'eq', field: 'country', value: 'DE' },
        requiredIf: { op: 'eq', field: 'country', value: 'US' }
      },
      { country: 'US' }
    );
    expect(result.visible).toBe(false);
    expect(result.required).toBe(false);
  });

  it('disables field when enabledIf false', () => {
    const result = evaluateFieldConditions({ enabledIf: { op: 'eq', field: 'device', value: 'desktop' } }, { device: 'mobile' });
    expect(result.enabled).toBe(false);
  });

  it('supports answer.* lookup', () => {
    const result = evaluateFieldConditions(
      { showIf: { op: 'eq', field: 'query.answer.plan', value: 'pro' } },
      { answers: { plan: 'pro' } }
    );
    expect(result.visible).toBe(true);
  });

  it('supports nested logic any', () => {
    const result = evaluateFieldConditions(
      {
        showIf: {
          any: [
            { op: 'eq', field: 'country', value: 'US' },
            { op: 'eq', field: 'country', value: 'DE' }
          ]
        }
      },
      { country: 'DE' }
    );
    expect(result.visible).toBe(true);
  });

  it('supports nested logic all', () => {
    const result = evaluateFieldConditions(
      {
        showIf: {
          all: [
            { op: 'eq', field: 'country', value: 'US' },
            { op: 'contains', field: 'segments', value: 'beta' }
          ]
        }
      },
      { country: 'US', segments: ['beta'] }
    );
    expect(result.visible).toBe(true);
  });

  it('supports nested logic not', () => {
    const result = evaluateFieldConditions({ showIf: { not: { op: 'eq', field: 'device', value: 'bot' } } }, { device: 'mobile' });
    expect(result.visible).toBe(true);
  });

  it('supports regex in conditions', () => {
    const result = evaluateFieldConditions(
      { requiredIf: { op: 'regex', field: 'query.answer.email', value: '@example.com$' } },
      { answers: { email: 'a@example.com' } }
    );
    expect(result.required).toBe(true);
  });
});
