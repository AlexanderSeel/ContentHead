import { Card } from 'primereact/card';

import { useAdminContext } from '../app/AdminContext';
import { PageHeader } from '../components/common/PageHeader';

export function DashboardPage() {
  const { siteId, marketCode, localeCode, combos } = useAdminContext();

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="ContentHead Studio backend overview" />
      <div className="card-grid">
        <Card title="Active Context">
          <p>Site: {siteId}</p>
          <p>Market/Locale: {marketCode}/{localeCode}</p>
          <p>Active combinations: {combos.filter((entry) => entry.active).length}</p>
        </Card>
        <Card title="Quick Links">
          <p>Use sidebar to navigate to Pages, Matrix, Workflows, and Dev Tools.</p>
        </Card>
      </div>
    </div>
  );
}
