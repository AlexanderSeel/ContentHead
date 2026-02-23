import { z } from 'zod';
const baseString = z.string().trim();
export const nodeRegistry = [
    {
        type: 'FetchContent',
        label: 'Fetch Content',
        icon: 'pi pi-search',
        defaultConfig: { contentItemId: 0 },
        schema: z.object({ contentItemId: z.number().int().positive() }),
        fields: [{ key: 'contentItemId', label: 'Content Item ID', type: 'number' }]
    },
    {
        type: 'CreateDraftVersion',
        label: 'Create Draft',
        icon: 'pi pi-file-edit',
        defaultConfig: {},
        schema: z.object({}),
        fields: []
    },
    {
        type: 'ManualApproval',
        label: 'Manual Approval',
        icon: 'pi pi-user-edit',
        defaultConfig: {},
        schema: z.object({}),
        fields: []
    },
    {
        type: 'PublishVersion',
        label: 'Publish Version',
        icon: 'pi pi-upload',
        defaultConfig: {},
        schema: z.object({}),
        fields: []
    },
    {
        type: 'ActivateVariant',
        label: 'Activate Variant',
        icon: 'pi pi-sliders-h',
        defaultConfig: { key: 'default', priority: 100, trafficAllocation: 100 },
        schema: z.object({
            key: baseString.min(1),
            priority: z.number().int().nonnegative(),
            trafficAllocation: z.number().int().min(0).max(100)
        }),
        fields: [
            { key: 'key', label: 'Variant key', type: 'text' },
            { key: 'priority', label: 'Priority', type: 'number' },
            { key: 'trafficAllocation', label: 'Traffic (%)', type: 'number' }
        ]
    },
    {
        type: 'AI.GenerateContent',
        label: 'AI Generate Content',
        icon: 'pi pi-sparkles',
        defaultConfig: { prompt: 'Generate publishable content' },
        schema: z.object({ prompt: baseString.min(3) }),
        fields: [{ key: 'prompt', label: 'Prompt', type: 'text' }]
    },
    {
        type: 'AI.Translate',
        label: 'AI Translate',
        icon: 'pi pi-language',
        defaultConfig: { targetLocaleCode: 'en-US', targetMarketCode: 'US' },
        schema: z.object({
            targetLocaleCode: baseString.min(2),
            targetMarketCode: baseString.min(2)
        }),
        fields: [
            { key: 'targetLocaleCode', label: 'Target locale', type: 'text' },
            { key: 'targetMarketCode', label: 'Target market', type: 'text' }
        ]
    },
    {
        type: 'Notify',
        label: 'Notify',
        icon: 'pi pi-send',
        defaultConfig: { message: 'Workflow finished' },
        schema: z.object({ message: baseString.min(2) }),
        fields: [{ key: 'message', label: 'Message', type: 'text' }]
    }
];
export function getNodeRegistryEntry(type) {
    return nodeRegistry.find((entry) => entry.type === type) ?? null;
}
export function validateNodeConfig(type, value) {
    const entry = getNodeRegistryEntry(type);
    if (!entry) {
        return [`Unsupported node type: ${type}`];
    }
    const parsed = entry.schema.safeParse(value);
    if (parsed.success) {
        return [];
    }
    return parsed.error.issues.map((issue) => `${issue.path.join('.') || 'config'}: ${issue.message}`);
}
