import { Card } from 'primereact/card';

import { PageHeader } from '../../components/common/PageHeader';

export function RolesPage() {
  return (
    <div>
      <PageHeader title="Roles" subtitle="Security permissions" />
      <Card>
        <p>Role management UI placeholder. Route guards are active for auth and dev-tools visibility.</p>
      </Card>
    </div>
  );
}
