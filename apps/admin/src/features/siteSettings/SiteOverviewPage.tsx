import { Card } from 'primereact/card';

import { useAdminContext } from '../../app/AdminContext';
import { PageHeader } from '../../components/common/PageHeader';

export function SiteOverviewPage() {
  const { siteId, marketCode, localeCode, sites } = useAdminContext();
  const site = sites.find((entry) => entry.id === siteId);

  return (
    <div>
      <PageHeader title="Site Overview" subtitle="Current tenant context and defaults" />
      <Card>
        <p>Site: {site?.name ?? `#${siteId}`}</p>
        <p>Current market: {marketCode}</p>
        <p>Current locale: {localeCode}</p>
      </Card>
    </div>
  );
}
