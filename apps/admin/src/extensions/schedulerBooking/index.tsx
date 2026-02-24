import { SchedulerBookingPage } from './SchedulerBookingPage';
import { BookingInspectorPanel } from './BookingInspectorPanel';
import type { AdminExtension } from '../core/types';

export const extension: AdminExtension = {
  id: 'scheduler-booking',
  label: 'Scheduler & Booking',
  menu: [
    {
      areaKey: 'extensions',
      areaLabel: 'Extensions',
      label: 'Scheduler',
      to: '/extensions/scheduler'
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
  ]
};
