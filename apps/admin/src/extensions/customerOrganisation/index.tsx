import { CustomerOrganisationPage } from './CustomerOrganisationPage';
import type { AdminExtension } from '../core/types';

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
  ]
};
