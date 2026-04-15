import { SchedulerBookingPage } from './SchedulerBookingPage';
import { BookingInspectorPanel } from './BookingInspectorPanel';
import type { AdminExtension } from '../core/types';
import { routeStartsWith } from '../../ui/commands/utils';

export const extension: AdminExtension = {
  id: 'scheduler-booking',
  label: 'Scheduler & Booking',
  menu: [
    {
      areaKey: 'extensions',
      areaLabel: 'Extensions',
      label: 'Scheduler',
      to: '/extensions/scheduler',
      icon: 'pi pi-calendar',
      order: 10
    }
  ],
  routes: [
    {
      path: '/extensions/scheduler',
      element: <SchedulerBookingPage />
    }
  ],
  inspectorPanels: [
    {
      id: 'schedule-review-meeting',
      label: 'Schedule publish review meeting',
      render: ({ siteId, contentItemId }) => <BookingInspectorPanel siteId={siteId} contentItemId={contentItemId} />
    }
  ],
  commands: [
    {
      placement: 'treeNodeContext',
      commands: [
        {
          id: 'scheduler.schedule-review',
          label: 'Schedule review',
          icon: 'pi pi-calendar-plus',
          group: 'Extensions',
          visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
          enabled: (ctx) => Boolean((ctx.treeNode as { contentItemId?: number } | undefined)?.contentItemId),
          run: (ctx) => {
            const node = ctx.treeNode as { contentItemId?: number; slug?: string } | undefined;
            const contentItemId = node?.contentItemId ?? null;
            if (!contentItemId) {
              ctx.toast?.({ severity: 'warn', summary: 'No page selected for scheduling.' });
              return;
            }
            ctx.toast?.({
              severity: 'info',
              summary: 'Review scheduled',
              detail: `Demo extension created a review booking for item #${contentItemId}.`
            });
          }
        }
      ]
    },
    {
      placement: 'pageHeaderOverflow',
      commands: [
        {
          id: 'scheduler.create-booking-from-page',
          label: 'Create booking from page...',
          icon: 'pi pi-calendar',
          group: 'Extensions',
          visible: (ctx) => routeStartsWith(ctx.route, '/content/pages'),
          enabled: (ctx) => Boolean(ctx.selectedContentItemId),
          run: (ctx) => {
            const contentItemId = Number(ctx.selectedContentItemId ?? 0);
            if (!contentItemId) {
              ctx.toast?.({ severity: 'warn', summary: 'Open a page first.' });
              return;
            }
            ctx.toast?.({
              severity: 'success',
              summary: 'Booking draft created',
              detail: `Demo extension prepared a booking for content item #${contentItemId}.`
            });
          }
        }
      ]
    }
  ]
};
