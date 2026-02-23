import { describe, expect, it } from 'vitest';
import { validateNodeConfig } from './nodeRegistry';
describe('validateNodeConfig', () => {
    it('accepts valid ActivateVariant config', () => {
        const errors = validateNodeConfig('ActivateVariant', {
            key: 'default',
            priority: 10,
            trafficAllocation: 100
        });
        expect(errors).toHaveLength(0);
    });
    it('rejects invalid ActivateVariant traffic allocation', () => {
        const errors = validateNodeConfig('ActivateVariant', {
            key: 'default',
            priority: 10,
            trafficAllocation: 180
        });
        expect(errors.some((entry) => entry.includes('trafficAllocation'))).toBe(true);
    });
    it('rejects unknown node types', () => {
        const errors = validateNodeConfig('Unknown', {});
        expect(errors[0]).toContain('Unsupported');
    });
});
