import { describe, expect, it } from 'vitest';

import { resolveComponentRegistry, type ComponentTypeSetting } from './componentRegistry';

describe('resolveComponentRegistry', () => {
  it('repairs stale structured field overrides so inspector keeps specialized editors', () => {
    const settings: ComponentTypeSetting[] = [
      {
        componentTypeId: 'hero',
        enabled: true,
        schemaJson: JSON.stringify([
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'primaryCta', label: 'Primary CTA', type: 'text' },
          { key: 'secondaryCta', label: 'Secondary CTA', type: 'multiline' },
          { key: 'backgroundAssetRef', label: 'Background Asset', type: 'text' }
        ])
      },
      {
        componentTypeId: 'pricing',
        enabled: true,
        schemaJson: JSON.stringify([
          { key: 'title', label: 'Title', type: 'text' },
          { key: 'tiers', label: 'Tiers', type: 'text' }
        ])
      }
    ];

    const resolved = resolveComponentRegistry(settings);
    const hero = resolved.find((entry) => entry.id === 'hero');
    const pricing = resolved.find((entry) => entry.id === 'pricing');
    expect(hero).toBeTruthy();
    expect(pricing).toBeTruthy();

    const heroByKey = new Map((hero?.fields ?? []).map((field) => [field.key, field]));
    expect(heroByKey.get('primaryCta')?.type).toBe('contentLink');
    expect(heroByKey.get('secondaryCta')?.type).toBe('contentLink');
    expect(heroByKey.get('backgroundAssetRef')?.type).toBe('assetRef');

    const pricingByKey = new Map((pricing?.fields ?? []).map((field) => [field.key, field]));
    expect(pricingByKey.get('tiers')?.type).toBe('objectList');
    expect((pricingByKey.get('tiers')?.fields ?? []).length).toBeGreaterThan(0);
  });
});

