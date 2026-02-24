import { CustomerOrganisationPage } from './CustomerOrganisationPage';
import type { AdminExtension } from '../core/types';
import { routeStartsWith } from '../../ui/commands/utils';

export const extension: AdminExtension = {
  id: 'customer-organisation',
  label: 'Customer & Organisation',
  menu: [
    {
      areaKey: 'extensions',
      areaLabel: 'Extensions',
      label: 'Customers',
      to: '/extensions/customers'
    }
  ],
  routes: [
    {
      path: '/extensions/customers',
      element: <CustomerOrganisationPage />
    }
  ],
  commands: [
    {
      placement: 'rowOverflow',
      commands: [
        {
          id: 'customer-org.assign-customer',
          label: 'Assign customer...',
          icon: 'pi pi-users',
          group: 'Extensions',
          visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
          enabled: (ctx) => Boolean((ctx.row as { contentItemId?: number } | undefined)?.contentItemId),
          run: (ctx) => {
            const row = ctx.row as { contentItemId?: number } | undefined;
            const contentItemId = row?.contentItemId ?? null;
            if (!contentItemId) {
              ctx.toast?.({ severity: 'warn', summary: 'Select a content item first.' });
              return;
            }
            ctx.toast?.({
              severity: 'info',
              summary: 'Customer assignment',
              detail: `Demo extension action for content item #${contentItemId}.`
            });
          }
        }
      ]
    },
    {
      placement: 'pageHeaderOverflow',
      commands: [
        {
          id: 'customer-org.export-mapping',
          label: 'Export customer mapping...',
          icon: 'pi pi-download',
          group: 'Extensions',
          visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
          run: (ctx) => {
            const siteId = Number(ctx.siteId ?? 0);
            const contentItemId = Number(ctx.selectedContentItemId ?? 0);
            const payload = {
              siteId,
              contentItemId: contentItemId || null,
              marketCode: ctx.marketCode ?? null,
              localeCode: ctx.localeCode ?? null,
              exportedAt: new Date().toISOString()
            };
            const downloader = ctx.downloadJson as ((filename: string, data: unknown) => void) | undefined;
            if (downloader) {
              downloader(`customer-mapping-site-${siteId || 'unknown'}.json`, payload);
            }
            ctx.toast?.({ severity: 'success', summary: 'Customer mapping exported.' });
          }
        }
      ]
    }
  ]
};
