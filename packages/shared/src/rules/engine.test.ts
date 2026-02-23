import { describe, expect, it } from 'vitest';

import { chooseTrafficBucket, evaluateRule, hashDeterministic, type RuleContext } from './engine.js';

const base: RuleContext = {
  userId: 'u-1',
  sessionId: 's-1',
  segments: ['vip', 'beta'],
  country: 'US',
  device: 'mobile',
  referrer: 'https://example.com/source',
  query: { campaign: 'spring', visits: 3, enabled: true }
};

describe('rule engine', () => {
  it('evaluates eq', () => {
    expect(evaluateRule({ op: 'eq', field: 'country', value: 'US' }, base)).toBe(true);
  });

  it('evaluates neq', () => {
    expect(evaluateRule({ op: 'neq', field: 'device', value: 'desktop' }, base)).toBe(true);
  });

  it('evaluates in', () => {
    expect(evaluateRule({ op: 'in', field: 'country', value: ['US', 'CA'] }, base)).toBe(true);
  });

  it('evaluates contains for arrays', () => {
    expect(evaluateRule({ op: 'contains', field: 'segments', value: 'vip' }, base)).toBe(true);
  });

  it('evaluates contains for strings', () => {
    expect(evaluateRule({ op: 'contains', field: 'referrer', value: 'example.com' }, base)).toBe(true);
  });

  it('evaluates gt and lt', () => {
    expect(evaluateRule({ op: 'gt', field: 'query.visits', value: 2 }, base)).toBe(true);
    expect(evaluateRule({ op: 'lt', field: 'query.visits', value: 4 }, base)).toBe(true);
  });

  it('evaluates regex', () => {
    expect(evaluateRule({ op: 'regex', field: 'query.campaign', value: '^spr' }, base)).toBe(true);
  });

  it('evaluates all', () => {
    expect(
      evaluateRule(
        {
          all: [
            { op: 'eq', field: 'country', value: 'US' },
            { op: 'contains', field: 'segments', value: 'beta' }
          ]
        },
        base
      )
    ).toBe(true);
  });

  it('evaluates any', () => {
    expect(
      evaluateRule(
        {
          any: [
            { op: 'eq', field: 'country', value: 'DE' },
            { op: 'eq', field: 'country', value: 'US' }
          ]
        },
        base
      )
    ).toBe(true);
  });

  it('evaluates not', () => {
    expect(evaluateRule({ not: { op: 'eq', field: 'country', value: 'DE' } }, base)).toBe(true);
  });

  it('reads query fields', () => {
    expect(evaluateRule({ op: 'eq', field: 'query.campaign', value: 'spring' }, base)).toBe(true);
  });

  it('hash is deterministic', () => {
    expect(hashDeterministic('abc')).toBe(hashDeterministic('abc'));
  });

  it('traffic bucket selection is deterministic', () => {
    const alloc = [
      { key: 'A', weight: 50 },
      { key: 'B', weight: 50 }
    ];
    expect(chooseTrafficBucket('seed-1', alloc)).toBe(chooseTrafficBucket('seed-1', alloc));
  });

  it('traffic bucket returns null for empty allocations', () => {
    expect(chooseTrafficBucket('seed', [{ key: 'A', weight: 0 }])).toBeNull();
  });
});